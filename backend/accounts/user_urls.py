from django.urls import path
from . import views

urlpatterns = [
    path('', views.UserListView.as_view(), name='api_user_list'),
    path('club-admins/', views.ClubAdminListView.as_view(), name='api_club_admins'),
    path('<int:pk>/', views.UserDetailView.as_view(), name='api_user_detail'),
    path('<int:pk>/role/', views.UserRoleUpdateView.as_view(), name='api_user_role'),
    path('<int:pk>/approve-club-admin/', views.ClubAdminApprovalView.as_view(), name='api_approve_club_admin'),
]
