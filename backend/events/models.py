from django.db import models
from django.conf import settings
from django.utils import timezone
import secrets


class Event(models.Model):
    CATEGORY_CHOICES = [
        ('workshop', 'Workshop'),
        ('seminar', 'Seminar'),
        ('competition', 'Competition'),
        ('cultural', 'Cultural'),
        ('sports', 'Sports'),
        ('networking', 'Networking'),
        ('hackathon', 'Hackathon'),
        ('other', 'Other'),
    ]

    title = models.CharField(max_length=250)
    description = models.TextField()
    banner_image = models.ImageField(upload_to='event_banners/', blank=True, null=True)
    club = models.ForeignKey(
        'clubs.Club', on_delete=models.CASCADE, related_name='events'
    )
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='other')
    event_date = models.DateTimeField()
    venue = models.CharField(max_length=300)
    capacity = models.PositiveIntegerField(default=50)
    registration_deadline = models.DateTimeField()
    requires_approval = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='created_events'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'events'
        ordering = ['event_date']

    def __str__(self):
        return f"{self.title} — {self.club.name}"

    @property
    def is_registration_open(self):
        return (
            timezone.now() <= self.registration_deadline and
            self.event_date > timezone.now() and
            self.is_active
        )

    @property
    def registered_count(self):
        return self.registrations.filter(status__in=['approved', 'pending']).count()

    @property
    def available_seats(self):
        return max(0, self.capacity - self.registered_count)

    @property
    def is_past(self):
        return self.event_date < timezone.now()


class EventRegistration(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='event_registrations', limit_choices_to={'role': 'student'}
    )
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    registered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'event_registrations'
        unique_together = ('student', 'event')
        ordering = ['-registered_at']

    def __str__(self):
        return f"{self.student.get_full_name()} → {self.event.title} ({self.status})"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Automatically generate or manage EventPass when registration is approved
        if self.status == 'approved':
            if not hasattr(self, 'pass_record'):
                EventPass.objects.create(registration=self)
            else:
                pass_rec = self.pass_record
                pass_rec.is_valid = True
                pass_rec.save()
        elif self.status in ['cancelled', 'rejected']:
            if hasattr(self, 'pass_record'):
                pass_rec = self.pass_record
                pass_rec.is_valid = False
                pass_rec.save()


class EventPass(models.Model):
    """
    Every approved registration receives a unique, unforgeable digital pass.
    The verification_token is a cryptographically strong 32-character hex token.
    """
    registration = models.OneToOneField(
        EventRegistration,
        on_delete=models.CASCADE,
        related_name='pass_record'
    )
    verification_token = models.CharField(max_length=64, unique=True, db_index=True)
    is_valid = models.BooleanField(default=True)
    is_checked_in = models.BooleanField(default=False)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    checked_in_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_passes'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'event_passes'

    def save(self, *args, **kwargs):
        if not self.verification_token:
            self.verification_token = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Pass for {self.registration.student.get_full_name()} — {self.registration.event.title}"


class EventFeedback(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='feedbacks', limit_choices_to={'role': 'student'}
    )
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='feedbacks')
    rating = models.PositiveSmallIntegerField(choices=[(i, str(i)) for i in range(1, 6)])
    comments = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'event_feedback'
        unique_together = ('student', 'event')
        ordering = ['-submitted_at']

    def __str__(self):
        return f"Feedback by {self.student.get_full_name()} for {self.event.title} — {self.rating}★"
