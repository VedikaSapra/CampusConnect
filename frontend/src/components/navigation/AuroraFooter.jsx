import { Link } from 'react-router-dom';
import { Sparkles, Heart, Mail, Globe, Share2 } from 'lucide-react';

export const AuroraFooter = () => {
  return (
    <footer className="bg-white dark:bg-[#1A152B] border-t border-[#E9E5F2] dark:border-purple-950/60 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand info */}
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#34246F] via-[#5141B8] to-[#8B5CF6] flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-[#34246F] to-[#8B5CF6] dark:from-white dark:to-purple-300 bg-clip-text text-transparent">
                CampusConnect
              </span>
            </Link>
            <p className="text-xs text-[#77738B] dark:text-slate-400 leading-relaxed">
              The unified campus community platform bridging students, student clubs, and collegiate leadership into one seamless experience.
            </p>
            <div className="flex space-x-3 pt-1 text-slate-400">
              <a href="#" className="hover:text-[#8B5CF6] transition-colors"><Mail className="w-4 h-4" /></a>
              <a href="#" className="hover:text-[#8B5CF6] transition-colors"><Globe className="w-4 h-4" /></a>
              <a href="#" className="hover:text-[#8B5CF6] transition-colors"><Share2 className="w-4 h-4" /></a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-bold text-[#211B35] dark:text-white uppercase tracking-wider mb-4">
              Explore Campus
            </h4>
            <ul className="space-y-2.5 text-xs text-[#77738B] dark:text-slate-400">
              <li><Link to="/clubs" className="hover:text-[#5141B8] dark:hover:text-purple-300 transition-colors">Student Societies</Link></li>
              <li><Link to="/events" className="hover:text-[#5141B8] dark:hover:text-purple-300 transition-colors">Upcoming Workshops</Link></li>
              <li><Link to="/events" className="hover:text-[#5141B8] dark:hover:text-purple-300 transition-colors">Hackathons & Fests</Link></li>
              <li><Link to="/announcements" className="hover:text-[#5141B8] dark:hover:text-purple-300 transition-colors">Campus Notices</Link></li>
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h4 className="text-xs font-bold text-[#211B35] dark:text-white uppercase tracking-wider mb-4">
              Access Portals
            </h4>
            <ul className="space-y-2.5 text-xs text-[#77738B] dark:text-slate-400">
              <li><Link to="/student/dashboard" className="hover:text-[#5141B8] dark:hover:text-purple-300 transition-colors">Student Hub</Link></li>
              <li><Link to="/club-admin/dashboard" className="hover:text-[#5141B8] dark:hover:text-purple-300 transition-colors">Club Officer Console</Link></li>
              <li><Link to="/admin/dashboard" className="hover:text-[#5141B8] dark:hover:text-purple-300 transition-colors">Campus Administration</Link></li>
              <li><Link to="/login" className="hover:text-[#5141B8] dark:hover:text-purple-300 transition-colors">Single Sign-On</Link></li>
            </ul>
          </div>

          {/* Academic notice */}
          <div>
            <h4 className="text-xs font-bold text-[#211B35] dark:text-white uppercase tracking-wider mb-4">
              Academic Project
            </h4>
            <div className="p-4 rounded-2xl bg-[#F8F7FC] dark:bg-purple-950/30 border border-[#E9E5F2] dark:border-purple-900/40">
              <p className="text-xs text-[#5141B8] dark:text-purple-300 font-bold mb-1">
                Full-Stack Capstone
              </p>
              <p className="text-[11px] text-[#77738B] dark:text-slate-400 leading-snug">
                Engineered with Django REST Framework, MariaDB (MySQL), React 19, Vite, and Tailwind CSS.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#E9E5F2] dark:border-purple-900/30 flex flex-col sm:flex-row justify-between items-center text-xs text-[#77738B] dark:text-slate-500">
          <p>© {new Date().getFullYear()} CampusConnect. All rights reserved.</p>
          <p className="flex items-center mt-2 sm:mt-0">
            Crafted for university excellence with <Heart className="w-3.5 h-3.5 text-[#E05265] mx-1 fill-current" />
          </p>
        </div>
      </div>
    </footer>
  );
};
