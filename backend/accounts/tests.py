from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .models import CustomUser


class AuthenticationTests(APITestCase):

    def setUp(self):
        self.student = CustomUser.objects.create_user(
            email='student@test.com', username='teststudent',
            first_name='Test', last_name='Student',
            password='TestPass@123', role='student'
        )
        self.super_admin = CustomUser.objects.create_user(
            email='admin@test.com', username='testadmin',
            first_name='Test', last_name='Admin',
            password='TestPass@123', role='super_admin',
            is_staff=True, is_superuser=True
        )

    def test_register_student(self):
        """Student can register with valid data."""
        url = reverse('register')
        data = {
            'email': 'newstudent@test.com', 'username': 'newstudent',
            'first_name': 'New', 'last_name': 'Student',
            'password': 'NewPass@123', 'password2': 'NewPass@123'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertEqual(response.data['user']['role'], 'student')

    def test_register_mismatched_passwords(self):
        """Registration fails when passwords do not match."""
        url = reverse('register')
        data = {
            'email': 'x@test.com', 'username': 'x',
            'first_name': 'X', 'last_name': 'Y',
            'password': 'Pass@123', 'password2': 'Different@123'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_valid(self):
        """Student can log in and receive JWT tokens."""
        url = reverse('login')
        response = self.client.post(url, {'email': 'student@test.com', 'password': 'TestPass@123'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data['tokens'])
        self.assertIn('refresh', response.data['tokens'])

    def test_login_invalid(self):
        """Login fails with wrong credentials."""
        url = reverse('login')
        response = self.client.post(url, {'email': 'student@test.com', 'password': 'WrongPass'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_profile_requires_auth(self):
        """Profile endpoint requires authentication."""
        url = reverse('profile')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_authenticated(self):
        """Authenticated user can view profile."""
        self.client.force_authenticate(user=self.student)
        url = reverse('profile')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'student@test.com')

    def test_user_list_requires_super_admin(self):
        """User list endpoint requires super admin role."""
        self.client.force_authenticate(user=self.student)
        url = reverse('user_list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_list_super_admin_access(self):
        """Super admin can access user list."""
        self.client.force_authenticate(user=self.super_admin)
        url = reverse('user_list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
