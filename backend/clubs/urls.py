from django.urls import path
from . import views

urlpatterns = [
    path('', views.ClubListCreateView.as_view(), name='club_list_create'),
    path('<int:pk>/', views.ClubDetailView.as_view(), name='club_detail'),
    path('<int:pk>/join/', views.JoinClubView.as_view(), name='club_join'),
    path('<int:pk>/members/', views.ClubMembersView.as_view(), name='club_members'),
    path('memberships/<int:pk>/', views.MembershipUpdateView.as_view(), name='membership_update'),
    path('memberships/<int:pk>/remove/', views.MembershipRemoveView.as_view(), name='membership_remove'),
    path('my-memberships/', views.MyMembershipsView.as_view(), name='my_memberships'),
    path('my-club/', views.MyClubView.as_view(), name='my_club'),
    path('my-club/members/', views.MyClubMembersView.as_view(), name='my_club_members'),
]
