# CampusConnect — College Community Management Platform

CampusConnect is a centralized college community management system built with Django REST Framework, MySQL, and a modern React (Vite + Tailwind CSS) client.

---

## 🚀 Key Features

### 1. Student Portal
- **Authentication**: Registration and JWT-based authentication.
- **Club Discovery**: Browse, filter by category, search, and submit membership requests.
- **Event Registrations**: View upcoming workshops, seminars, and hackathons; register or cancel registrations before deadlines with concurrency protection.
- **Notices & Bulletins**: Real-time announcements from college administrators and joined clubs.
- **Profile Management**: Update department, year of study, contact information, and password.

### 2. Club Administrator Portal
- **Club Dashboard**: Dedicated metrics (member count, pending requests, upcoming events, seat availability).
- **Membership Workflow**: Approve or reject student membership requests.
- **Event Organization**: Create, manage, and schedule events with custom capacity, deadlines, and approval modes.
- **Announcements**: Publish club-specific announcements.

### 3. Super Administrator Portal
- **Platform Analytics**: Interactive visualizations via Recharts for events and clubs categorized across campus.
- **Platform Governance**: Full control over clubs, user accounts, and events.
- **College-wide Announcements**: Broadcast important notices to all students.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.13, Django 4.2 LTS, Django REST Framework, Simple JWT, MySQL / MariaDB (XAMPP).
- **API Documentation**: OpenAPI / Swagger (`/api/docs/`) powered by `drf-spectacular`.
- **Frontend**: React 19, Vite, Tailwind CSS v4, React Router DOM, Axios, Recharts, Lucide Icons.

---

## ⚙️ Installation & Setup

### Prerequisites
1. Python 3.10+
2. Node.js 18+
3. MySQL / MariaDB (e.g., via XAMPP on port 3306)

---

### Step 1: Database Setup
Make sure MySQL is running in XAMPP:
```sql
CREATE DATABASE campusconnect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

### Step 2: Backend Setup
```bash
cd backend

# Install Python requirements
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Seed sample data (admin, club admins, students, clubs, events, announcements)
python manage.py seed_data

# Start the Django server
python manage.py runserver 127.0.0.1:8000
```

The Django REST API and Interactive Swagger Documentation will be accessible at:
- **API Base**: `http://127.0.0.1:8000/api/`
- **Swagger UI**: `http://127.0.0.1:8000/api/docs/`
- **Django Admin**: `http://127.0.0.1:8000/admin/`

---

### Step 3: Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Visit the application in your browser at:
`http://localhost:5173`

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Super Admin** | `admin@campusconnect.edu` | `Admin@1234` |
| **Club Admin (Technical)** | `techadmin@campusconnect.edu` | `Admin@1234` |
| **Club Admin (Cultural)** | `culturaladmin@campusconnect.edu` | `Admin@1234` |
| **Student 1** | `alice@student.edu` | `Student@1234` |
| **Student 2** | `bob@student.edu` | `Student@1234` |
