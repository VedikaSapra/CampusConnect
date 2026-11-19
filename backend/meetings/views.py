import csv
import secrets
from django.http import HttpResponse
from django.utils import timezone
from django.db import transaction
from django.db.models import Q, Count
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Meeting, MeetingParticipant, Notification
from .serializers import MeetingSerializer, MeetingParticipantSerializer, NotificationSerializer
from accounts.permissions import IsStudent, IsClubAdmin, IsClubAdminOrSuperAdmin, IsSuperAdmin
from clubs.models import ClubMembership, Club


class MeetingListCreateView(generics.ListCreateAPIView):
    serializer_class = MeetingSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsClubAdminOrSuperAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Meeting.objects.select_related('club', 'organizer').prefetch_related('participants')
        status_param = self.request.query_params.get('status')
        type_param = self.request.query_params.get('type')
        upcoming = self.request.query_params.get('upcoming')

        if user.is_super_admin:
            pass  # Super admin sees all
        elif user.is_club_admin:
            try:
                club = user.administered_club
                qs = qs.filter(club=club)
            except Exception:
                return Meeting.objects.none()
        else:
            # Student sees meetings of approved clubs only
            joined_club_ids = ClubMembership.objects.filter(
                student=user, status='approved'
            ).values_list('club_id', flat=True)
            qs = qs.filter(club__in=joined_club_ids)

        if status_param and status_param != 'all':
            qs = qs.filter(status=status_param)
        if type_param and type_param != 'all':
            qs = qs.filter(meeting_type=type_param)
        if upcoming == 'true':
            qs = qs.filter(date__gte=timezone.now().date(), status__in=['upcoming', 'ongoing'])

        return qs.order_by('date', 'start_time')

    @transaction.atomic
    def perform_create(self, serializer):
        user = self.request.user
        club = None
        if user.is_club_admin:
            try:
                club = user.administered_club
            except Exception:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You are not assigned to any club.")
        else:
            # Super admin can assign to club via request data
            club_id = self.request.data.get('club')
            if club_id:
                club = Club.objects.filter(id=club_id).first()
            if not club:
                # default to first approved club if none specified
                club = Club.objects.filter(is_approved=True).first()

        if not club:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'club': 'A valid club must be associated with this meeting.'})

        meeting = serializer.save(organizer=user, club=club)

        # 1. Automatically invite all approved club members
        approved_memberships = ClubMembership.objects.filter(
            club=club, status='approved'
        ).select_related('student')

        participants_to_create = []
        notifications_to_create = []
        for m in approved_memberships:
            student = m.student
            participants_to_create.append(
                MeetingParticipant(
                    meeting=meeting,
                    student=student,
                    attendance_token=f"mtg_{secrets.token_urlsafe(20)}"
                )
            )
            notifications_to_create.append(
                Notification(
                    recipient=student,
                    title=f"New Meeting: {meeting.title}",
                    message=f"{club.name} has scheduled a {meeting.get_meeting_type_display()} on {meeting.date} at {meeting.start_time}.",
                    notification_type='meeting_invite',
                    link=f"/student/meetings"
                )
            )

        MeetingParticipant.objects.bulk_create(participants_to_create, ignore_conflicts=True)
        Notification.objects.bulk_create(notifications_to_create)

        # 2. Group Chat Integration: Share in club chat if requested
        share_in_chat = self.request.data.get('share_in_chat', True)
        if share_in_chat:
            try:
                from chat.models import ChatRoom, ChatMessage
                room = ChatRoom.objects.filter(club=club).first()
                if room:
                    mode_str = meeting.get_meeting_mode_display()
                    loc_str = meeting.meeting_link if meeting.meeting_mode == 'online' else meeting.venue
                    content = (
                        f"📅 **New Meeting Announced: {meeting.title}**\n\n"
                        f"• Type: {meeting.get_meeting_type_display()}\n"
                        f"• Date: {meeting.date}\n"
                        f"• Time: {meeting.start_time.strftime('%I:%M %p')} - {meeting.end_time.strftime('%I:%M %p')}\n"
                        f"• Mode: {mode_str} ({loc_str})\n"
                        f"• Agenda: {meeting.agenda or 'Open Discussion'}\n\n"
                        f"Please RSVP in the Meetings section!"
                    )
                    ChatMessage.objects.create(room=room, sender=user, content=content)
            except Exception as e:
                print("Could not share meeting to chat:", e)


class MeetingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MeetingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_super_admin:
            return Meeting.objects.all()
        if user.is_club_admin:
            return Meeting.objects.filter(club__admin_user=user)
        # Student
        joined = ClubMembership.objects.filter(student=user, status='approved').values_list('club_id', flat=True)
        return Meeting.objects.filter(club__in=joined)

    def perform_update(self, serializer):
        meeting = serializer.save()
        # Notify participants of update
        participants = meeting.participants.select_related('student')
        notifications = [
            Notification(
                recipient=p.student,
                title=f"Meeting Updated: {meeting.title}",
                message=f"Details for {meeting.title} have been updated. Date: {meeting.date}, Time: {meeting.start_time}.",
                notification_type='meeting_update',
                link="/student/meetings"
            )
            for p in participants
        ]
        Notification.objects.bulk_create(notifications)


class MeetingStatusUpdateView(APIView):
    """Club Admin / Super Admin cancel or complete a meeting."""
    permission_classes = [IsClubAdminOrSuperAdmin]

    def post(self, request, pk, action):
        meeting = generics.get_object_or_404(Meeting, pk=pk)
        user = request.user
        if not user.is_super_admin and meeting.club.admin_user != user:
            return Response({'error': 'Unauthorized for this club meeting.'}, status=status.HTTP_403_FORBIDDEN)

        if action == 'cancel':
            meeting.status = 'cancelled'
            meeting.save()
            # Notify participants
            notifications = [
                Notification(
                    recipient=p.student,
                    title=f"Meeting Cancelled: {meeting.title}",
                    message=f"The meeting scheduled for {meeting.date} has been cancelled.",
                    notification_type='meeting_cancelled',
                    link="/student/meetings"
                )
                for p in meeting.participants.select_related('student')
            ]
            Notification.objects.bulk_create(notifications)
            return Response({'message': 'Meeting marked as cancelled.', 'status': 'cancelled'})

        elif action == 'complete':
            meeting.status = 'completed'
            meeting.save()
            return Response({'message': 'Meeting marked as completed.', 'status': 'completed'})

        return Response({'error': 'Invalid action. Use "cancel" or "complete".'}, status=status.HTTP_400_BAD_REQUEST)


