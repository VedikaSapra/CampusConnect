import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import {
  Calendar, Search, PlusCircle, RefreshCw, MapPin, Users,
  Trash2, QrCode, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';

export const ClubEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);
  const { showNotification } = useNotification();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/events/my-club-events/');
      setEvents(res.data?.results ?? res.data ?? []);
    } catch {
      showNotification('Failed to load club events.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete event "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/events/${id}/`);
      setEvents(prev => prev.filter(e => e.id !== id));
      showNotification('Event deleted.', 'success');
    } catch (err) {
      showNotification(err.response?.data?.error || 'Failed to delete event.', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = events.filter(e => {
    const q = search.toLowerCase();
    return !q ||
      e.title?.toLowerCase().includes(q) ||
      e.venue?.toLowerCase().includes(q) ||
      e.category?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#211B35] dark:text-white">Manage Club Events</h1>
          <p className="text-sm text-[#77738B] dark:text-[#B3ADC7] mt-1">
            {loading ? 'Loading…' : `${events.length} event${events.length !== 1 ? 's' : ''} organized by your club`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchEvents}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#191726] border border-[#E9E5F2] dark:border-[#383248] text-[#5141B8] dark:text-purple-300 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/club-admin/events/create"
            className="flex items-center gap-2 px-4 py-2 bg-[#5141B8] hover:bg-[#34246F] dark:bg-[#6D5BD0] dark:hover:bg-[#8B7CF6] text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Create Event
          </Link>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by event title, venue or category…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-[#E9E5F2] dark:border-[#383248] rounded-xl text-sm focus:ring-2 focus:ring-[#8B5CF6] outline-none bg-white dark:bg-[#191726] text-[#211B35] dark:text-white shadow-xs"
        />
      </div>

      <div className="bg-white dark:bg-[#191726] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#5141B8]" />
            <p className="text-sm">Loading club events…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-[#383248]" />
            <p className="font-bold text-slate-500 dark:text-[#B3ADC7]">No events found</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Click "Create Event" to publish an event for your club.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F7FC] dark:bg-[#12111A] border-b border-[#E9E5F2] dark:border-[#383248]">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider">Event</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider hidden sm:table-cell">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider hidden md:table-cell">Registrations</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EEFF] dark:divide-[#29243B]">
                <AnimatePresence>
                  {filtered.map((e, i) => (
                    <motion.tr
                      key={e.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-[#F8F7FC] dark:hover:bg-[#251E3E] transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-[#211B35] dark:text-white">{e.title}</p>
                        <div className="flex items-center gap-1 text-xs text-[#77738B] dark:text-[#B3ADC7] mt-0.5">
                          <MapPin className="w-3 h-3 text-[#8B5CF6]" /> {e.venue || '—'}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F3EEFF] dark:bg-purple-950/60 text-[#5141B8] dark:text-purple-300 capitalize border border-[#E8DEFF] dark:border-purple-800/40">
                          {e.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell text-xs text-[#77738B] dark:text-[#B3ADC7]">
                        {e.event_date ? new Date(e.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        {e.is_past && <span className="ml-1 text-red-400 font-semibold">(Past)</span>}
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#211B35] dark:text-white">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{e.registered_count ?? 0} / {e.capacity}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/events/${e.id}`}
                            className="p-1.5 hover:bg-[#F3EEFF] dark:hover:bg-purple-950/40 text-[#5141B8] dark:text-purple-300 rounded-lg transition-all"
                            title="View Event Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to="/club-admin/check-in"
                            className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg transition-all"
                            title="Open QR Check-In"
                          >
                            <QrCode className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(e.id, e.title)}
                            disabled={deleting === e.id}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 dark:text-red-400 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
