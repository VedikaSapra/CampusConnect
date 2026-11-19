from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.db.models import Avg, Count
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Event, EventRegistration, EventPass, EventFeedback
from .serializers import (
    EventSerializer, EventRegistrationSerializer, EventPassSerializer, EventFeedbackSerializer
)
from .permissions import IsEventClubAdmin, CanManageRegistration
from accounts.permissions import IsStudent, IsClubAdminOrSuperAdmin, IsSuperAdmin


class EventListCreateView(generics.ListCreateAPIView):
    serializer_class = EventSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'club', 'is_active']
    search_fields = ['title', 'description', 'venue']
    ordering_fields = ['event_date', 'created_at', 'title']

    def get_queryset(self):
        user = self.request.user
        upcoming = self.request.query_params.get('upcoming', None)
        qs = Event.objects.select_related('club', 'created_by').all()

        if upcoming == 'true':
            qs = qs.filter(event_date__gt=timezone.now())

        return qs

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsClubAdminOrSuperAdmin()]
        return [permissions.AllowAny()]

    def create(self, request, *args, **kwargs):
        """Override create to inject club before serializer validation for club admins."""
        user = request.user
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)

        if user.is_club_admin and not data.get('club'):
            try:
                club = user.administered_club
                data['club'] = club.id
            except Exception:
                pass

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        from rest_framework import status as drf_status
        return Response(serializer.data, status=drf_status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_club_admin:
            try:
                club = user.administered_club
            except Exception:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You are not assigned to any club.")
            serializer.save(created_by=user, club=club)
        else:
            # Super admin creation
            club = serializer.validated_data.get('club')
            if not club:
                from clubs.models import Club
                club = Club.objects.filter(is_approved=True).first()
            serializer.save(created_by=user, club=club)


class EventDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Event.objects.select_related('club').all()
    serializer_class = EventSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsEventClubAdmin()]


