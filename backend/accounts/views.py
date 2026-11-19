import json
import urllib.request
import urllib.error
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import CustomUser, EmailOTP, SuperAdminInvitation
from .serializers import (
    StudentRegisterSerializer, ClubAdminRegisterSerializer, SuperAdminInvitationRegisterSerializer,
    LoginSerializer, UserProfileSerializer, UserListSerializer, ChangePasswordSerializer
)
from .permissions import IsSuperAdmin
from clubs.models import Club


def send_otp_email(user, otp, purpose_title):
    subject = f"CampusConnect — Your OTP for {purpose_title}"
    message = (
        f"Hello {user.first_name or user.username},\n\n"
        f"Your CampusConnect one-time verification code is: {otp.otp_code}\n\n"
        f"This code will expire in 5 minutes.\n"
        f"If you did not request this code, please ignore this email.\n\n"
        f"— CampusConnect Security Team"
    )
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@campusconnect.edu'),
            recipient_list=[user.email],
            fail_silently=True,
        )
    except Exception as e:
        print(f"Failed to send email to {user.email}: {e}")


# ==========================================
# REGISTRATION VIEWS (3 PATHS)
# ==========================================

class StudentRegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = StudentRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Generate OTP for email verification
            otp = EmailOTP.create_otp(user.email, purpose='register', user=user)
            send_otp_email(user, otp, "Student Account Verification")
            return Response({
                'message': 'Student registration successful. Please verify your email with the OTP sent.',
                'email': user.email,
                'requires_otp': True,
                'purpose': 'register',
                'user': UserProfileSerializer(user, context={'request': request}).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ClubAdminRegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ClubAdminRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            otp = EmailOTP.create_otp(user.email, purpose='register', user=user)
            send_otp_email(user, otp, "Club Administrator Application")
            return Response({
                'message': 'Club Administrator application submitted. Please verify your email with the OTP sent. Your account will await Super Administrator approval after verification.',
                'email': user.email,
                'requires_otp': True,
                'purpose': 'register',
                'user': UserProfileSerializer(user, context={'request': request}).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SuperAdminInvitationRegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SuperAdminInvitationRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            otp = EmailOTP.create_otp(user.email, purpose='register', user=user)
            send_otp_email(user, otp, "Super Administrator Activation")
            return Response({
                'message': 'Super Administrator account created via invitation. Please verify your email with the OTP sent.',
                'email': user.email,
                'requires_otp': True,
                'purpose': 'register',
                'user': UserProfileSerializer(user, context={'request': request}).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Backwards compatibility register endpoint (routes to student)
class RegisterView(StudentRegisterView):
    pass


# ==========================================
# LOGIN & OTP 2FA VIEWS
# ==========================================

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']

            # Check if club admin is still pending approval
            if user.role == 'club_admin' and user.approval_status != 'approved':
                if user.approval_status == 'pending':
                    return Response({
                        'error': 'Your Club Administrator application is currently pending review by the Super Administrator.',
                        'approval_status': 'pending'
                    }, status=status.HTTP_403_FORBIDDEN)
                elif user.approval_status == 'rejected':
                    return Response({
                        'error': 'Your Club Administrator application was rejected. Please contact the administrator.',
                        'approval_status': 'rejected'
                    }, status=status.HTTP_403_FORBIDDEN)

            # Check first-time email verification:
            # If the user has NOT verified their email yet (first time), require OTP verification
            if not user.email_verified:
                otp = EmailOTP.create_otp(user.email, purpose='register', user=user)
                send_otp_email(user, otp, "First-Time Account Verification")
                return Response({
                    'message': 'First-time sign in detected: Please enter the 6-digit verification code sent to your email to activate your account.',
                    'requires_otp': True,
                    'purpose': 'register',
                    'email': user.email
                }, status=status.HTTP_200_OK)

            # Once already verified, allow direct password login without OTP prompt every time!
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'Login successful.',
                'user': UserProfileSerializer(user, context={'request': request}).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        otp_code = request.data.get('otp', '').strip()
        purpose = request.data.get('purpose', 'login')

        if not email or not otp_code:
            return Response({'error': 'Email and 6-digit OTP are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response({'error': 'No user account found with this email.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            otp_record = EmailOTP.objects.filter(email=email, purpose=purpose, is_used=False).latest('created_at')
        except EmailOTP.DoesNotExist:
            return Response({'error': 'No active OTP found. Please request a new code.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check attempts limit
        if otp_record.attempts >= 5:
            otp_record.is_used = True
            otp_record.save()
            return Response({'error': 'Too many incorrect attempts. Please request a new OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check expiration
        if timezone.now() > otp_record.expires_at:
            return Response({'error': 'OTP has expired. Please request a new code.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check code match
        if otp_record.otp_code != otp_code:
            otp_record.attempts += 1
            otp_record.save()
            remaining = 5 - otp_record.attempts
            return Response({'error': f'Incorrect OTP. {remaining} attempt(s) remaining.'}, status=status.HTTP_400_BAD_REQUEST)

        # Mark OTP as successfully used
        otp_record.is_used = True
        otp_record.save()

        # If this was registration or email verification
        if purpose == 'register':
            user.email_verified = True
            user.save()

            # If club admin, explain that account is awaiting approval
            if user.role == 'club_admin' and user.approval_status != 'approved':
                return Response({
                    'message': 'Email verified successfully! Your Club Administrator application has been submitted and is awaiting approval by the Super Administrator.',
                    'approval_status': user.approval_status,
                    'user': UserProfileSerializer(user, context={'request': request}).data
                }, status=status.HTTP_200_OK)

        # Generate JWT tokens for authenticated session
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Authentication successful.',
            'user': UserProfileSerializer(user, context={'request': request}).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_200_OK)


class ResendOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        purpose = request.data.get('purpose', 'login')

        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response({'error': 'No account associated with this email.'}, status=status.HTTP_404_NOT_FOUND)

        # Rate limit check: at most one OTP every 30 seconds
        recent = EmailOTP.objects.filter(email=email, purpose=purpose, created_at__gte=timezone.now() - timezone.timedelta(seconds=30)).first()
        if recent:
            return Response({'error': 'Please wait a moment before requesting another OTP.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        otp = EmailOTP.create_otp(email, purpose=purpose, user=user)
        send_otp_email(user, otp, "Verification")

        return Response({'message': 'A new 6-digit verification code has been dispatched to your email.'}, status=status.HTTP_200_OK)


# ==========================================
# GOOGLE OAUTH 2.0 SIGN-IN
# ==========================================

class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        credential = request.data.get('credential') or request.data.get('token')
        if not credential:
            return Response({'error': 'Google credential token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate with Google tokeninfo endpoint
        try:
            url = f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}"
            req = urllib.request.Request(url, headers={'User-Agent': 'CampusConnect/1.0'})
            with urllib.request.urlopen(req, timeout=5) as response:
                payload = json.loads(response.read().decode('utf-8'))
        except Exception as e:
            return Response({'error': f'Invalid Google OAuth identity: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        google_email = payload.get('email')
        google_sub = payload.get('sub')
        first_name = payload.get('given_name', '')
        last_name = payload.get('family_name', '')
        avatar = payload.get('picture', '')

        if not google_email:
            return Response({'error': 'Email address not provided in Google profile.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user already exists
        user = CustomUser.objects.filter(email=google_email).first()

        if user:
            # Existing user — attach google_id if missing
            if not user.google_id:
                user.google_id = google_sub
            user.email_verified = True
            user.save()
        else:
            # Create a new Student account
            # Derive username
            base_username = google_email.split('@')[0]
            username = base_username
            idx = 1
            while CustomUser.objects.filter(username=username).exists():
                username = f"{base_username}_{idx}"
                idx += 1

            user = CustomUser.objects.create(
                email=google_email,
                username=username,
                first_name=first_name or base_username,
                last_name=last_name or '',
                google_id=google_sub,
                role='student',
                email_verified=True,
                approval_status='approved'
            )
            # Set unusable password
            user.set_unusable_password()
            user.save()

        # Check approval status (for club admins who registered earlier)
        if user.role == 'club_admin' and user.approval_status != 'approved':
            return Response({
                'error': 'Your Club Administrator application is pending approval.',
                'approval_status': user.approval_status
            }, status=status.HTTP_403_FORBIDDEN)

        # Issue JWT tokens
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Signed in via Google successfully.',
            'user': UserProfileSerializer(user, context={'request': request}).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_200_OK)


# ==========================================
# PASSWORD RECOVERY (FORGOT / RESET)
# ==========================================

class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        if not email:
            return Response({'error': 'Email address is required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = CustomUser.objects.filter(email=email).first()
        if user:
            otp = EmailOTP.create_otp(email, purpose='password_reset', user=user, expiry_minutes=10)
            send_otp_email(user, otp, "Password Recovery")

        # Avoid email enumeration attacks by returning standard message
        return Response({
            'message': 'If an account exists with this email address, a password recovery code has been sent.',
            'email': email
        }, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        otp_code = request.data.get('otp', '').strip()
        new_password = request.data.get('new_password', '')
        confirm_password = request.data.get('confirm_password', '')

        if not email or not otp_code or not new_password:
            return Response({'error': 'Email, recovery OTP, and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if new_password != confirm_password:
            return Response({'error': 'New passwords do not match.'}, status=status.HTTP_400_BAD_REQUEST)

        user = CustomUser.objects.filter(email=email).first()
        if not user:
            return Response({'error': 'Invalid request.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            otp_record = EmailOTP.objects.filter(email=email, purpose='password_reset', is_used=False).latest('created_at')
        except EmailOTP.DoesNotExist:
            return Response({'error': 'No active recovery request found. Please request a new code.'}, status=status.HTTP_400_BAD_REQUEST)

        if timezone.now() > otp_record.expires_at:
            return Response({'error': 'Recovery code has expired.'}, status=status.HTTP_400_BAD_REQUEST)

        if otp_record.otp_code != otp_code:
            return Response({'error': 'Invalid recovery code.'}, status=status.HTTP_400_BAD_REQUEST)

        # Mark OTP used and update password
        otp_record.is_used = True
        otp_record.save()

        user.set_password(new_password)
        user.save()

        return Response({'message': 'Password has been reset successfully. You can now sign in.'}, status=status.HTTP_200_OK)


# ==========================================
# SUPER ADMIN INVITATIONS & CLUB APPROVALS
# ==========================================

class SuperAdminInvitationCreateView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request):
        import secrets
        email = request.data.get('email', '').strip()
        if not email:
            return Response({'error': 'Invited email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if CustomUser.objects.filter(email=email, role='super_admin').exists():
            return Response({'error': 'User is already a Super Administrator.'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate unique code
        code = f"CC-ADMIN-{secrets.token_hex(8).upper()}"
        expires = timezone.now() + timezone.timedelta(days=7)

        # Invalidate older unused invitation for this email
        SuperAdminInvitation.objects.filter(email=email, is_used=False).delete()

        invitation = SuperAdminInvitation.objects.create(
            invitation_code=code,
            email=email,
            created_by=request.user,
            expires_at=expires
        )

        return Response({
            'message': f'Invitation created for {email}.',
            'invitation_code': code,
            'email': email,
            'expires_at': expires
        }, status=status.HTTP_201_CREATED)

    def get(self, request):
        invitations = SuperAdminInvitation.objects.all().order_by('-created_at')
        data = [{
            'id': inv.id,
            'invitation_code': inv.invitation_code,
            'email': inv.email,
            'is_used': inv.is_used,
            'expires_at': inv.expires_at,
            'created_at': inv.created_at,
            'created_by': inv.created_by.get_full_name() if inv.created_by else 'System'
        } for inv in invitations]
        return Response(data)


class ClubAdminApprovalView(APIView):
    """Super Admin approves or rejects a Club Admin application."""
    permission_classes = [IsSuperAdmin]

    def post(self, request, pk):
        decision = request.data.get('decision')  # 'approve' or 'reject'
        try:
            applicant = CustomUser.objects.get(pk=pk, role='club_admin')
        except CustomUser.DoesNotExist:
            return Response({'error': 'Club admin application not found.'}, status=status.HTTP_404_NOT_FOUND)

        if decision == 'approve':
            applicant.approval_status = 'approved'
            applicant.save()

            # Create or link the club if applicant specified club details
            if applicant.applied_club_name:
                club, created = Club.objects.get_or_create(
                    name=applicant.applied_club_name,
                    defaults={
                        'description': applicant.applied_club_description or '',
                        'category': applicant.applied_club_category or 'technical',
                        'admin_user': applicant,
                        'is_approved': True
                    }
                )
                if not created and not club.admin_user:
                    club.admin_user = applicant
                    club.save()

            return Response({
                'message': f'Approved Club Administrator access for {applicant.get_full_name()}.',
                'user': UserProfileSerializer(applicant, context={'request': request}).data
            })
        elif decision == 'reject':
            applicant.approval_status = 'rejected'
            applicant.save()
            return Response({
                'message': f'Rejected Club Administrator application for {applicant.get_full_name()}.',
                'user': UserProfileSerializer(applicant, context={'request': request}).data
            })

        return Response({'error': "Decision must be 'approve' or 'reject'."}, status=status.HTTP_400_BAD_REQUEST)


# ==========================================
# STANDARD PROFILE & LOGOUT
# ==========================================

class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


class ChangePasswordView(APIView):
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            return Response({'message': 'Password changed successfully.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserListView(generics.ListAPIView):
    """Super admin: list all users with filtering."""
    queryset = CustomUser.objects.all().order_by('-date_joined')
    serializer_class = UserListSerializer
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['role', 'is_active', 'approval_status']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering_fields = ['date_joined', 'username']


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Super admin: manage individual user."""
    queryset = CustomUser.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsSuperAdmin]

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user == request.user:
            return Response({'error': 'You cannot delete your own account.'}, status=status.HTTP_400_BAD_REQUEST)
        user.delete()
        return Response({'message': 'User deleted.'}, status=status.HTTP_204_NO_CONTENT)


class ClubAdminListView(generics.ListAPIView):
    """Super admin: list all registered club administrators."""
    serializer_class = UserListSerializer
    permission_classes = [IsSuperAdmin]

    def get_queryset(self):
        return CustomUser.objects.filter(role='club_admin').order_by('first_name', 'last_name')


class UserRoleUpdateView(APIView):
    """Super admin: update a user's role."""
    permission_classes = [IsSuperAdmin]

    def patch(self, request, pk):
        try:
            target_user = CustomUser.objects.get(pk=pk)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_role = request.data.get('role')
        if new_role not in ['student', 'club_admin', 'super_admin']:
            return Response({'error': 'Invalid role specified.'}, status=status.HTTP_400_BAD_REQUEST)

        if target_user == request.user and new_role != 'super_admin':
            return Response({'error': 'You cannot demote yourself from Super Administrator.'}, status=status.HTTP_400_BAD_REQUEST)

        target_user.role = new_role
        if new_role == 'super_admin':
            target_user.is_staff = True
            target_user.is_superuser = True
        elif new_role == 'club_admin':
            target_user.approval_status = 'approved'
        target_user.save()

        return Response({
            'message': f"Role updated to {new_role}.",
            'user': UserListSerializer(target_user).data
        })

