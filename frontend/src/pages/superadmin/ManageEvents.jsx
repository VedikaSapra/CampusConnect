import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import {
  Calendar, Search, Filter, RefreshCw, Eye, Trash2, PlusCircle,
  MapPin, Users, X, Building2, CheckCircle2, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';

const CATEGORY_COLORS = {
  workshop: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/40',
  hackathon: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800/40',
  seminar: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/40',
  cultural: 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 dark:border-pink-800/40',
  sports: 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300 border-green-200 dark:border-green-800/40',
  networking: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
  competition: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800/40',
};

const EMPTY_EVENT_FORM = {
  title: '',
  description: '',
  category: 'workshop',
  event_date: '',
  registration_deadline: '',
  venue: '',
  capacity: 100,
  club: '',
  requires_approval: false,
};

export const ManageEvents = () => {
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_EVENT_FORM);
  const [creating, setCreating] = useState(false);
  const { showNotification } = useNotification();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      params.set('ordering', '-event_date');
      const res = await api.get(`/events/?${params}`);
      setEvents(res.data?.results ?? res.data ?? []);
    } catch {
      showNotification('Failed to load events.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  const fetchClubs = async () => {
    try {
      const res = await api.get('/clubs/');
      setClubs(res.data?.results ?? res.data ?? []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchEvents, 300);
    return () => clearTimeout(t);
  }, [fetchEvents]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        ...formData,
        capacity: parseInt(formData.capacity) || 100,
        club: formData.club ? parseInt(formData.club) : null,
      };
      await api.post('/events/', payload);
      showNotification('University event created successfully!', 'success');
      setShowCreateModal(false);
      setFormData(EMPTY_EVENT_FORM);
      fetchEvents();
    } catch (err) {
      showNotification(err.response?.data?.error || 'Failed to create event. Verify fields.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (eventId, title) => {
    if (!window.confirm(`Delete event "${title}"? This cannot be undone.`)) return;
    setDeleting(eventId);
    try {
      await api.delete(`/events/${eventId}/`);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      showNotification('Event deleted.', 'success');
    } catch (err) {
      showNotification(err.response?.data?.error || 'Failed to delete event.', 'error');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#211B35] dark:text-white">
            Manage Campus Events
          </h1>
          <p className="text-sm text-[#77738B] dark:text-slate-400 mt-1">
            {loading ? 'Loading…' : `${events.length} event${events.length !== 1 ? 's' : ''} organized across university societies`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchEvents}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#191726] border border-[#E9E5F2] dark:border-[#383248] text-[#5141B8] dark:text-purple-300 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#5141B8] hover:bg-[#34246F] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4" /> Create Platform Event
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search events by title, description or venue…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-[#E9E5F2] dark:border-[#383248] rounded-xl text-sm focus:ring-2 focus:ring-[#5141B8] outline-none bg-white dark:bg-[#191726] text-[#211B35] dark:text-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 border border-[#E9E5F2] dark:border-[#383248] rounded-xl text-sm focus:ring-2 focus:ring-[#5141B8] outline-none bg-white dark:bg-[#191726] text-[#211B35] dark:text-white font-medium"
          >
            <option value="">All Categories</option>
            <option value="workshop">Workshop</option>
            <option value="hackathon">Hackathon</option>
            <option value="seminar">Seminar</option>
            <option value="cultural">Cultural</option>
            <option value="sports">Sports</option>
            <option value="networking">Networking</option>
            <option value="competition">Competition</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#191726] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#5141B8]" />
            <p className="text-sm font-semibold">Loading events…</p>
          </div>
        ) : events.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30 text-[#5141B8]" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No events found</p>
            <p className="text-xs mt-1">Try adjusting the search query or category filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F7FC] dark:bg-[#12111A] border-b border-[#E9E5F2] dark:border-[#383248]">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider">Event</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider hidden sm:table-cell">Organizing Society</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider hidden md:table-cell">Date & Venue</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider hidden lg:table-cell">Signups / Seats</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EEFF] dark:divide-[#29243B]">
                <AnimatePresence>
                  {events.map((e) => {
                    const catCfg = CATEGORY_COLORS[e.category] ?? 'bg-slate-100 text-slate-600 border-slate-200';
                    return (
                      <motion.tr
                        key={e.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-[#F8F7FC] dark:hover:bg-[#211E30] transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-[#211B35] dark:text-white">{e.title}</p>
                          <p className="text-xs text-[#77738B] dark:text-slate-400 line-clamp-1">{e.venue}</p>
                        </td>
                        <td className="px-5 py-3.5 hidden sm:table-cell">
                          <span className="text-xs font-semibold text-[#5141B8] dark:text-purple-300">
                            {e.club_name || 'College Wide'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${catCfg}`}>
                            {e.category}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell text-xs text-[#77738B] dark:text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{e.event_date ? new Date(e.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          <span className="text-xs font-bold text-[#211B35] dark:text-white">
                            {e.registered_count ?? 0}
                          </span>
                          <span className="text-xs text-slate-400"> / {e.capacity}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`/events/${e.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#5141B8] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="View Event Page"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => handleDelete(e.id, e.title)}
                              disabled={deleting === e.id}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-50"
                              title="Delete Event"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE EVENT MODAL (SUPER ADMIN) */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#191726] rounded-3xl border border-[#E9E5F2] dark:border-[#383248] p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative my-8"
            >
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-extrabold text-[#211B35] dark:text-white mb-1">
                Create Platform / College-Wide Event
              </h2>
              <p className="text-xs text-[#77738B] dark:text-slate-400 mb-6">
                Publish an event open across the institution or associate it with an active society.
              </p>

              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Annual University Tech Fest 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] text-sm text-[#211B35] dark:text-white outline-none focus:ring-2 focus:ring-[#5141B8]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                      Organizing Society (Optional)
                    </label>
                    <select
                      value={formData.club}
                      onChange={e => setFormData({ ...formData, club: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] text-sm text-[#211B35] dark:text-white outline-none"
                    >
                      <option value="">Campus-Wide / College Administration</option>
                      {clubs.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] text-sm text-[#211B35] dark:text-white outline-none"
                    >
                      <option value="workshop">Workshop</option>
                      <option value="hackathon">Hackathon</option>
                      <option value="seminar">Seminar</option>
                      <option value="cultural">Cultural</option>
                      <option value="sports">Sports</option>
                      <option value="networking">Networking</option>
                      <option value="competition">Competition</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                    Event Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide complete event details, itinerary, prerequisites, and instructions…"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] text-sm text-[#211B35] dark:text-white outline-none focus:ring-2 focus:ring-[#5141B8]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                      Event Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.event_date}
                      onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] text-sm text-[#211B35] dark:text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                      Registration Deadline *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.registration_deadline}
                      onChange={e => setFormData({ ...formData, registration_deadline: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] text-sm text-[#211B35] dark:text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                      Venue / Hall *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.venue}
                      onChange={e => setFormData({ ...formData, venue: e.target.value })}
                      placeholder="e.g. University Main Auditorium"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] text-sm text-[#211B35] dark:text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                      Capacity (Seats) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.capacity}
                      onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] text-sm text-[#211B35] dark:text-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="super_approval"
                    checked={formData.requires_approval}
                    onChange={e => setFormData({ ...formData, requires_approval: e.target.checked })}
                    className="w-4 h-4 text-[#5141B8] rounded border-slate-300"
                  />
                  <label htmlFor="super_approval" className="text-xs font-semibold text-[#211B35] dark:text-slate-300 cursor-pointer">
                    Require administrator registration approval
                  </label>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-[#F3EEFF] dark:border-[#29243B]">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-6 py-2.5 rounded-xl bg-[#5141B8] hover:bg-[#34246F] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                  >
                    {creating ? 'Publishing Event…' : 'Publish University Event'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
