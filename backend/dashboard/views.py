from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Avg, Q
from django.utils import timezone

from accounts.models import CustomUser
from accounts.permissions import IsStudent, IsClubAdminOrSuperAdmin, IsSuperAdmin
from clubs.models import Club, ClubMembership
from events.models import Event, EventRegistration, EventFeedback
from announcements.models import Announcement


class StudentDashboardView(APIView):
    permission_classes = [IsStudent]

    def get(self, request):
        user = request.user
        now = timezone.now()

        # Joined clubs
        joined_memberships = ClubMembership.objects.filter(student=user, status='approved')
        pending_memberships = ClubMembership.objects.filter(student=user, status='pending')

        # Upcoming registered events
        upcoming_registrations = EventRegistration.objects.filter(
            student=user,
            status__in=['approved', 'pending'],
            event__event_date__gt=now
        ).select_related('event', 'event__club').order_by('event__event_date')[:5]

        # Recent announcements (all + joined clubs)
        joined_club_ids = joined_memberships.values_list('club_id', flat=True)
        recent_announcements = Announcement.objects.filter(
            Q(target_audience='all') | Q(club__in=joined_club_ids),
            is_active=True
        ).order_by('-published_at')[:5]

        # Recommended upcoming events (not already registered)
        registered_event_ids = EventRegistration.objects.filter(
            student=user
        ).values_list('event_id', flat=True)
        recommended_events = Event.objects.filter(
            event_date__gt=now,
            is_active=True,
            registration_deadline__gt=now
        ).exclude(id__in=registered_event_ids).order_by('event_date')[:6]

        # Upcoming club meetings from joined clubs
        from meetings.models import Meeting
        from meetings.serializers import MeetingSerializer
        upcoming_meetings = Meeting.objects.filter(
            club__in=joined_club_ids,
            status__in=['upcoming', 'ongoing'],
            date__gte=now.date()
        ).select_related('club', 'organizer').prefetch_related('participants').order_by('date', 'start_time')[:5]

        from events.serializers import EventRegistrationSerializer, EventSerializer
        from announcements.serializers import AnnouncementSerializer

        return Response({
            'stats': {
                'joined_clubs': joined_memberships.count(),
                'pending_memberships': pending_memberships.count(),
                'upcoming_events': upcoming_registrations.count(),
                'upcoming_meetings': upcoming_meetings.count(),
            },
            'upcoming_registrations': EventRegistrationSerializer(
                upcoming_registrations, many=True, context={'request': request}
            ).data,
            'recent_announcements': AnnouncementSerializer(recent_announcements, many=True).data,
            'recommended_events': EventSerializer(
                recommended_events, many=True, context={'request': request}
            ).data,
            'upcoming_meetings': MeetingSerializer(
                upcoming_meetings, many=True, context={'request': request}
            ).data,
        })


class ClubAdminDashboardView(APIView):
    permission_classes = [IsClubAdminOrSuperAdmin]

    def get(self, request):
        user = request.user
        now = timezone.now()

        try:
            club = user.administered_club
        except Exception:
            return Response({'error': 'You are not assigned to any club.'}, status=404)

        total_members = ClubMembership.objects.filter(club=club, status='approved').count()
        pending_requests = ClubMembership.objects.filter(club=club, status='pending').count()

        all_events = Event.objects.filter(club=club)
        total_events = all_events.count()
        upcoming_events = all_events.filter(event_date__gt=now, is_active=True)
        completed_events = all_events.filter(event_date__lte=now).count()

        total_registrations = EventRegistration.objects.filter(
            event__club=club, status__in=['approved', 'pending']
        ).count()
        approved_registrations = EventRegistration.objects.filter(
            event__club=club, status='approved'
        ).count()

        # Check-in counts for events
        from events.models import EventPass
        checked_in_passes = EventPass.objects.filter(
            registration__event__club=club, is_checked_in=True
        ).count()
        event_attendance_rate = round((checked_in_passes / approved_registrations * 100), 1) if approved_registrations > 0 else 0

        avg_rating = EventFeedback.objects.filter(
            event__club=club
        ).aggregate(avg=Avg('rating'))['avg']

        # Meetings stats for this club
        try:
            from meetings.models import Meeting, MeetingParticipant
            club_meetings = Meeting.objects.filter(club=club)
            total_meetings = club_meetings.count()
            upcoming_meetings = club_meetings.filter(status='upcoming', date__gte=now.date()).count()
            completed_meetings = club_meetings.filter(status='completed').count()
            total_meeting_attendees = MeetingParticipant.objects.filter(
                meeting__club=club, attendance_status='present'
            ).count()
        except Exception:
            total_meetings = 0
            upcoming_meetings = 0
            completed_meetings = 0
            total_meeting_attendees = 0

        # Events list with available seats
        events_data = []
        for event in upcoming_events[:8]:
            events_data.append({
                'id': event.id,
                'title': event.title,
                'event_date': event.event_date,
                'capacity': event.capacity,
                'registered': event.registered_count,
                'available': event.available_seats,
            })

        # Recent membership requests
        recent_requests = ClubMembership.objects.filter(
            club=club, status='pending'
        ).select_related('student').order_by('-requested_at')[:5]
        from clubs.serializers import ClubMembershipSerializer

        # Recent announcements
        from announcements.models import Announcement
        from announcements.serializers import AnnouncementSerializer
        recent_announcements = Announcement.objects.filter(
            Q(club=club) | Q(target_audience='all')
        ).order_by('-published_at')[:4]

        return Response({
            'stats': {
                'total_members': total_members,
                'pending_membership_requests': pending_requests,
                'total_events': total_events,
                'upcoming_events': upcoming_events.count(),
                'completed_events': completed_events,
                'total_registrations': total_registrations,
                'checked_in_attendees': checked_in_passes,
                'event_attendance_rate': event_attendance_rate,
                'average_rating': round(avg_rating, 2) if avg_rating else None,
                'total_meetings': total_meetings,
                'upcoming_meetings': upcoming_meetings,
                'completed_meetings': completed_meetings,
                'total_meeting_attendees': total_meeting_attendees,
            },
            'upcoming_events': events_data,
            'recent_membership_requests': ClubMembershipSerializer(recent_requests, many=True).data,
            'recent_announcements': AnnouncementSerializer(recent_announcements, many=True).data,
        })


