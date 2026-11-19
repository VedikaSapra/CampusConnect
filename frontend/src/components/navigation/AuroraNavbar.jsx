import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemeToggle } from '../common/ThemeToggle';
import { 
  Sparkles, Compass, Calendar, Megaphone, LogIn, UserPlus, 
  Menu, X, Bell, ChevronDown, User, LogOut, Award, Shield, Home 
} from 'lucide-react';
import { Button } from '../common/UIComponents';

export const AuroraNavbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Explore Clubs', href: '/clubs', icon: Compass },
    { label: 'Discover Events', href: '/events', icon: Calendar },
    { 
      label: 'Announcements', 
      href: user?.role === 'super_admin' ? '/admin/announcements' : user?.role === 'club_admin' ? '/club-admin/announcements' : '/announcements', 
      icon: Megaphone 
    },
  ];

  const getDashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'super_admin') return '/admin/dashboard';
    if (user.role === 'club_admin') return '/club-admin/dashboard';
    return '/student/dashboard';
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/85 dark:bg-[#211B35]/90 border-b border-[#E9E5F2] dark:border-purple-900/40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#34246F] via-[#5141B8] to-[#8B5CF6] flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-[#34246F] via-[#5141B8] to-[#8B5CF6] dark:from-white dark:to-purple-300 bg-clip-text text-transparent">
                CampusConnect
              </span>
              <span className="block text-[9px] uppercase tracking-widest font-bold text-[#8B5CF6] -mt-1">
                Aurora Edition
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center space-x-2 ${
                    isActive
                      ? 'text-[#6D36F5] bg-[#EFE9FE] font-bold shadow-xs dark:bg-purple-900/40 dark:text-purple-300'
                      : 'text-[#77728C] hover:text-[#6D36F5] hover:bg-[#F3EEFF]/80 dark:text-slate-300 dark:hover:text-white dark:hover:bg-purple-950/40'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#6D36F5] dark:text-[#A78BFA]' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Action Icons & Auth */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2.5 p-1.5 pl-2.5 rounded-2xl border border-[#E9E5F2] hover:border-[#8B5CF6]/50 bg-[#F8F7FC] dark:bg-purple-950/30 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5141B8] to-[#8B5CF6] flex items-center justify-center font-bold text-white text-xs shadow-xs">
                    {user.first_name?.[0] || 'U'}
                  </div>
                  <div className="text-left text-xs pr-1">
                    <p className="font-bold text-[#211B35] dark:text-white leading-tight">{user.first_name}</p>
                    <p className="text-[10px] text-[#8B5CF6] font-semibold uppercase">{user.role?.replace('_', ' ')}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#211B35] rounded-2xl shadow-xl border border-[#E9E5F2] dark:border-purple-900/50 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-purple-900/30">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-sm font-bold text-[#211B35] dark:text-white truncate">{user.email}</p>
                    </div>

                    <Link
                      to={getDashboardPath()}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center space-x-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-[#F3EEFF] dark:hover:bg-purple-950/40 hover:text-[#5141B8]"
                    >
                      <Shield className="w-4 h-4 text-[#8B5CF6]" />
                      <span>Role Dashboard</span>
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center space-x-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-[#F3EEFF] dark:hover:bg-purple-950/40 hover:text-[#5141B8]"
                    >
                      <User className="w-4 h-4 text-[#8B5CF6]" />
                      <span>Account Settings</span>
                    </Link>

                    <div className="border-t border-slate-100 dark:border-purple-900/30 my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm text-[#E05265] hover:bg-red-50 dark:hover:bg-red-950/20 text-left transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2.5">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-[#5141B8] hover:text-[#34246F] hover:bg-[#F3EEFF] rounded-xl transition-all"
                >
                  Sign In
                </Link>
                <Link to="/register">
                  <Button size="md" icon={UserPlus}>
                    Join Campus
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <ThemeToggle compact />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E9E5F2] dark:border-purple-900/40 bg-white dark:bg-[#211B35] px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-[#F3EEFF] dark:hover:bg-purple-950/30"
            >
              <link.icon className="w-5 h-5 text-[#8B5CF6]" />
              <span>{link.label}</span>
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-100 dark:border-purple-900/40 flex flex-col space-y-2">
            {user ? (
              <>
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 bg-[#F3EEFF] text-[#5141B8] font-bold rounded-xl text-sm"
                >
                  Go to Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 text-sm font-semibold text-[#E05265] border border-red-200 rounded-xl"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 border border-[#E9E5F2] text-[#34246F] font-semibold rounded-xl text-sm"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 aurora-gradient-btn text-white font-semibold rounded-xl text-sm shadow-md"
                >
                  Join CampusConnect
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

