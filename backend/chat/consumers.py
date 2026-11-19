import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from accounts.models import CustomUser
from .models import ChatRoom, ChatMessage
from clubs.models import ClubMembership


class ClubChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'club_chat_{self.room_id}'

        # Authenticate user from query parameter token or headers
        self.user = await self.get_user_from_scope()
        if not self.user or self.user.is_anonymous:
            await self.close(code=4001)
            return

        # Check membership authorization before joining room
        has_access = await self.check_membership_access(self.user, self.room_id)
        if not has_access:
            await self.close(code=4003)
            return

        # Join channel layer group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except Exception:
            return

        action = data.get('action', 'send_message')

        if action == 'send_message':
            content = data.get('content', '').strip()
            if not content:
                return

            # Save message to database
            msg = await self.save_message(self.user, self.room_id, content)

            # Broadcast message to all active subscribers in room
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': {
                        'id': msg.id,
                        'room': int(self.room_id),
                        'sender': self.user.id,
                        'sender_name': self.user.get_full_name(),
                        'sender_username': self.user.username,
                        'sender_role': self.user.role,
                        'content': msg.content,
                        'created_at': msg.created_at.isoformat(),
                    }
                }
            )

        elif action == 'typing':
            # Broadcast typing indicator
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_typing',
                    'user': {
                        'id': self.user.id,
                        'name': self.user.get_full_name(),
                    }
                }
            )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message']
        }))

    async def user_typing(self, event):
        # Don't echo typing to the sender themselves
        if event['user']['id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'user_typing',
                'user': event['user']
            }))

    @database_sync_to_async
    def get_user_from_scope(self):
        try:
            # Look for token in query string: ?token=<jwt_access_token>
            query_string = self.scope.get('query_string', b'').decode('utf-8')
            params = dict(qp.split('=') for qp in query_string.split('&') if '=' in qp)
            token_str = params.get('token')
            if token_str:
                token = AccessToken(token_str)
                user_id = token.payload.get('user_id')
                return CustomUser.objects.filter(id=user_id, is_active=True).first()
        except Exception as e:
            pass
        return getattr(self.scope, 'user', AnonymousUser())

    @database_sync_to_async
    def check_membership_access(self, user, room_id):
        if user.is_super_admin:
            return True
        try:
            room = ChatRoom.objects.select_related('club').get(pk=room_id)
            if user.is_club_admin:
                return room.club.admin_user_id == user.id
            if user.is_student:
                return ClubMembership.objects.filter(
                    club=room.club,
                    student=user,
                    status='approved'
                ).exists()
        except ChatRoom.DoesNotExist:
            return False
        return False

    @database_sync_to_async
    def save_message(self, user, room_id, content):
        room = ChatRoom.objects.get(pk=room_id)
        return ChatMessage.objects.create(
            room=room,
            sender=user,
            content=content
        )
