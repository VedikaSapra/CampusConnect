from django.db import models
from django.conf import settings
from clubs.models import Club


class ChatRoom(models.Model):
    """
    Every approved club automatically has a ChatRoom.
    Membership to the chat room is governed strictly by approved ClubMembership.
    """
    club = models.OneToOneField(Club, on_delete=models.CASCADE, related_name='chat_room')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'chat_rooms'

    def __str__(self):
        return f"Chat: {self.club.name}"


class ChatMessage(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField(blank=True, default='')
    attachment = models.FileField(upload_to='chat_attachments/', blank=True, null=True)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'chat_messages'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username} in {self.room.club.name}: {self.content[:30]}"
