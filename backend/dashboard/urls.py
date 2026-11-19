from django.urls import path
from . import views

urlpatterns = [
    path('student/', views.StudentDashboardView.as_view(), name='student_dashboard'),
    path('club-admin/', views.ClubAdminDashboardView.as_view(), name='club_admin_dashboard'),
    path('super-admin/', views.SuperAdminDashboardView.as_view(), name='super_admin_dashboard'),
]