class MeetingRSVPView(APIView):
    """Member responds to meeting invitation: 'going' or 'not_going'."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        import secrets
        meeting = generics.get_object_or_404(Meeting, pk=pk)
        new_status = request.data.get('rsvp_status')
        if new_status not in ['going', 'not_going']:
            return Response({'error': "rsvp_status must be 'going' or 'not_going'."}, status=status.HTTP_400_BAD_REQUEST)

        participant, created = MeetingParticipant.objects.get_or_create(
            meeting=meeting,
            student=request.user,
            defaults={'attendance_token': f"mtg_{secrets.token_urlsafe(20)}"}
        )
        participant.rsvp_status = new_status
        participant.responded_at = timezone.now()
        if not participant.attendance_token:
            participant.attendance_token = f"mtg_{secrets.token_urlsafe(20)}"
        participant.save()

        return Response({
            'message': f"RSVP updated to {new_status}.",
            'rsvp_status': participant.rsvp_status,
            'attendance_token': participant.attendance_token
        })


class MeetingAttendanceView(APIView):
    """View and manage attendance for a meeting (Club Admin / Super Admin)."""
    permission_classes = [IsClubAdminOrSuperAdmin]

    def get(self, request, pk):
        meeting = generics.get_object_or_404(Meeting, pk=pk)
        participants = meeting.participants.select_related('student').all()

        total = participants.count()
        going = participants.filter(rsvp_status='going').count()
        present = participants.filter(attendance_status='present').count()
        absent = participants.filter(attendance_status='absent').count()
        excused = participants.filter(attendance_status='excused').count()
        unmarked = participants.filter(attendance_status='unmarked').count()
        rate = round((present / total) * 100, 1) if total > 0 else 0

        return Response({
            'meeting_id': meeting.id,
            'meeting_title': meeting.title,
            'meeting_date': meeting.date,
            'stats': {
                'total_invited': total,
                'confirmed_going': going,
                'present': present,
                'absent': absent,
                'excused': excused,
                'unmarked': unmarked,
                'attendance_rate': rate,
            },
            'participants': MeetingParticipantSerializer(participants, many=True).data
        })

    def post(self, request, pk):
        """Manual attendance marking: single or bulk."""
        meeting = generics.get_object_or_404(Meeting, pk=pk)
        user = request.user
        if not user.is_super_admin and meeting.club.admin_user != user:
            return Response({'error': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)

        # Check for bulk attendance payload
        items = request.data.get('attendance', [])
        if not items and 'student_id' in request.data:
            items = [request.data]

        updated_count = 0
        for item in items:
            student_id = item.get('student_id')
            new_status = item.get('status')
            if student_id and new_status in ['present', 'absent', 'excused', 'unmarked']:
                p = meeting.participants.filter(student_id=student_id).first()
                if p:
                    p.attendance_status = new_status
                    if new_status == 'present' and not p.check_in_time:
                        p.check_in_time = timezone.now()
                    p.save()
                    updated_count += 1

        return Response({'message': f"Updated attendance for {updated_count} member(s)."})


class MeetingCheckInView(APIView):
    """Verify QR code attendance token and mark present."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'Token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        participant = MeetingParticipant.objects.select_related('meeting', 'student', 'meeting__club').filter(
            attendance_token=token
        ).first()

        if not participant:
            return Response({'error': 'Invalid meeting attendance token.'}, status=status.HTTP_404_NOT_FOUND)

        if participant.attendance_status == 'present':
            return Response({
                'already_checked_in': True,
                'message': f"{participant.student.get_full_name()} is already checked in for {participant.meeting.title}.",
                'check_in_time': participant.check_in_time,
                'student_name': participant.student.get_full_name(),
                'meeting_title': participant.meeting.title
            })

        participant.attendance_status = 'present'
        participant.check_in_time = timezone.now()
        participant.save()

        return Response({
            'success': True,
            'message': f"Check-in verified! Welcome, {participant.student.get_full_name()}.",
            'student_name': participant.student.get_full_name(),
            'meeting_title': participant.meeting.title,
            'check_in_time': participant.check_in_time
        })


class MeetingAttendanceExportView(APIView):
    """Export meeting attendance as CSV."""
    permission_classes = [IsClubAdminOrSuperAdmin]

    def get(self, request, pk):
        meeting = generics.get_object_or_404(Meeting, pk=pk)
        participants = meeting.participants.select_related('student').all()

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="attendance_meeting_{meeting.id}.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Student Name', 'Username', 'Email', 'Student ID',
            'Department', 'Year', 'RSVP Status', 'Attendance Status',
            'Check-In Time'
        ])

        for p in participants:
            s = p.student
            writer.writerow([
                s.get_full_name(),
                s.username,
                s.email,
                s.student_id or 'N/A',
                s.department or 'N/A',
                s.year_of_study or 'N/A',
                p.get_rsvp_status_display(),
                p.get_attendance_status_display(),
                p.check_in_time.strftime('%Y-%m-%d %H:%M:%S') if p.check_in_time else 'N/A'
            ])

        return response


class MyMeetingsView(generics.ListAPIView):
    """Student list of meetings from their joined clubs."""
    serializer_class = MeetingSerializer
    permission_classes = [IsStudent]

    def get_queryset(self):
        user = self.request.user
        joined_club_ids = ClubMembership.objects.filter(
            student=user, status='approved'
        ).values_list('club_id', flat=True)

        qs = Meeting.objects.filter(
            club__in=joined_club_ids
        ).select_related('club', 'organizer').prefetch_related('participants')

        status_filter = self.request.query_params.get('status')
        if status_filter and status_filter != 'all':
            qs = qs.filter(status=status_filter)

        return qs.order_by('date', 'start_time')


class NotificationListView(generics.ListAPIView):
    """List notifications for the authenticated user."""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)[:30]

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        serializer = self.get_serializer(qs, many=True)
        return Response({
            'unread_count': unread_count,
            'notifications': serializer.data
        })


class NotificationMarkReadView(APIView):
    """Mark a notification or all notifications as read."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk=None):
        if pk:
            notif = generics.get_object_or_404(Notification, pk=pk, recipient=request.user)
            notif.is_read = True
            notif.save()
            return Response({'message': 'Marked as read.'})
        else:
            Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
            return Response({'message': 'All notifications marked as read.'})
