from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # 3 Separate Role Registration Endpoints
    path('register/', views.RegisterView.as_view(), name='register'),
    path('register/student/', views.StudentRegisterView.as_view(), name='register_student'),
    path('register/club-admin/', views.ClubAdminRegisterView.as_view(), name='register_club_admin'),
    path('register/super-admin/', views.SuperAdminInvitationRegisterView.as_view(), name='register_super_admin'),

    # Unified Login & OTP 2FA
    path('login/', views.LoginView.as_view(), name='login'),
    path('otp/verify/', views.VerifyOTPView.as_view(), name='otp_verify'),
    path('otp/resend/', views.ResendOTPView.as_view(), name='otp_resend'),

    # Google OAuth Sign-in
    path('google/', views.GoogleAuthView.as_view(), name='google_auth'),

    # Password Recovery
    path('password/forgot/', views.ForgotPasswordView.as_view(), name='password_forgot'),
    path('password/reset/', views.ResetPasswordView.as_view(), name='password_reset'),

    # Tokens & Sessions
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # User Profile & Management
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),
    path('users/', views.UserListView.as_view(), name='user_list'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user_detail'),

    # Super Admin: Club Admin Application Approval & Invitations
    path('users/<int:pk>/approve-club-admin/', views.ClubAdminApprovalView.as_view(), name='approve_club_admin'),
    path('invitations/', views.SuperAdminInvitationCreateView.as_view(), name='superadmin_invitations'),
]
