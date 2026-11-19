from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import ChatRoom, ChatMessage
from .serializers import ChatRoomListSerializer, ChatMessageSerializer
from clubs.models import Club, ClubMembership
from accounts.serializers import UserListSerializer


def has_chat_access(user, room):
    """
    Enforces membership-based chat authorization:
    - Super admins have global moderation access.
    - Club admins only access their own club's chat.
    - Students only access chats of clubs where they have an APPROVED membership.
    """
    if not user.is_authenticated:
        return False
    if user.is_super_admin:
        return True
    if user.is_club_admin:
        return room.club.admin_user_id == user.id
    if user.is_student:
        return ClubMembership.objects.filter(
            club=room.club,
            student=user,
            status='approved'
        ).exists()
    return False


class ChatRoomListView(APIView):
    """
    Returns only the chat rooms the authenticated user is authorized to participate in.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Ensure every approved club has a ChatRoom
        approved_clubs = Club.objects.filter(is_approved=True)
        for club in approved_clubs:
            ChatRoom.objects.get_or_create(club=club)

        if user.is_super_admin:
            rooms = ChatRoom.objects.all().select_related('club')
        elif user.is_club_admin:
            rooms = ChatRoom.objects.filter(club__admin_user=user).select_related('club')
        else:
            # Student: only approved clubs
            approved_club_ids = ClubMembership.objects.filter(
                student=user,
                status='approved'
            ).values_list('club_id', flat=True)
            rooms = ChatRoom.objects.filter(club_id__in=approved_club_ids).select_related('club')

        serializer = ChatRoomListSerializer(rooms, many=True, context={'request': request})
        return Response(serializer.data)


class ChatMessagesView(generics.ListCreateAPIView):
    """
    List messages or send a message to a club chat room.
    Strictly verifies club membership before allowing read or write.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChatMessageSerializer

    def get_room(self):
        room_id = self.kwargs.get('room_id')
        room = get_object_or_404(ChatRoom, pk=room_id)
        if not has_chat_access(self.request.user, room):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You are not an approved member of this club.")
        return room

    def get_queryset(self):
        room = self.get_room()
        return room.messages.filter(is_deleted=False).select_related('sender').order_by('created_at')

    def perform_create(self, serializer):
        room = self.get_room()
        serializer.save(room=room, sender=self.request.user)


class ChatRoomMembersView(APIView):
    """
    Returns list of members in the club group chat.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_id):
        room = get_object_or_404(ChatRoom, pk=room_id)
        if not has_chat_access(request.user, room):
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        # Approved members
        approved_members = ClubMembership.objects.filter(
            club=room.club,
            status='approved'
        ).select_related('student')

        students = [m.student for m in approved_members]
        if room.club.admin_user:
            students.insert(0, room.club.admin_user)

        return Response(UserListSerializer(students, many=True).data)


class ChatAttachmentUploadView(APIView):
    """
    Handles file / image uploads for chat messages.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, room_id):
        room = get_object_or_404(ChatRoom, pk=room_id)
        if not has_chat_access(request.user, room):
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        file_obj = request.FILES.get('file')
        content = request.data.get('content', '')
        if not file_obj and not content:
            return Response({'error': 'No file or message provided'}, status=status.HTTP_400_BAD_REQUEST)

        msg = ChatMessage.objects.create(
            room=room,
            sender=request.user,
            content=content,
            attachment=file_obj
        )
        return Response(ChatMessageSerializer(msg, context={'request': request}).data, status=status.HTTP_201_CREATED)
