from django.contrib import admin
from .models import Club, ClubMembership


@admin.register(Club)
class ClubAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'admin_user', 'is_approved', 'member_count', 'created_at']
    list_filter = ['category', 'is_approved']
    search_fields = ['name', 'description', 'faculty_coordinator']
    list_editable = ['is_approved']


@admin.register(ClubMembership)
class ClubMembershipAdmin(admin.ModelAdmin):
    list_display = ['student', 'club', 'status', 'requested_at']
    list_filter = ['status', 'club']
    search_fields = ['student__email', 'club__name']
