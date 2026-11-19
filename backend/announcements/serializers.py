from rest_framework import serializers
from .models import Announcement
from accounts.serializers import UserListSerializer


class AnnouncementSerializer(serializers.ModelSerializer):
    author_detail = UserListSerializer(source='author', read_only=True)
    club_name = serializers.CharField(source='club.name', read_only=True, allow_null=True)

    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'content', 'author', 'author_detail',
            'target_audience', 'club', 'club_name',
            'published_at', 'expires_at', 'is_active'
        ]
        read_only_fields = ['id', 'author', 'published_at']
