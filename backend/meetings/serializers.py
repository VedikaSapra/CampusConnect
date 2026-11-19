from rest_framework import serializers
from .models import Meeting, MeetingParticipant, Notification
from accounts.serializers import UserListSerializer


class MeetingParticipantSerializer(serializers.ModelSerializer):
    student_detail = UserListSerializer(source='student', read_only=True)
    meeting_title = serializers.CharField(source='meeting.title', read_only=True)

    class Meta:
        model = MeetingParticipant
        fields = [
            'id', 'meeting', 'meeting_title', 'student', 'student_detail',
            'rsvp_status', 'attendance_status', 'attendance_token',
            'check_in_time', 'invited_at', 'responded_at'
        ]
        read_only_fields = ['id', 'meeting', 'student', 'attendance_token', 'invited_at']


class MeetingSerializer(serializers.ModelSerializer):
    club_name = serializers.CharField(source='club.name', read_only=True)
    club_logo = serializers.SerializerMethodField(read_only=True)
    organizer_name = serializers.CharField(source='organizer.get_full_name', read_only=True)
    total_invited = serializers.IntegerField(read_only=True)
    total_going = serializers.IntegerField(read_only=True)
    total_not_going = serializers.IntegerField(read_only=True)
    total_attended = serializers.IntegerField(read_only=True)
    attendance_rate = serializers.FloatField(read_only=True)
    my_rsvp = serializers.SerializerMethodField(read_only=True)
    my_attendance_token = serializers.SerializerMethodField(read_only=True)
    my_attendance_status = serializers.SerializerMethodField(read_only=True)

    venue = serializers.CharField(max_length=255, required=False, allow_blank=True, default='TBD')
    meeting_link = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True, default='')
    description = serializers.CharField(required=False, allow_blank=True, default='')
    agenda = serializers.CharField(required=False, allow_blank=True, allow_null=True, default='')

    class Meta:
        model = Meeting
        fields = [
            'id', 'club', 'club_name', 'club_logo', 'title', 'description',
            'meeting_type', 'date', 'start_time', 'end_time', 'venue',
            'meeting_mode', 'meeting_link', 'agenda', 'organizer', 'organizer_name',
            'attendance_required', 'status', 'total_invited', 'total_going',
            'total_not_going', 'total_attended', 'attendance_rate',
            'my_rsvp', 'my_attendance_token', 'my_attendance_status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'organizer', 'club', 'created_at', 'updated_at']

    def get_club_logo(self, obj):
        request = self.context.get('request')
        if obj.club.logo and request:
            return request.build_absolute_uri(obj.club.logo.url)
        return None

    def get_my_rsvp(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            participant = obj.participants.filter(student=request.user).first()
            if participant:
                return participant.rsvp_status
        return None

    def get_my_attendance_token(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            participant = obj.participants.filter(student=request.user).first()
            if participant:
                return participant.attendance_token
        return None

    def get_my_attendance_status(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            participant = obj.participants.filter(student=request.user).first()
            if participant:
                return participant.attendance_status
        return None


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'notification_type',
            'link', 'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
