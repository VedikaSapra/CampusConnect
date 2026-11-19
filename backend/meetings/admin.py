from django.contrib import admin
from .models import Meeting, MeetingParticipant, Notification


@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ['title', 'club', 'meeting_type', 'date', 'start_time', 'meeting_mode', 'status']
    list_filter = ['status', 'meeting_type', 'meeting_mode', 'club']
    search_fields = ['title', 'description', 'venue']


@admin.register(MeetingParticipant)
class MeetingParticipantAdmin(admin.ModelAdmin):
    list_display = ['meeting', 'student', 'rsvp_status', 'attendance_status', 'check_in_time']
    list_filter = ['rsvp_status', 'attendance_status']
    search_fields = ['student__username', 'student__email', 'meeting__title']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['recipient', 'title', 'notification_type', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read']
    search_fields = ['recipient__email', 'title', 'message']
