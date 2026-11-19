from django.urls import path
from . import views

urlpatterns = [
    path('rooms/', views.ChatRoomListView.as_view(), name='chat_rooms'),
    path('rooms/<int:room_id>/messages/', views.ChatMessagesView.as_view(), name='chat_messages'),
    path('rooms/<int:room_id>/members/', views.ChatRoomMembersView.as_view(), name='chat_room_members'),
    path('rooms/<int:room_id>/upload/', views.ChatAttachmentUploadView.as_view(), name='chat_upload'),
]
