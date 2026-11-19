import secrets
from django.db import models
from django.conf import settings
from django.utils import timezone


def generate_attendance_token():
    return f"mtg_{secrets.token_urlsafe(20)}"


class Meeting(models.Model):
    TYPE_CHOICES = [
        ('general', 'General Meeting'),
        ('planning', 'Planning Meeting'),
        ('event_prep', 'Event Preparation'),
        ('committee', 'Committee Meeting'),
        ('technical', 'Technical Discussion'),
        ('volunteer', 'Volunteer Meeting'),
        ('other', 'Other'),
    ]

    MODE_CHOICES = [
        ('in_person', 'In Person'),
        ('online', 'Online'),
        ('hybrid', 'Hybrid'),
    ]

    STATUS_CHOICES = [
        ('upcoming', 'Upcoming'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    club = models.ForeignKey(
        'clubs.Club', on_delete=models.CASCADE, related_name='meetings'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    meeting_type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='general')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    venue = models.CharField(max_length=255, default='TBD', blank=True)
    meeting_mode = models.CharField(max_length=20, choices=MODE_CHOICES, default='in_person')
    meeting_link = models.URLField(max_length=500, blank=True, null=True)
    agenda = models.TextField(blank=True, null=True)
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='organized_meetings'
    )
    attendance_required = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'meetings'
        ordering = ['date', 'start_time']

    def __str__(self):
        return f"{self.title} ({self.club.name})"

    @property
    def total_invited(self):
        return self.participants.count()

    @property
    def total_going(self):
        return self.participants.filter(rsvp_status='going').count()

    @property
    def total_not_going(self):
        return self.participants.filter(rsvp_status='not_going').count()

    @property
    def total_attended(self):
        return self.participants.filter(attendance_status='present').count()

    @property
    def attendance_rate(self):
        total = self.participants.count()
        if total == 0:
            return 0
        present = self.participants.filter(attendance_status='present').count()
        return round((present / total) * 100, 1)


class MeetingParticipant(models.Model):
    RSVP_CHOICES = [
        ('pending', 'Not Responded'),
        ('going', 'Going'),
        ('not_going', 'Not Going'),
    ]

    ATTENDANCE_CHOICES = [
        ('unmarked', 'Unmarked'),
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('excused', 'Excused'),
    ]

    meeting = models.ForeignKey(
        Meeting, on_delete=models.CASCADE, related_name='participants'
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='meeting_participations'
    )
    rsvp_status = models.CharField(max_length=20, choices=RSVP_CHOICES, default='pending')
    attendance_status = models.CharField(max_length=20, choices=ATTENDANCE_CHOICES, default='unmarked')
    attendance_token = models.CharField(max_length=64, unique=True, db_index=True, default=generate_attendance_token)
    check_in_time = models.DateTimeField(null=True, blank=True)
    invited_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'meeting_participants'
        unique_together = ('meeting', 'student')

    def save(self, *args, **kwargs):
        if not self.attendance_token:
            self.attendance_token = f"mtg_{secrets.token_urlsafe(20)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.meeting.title}"


class Notification(models.Model):
    TYPE_CHOICES = [
        ('meeting_invite', 'Meeting Invitation'),
        ('meeting_update', 'Meeting Update'),
        ('meeting_cancelled', 'Meeting Cancelled'),
        ('meeting_reminder', 'Meeting Reminder'),
        ('event_registration', 'Event Registration'),
        ('membership_approved', 'Membership Approved'),
        ('announcement', 'Announcement'),
        ('info', 'Information'),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='notifications'
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='info')
    link = models.CharField(max_length=255, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.notification_type}] {self.title} -> {self.recipient.email}"
