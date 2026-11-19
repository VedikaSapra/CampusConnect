import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Megaphone, Calendar, Plus, Globe, Users, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await api.get('/announcements/');
        setAnnouncements(res.data.results || res.data);
      } catch (err) {
        console.error('Error fetching announcements', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  // Both club_admin and super_admin can create announcements
  const createLink =
    user?.role === 'super_admin'
      ? '/admin/announcements'
      : user?.role === 'club_admin'
        ? '/club-admin/announcements'
        : null;

  const getTagConfig = (item) => {
    if (item.club_name) {
      return {
        label: item.club_name,
        cls: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700/40',
      };
    }
    return {
      label: 'College Wide',
      cls: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/40',
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#211B35] dark:text-white">
            Campus Notices &amp; Announcements
          </h1>
          <p className="text-sm text-[#77738B] dark:text-[#B3ADC7] mt-1">
            Stay informed with college-wide updates and club-specific bulletins.
          </p>
        </div>
        {createLink && (
          <Link
            to={createLink}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5141B8] hover:bg-[#34246F] dark:bg-[#6D5BD0] dark:hover:bg-[#8B7CF6] text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Create Announcement
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="w-8 h-8 border-transparent animate-spin text-[#5141B8] dark:text-[#A78BFA]" />
        </div>
      ) : announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((item) => {
            const tag = getTagConfig(item);
            return (
              <div
                key={item.id}
                className="bg-white dark:bg-[#211E30] p-6 rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs hover:shadow-md dark:hover:shadow-purple-900/20 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F3EEFF] dark:border-[#29243B] pb-3 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-0.5 text-xs font-bold uppercase rounded-md ${tag.cls}`}>
                      {tag.label}
                    </span>
                    <span className="text-xs text-[#77738B] dark:text-[#B3ADC7]">
                      • Posted by {item.author_detail?.full_name || 'Campus Admin'}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-[#77738B] dark:text-[#B3ADC7] space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(item.published_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                <h2 className="text-base font-bold text-[#211B35] dark:text-white">{item.title}</h2>
                <p className="text-sm text-[#77738B] dark:text-[#B3ADC7] mt-2 whitespace-pre-line leading-relaxed">
                  {item.content}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#211E30] p-12 text-center rounded-2xl border border-[#E9E5F2] dark:border-[#383248]">
          <Megaphone className="w-10 h-10 mx-auto mb-3 text-[#E9E5F2] dark:text-[#383248]" />
          <p className="text-[#77738B] dark:text-[#B3ADC7] text-sm">No announcements at this time.</p>
        </div>
      )}
    </div>
  );
};
