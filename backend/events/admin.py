from django.contrib import admin
from .models import Event, EventRegistration, EventFeedback


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'club', 'category', 'event_date', 'capacity', 'is_active', 'registered_count']
    list_filter = ['category', 'is_active', 'club', 'requires_approval']
    search_fields = ['title', 'description', 'venue']
    list_editable = ['is_active']


@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    list_display = ['student', 'event', 'status', 'registered_at']
    list_filter = ['status', 'event__club']
    search_fields = ['student__email', 'event__title']


@admin.register(EventFeedback)
class EventFeedbackAdmin(admin.ModelAdmin):
    list_display = ['student', 'event', 'rating', 'submitted_at']
    list_filter = ['rating', 'event']