class SuperAdminDashboardView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        now = timezone.now()

        total_students = CustomUser.objects.filter(role='student').count()
        total_club_admins = CustomUser.objects.filter(role='club_admin').count()
        total_clubs = Club.objects.count()
        approved_clubs = Club.objects.filter(is_approved=True).count()
        pending_clubs = Club.objects.filter(is_approved=False).count()

        total_events = Event.objects.count()
        upcoming_events = Event.objects.filter(event_date__gt=now, is_active=True).count()
        completed_events = Event.objects.filter(event_date__lte=now).count()

        total_memberships = ClubMembership.objects.filter(status='approved').count()
        total_registrations = EventRegistration.objects.exclude(status='cancelled').count()
        approved_registrations = EventRegistration.objects.filter(status='approved').count()

        from events.models import EventPass
        total_check_ins = EventPass.objects.filter(is_checked_in=True).count()
        overall_attendance_rate = round((total_check_ins / approved_registrations * 100), 1) if approved_registrations > 0 else 0

        from announcements.models import Announcement
        total_announcements = Announcement.objects.count()

        try:
            from meetings.models import Meeting, MeetingParticipant
            total_meetings = Meeting.objects.count()
            upcoming_meetings = Meeting.objects.filter(status='upcoming', date__gte=now.date()).count()
            completed_meetings = Meeting.objects.filter(status='completed').count()
            total_meeting_attendance = MeetingParticipant.objects.filter(attendance_status='present').count()
        except Exception:
            total_meetings = 0
            upcoming_meetings = 0
            completed_meetings = 0
            total_meeting_attendance = 0

        # Events by category for chart
        events_by_category = list(
            Event.objects.values('category').annotate(count=Count('id')).order_by('-count')
        )

        # Clubs by category
        clubs_by_category = list(
            Club.objects.filter(is_approved=True).values('category').annotate(count=Count('id')).order_by('-count')
        )

        # Monthly registrations (last 6 months) - computed safely in Python to avoid MySQL timezone table errors
        reg_dates = EventRegistration.objects.filter(
            registered_at__gte=now - timezone.timedelta(days=180)
        ).values_list('registered_at', flat=True)

        from collections import defaultdict
        month_counts = defaultdict(int)
        for dt in reg_dates:
            if dt:
                month_counts[dt.strftime('%b %Y')] += 1

        monthly_registrations = []
        for i in range(5, -1, -1):
            target_date = now - timezone.timedelta(days=i * 30)
            m_key = target_date.strftime('%b %Y')
            monthly_registrations.append({
                'month': m_key,
                'registrations': month_counts.get(m_key, 0)
            })

        # Recent users
        recent_users = CustomUser.objects.order_by('-date_joined')[:6]
        from accounts.serializers import UserListSerializer

        # Recent activities
        recent_events = Event.objects.order_by('-created_at')[:4]
        from events.serializers import EventSerializer

        return Response({
            'stats': {
                'total_students': total_students,
                'total_club_admins': total_club_admins,
                'total_clubs': total_clubs,
                'approved_clubs': approved_clubs,
                'pending_clubs': pending_clubs,
                'total_events': total_events,
                'upcoming_events': upcoming_events,
                'completed_events': completed_events,
                'total_memberships': total_memberships,
                'total_registrations': total_registrations,
                'total_check_ins': total_check_ins,
                'overall_attendance_rate': overall_attendance_rate,
                'total_announcements': total_announcements,
                'total_meetings': total_meetings,
                'upcoming_meetings': upcoming_meetings,
                'completed_meetings': completed_meetings,
                'total_meeting_attendance': total_meeting_attendance,
            },
            'charts': {
                'events_by_category': events_by_category,
                'clubs_by_category': clubs_by_category,
                'monthly_registrations': monthly_registrations,
            },
            'recent_users': UserListSerializer(recent_users, many=True).data,
            'recent_events': EventSerializer(recent_events, many=True, context={'request': request}).data,
        })
