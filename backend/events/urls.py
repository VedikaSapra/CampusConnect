from django.urls import path
from . import views

urlpatterns = [
    path('', views.EventListCreateView.as_view(), name='event_list_create'),
    path('<int:pk>/', views.EventDetailView.as_view(), name='event_detail'),
    path('<int:pk>/register/', views.EventRegisterView.as_view(), name='event_register'),
    path('<int:pk>/registrations/', views.EventRegistrationListView.as_view(), name='event_registrations'),
    path('<int:pk>/feedback/', views.EventFeedbackView.as_view(), name='event_feedback'),
    path('registrations/<int:pk>/', views.EventRegistrationUpdateView.as_view(), name='registration_update'),
    path('my-registrations/', views.MyEventRegistrationsView.as_view(), name='my_registrations'),
    path('my-club-events/', views.MyClubEventsView.as_view(), name='my_club_events'),
    path('my-club-registrations/', views.MyClubRegistrationsView.as_view(), name='my_club_registrations'),

    # Module B: Digital Pass & Check-In
    path('passes/<int:pk>/', views.EventPassDetailView.as_view(), name='event_pass_detail'),
    path('passes/verify/', views.EventPassVerifyView.as_view(), name='event_pass_verify'),
    path('passes/check-in/', views.EventPassCheckInView.as_view(), name='event_pass_check_in'),
    path('<int:pk>/attendance/', views.EventAttendanceStatsView.as_view(), name='event_attendance_stats'),
]
