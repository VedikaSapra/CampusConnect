from django.contrib import admin
from .models import Announcement


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'target_audience', 'club', 'is_active', 'published_at', 'expires_at']
    list_filter = ['target_audience', 'is_active', 'club']
    search_fields = ['title', 'content']
    list_editable = ['is_active']
