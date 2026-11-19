from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Club, ClubMembership
from .serializers import ClubSerializer, ClubMembershipSerializer
from .permissions import IsClubAdminOfClub, IsClubAdminOfMembershipClub
from accounts.permissions import IsSuperAdmin, IsStudent, IsClubAdminOrSuperAdmin


class ClubListCreateView(generics.ListCreateAPIView):
    serializer_class = ClubSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'is_approved']
    search_fields = ['name', 'description', 'faculty_coordinator']
    ordering_fields = ['name', 'created_at']

    def get_queryset(self):
        user = self.request.user
        # Super admins see all clubs; others see only approved ones
        if user.is_authenticated and user.is_super_admin:
            return Club.objects.all()
        return Club.objects.filter(is_approved=True)

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsSuperAdmin()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(is_approved=True)


class ClubDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Club.objects.all()
    serializer_class = ClubSerializer

    def get_permissions(self):
        if self.request.method in ('GET',):
            return [permissions.AllowAny()]
        return [IsClubAdminOfClub()]


class JoinClubView(APIView):
    permission_classes = [IsStudent]

    def post(self, request, pk):
        try:
            club = Club.objects.get(pk=pk, is_approved=True)
        except Club.DoesNotExist:
            return Response({'error': 'Club not found.'}, status=status.HTTP_404_NOT_FOUND)

        if ClubMembership.objects.filter(student=request.user, club=club).exists():
            return Response({'error': 'You have already requested or joined this club.'}, status=status.HTTP_400_BAD_REQUEST)

        membership = ClubMembership.objects.create(student=request.user, club=club, status='pending')
        return Response(
            ClubMembershipSerializer(membership).data,
            status=status.HTTP_201_CREATED
        )


class ClubMembersView(generics.ListAPIView):
    serializer_class = ClubMembershipSerializer

    def get_permissions(self):
        return [IsClubAdminOrSuperAdmin()]

    def get_queryset(self):
        pk = self.kwargs.get('pk')
        club = Club.objects.get(pk=pk)
        user = self.request.user
        # Club admin can only see members of their own club
        if user.is_club_admin and club.admin_user != user:
            return ClubMembership.objects.none()
        status_filter = self.request.query_params.get('status', None)
        qs = club.memberships.all()
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class MembershipUpdateView(generics.UpdateAPIView):
    """Club admin approves or rejects a membership request."""
    queryset = ClubMembership.objects.all()
    serializer_class = ClubMembershipSerializer
    permission_classes = [IsClubAdminOfMembershipClub]
    http_method_names = ['patch']

    def patch(self, request, *args, **kwargs):
        membership = self.get_object()
        new_status = request.data.get('status')
        if new_status not in ['approved', 'rejected']:
            return Response({'error': "Status must be 'approved' or 'rejected'."}, status=status.HTTP_400_BAD_REQUEST)
        membership.status = new_status
        membership.save()
        return Response(ClubMembershipSerializer(membership).data)


class MyMembershipsView(generics.ListAPIView):
    """Student: view all their memberships."""
    serializer_class = ClubMembershipSerializer
    permission_classes = [IsStudent]

    def get_queryset(self):
        return ClubMembership.objects.filter(student=self.request.user)


class MyClubView(APIView):
    """Club admin: get their assigned club's details."""
    permission_classes = [IsClubAdminOrSuperAdmin]

    def get(self, request):
        try:
            club = request.user.administered_club
        except Exception:
            return Response({'error': 'You are not assigned to any club.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ClubSerializer(club, context={'request': request}).data)


class MyClubMembersView(generics.ListAPIView):
    """Club admin: list members of their own club filtered by status."""
    serializer_class = ClubMembershipSerializer
    permission_classes = [IsClubAdminOrSuperAdmin]

    def get_queryset(self):
        try:
            club = self.request.user.administered_club
        except Exception:
            return ClubMembership.objects.none()
        status_filter = self.request.query_params.get('status', None)
        qs = club.memberships.select_related('student').all()
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs.order_by('-requested_at')


class MembershipRemoveView(APIView):
    """Club admin: remove (set rejected) an approved member from their club."""
    permission_classes = [IsClubAdminOrSuperAdmin]

    def delete(self, request, pk):
        try:
            membership = ClubMembership.objects.select_related('club').get(pk=pk)
        except ClubMembership.DoesNotExist:
            return Response({'error': 'Membership not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            club = request.user.administered_club
        except Exception:
            return Response({'error': 'Not assigned to a club.'}, status=status.HTTP_403_FORBIDDEN)
        if membership.club != club:
            return Response({'error': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)
        membership.status = 'rejected'
        membership.save()
        return Response({'message': 'Member removed.'}, status=status.HTTP_200_OK)
