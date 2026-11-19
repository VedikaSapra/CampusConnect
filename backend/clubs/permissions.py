from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsClubAdminOfClub(BasePermission):
    """Allow modification only if the user is the club admin of this specific club."""
    def has_object_permission(self, request, view, obj):
        if request.user.is_super_admin:
            return True
        if request.method in SAFE_METHODS:
            return True
        # obj is a Club
        return obj.admin_user == request.user


class IsClubAdminOfMembershipClub(BasePermission):
    """Allow modification of memberships only by that club's admin."""
    def has_object_permission(self, request, view, obj):
        if request.user.is_super_admin:
            return True
        # obj is a ClubMembership
        return obj.club.admin_user == request.user


class CanManageMembership(BasePermission):
    """Club admin can only manage memberships of their own club."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_club_admin or request.user.is_super_admin
        )
