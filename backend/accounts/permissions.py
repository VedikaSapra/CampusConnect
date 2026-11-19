from rest_framework.permissions import BasePermission


class IsStudent(BasePermission):
    """Allow access only to users with student role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_student)


class IsClubAdmin(BasePermission):
    """Allow access only to users with club_admin role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_club_admin)


class IsSuperAdmin(BasePermission):
    """Allow access only to users with super_admin role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_super_admin)


class IsClubAdminOrSuperAdmin(BasePermission):
    """Allow access to club admins and super admins."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            (request.user.is_club_admin or request.user.is_super_admin)
        )


class IsOwnerOrSuperAdmin(BasePermission):
    """Allow access to object owner or super admin."""
    def has_object_permission(self, request, view, obj):
        if request.user.is_super_admin:
            return True
        return obj == request.user
