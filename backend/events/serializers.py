from rest_framework import serializers
from django.utils import timezone
from .models import Event, EventRegistration, EventPass, EventFeedback
from clubs.models import Club
from accounts.serializers import UserListSerializer


class EventSerializer(serializers.ModelSerializer):
    is_registration_open = serializers.ReadOnlyField()
    registered_count = serializers.ReadOnlyField()
    available_seats = serializers.ReadOnlyField()
    is_past = serializers.ReadOnlyField()
    banner_image_url = serializers.SerializerMethodField()
    club = serializers.PrimaryKeyRelatedField(queryset=Club.objects.all(), required=False, allow_null=True)
    club_name = serializers.CharField(source='club.name', read_only=True)
    registration_status = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'banner_image', 'banner_image_url',
            'club', 'club_name', 'category', 'event_date', 'venue',
            'capacity', 'registration_deadline', 'requires_approval',
            'is_active', 'is_registration_open', 'registered_count',
            'available_seats', 'is_past', 'registration_status',
            'created_by', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'banner_image': {'write_only': True},
            'created_by': {'read_only': True},
        }

    def get_banner_image_url(self, obj):
        request = self.context.get('request')
        if obj.banner_image and request:
            return request.build_absolute_uri(obj.banner_image.url)
        return None

    def get_registration_status(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.is_student:
            reg = obj.registrations.filter(student=request.user).first()
            if reg:
                return reg.status
        return None

    def validate(self, attrs):
        event_date = attrs.get('event_date')
        deadline = attrs.get('registration_deadline')
        if event_date and deadline:
            if deadline >= event_date:
                raise serializers.ValidationError(
                    {'registration_deadline': 'Registration deadline must be before the event date.'}
                )
            if event_date <= timezone.now():
                raise serializers.ValidationError(
                    {'event_date': 'Event date must be in the future.'}
                )
        return attrs


class EventPassSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='registration.student.get_full_name', read_only=True)
    student_username = serializers.CharField(source='registration.student.username', read_only=True)
    student_email = serializers.CharField(source='registration.student.email', read_only=True)
    student_department = serializers.CharField(source='registration.student.department', read_only=True)
    student_year = serializers.IntegerField(source='registration.student.year_of_study', read_only=True)
    profile_picture_url = serializers.SerializerMethodField()
    
    event_id = serializers.IntegerField(source='registration.event.id', read_only=True)
    event_title = serializers.CharField(source='registration.event.title', read_only=True)
    event_date = serializers.DateTimeField(source='registration.event.event_date', read_only=True)
    event_venue = serializers.CharField(source='registration.event.venue', read_only=True)
    event_category = serializers.CharField(source='registration.event.category', read_only=True)
    banner_image_url = serializers.SerializerMethodField()
    
    club_id = serializers.IntegerField(source='registration.event.club.id', read_only=True)
    club_name = serializers.CharField(source='registration.event.club.name', read_only=True)
    
    registration_id = serializers.IntegerField(source='registration.id', read_only=True)
    registration_status = serializers.CharField(source='registration.status', read_only=True)

    class Meta:
        model = EventPass
        fields = [
            'id', 'registration', 'registration_id', 'registration_status',
            'verification_token', 'is_valid', 'is_checked_in', 'checked_in_at',
            'student_name', 'student_username', 'student_email', 'student_department',
            'student_year', 'profile_picture_url',
            'event_id', 'event_title', 'event_date', 'event_venue', 'event_category',
            'banner_image_url', 'club_id', 'club_name', 'created_at'
        ]
        read_only_fields = [
            'id', 'registration', 'verification_token', 'is_valid',
            'is_checked_in', 'checked_in_at', 'created_at'
        ]

    def get_profile_picture_url(self, obj):
        request = self.context.get('request')
        student = obj.registration.student
        if student.profile_picture and request:
            return request.build_absolute_uri(student.profile_picture.url)
        return None

    def get_banner_image_url(self, obj):
        request = self.context.get('request')
        event = obj.registration.event
        if event.banner_image and request:
            return request.build_absolute_uri(event.banner_image.url)
        return None


class EventRegistrationSerializer(serializers.ModelSerializer):
    student_detail = UserListSerializer(source='student', read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)
    event_date = serializers.DateTimeField(source='event.event_date', read_only=True)
    pass_data = EventPassSerializer(source='pass_record', read_only=True)

    class Meta:
        model = EventRegistration
        fields = [
            'id', 'student', 'student_detail', 'event', 'event_title',
            'event_date', 'status', 'pass_data', 'registered_at', 'updated_at'
        ]
        read_only_fields = ['id', 'student', 'event', 'pass_data', 'registered_at', 'updated_at']


class EventFeedbackSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = EventFeedback
        fields = ['id', 'student', 'student_name', 'event', 'rating', 'comments', 'submitted_at']
        read_only_fields = ['id', 'student', 'event', 'submitted_at']

    def get_student_name(self, obj):
        return obj.student.get_full_name()

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Rating must be between 1 and 5.')
        return value
