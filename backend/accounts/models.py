import secrets
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from datetime import timedelta


class CustomUserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('role', 'super_admin')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('email_verified', True)
        extra_fields.setdefault('approval_status', 'approved')
        return self.create_user(email, username, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('club_admin', 'Club Administrator'),
        ('super_admin', 'Super Administrator'),
    ]

    APPROVAL_STATUS_CHOICES = [
        ('approved', 'Approved'),
        ('pending', 'Pending Approval'),
        ('rejected', 'Rejected'),
    ]

    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    student_id = models.CharField(max_length=50, blank=True, null=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    year_of_study = models.IntegerField(blank=True, null=True)
    
    # Verification & Approval workflows
    email_verified = models.BooleanField(default=False)
    approval_status = models.CharField(max_length=20, choices=APPROVAL_STATUS_CHOICES, default='approved')
    google_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    
    # Applied club for club admin registration
    applied_club_name = models.CharField(max_length=200, blank=True, null=True)
    applied_club_category = models.CharField(max_length=50, blank=True, null=True)
    applied_club_description = models.TextField(blank=True, null=True)
    applied_club_reason = models.TextField(blank=True, null=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.get_full_name()} ({self.email}) — {self.get_role_display()}"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def is_student(self):
        return self.role == 'student'

    @property
    def is_club_admin(self):
        return self.role == 'club_admin'

    @property
    def is_super_admin(self):
        return self.role == 'super_admin'


class EmailOTP(models.Model):
    PURPOSE_CHOICES = [
        ('login', 'Login 2FA'),
        ('register', 'Email Verification'),
        ('password_reset', 'Password Recovery'),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='otps', null=True, blank=True)
    email = models.EmailField()
    otp_code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES, default='login')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)

    class Meta:
        db_table = 'email_otps'
        ordering = ['-created_at']

    def is_valid(self):
        return not self.is_used and timezone.now() < self.expires_at and self.attempts < 5

    @classmethod
    def create_otp(cls, email, purpose='login', user=None, expiry_minutes=5):
        # Invalidate old unused OTPs for same email & purpose
        cls.objects.filter(email=email, purpose=purpose, is_used=False).update(is_used=True)
        # Generate 6-digit cryptographically secure numeric OTP
        code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
        expires = timezone.now() + timedelta(minutes=expiry_minutes)
        return cls.objects.create(
            user=user,
            email=email,
            otp_code=code,
            purpose=purpose,
            expires_at=expires
        )


class SuperAdminInvitation(models.Model):
    invitation_code = models.CharField(max_length=64, unique=True)
    email = models.EmailField(unique=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_invitations')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    used_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='used_invitation')

    class Meta:
        db_table = 'superadmin_invitations'
        ordering = ['-created_at']

    def is_valid(self):
        return not self.is_used and timezone.now() < self.expires_at
