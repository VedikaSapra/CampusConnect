import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { MainLayout } from './layouts/MainLayout';
import { AdaptiveLayout } from './layouts/AdaptiveLayout';

// Public pages
import { LandingPage } from './pages/public/LandingPage';
import { AuroraLogin } from './pages/auth/AuroraLogin';
import { AuroraRegister } from './pages/auth/AuroraRegister';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { AnnouncementsPage } from './pages/public/AnnouncementsPage';
import { Profile } from './pages/public/Profile';
import { VerifyPass } from './pages/public/VerifyPass';

// Student pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { ClubList } from './pages/student/ClubList';
import { ClubDetails } from './pages/student/ClubDetails';
import { EventList } from './pages/student/EventList';
import { EventDetails } from './pages/student/EventDetails';
import { MyClubs } from './pages/student/MyClubs';
import { AuroraMyRegistrations } from './pages/student/AuroraMyRegistrations';
import { EventCalendar } from './pages/student/EventCalendar';
import { StudentMeetings } from './pages/student/StudentMeetings';

// Chat Module
import { ClubChat } from './pages/chat/ClubChat';

// Club Admin pages
import { ClubAdminDashboard } from './pages/clubadmin/ClubAdminDashboard';
import { CreateEvent } from './pages/clubadmin/CreateEvent';
import { EventCheckIn } from './pages/clubadmin/EventCheckIn';
import { ClubMembers } from './pages/clubadmin/ClubMembers';
import { MembershipRequests } from './pages/clubadmin/MembershipRequests';
import { ClubEvents } from './pages/clubadmin/ClubEvents';
import { EventRegistrations } from './pages/clubadmin/EventRegistrations';
import { ClubAnnouncements } from './pages/clubadmin/ClubAnnouncements';
import { ClubMeetings } from './pages/clubadmin/ClubMeetings';

// Super Admin pages
import { SuperAdminDashboard } from './pages/superadmin/SuperAdminDashboard';
import { SuperAdminClubs } from './pages/superadmin/SuperAdminClubs';
import { ManageUsers } from './pages/superadmin/ManageUsers';
import { ManageClubAdmins } from './pages/superadmin/ManageClubAdmins';
import { ManageEvents } from './pages/superadmin/ManageEvents';
import { ManageAnnouncements } from './pages/superadmin/ManageAnnouncements';

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <Routes>
            {/* Standalone Landing Page */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
            </Route>

            {/* Discovery Routes with Adaptive Layout (Preserves Sidebar if logged in, Aurora header/footer if guest) */}
            <Route element={<AdaptiveLayout />}>
              <Route path="/clubs" element={<ClubList />} />
              <Route path="/clubs/:id" element={<ClubDetails />} />
              <Route path="/events" element={<EventList />} />
              <Route path="/events/:id" element={<EventDetails />} />
              <Route path="/calendar" element={<EventCalendar />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
            </Route>

            {/* Standalone Auth Routes */}
            <Route path="/login" element={<AuroraLogin />} />
            <Route path="/register" element={<AuroraRegister />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Standalone Attendee QR Verification Screen */}
            <Route path="/verify-pass/:token" element={<VerifyPass />} />
            <Route path="/verify-pass/:token/" element={<VerifyPass />} />

            {/* Protected Role Routes (Dashboard layouts with Sidebar) */}
            <Route element={<MainLayout />}>
              {/* Authenticated User Settings */}
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<Profile />} />
              </Route>

              {/* Student Portal */}
              <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/meetings" element={<StudentMeetings />} />
                <Route path="/student/chat" element={<ClubChat />} />
                <Route path="/student/my-clubs" element={<MyClubs />} />
                <Route path="/student/my-registrations" element={<AuroraMyRegistrations />} />
                <Route path="/student/calendar" element={<EventCalendar />} />
              </Route>

              {/* Club Admin Portal */}
              <Route element={<ProtectedRoute allowedRoles={['club_admin']} />}>
                <Route path="/club-admin/dashboard" element={<ClubAdminDashboard />} />
                <Route path="/club-admin/meetings" element={<ClubMeetings />} />
                <Route path="/club-admin/chat" element={<ClubChat />} />
                <Route path="/club-admin/check-in" element={<EventCheckIn />} />
                <Route path="/club-admin/members" element={<ClubMembers />} />
                <Route path="/club-admin/requests" element={<MembershipRequests />} />
                <Route path="/club-admin/events" element={<ClubEvents />} />
                <Route path="/club-admin/events/create" element={<CreateEvent />} />
                <Route path="/club-admin/registrations" element={<EventRegistrations />} />
                <Route path="/club-admin/announcements" element={<ClubAnnouncements />} />
                <Route path="/club-admin/analytics" element={<Navigate to="/club-admin/dashboard" replace />} />
              </Route>

              {/* Super Admin Portal */}
              <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
                <Route path="/admin/dashboard" element={<SuperAdminDashboard />} />
                <Route path="/admin/chat" element={<ClubChat />} />
                <Route path="/admin/users" element={<ManageUsers />} />
                <Route path="/admin/clubs" element={<SuperAdminClubs />} />
                <Route path="/admin/club-admins" element={<ManageClubAdmins />} />
                <Route path="/admin/events" element={<ManageEvents />} />
                <Route path="/admin/announcements" element={<ManageAnnouncements />} />
                <Route path="/admin/reports" element={<Navigate to="/admin/dashboard" replace />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
