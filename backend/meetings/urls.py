from django.urls import path
from . import views

urlpatterns = [
    # Meetings (Specific static sub-paths must precede generic parameter patterns)
    path('', views.MeetingListCreateView.as_view(), name='meeting_list_create'),
    path('check-in/', views.MeetingCheckInView.as_view(), name='meeting_check_in'),
    path('my-meetings/', views.MyMeetingsView.as_view(), name='my_meetings'),
    path('<int:pk>/', views.MeetingDetailView.as_view(), name='meeting_detail'),
    path('<int:pk>/rsvp/', views.MeetingRSVPView.as_view(), name='meeting_rsvp'),
    path('<int:pk>/attendance/', views.MeetingAttendanceView.as_view(), name='meeting_attendance'),
    path('<int:pk>/attendance/export/', views.MeetingAttendanceExportView.as_view(), name='meeting_attendance_export'),
    path('<int:pk>/<str:action>/', views.MeetingStatusUpdateView.as_view(), name='meeting_status_action'),

    # Notifications
    path('notifications/', views.NotificationListView.as_view(), name='notification_list'),
    path('notifications/read-all/', views.NotificationMarkReadView.as_view(), name='notification_read_all'),
    path('notifications/<int:pk>/read/', views.NotificationMarkReadView.as_view(), name='notification_read_one'),
]
