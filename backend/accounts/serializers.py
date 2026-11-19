from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from django.utils import timezone
from .models import CustomUser, SuperAdminInvitation


def generate_unique_username(email):
    base = email.split('@')[0].strip().lower()
    clean_base = ''.join(c for c in base if c.isalnum() or c == '_') or 'user'
    username = clean_base
    counter = 1
    while CustomUser.objects.filter(username=username).exists():
        username = f"{clean_base}{counter}"
        counter += 1
    return username


class StudentRegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label='Confirm Password')
    student_id = serializers.CharField(required=True)
    phone = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = CustomUser
        fields = [
            'email', 'username', 'first_name', 'last_name',
            'student_id', 'department', 'year_of_study',
            'password', 'password2', 'phone'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        if not validated_data.get('username'):
            validated_data['username'] = generate_unique_username(validated_data['email'])
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.role = 'student'
        user.email_verified = False
        user.approval_status = 'approved'
        user.save()
        return user


class ClubAdminRegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label='Confirm Password')
    phone = serializers.CharField(required=False, allow_blank=True)
    club_name = serializers.CharField(required=True, write_only=True)
    club_category = serializers.CharField(required=True, write_only=True)
    club_description = serializers.CharField(required=True, write_only=True)
    reason = serializers.CharField(required=True, write_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'email', 'username', 'first_name', 'last_name', 'phone',
            'password', 'password2',
            'club_name', 'club_category', 'club_description', 'reason'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        club_name = validated_data.pop('club_name')
        club_category = validated_data.pop('club_category')
        club_desc = validated_data.pop('club_description')
        reason = validated_data.pop('reason')

        if not validated_data.get('username'):
            validated_data['username'] = generate_unique_username(validated_data['email'])

        user = CustomUser(**validated_data)
        user.set_password(password)
        user.role = 'club_admin'
        user.email_verified = False
        user.approval_status = 'pending'
        user.applied_club_name = club_name
        user.applied_club_category = club_category
        user.applied_club_description = club_desc
        user.applied_club_reason = reason
        user.save()
        return user


class SuperAdminInvitationRegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label='Confirm Password')
    invitation_code = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = [
            'email', 'username', 'first_name', 'last_name',
            'password', 'password2', 'invitation_code'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        code = attrs.get('invitation_code')
        email = attrs.get('email')
        try:
            invitation = SuperAdminInvitation.objects.get(invitation_code=code, email=email)
            if not invitation.is_valid():
                raise serializers.ValidationError({'invitation_code': 'Invitation code is expired or already used.'})
        except SuperAdminInvitation.DoesNotExist:
            raise serializers.ValidationError({'invitation_code': 'Super Administrator registration is restricted. Please obtain an authorized invitation.'})
        attrs['invitation'] = invitation
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        invitation = validated_data.pop('invitation')
        validated_data.pop('invitation_code')

        if not validated_data.get('username'):
            validated_data['username'] = generate_unique_username(validated_data['email'])

        user = CustomUser(**validated_data)
        user.set_password(password)
        user.role = 'super_admin'
        user.is_staff = True
        user.is_superuser = True
        user.email_verified = False
        user.approval_status = 'approved'
        user.save()

        # Mark invitation as consumed
        invitation.is_used = True
        invitation.used_by = user
        invitation.save()
        return user


# Backwards compatibility
RegisterSerializer = StudentRegisterSerializer


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(username=attrs['email'], password=attrs['password'])
        if not user:
            raise serializers.ValidationError('Invalid email or password.')
        if not user.is_active:
            raise serializers.ValidationError('Account is deactivated.')
        attrs['user'] = user
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField(read_only=True)
    profile_picture_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'role', 'student_id', 'phone', 'bio', 'profile_picture', 'profile_picture_url',
            'department', 'year_of_study', 'email_verified', 'approval_status',
            'applied_club_name', 'date_joined', 'updated_at'
        ]
        read_only_fields = ['id', 'email', 'role', 'email_verified', 'approval_status', 'date_joined', 'updated_at']
        extra_kwargs = {
            'profile_picture': {'write_only': True},
        }

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_profile_picture_url(self, obj):
        request = self.context.get('request')
        if obj.profile_picture and request:
            return request.build_absolute_uri(obj.profile_picture.url)
        return None


class UserListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'role', 'student_id', 'department', 'year_of_study', 'phone',
            'email_verified', 'approval_status', 'is_active', 'date_joined'
        ]

    def get_full_name(self, obj):
        return obj.get_full_name()


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    new_password2 = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({'new_password': 'New passwords do not match.'})
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value
