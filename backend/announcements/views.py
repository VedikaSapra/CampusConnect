from rest_framework import generics, status, permissions
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter

from .models import Announcement
from .serializers import AnnouncementSerializer
from accounts.permissions import IsClubAdminOrSuperAdmin, IsSuperAdmin
from clubs.models import ClubMembership


class AnnouncementListCreateView(generics.ListCreateAPIView):
    serializer_class = AnnouncementSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['target_audience', 'is_active']
    search_fields = ['title', 'content']

    def get_queryset(self):
        user = self.request.user
        now = timezone.now()
        qs = Announcement.objects.filter(
            Q(expires_at__isnull=True) | Q(expires_at__gte=now),
            is_active=True
        )

        if not user.is_authenticated:
            return qs.filter(target_audience='all')

        if user.is_super_admin:
            return Announcement.objects.all()

        if user.is_club_admin:
            try:
                club = user.administered_club
                return Announcement.objects.filter(
                    Q(target_audience='all') | Q(club=club)
                )
            except Exception:
                return qs.filter(target_audience='all')

        # Student: see college-wide + their clubs' announcements
        joined_club_ids = ClubMembership.objects.filter(
            student=user, status='approved'
        ).values_list('club_id', flat=True)
        return qs.filter(
            Q(target_audience='all') | Q(club__in=joined_club_ids)
        )

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsClubAdminOrSuperAdmin()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_club_admin:
            try:
                club = user.administered_club
                serializer.save(author=user, club=club, target_audience='club')
            except Exception:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('You are not assigned to any club.')
        else:
            serializer.save(author=user)


class AnnouncementDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [IsClubAdminOrSuperAdmin()]

    def update(self, request, *args, **kwargs):
        announcement = self.get_object()
        # Club admin can only edit their own announcements
        if request.user.is_club_admin and announcement.author != request.user:
            return Response({'error': 'You can only edit your own announcements.'}, status=status.HTTP_403_FORBIDDEN)
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        announcement = self.get_object()
        if request.user.is_club_admin and announcement.author != request.user:
            return Response({'error': 'You can only delete your own announcements.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
