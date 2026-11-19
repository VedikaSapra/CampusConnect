from django.db import models
from django.conf import settings


class Club(models.Model):
    CATEGORY_CHOICES = [
        ('technical', 'Technical'),
        ('cultural', 'Cultural'),
        ('sports', 'Sports'),
        ('social', 'Social Service'),
        ('academic', 'Academic'),
        ('arts', 'Arts & Media'),
        ('entrepreneurship', 'Entrepreneurship'),
        ('other', 'Other'),
    ]

    name = models.CharField(max_length=200, unique=True)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='other')
    logo = models.ImageField(upload_to='club_logos/', blank=True, null=True)
    cover_image = models.ImageField(upload_to='club_covers/', blank=True, null=True)
    faculty_coordinator = models.CharField(max_length=200, blank=True, null=True)
    admin_user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='administered_club',
        limit_choices_to={'role': 'club_admin'}
    )
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'clubs'
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def member_count(self):
        return self.memberships.filter(status='approved').count()


class ClubMembership(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='memberships',
        limit_choices_to={'role': 'student'}
    )
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='memberships')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    requested_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'club_memberships'
        unique_together = ('student', 'club')
        ordering = ['-requested_at']

    def __str__(self):
        return f"{self.student.get_full_name()} → {self.club.name} ({self.status})"
