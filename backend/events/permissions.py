from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsEventClubAdmin(BasePermission):
    """Allow modification only if the user is the club admin for the event's club."""
    def has_object_permission(self, request, view, obj):
        if request.user.is_super_admin:
            return True
        if request.method in SAFE_METHODS:
            return True
        # obj is an Event
        return obj.club.admin_user == request.user


class CanManageRegistration(BasePermission):
    """Club admin can only manage registrations of their club's events."""
    def has_object_permission(self, request, view, obj):
        if request.user.is_super_admin:
            return True
        # obj is EventRegistration
        return obj.event.club.admin_user == request.user
