"""
Management command to seed the database with sample data.
Usage: python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random


class Command(BaseCommand):
    help = 'Seeds the database with sample data for development'

    def handle(self, *args, **kwargs):
        from accounts.models import CustomUser
        from clubs.models import Club, ClubMembership
        from events.models import Event, EventRegistration
        from announcements.models import Announcement

        self.stdout.write(self.style.WARNING('Seeding database...'))

        # === Super Admin ===
        super_admin, _ = CustomUser.objects.get_or_create(
            email='admin@campusconnect.edu',
            defaults={
                'username': 'superadmin',
                'first_name': 'Campus',
                'last_name': 'Admin',
                'role': 'super_admin',
                'is_staff': True,
                'is_superuser': True,
                'department': 'Administration',
            }
        )
        super_admin.set_password('Admin@1234')
        super_admin.save()
        self.stdout.write('  ✅ Super admin created: admin@campusconnect.edu / Admin@1234')

        # === Club Admins ===
        club_admin_data = [
            ('techadmin@campusconnect.edu', 'techadmin', 'Rahul', 'Sharma', 'Computer Science'),
            ('culturaladmin@campusconnect.edu', 'culturaladmin', 'Priya', 'Patel', 'Arts'),
            ('sportsadmin@campusconnect.edu', 'sportsadmin', 'Arjun', 'Singh', 'Physical Education'),
        ]
        club_admins = []
        for email, username, first, last, dept in club_admin_data:
            admin, _ = CustomUser.objects.get_or_create(email=email, defaults={
                'username': username, 'first_name': first, 'last_name': last,
                'role': 'club_admin', 'department': dept
            })
            admin.set_password('Admin@1234')
            admin.save()
            club_admins.append(admin)
        self.stdout.write(f'  ✅ {len(club_admins)} club admins created')

        # === Clubs ===
        clubs_data = [
            ('CodeCraft Club', 'Technical', 'A community for coding enthusiasts, hackathons, and open-source projects.', 'technical', club_admins[0], 'Dr. Ravi Kumar'),
            ('Cultural Fiesta', 'Cultural', 'Celebrating diversity through dance, music, drama and art.', 'cultural', club_admins[1], 'Prof. Meena Iyer'),
            ('Sports Arena', 'Sports', 'Your hub for all sports activities, tournaments and fitness.', 'sports', club_admins[2], 'Coach Suresh Nair'),
            ('Entrepreneurship Cell', 'E-Cell', 'Build your startup dream — mentorship, funding, and networking.', 'entrepreneurship', None, 'Dr. Anjali Mehta'),
            ('Social Outreach Club', 'Social Service', 'Community service, NGO partnerships, and volunteering.', 'social', None, 'Dr. Pooja Verma'),
        ]
        clubs = []
        for name, cat_display, desc, cat, admin_user, faculty in clubs_data:
            club, _ = Club.objects.get_or_create(name=name, defaults={
                'description': desc, 'category': cat,
                'admin_user': admin_user, 'faculty_coordinator': faculty,
                'is_approved': True
            })
            clubs.append(club)
        self.stdout.write(f'  ✅ {len(clubs)} clubs created')

        # === Students ===
        student_data = [
            ('alice@student.edu', 'alice_j', 'Alice', 'Johnson', 'Computer Science', 2),
            ('bob@student.edu', 'bob_s', 'Bob', 'Smith', 'Mechanical', 3),
            ('carol@student.edu', 'carol_m', 'Carol', 'Martin', 'Arts', 1),
            ('dave@student.edu', 'dave_b', 'Dave', 'Brown', 'Business', 4),
            ('eva@student.edu', 'eva_k', 'Eva', 'Khan', 'Computer Science', 2),
            ('frank@student.edu', 'frank_r', 'Frank', 'Rodrigues', 'Civil', 3),
        ]
        students = []
        for email, username, first, last, dept, year in student_data:
            student, _ = CustomUser.objects.get_or_create(email=email, defaults={
                'username': username, 'first_name': first, 'last_name': last,
                'role': 'student', 'department': dept, 'year_of_study': year
            })
            student.set_password('Student@1234')
            student.save()
            students.append(student)
        self.stdout.write(f'  ✅ {len(students)} students created')

        # === Club Memberships ===
        for student in students[:3]:
            ClubMembership.objects.get_or_create(
                student=student, club=clubs[0], defaults={'status': 'approved'}
            )
        for student in students[2:5]:
            ClubMembership.objects.get_or_create(
                student=student, club=clubs[1], defaults={'status': 'approved'}
            )
        # Pending requests
        ClubMembership.objects.get_or_create(
            student=students[4], club=clubs[0], defaults={'status': 'pending'}
        )
        self.stdout.write('  ✅ Club memberships created')

        # === Events ===
        now = timezone.now()
        events_data = [
            {
                'title': 'Python Hackathon 2025',
                'description': 'Build real-world applications using Python in 24 hours. Prizes worth ₹50,000!',
                'club': clubs[0], 'category': 'hackathon',
                'event_date': now + timedelta(days=10),
                'registration_deadline': now + timedelta(days=7),
                'venue': 'Computer Lab Block A', 'capacity': 60,
                'requires_approval': False, 'created_by': club_admins[0],
            },
            {
                'title': 'Web Development Workshop',
                'description': 'Learn React.js and Django from scratch. Hands-on session for beginners.',
                'club': clubs[0], 'category': 'workshop',
                'event_date': now + timedelta(days=5),
                'registration_deadline': now + timedelta(days=3),
                'venue': 'Seminar Hall 2', 'capacity': 40,
                'requires_approval': False, 'created_by': club_admins[0],
            },
            {
                'title': 'Annual Cultural Night',
                'description': 'An evening of music, dance, drama and cultural performances. All are welcome!',
                'club': clubs[1], 'category': 'cultural',
                'event_date': now + timedelta(days=15),
                'registration_deadline': now + timedelta(days=12),
                'venue': 'Open Air Theatre', 'capacity': 500,
                'requires_approval': True, 'created_by': club_admins[1],
            },
            {
                'title': 'Inter-College Cricket Tournament',
                'description': 'Compete with top college teams in a 3-day cricket tournament.',
                'club': clubs[2], 'category': 'sports',
                'event_date': now + timedelta(days=20),
                'registration_deadline': now + timedelta(days=15),
                'venue': 'College Cricket Ground', 'capacity': 100,
                'requires_approval': True, 'created_by': club_admins[2],
            },
        ]
        events = []
        for data in events_data:
            event, _ = Event.objects.get_or_create(title=data['title'], defaults=data)
            events.append(event)
        self.stdout.write(f'  ✅ {len(events)} events created')

        # === Event Registrations ===
        for student in students[:3]:
            EventRegistration.objects.get_or_create(
                student=student, event=events[0], defaults={'status': 'approved'}
            )
        for student in students[1:4]:
            EventRegistration.objects.get_or_create(
                student=student, event=events[1], defaults={'status': 'approved'}
            )
        self.stdout.write('  ✅ Event registrations created')

        # === Announcements ===
        Announcement.objects.get_or_create(
            title='Welcome to CampusConnect!',
            defaults={
                'content': 'We are excited to launch CampusConnect — your one-stop platform for college activities. Explore clubs, register for events, and stay connected!',
                'author': super_admin, 'target_audience': 'all',
            }
        )
        Announcement.objects.get_or_create(
            title='Exam Schedule Released',
            defaults={
                'content': 'The end-semester examination schedule has been released. Please check the academic portal for your individual timetable.',
                'author': super_admin, 'target_audience': 'all',
            }
        )
        Announcement.objects.get_or_create(
            title='Hackathon Registration Open!',
            defaults={
                'content': 'Registration for Python Hackathon 2025 is now open. Limited seats available. Register now!',
                'author': club_admins[0], 'target_audience': 'club', 'club': clubs[0],
            }
        )
        self.stdout.write('  ✅ Announcements created')

        self.stdout.write(self.style.SUCCESS('\n🎉 Database seeded successfully!'))
        self.stdout.write('\n📋 Login Credentials:')
        self.stdout.write('  Super Admin:  admin@campusconnect.edu / Admin@1234')
        self.stdout.write('  Club Admin 1: techadmin@campusconnect.edu / Admin@1234')
        self.stdout.write('  Club Admin 2: culturaladmin@campusconnect.edu / Admin@1234')
        self.stdout.write('  Student 1:    alice@student.edu / Student@1234')
        self.stdout.write('  Student 2:    bob@student.edu / Student@1234')