class EventRegisterView(APIView):
    permission_classes = [IsStudent]

    @transaction.atomic
    def post(self, request, pk):
        try:
            event = Event.objects.select_for_update().get(pk=pk)
        except Event.DoesNotExist:
            return Response({'error': 'Event not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not event.is_active:
            return Response({'error': 'This event is not active.'}, status=status.HTTP_400_BAD_REQUEST)
        if event.is_past:
            return Response({'error': 'This event has already passed.'}, status=status.HTTP_400_BAD_REQUEST)
        if timezone.now() > event.registration_deadline:
            return Response({'error': 'Registration deadline has passed.'}, status=status.HTTP_400_BAD_REQUEST)
        if event.available_seats <= 0:
            return Response({'error': 'Event is at full capacity.'}, status=status.HTTP_400_BAD_REQUEST)
        if EventRegistration.objects.filter(student=request.user, event=event).exists():
            return Response({'error': 'You are already registered for this event.'}, status=status.HTTP_400_BAD_REQUEST)

        reg_status = 'pending' if event.requires_approval else 'approved'
        registration = EventRegistration.objects.create(
            student=request.user, event=event, status=reg_status
        )
        return Response(
            EventRegistrationSerializer(registration).data,
            status=status.HTTP_201_CREATED
        )

    def delete(self, request, pk):
        try:
            event = Event.objects.get(pk=pk)
        except Event.DoesNotExist:
            return Response({'error': 'Event not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            registration = EventRegistration.objects.get(student=request.user, event=event)
        except EventRegistration.DoesNotExist:
            return Response({'error': 'You are not registered for this event.'}, status=status.HTTP_404_NOT_FOUND)

        if timezone.now() > event.registration_deadline:
            return Response({'error': 'Cannot cancel after the registration deadline.'}, status=status.HTTP_400_BAD_REQUEST)

        registration.status = 'cancelled'
        registration.save()
        return Response({'message': 'Registration cancelled.'}, status=status.HTTP_200_OK)


class EventRegistrationListView(generics.ListAPIView):
    serializer_class = EventRegistrationSerializer
    permission_classes = [IsClubAdminOrSuperAdmin]

    def get_queryset(self):
        pk = self.kwargs.get('pk')
        try:
            event = Event.objects.get(pk=pk)
        except Event.DoesNotExist:
            return EventRegistration.objects.none()

        user = self.request.user
        if user.is_club_admin and event.club.admin_user != user:
            return EventRegistration.objects.none()

        status_filter = self.request.query_params.get('status', None)
        qs = event.registrations.select_related('student', 'pass_record').all()
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class EventRegistrationUpdateView(generics.UpdateAPIView):
    queryset = EventRegistration.objects.select_related('event__club').all()
    serializer_class = EventRegistrationSerializer
    permission_classes = [CanManageRegistration]
    http_method_names = ['patch']

    def patch(self, request, *args, **kwargs):
        registration = self.get_object()
        new_status = request.data.get('status')
        if new_status not in ['approved', 'rejected']:
            return Response({'error': "Status must be 'approved' or 'rejected'."}, status=status.HTTP_400_BAD_REQUEST)
        registration.status = new_status
        registration.save()
        return Response(EventRegistrationSerializer(registration).data)


class MyEventRegistrationsView(generics.ListAPIView):
    serializer_class = EventRegistrationSerializer
    permission_classes = [IsStudent]

    def get_queryset(self):
        # Automatically backfill passes for any existing approved registrations
        approved_without_pass = EventRegistration.objects.filter(
            student=self.request.user,
            status='approved',
            pass_record__isnull=True
        )
        for reg in approved_without_pass:
            EventPass.objects.create(registration=reg)

        return EventRegistration.objects.filter(
            student=self.request.user
        ).select_related('event', 'event__club', 'pass_record').order_by('-registered_at')


class MyClubEventsView(generics.ListAPIView):
    """Club admin: list all events for their club."""
    serializer_class = EventSerializer
    permission_classes = [IsClubAdminOrSuperAdmin]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['title', 'venue']
    ordering_fields = ['event_date', 'created_at']

    def get_queryset(self):
        user = self.request.user
        try:
            club = user.administered_club
        except Exception:
            return Event.objects.none()
        return Event.objects.filter(club=club).select_related('club', 'created_by').order_by('-event_date')


class MyClubRegistrationsView(generics.ListAPIView):
    """Club admin: list all event registrations for their club's events."""
    serializer_class = EventRegistrationSerializer
    permission_classes = [IsClubAdminOrSuperAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['status']
    search_fields = ['student__first_name', 'student__last_name', 'student__email', 'event__title']

    def get_queryset(self):
        user = self.request.user
        try:
            club = user.administered_club
        except Exception:
            return EventRegistration.objects.none()
        return EventRegistration.objects.filter(
            event__club=club
        ).select_related('student', 'event', 'pass_record').order_by('-registered_at')


# --- MODULE B: INDIVIDUAL DIGITAL EVENT PASS & ATTENDANCE APIS ---

class EventPassDetailView(APIView):
    """
    Returns verified digital pass information for the authorized student.
    """
    permission_classes = [IsStudent]

    def get(self, request, pk):
        event_pass = get_object_or_404(
            EventPass.objects.select_related('registration__student', 'registration__event__club'),
            pk=pk,
            registration__student=request.user
        )
        if not event_pass.is_valid or event_pass.registration.status != 'approved':
            return Response({'error': 'This pass is inactive or cancelled.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(EventPassSerializer(event_pass).data)


class EventPassVerifyView(APIView):
    """
    Validates scanned QR verification token.
    Publicly inspectable for attendee verification UI (or authenticated for organizers).
    Enforces token validity, registration status, and reports whether the pass can be checked in.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        token = request.query_params.get('token', '').strip()
        return self._verify_token(request, token)

    def post(self, request):
        token = request.data.get('token', '').strip()
        return self._verify_token(request, token, event_id=request.data.get('event_id'))

    def _verify_token(self, request, token, event_id=None):
        if not token:
            return Response({'error': 'No token provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            event_pass = EventPass.objects.select_related(
                'registration__student',
                'registration__event__club'
            ).get(verification_token=token)
        except EventPass.DoesNotExist:
            return Response({
                'valid': False,
                'status': 'invalid',
                'message': 'This QR code is invalid or could not be verified in the CampusConnect system.'
            }, status=status.HTTP_404_NOT_FOUND)

        # Ensure pass belongs to the event being checked in (if specific event_id was provided)
        if event_id and str(event_pass.registration.event_id) != str(event_id):
            return Response({
                'valid': False,
                'status': 'mismatch',
                'message': f'This pass is issued for "{event_pass.registration.event.title}", not this event.',
                'pass_data': EventPassSerializer(event_pass, context={'request': request}).data
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check registration status (approved / pending / rejected / cancelled)
        reg_status = event_pass.registration.status
        if reg_status == 'cancelled':
            return Response({
                'valid': False,
                'status': 'cancelled',
                'message': 'This event registration was cancelled by the student.',
                'pass_data': EventPassSerializer(event_pass, context={'request': request}).data
            }, status=status.HTTP_200_OK)

        if reg_status == 'rejected':
            return Response({
                'valid': False,
                'status': 'rejected',
                'message': 'This event registration request was rejected by the organizing committee.',
                'pass_data': EventPassSerializer(event_pass, context={'request': request}).data
            }, status=status.HTTP_200_OK)

        if reg_status == 'pending':
            return Response({
                'valid': False,
                'status': 'pending',
                'message': 'This registration is pending organizer approval. The pass is not yet active.',
                'pass_data': EventPassSerializer(event_pass, context={'request': request}).data
            }, status=status.HTTP_200_OK)

        # Check validity flag
        if not event_pass.is_valid:
            return Response({
                'valid': False,
                'status': 'revoked',
                'message': 'This pass has expired or been revoked.',
                'pass_data': EventPassSerializer(event_pass, context={'request': request}).data
            }, status=status.HTTP_200_OK)

        # Check already used
        if event_pass.is_checked_in:
            return Response({
                'valid': False,
                'status': 'already_used',
                'message': f'Pass already checked in on {event_pass.checked_in_at.strftime("%b %d, %Y at %I:%M %p") if event_pass.checked_in_at else "previously"}',
                'pass_data': EventPassSerializer(event_pass, context={'request': request}).data
            }, status=status.HTTP_200_OK)

        # Check if user scanning is authorized organizer for check-in action
        user = request.user
        can_check_in = False
        if user.is_authenticated:
            if user.is_super_admin:
                can_check_in = True
            elif user.is_club_admin and event_pass.registration.event.club.admin_user_id == user.id:
                can_check_in = True

        return Response({
            'valid': True,
            'status': 'verified',
            'can_check_in': can_check_in,
            'message': 'Registration verified successfully! Valid pass for entry.',
            'pass_data': EventPassSerializer(event_pass, context={'request': request}).data
        })


class EventPassCheckInView(APIView):
    """
    Confirms attendee check-in and records check-in timestamp and organizer ID.
    Enforces organizer role permissions on backend and prevents double check-in atomically.
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        token = request.data.get('token', '').strip()
        if not token:
            return Response({'error': 'Token required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            event_pass = EventPass.objects.select_for_update().select_related(
                'registration__student',
                'registration__event__club'
            ).get(verification_token=token)
        except EventPass.DoesNotExist:
            return Response({'error': 'Pass not found'}, status=status.HTTP_404_NOT_FOUND)

        # Permission check: must be super admin or the organizer of this event's club
        user = request.user
        is_authorized = False
        if user.is_super_admin:
            is_authorized = True
        elif user.is_club_admin and event_pass.registration.event.club.admin_user_id == user.id:
            is_authorized = True

        if not is_authorized:
            return Response({
                'error': 'You are not authorized to check in attendees for this event. Only the assigned club administrator or super administrator can record attendance.'
            }, status=status.HTTP_403_FORBIDDEN)

        if not event_pass.is_valid or event_pass.registration.status != 'approved':
            return Response({'error': 'Pass is invalid or registration not approved'}, status=status.HTTP_400_BAD_REQUEST)

        if event_pass.is_checked_in:
            return Response({
                'error': f'Attendee has already been checked in at {event_pass.checked_in_at.strftime("%I:%M %p") if event_pass.checked_in_at else "earlier"}.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Mark check-in
        event_pass.is_checked_in = True
        event_pass.checked_in_at = timezone.now()
        event_pass.checked_in_by = request.user
        event_pass.save()

        return Response({
            'success': True,
            'status': 'checked_in',
            'message': f'Successfully checked in {event_pass.registration.student.get_full_name()}!',
            'pass_data': EventPassSerializer(event_pass, context={'request': request}).data
        })

        # Mark check-in
        event_pass.is_checked_in = True
        event_pass.checked_in_at = timezone.now()
        event_pass.checked_in_by = request.user
        event_pass.save()

        return Response({
            'success': True,
            'message': f'Successfully checked in {event_pass.registration.student.get_full_name()}!',
            'pass_data': EventPassSerializer(event_pass).data
        })


class EventAttendanceStatsView(APIView):
    """
    Returns live check-in progress, attendance percentages, and attendee roster for organizers.
    """
    permission_classes = [IsClubAdminOrSuperAdmin]

    def get(self, request, pk):
        event = get_object_or_404(Event.objects.select_related('club'), pk=pk)
        
        user = request.user
        if user.is_club_admin and event.club.admin_user != user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        total_registered = event.registrations.exclude(status='cancelled').count()
        approved_registrations = event.registrations.filter(status='approved')
        total_approved = approved_registrations.count()
        
        passes = EventPass.objects.filter(registration__in=approved_registrations).select_related(
            'registration__student'
        )
        total_checked_in = passes.filter(is_checked_in=True).count()
        not_arrived = total_approved - total_checked_in
        percentage = round((total_checked_in / total_approved * 100), 1) if total_approved > 0 else 0.0

        attendees = []
        for p in passes.order_by('-checked_in_at', 'registration__student__first_name'):
            attendees.append({
                'pass_id': p.id,
                'token': p.verification_token,
                'student_name': p.registration.student.get_full_name(),
                'student_email': p.registration.student.email,
                'department': p.registration.student.department,
                'is_checked_in': p.is_checked_in,
                'checked_in_at': p.checked_in_at,
            })

        return Response({
            'stats': {
                'total_registered': total_registered,
                'total_approved': total_approved,
                'total_checked_in': total_checked_in,
                'not_arrived': not_arrived,
                'attendance_percentage': percentage,
            },
            'attendees': attendees
        })


class EventFeedbackView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsStudent()]
        return [IsClubAdminOrSuperAdmin()]

    def get(self, request, pk):
        try:
            event = Event.objects.get(pk=pk)
        except Event.DoesNotExist:
            return Response({'error': 'Event not found.'}, status=status.HTTP_404_NOT_FOUND)

        feedbacks = event.feedbacks.select_related('student').all()
        avg_rating = feedbacks.aggregate(avg=Avg('rating'))['avg']
        return Response({
            'average_rating': round(avg_rating, 2) if avg_rating else None,
            'total_feedback': feedbacks.count(),
            'feedbacks': EventFeedbackSerializer(feedbacks, many=True).data
        })

    def post(self, request, pk):
        try:
            event = Event.objects.get(pk=pk)
        except Event.DoesNotExist:
            return Response({'error': 'Event not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not EventRegistration.objects.filter(
            student=request.user, event=event, status='approved'
        ).exists():
            return Response(
                {'error': 'You must be an approved registrant to submit feedback.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if not event.is_past:
            return Response({'error': 'You can only submit feedback after the event.'}, status=status.HTTP_400_BAD_REQUEST)
        if EventFeedback.objects.filter(student=request.user, event=event).exists():
            return Response({'error': 'You have already submitted feedback for this event.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = EventFeedbackSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(student=request.user, event=event)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
