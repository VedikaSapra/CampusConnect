from rest_framework import serializers
from .models import Club, ClubMembership
from accounts.serializers import UserListSerializer


class ClubSerializer(serializers.ModelSerializer):
    member_count = serializers.ReadOnlyField()
    admin_user_detail = UserListSerializer(source='admin_user', read_only=True)
    logo_url = serializers.SerializerMethodField()
    cover_image_url = serializers.SerializerMethodField()
    membership_status = serializers.SerializerMethodField()

    class Meta:
        model = Club
        fields = [
            'id', 'name', 'description', 'category', 'logo', 'logo_url',
            'cover_image', 'cover_image_url', 'faculty_coordinator',
            'admin_user', 'admin_user_detail', 'is_approved',
            'member_count', 'membership_status', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'logo': {'write_only': True},
            'cover_image': {'write_only': True},
        }

    def get_logo_url(self, obj):
        request = self.context.get('request')
        if obj.logo and request:
            return request.build_absolute_uri(obj.logo.url)
        return None

    def get_cover_image_url(self, obj):
        request = self.context.get('request')
        if obj.cover_image and request:
            return request.build_absolute_uri(obj.cover_image.url)
        return None

    def get_membership_status(self, obj):
        """Return the requesting student's membership status for this club."""
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.is_student:
            membership = obj.memberships.filter(student=request.user).first()
            if membership:
                return membership.status
        return None


class ClubMembershipSerializer(serializers.ModelSerializer):
    student_detail = UserListSerializer(source='student', read_only=True)
    club_name = serializers.CharField(source='club.name', read_only=True)

    class Meta:
        model = ClubMembership
        fields = [
            'id', 'student', 'student_detail', 'club', 'club_name',
            'status', 'requested_at', 'updated_at'
        ]
        read_only_fields = ['id', 'student', 'club', 'requested_at', 'updated_at']

    def validate_status(self, value):
        if value not in ['approved', 'rejected']:
            raise serializers.ValidationError("Status must be 'approved' or 'rejected'.")
        return value
