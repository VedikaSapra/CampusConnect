import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Calendar, AlertCircle, Sparkles, Building2, CheckCircle2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export const CreateEvent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [club, setClub] = useState(null);
  const [availableClubs, setAvailableClubs] = useState([]);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'workshop',
    event_date: '',
    venue: '',
    capacity: 50,
    registration_deadline: '',
    requires_approval: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. Fetch club info for administered club
    const fetchClub = async () => {
      try {
        const res = await api.get('/clubs/my-club/');
        if (res.data && res.data.id) {
          setClub(res.data);
          setSelectedClubId(res.data.id.toString());
          return;
        }
      } catch (e) {
        // Not a single-club admin or super admin
      }

      // 2. If not pre-assigned or super admin, fetch all approved clubs
      try {
        const clubsRes = await api.get('/clubs/');
        const list = clubsRes.data.results || clubsRes.data || [];
        setAvailableClubs(list);
        if (list.length > 0) {
          setSelectedClubId(list[0].id.toString());
        }
      } catch (err) {
        console.warn('Could not fetch clubs list', err);
      }
    };

    fetchClub();
  }, []);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        capacity: parseInt(formData.capacity, 10) || 50,
      };

      const finalClubId = club?.id || selectedClubId;
      if (finalClubId) {
        payload.club = parseInt(finalClubId, 10);
      }

      await api.post('/events/', payload);
      showNotification('Event published successfully!', 'success');
      navigate(user?.role === 'super_admin' ? '/admin/events' : '/club-admin/events');
    } catch (err) {
      const data = err.response?.data;
      if (typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        const msg = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey];
        setError(`${firstKey}: ${msg}`);
      } else {
        setError('Failed to create event. Please verify all fields.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#211B35] dark:text-white">Create New Event</h1>
          <p className="text-sm text-[#77738B] dark:text-[#B3ADC7] mt-1">Publish an upcoming workshop, tournament, or seminar for students.</p>
        </div>
        {club ? (
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#F3EEFF] dark:bg-purple-950/40 text-[#5141B8] dark:text-purple-300 rounded-xl text-xs font-bold border border-[#E8DEFF] dark:border-purple-800/40">
            <Building2 className="w-3.5 h-3.5" />
            <span>{club.name}</span>
          </div>
        ) : availableClubs.length > 0 ? (
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Club:</label>
            <select
              value={selectedClubId}
              onChange={(e) => setSelectedClubId(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-[#191726] text-[#211B35] dark:text-white border border-[#E9E5F2] dark:border-[#383248] focus:ring-2 focus:ring-[#8B5CF6] outline-none"
            >
              {availableClubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <div className="bg-white dark:bg-[#191726] p-6 sm:p-8 rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs">
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-950/40 border-l-4 border-red-500 p-4 rounded-r-lg flex items-center space-x-2 text-red-700 dark:text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* If user is Super Admin or not bound to single club and no club displayed above, show club dropdown */}
          {!club && availableClubs.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-[#211B35] dark:text-slate-200 uppercase mb-1">Organizing Society / Club *</label>
              <select
                value={selectedClubId}
                onChange={(e) => setSelectedClubId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-[#E9E5F2] dark:border-[#383248] rounded-xl text-sm focus:ring-2 focus:ring-[#5141B8] outline-none bg-white dark:bg-[#12111A] text-[#211B35] dark:text-white"
              >
                {availableClubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.category || 'General'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#211B35] dark:text-slate-200 uppercase mb-1">Event Title *</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. AI & Robotics Bootcamp 2025"
              className="w-full px-3.5 py-2.5 border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] rounded-xl text-sm focus:ring-2 focus:ring-[#5141B8] outline-none text-[#211B35] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#211B35] dark:text-slate-200 uppercase mb-1">Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 border border-[#E9E5F2] dark:border-[#383248] rounded-xl text-sm focus:ring-2 focus:ring-[#5141B8] outline-none bg-white dark:bg-[#12111A] text-[#211B35] dark:text-white"
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

          <div>
            <label className="block text-xs font-bold text-[#211B35] dark:text-slate-200 uppercase mb-1">Description *</label>
            <textarea
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Detailed description of the agenda, speakers, requirements, and rules..."
              className="w-full px-3.5 py-2.5 border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] rounded-xl text-sm focus:ring-2 focus:ring-[#5141B8] outline-none text-[#211B35] dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#211B35] dark:text-slate-200 uppercase mb-1">Event Date & Time *</label>
              <input
                type="datetime-local"
                name="event_date"
                required
                value={formData.event_date}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] rounded-xl text-sm focus:ring-2 focus:ring-[#5141B8] outline-none text-[#211B35] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#211B35] dark:text-slate-200 uppercase mb-1">Registration Deadline *</label>
              <input
                type="datetime-local"
                name="registration_deadline"
                required
                value={formData.registration_deadline}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] rounded-xl text-sm focus:ring-2 focus:ring-[#5141B8] outline-none text-[#211B35] dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#211B35] dark:text-slate-200 uppercase mb-1">Venue / Room *</label>
              <input
                type="text"
                name="venue"
                required
                value={formData.venue}
                onChange={handleChange}
                placeholder="e.g. Auditorium B, Ground Floor"
                className="w-full px-3.5 py-2.5 border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] rounded-xl text-sm focus:ring-2 focus:ring-[#5141B8] outline-none text-[#211B35] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#211B35] dark:text-slate-200 uppercase mb-1">Capacity (Seats) *</label>
              <input
                type="number"
                name="capacity"
                min="1"
                required
                value={formData.capacity}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] rounded-xl text-sm focus:ring-2 focus:ring-[#5141B8] outline-none text-[#211B35] dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2.5 pt-2">
            <input
              type="checkbox"
              id="requires_approval"
              name="requires_approval"
              checked={formData.requires_approval}
              onChange={handleChange}
              className="w-4 h-4 text-[#5141B8] rounded border-slate-300 focus:ring-[#5141B8]"
            />
            <label htmlFor="requires_approval" className="text-xs text-[#211B35] dark:text-slate-300 font-semibold cursor-pointer">
              Require manual administrator approval for registrations
            </label>
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-[#F3EEFF] dark:border-[#383248]">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#5141B8] hover:bg-[#34246F] dark:bg-[#6D5BD0] dark:hover:bg-[#8B7CF6] text-white rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Publishing Event…' : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
