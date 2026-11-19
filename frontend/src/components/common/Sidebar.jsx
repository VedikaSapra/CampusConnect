import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Calendar, Megaphone, 
  Settings, UserCheck, BarChart3, PlusCircle, CheckSquare, 
  Award, MessageSquare, QrCode, Video
} from 'lucide-react';

export const Sidebar = ({ role }) => {
  const location = useLocation();

  const studentLinks = [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/meetings', label: 'Club Meetings', icon: Video },
    { to: '/student/chat', label: 'Messages & Chat', icon: MessageSquare },
    { to: '/student/my-clubs', label: 'My Clubs', icon: Users },
    { to: '/student/my-registrations', label: 'My Registrations', icon: Calendar },
    { to: '/student/calendar', label: 'Event Calendar', icon: Calendar },
    { to: '/clubs', label: 'Explore Clubs', icon: Award },
    { to: '/events', label: 'Explore Events', icon: Calendar },
    { to: '/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/profile', label: 'Profile Settings', icon: Settings },
  ];

  const clubAdminLinks = [
    { to: '/club-admin/dashboard', label: 'Club Dashboard', icon: LayoutDashboard },
    { to: '/club-admin/meetings', label: 'Club Meetings', icon: Video },
    { to: '/club-admin/chat', label: 'Community Chat', icon: MessageSquare },
    { to: '/club-admin/check-in', label: 'Event Check-in & Attendance', icon: QrCode },
    { to: '/club-admin/members', label: 'Club Members', icon: Users },
    { to: '/club-admin/requests', label: 'Membership Requests', icon: UserCheck },
    { to: '/club-admin/events', label: 'Manage Events', icon: Calendar },
    { to: '/club-admin/events/create', label: 'Create Event', icon: PlusCircle },
    { to: '/club-admin/registrations', label: 'Event Registrations', icon: CheckSquare },
    { to: '/club-admin/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/profile', label: 'Profile Settings', icon: Settings },
  ];

  const superAdminLinks = [
    { to: '/admin/dashboard', label: 'Platform Overview', icon: LayoutDashboard },
    { to: '/admin/chat', label: 'Chat Moderation', icon: MessageSquare },
    { to: '/admin/users', label: 'Manage Users', icon: Users },
    { to: '/admin/clubs', label: 'Manage Clubs', icon: Award },
    { to: '/admin/club-admins', label: 'Club Administrators', icon: UserCheck },
    { to: '/admin/events', label: 'Manage Events', icon: Calendar },
    { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/profile', label: 'Profile Settings', icon: Settings },
  ];

  const links = 
    role === 'super_admin' ? superAdminLinks :
    role === 'club_admin' ? clubAdminLinks : 
    studentLinks;

  return (
    <aside className="w-64 my-4 ml-2 sm:ml-4 bg-white dark:bg-[#191726] border border-[#E5E3F0] dark:border-[#383248] rounded-3xl min-h-[calc(100vh-6rem)] p-4 flex flex-col justify-between hidden md:flex transition-all shadow-xs shrink-0 self-start sticky top-20">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-extrabold text-[#77728C] dark:text-[#B3ADC7] uppercase tracking-wider">
          Navigation
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#EFE9FE] text-[#6D36F5] dark:bg-[#29243B] dark:text-[#A78BFA] font-bold shadow-xs scale-[1.01]'
                  : 'text-[#77728C] hover:bg-[#F3EEFF]/60 hover:text-[#6D36F5] dark:text-[#B3ADC7] dark:hover:bg-[#211E30] dark:hover:text-[#F5F3FF]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#6D36F5] dark:text-[#A78BFA]' : 'text-slate-400 dark:text-slate-500'}`} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-4 bg-gradient-to-br from-[#2D146F] via-[#3E1A8F] to-[#6A38E0] text-white rounded-2xl shadow-md space-y-1.5 transition-all">
        <p className="text-xs font-bold tracking-tight">CampusConnect Hub</p>
        <p className="text-[10px] text-purple-200">Verified Passes & Active Assemblies</p>
        <div className="pt-1">
          <span className="inline-block px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-full text-[9px] font-bold uppercase tracking-wider backdrop-blur-xs transition-colors">
            Online v2.0
          </span>
        </div>
      </div>
    </aside>
  );
};
