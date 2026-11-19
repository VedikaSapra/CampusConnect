from rest_framework import serializers
from .models import ChatRoom, ChatMessage
from accounts.serializers import UserListSerializer


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_role = serializers.CharField(source='sender.role', read_only=True)
    attachment_url = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = [
            'id', 'room', 'sender', 'sender_name', 'sender_username',
            'sender_role', 'content', 'attachment', 'attachment_url',
            'is_deleted', 'created_at'
        ]
        read_only_fields = ['id', 'room', 'sender', 'created_at']

    def get_attachment_url(self, obj):
        request = self.context.get('request')
        if obj.attachment and request:
            return request.build_absolute_uri(obj.attachment.url)
        return None


class ChatRoomListSerializer(serializers.ModelSerializer):
    club_name = serializers.CharField(source='club.name', read_only=True)
    club_category = serializers.CharField(source='club.category', read_only=True)
    club_description = serializers.CharField(source='club.description', read_only=True)
    member_count = serializers.IntegerField(source='club.member_count', read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = [
            'id', 'club', 'club_name', 'club_category', 'club_description',
            'member_count', 'last_message', 'created_at'
        ]

    def get_last_message(self, obj):
        last = obj.messages.filter(is_deleted=False).order_by('-created_at').first()
        if last:
            return {
                'id': last.id,
                'content': last.content,
                'sender_name': last.sender.get_full_name(),
                'created_at': last.created_at,
            }
        return None
