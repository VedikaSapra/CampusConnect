import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from './NotificationBell';
import { 
  Sparkles, Compass, Calendar, Megaphone, User, LogOut, 
  LayoutDashboard, Shield, Home 
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'super_admin') return '/admin/dashboard';
    if (user.role === 'club_admin') return '/club-admin/dashboard';
    return '/student/dashboard';
  };

  return (
    <nav className="bg-white dark:bg-[#191726] border-b border-[#E9E5F2] dark:border-[#383248] sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-3">
            <Link to={getDashboardLink()} className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#34246F] via-[#5141B8] to-[#8B5CF6] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-[#34246F] via-[#5141B8] to-[#8B5CF6] dark:from-white dark:to-purple-300 bg-clip-text text-transparent">
                CampusConnect
              </span>
            </Link>

            {/* Public/Dashboard quick links */}
            <div className="hidden md:flex ml-8 space-x-1.5">
              <Link 
                to="/" 
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  location.pathname === '/' 
                    ? 'text-[#6D36F5] bg-[#EFE9FE] dark:bg-[#29243B] dark:text-[#A78BFA] font-bold shadow-xs' 
                    : 'text-[#77728C] dark:text-[#B3ADC7] hover:text-[#6D36F5] hover:bg-[#F3EEFF]/80 dark:hover:text-white'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </Link>
              <Link 
                to="/clubs" 
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  location.pathname === '/clubs' 
                    ? 'text-[#6D36F5] bg-[#EFE9FE] dark:bg-[#29243B] dark:text-[#A78BFA] font-bold shadow-xs' 
                    : 'text-[#77728C] dark:text-[#B3ADC7] hover:text-[#6D36F5] hover:bg-[#F3EEFF]/80 dark:hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Clubs</span>
              </Link>
              <Link 
                to="/events" 
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  location.pathname === '/events' 
                    ? 'text-[#6D36F5] bg-[#EFE9FE] dark:bg-[#29243B] dark:text-[#A78BFA] font-bold shadow-xs' 
                    : 'text-[#77728C] dark:text-[#B3ADC7] hover:text-[#6D36F5] hover:bg-[#F3EEFF]/80 dark:hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Events</span>
              </Link>
              <Link 
                to="/announcements" 
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  location.pathname === '/announcements' 
                    ? 'text-[#6D36F5] bg-[#EFE9FE] dark:bg-[#29243B] dark:text-[#A78BFA] font-bold shadow-xs' 
                    : 'text-[#77728C] dark:text-[#B3ADC7] hover:text-[#6D36F5] hover:bg-[#F3EEFF]/80 dark:hover:text-white'
                }`}
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>Announcements</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Notification Bell */}
            {user && <NotificationBell />}

            {user ? (
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Link
                  to={getDashboardLink()}
                  className="hidden sm:inline-block px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#F3EEFF] dark:bg-[#29243B] text-[#5141B8] dark:text-[#A78BFA] border border-[#E8DEFF] dark:border-[#383248] uppercase tracking-wider"
                >
                  {user.role?.replace('_', ' ')}
                </Link>
                <Link 
                  to="/profile" 
                  className="flex items-center space-x-2 text-[#211B35] dark:text-[#F5F3FF] hover:text-[#5141B8] dark:hover:text-[#A78BFA] transition-colors p-1.5 rounded-xl hover:bg-[#F3EEFF] dark:hover:bg-[#29243B]"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#5141B8] to-[#8B5CF6] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user.first_name?.[0] || 'U'}
                  </div>
                  <span className="text-xs font-bold hidden sm:inline">{user.first_name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-[#77738B] dark:text-[#B3ADC7] hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link 
                  to="/login" 
                  className="text-xs font-bold text-[#5141B8] dark:text-[#A78BFA] hover:underline px-3 py-1.5"
                >
                  Sign in
                </Link>
                <Link 
                  to="/register" 
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#5141B8] hover:bg-[#34246F] rounded-xl shadow-xs transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
