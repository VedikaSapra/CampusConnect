from django.db import models
from django.conf import settings


class Announcement(models.Model):
    TARGET_CHOICES = [
        ('all', 'All Students'),
        ('club', 'Club Members'),
    ]

    title = models.CharField(max_length=250)
    content = models.TextField()
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='announcements'
    )
    target_audience = models.CharField(max_length=20, choices=TARGET_CHOICES, default='all')
    club = models.ForeignKey(
        'clubs.Club', on_delete=models.CASCADE, null=True, blank=True,
        related_name='announcements'
    )
    published_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'announcements'
        ordering = ['-published_at']

    def __str__(self):
        return self.title
