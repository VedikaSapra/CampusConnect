import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Bell, CheckCheck, Video, Calendar, Megaphone, Info, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/meetings/notifications/');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch {
      // Ignore background notification fetch errors
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000); // 25s polling
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/meetings/notifications/read-all/');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {
      // ignore
    }
  };

  const handleClickItem = async (notif) => {
    if (!notif.is_read) {
      try {
        await api.post(`/meetings/notifications/${notif.id}/read/`);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      } catch {
        // ignore
      }
    }
    setOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const getIcon = (type) => {
    if (type?.startsWith('meeting')) {
      return <Video className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
    }
    if (type?.startsWith('event')) {
      return <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
    }
    if (type === 'announcement') {
      return <Megaphone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
    }
    return <Info className="w-3.5 h-3.5 text-[#5141B8] dark:text-purple-400" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-[#77738B] dark:text-[#B3ADC7] hover:text-[#5141B8] dark:hover:text-white rounded-xl hover:bg-[#F3EEFF] dark:hover:bg-[#29243B] transition-colors relative"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#191726] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-3.5 border-b border-[#F3EEFF] dark:border-[#29243B] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[#211B35] dark:text-white uppercase tracking-wider">
                  Campus Alerts
                </span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-bold text-[#5141B8] dark:text-purple-300 hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-[#F3EEFF] dark:divide-[#29243B]">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-[#5141B8]" />
                  <p>No notifications yet.</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => handleClickItem(n)}
                    className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-[#F8F7FC] dark:hover:bg-[#211E30] ${
                      !n.is_read ? 'bg-purple-50/50 dark:bg-purple-950/20' : ''
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-white dark:bg-[#12111A] border border-[#E9E5F2] dark:border-[#383248] flex-shrink-0 mt-0.5">
                      {getIcon(n.notification_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs ${!n.is_read ? 'font-bold text-[#211B35] dark:text-white' : 'font-medium text-slate-600 dark:text-slate-300'}`}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-[#77738B] dark:text-slate-400 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-purple-600 flex-shrink-0 mt-2" />
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
