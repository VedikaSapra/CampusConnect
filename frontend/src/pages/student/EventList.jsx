import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Search, Calendar, MapPin, Users, Check, AlertCircle, RefreshCw } from 'lucide-react';

export const EventList = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [registeringId, setRegisteringId] = useState(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/events/', {
        params: {
          search: search || undefined,
          category: category || undefined,
        },
      });
      setEvents(res.data.results || res.data || []);
    } catch (err) {
      console.error('Error fetching events', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [category]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  const handleRegister = async (eventId) => {
    setRegisteringId(eventId);
    try {
      await api.post(`/events/${eventId}/register/`);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.error || 'Registration failed.');
    } finally {
      setRegisteringId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#211B35] dark:text-white">Campus Events & Workshops</h1>
          <p className="text-sm text-[#77738B] dark:text-[#B3ADC7] mt-1">Discover hackathons, seminars, cultural fests, and sports tournaments.</p>
        </div>
      </div>

      {/* Filter and search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search events by title or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#191726] border border-[#E9E5F2] dark:border-[#383248] text-[#211B35] dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] shadow-xs"
          />
        </form>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-white dark:bg-[#191726] border border-[#E9E5F2] dark:border-[#383248] text-[#211B35] dark:text-white rounded-xl px-4 py-2.5 text-sm shadow-xs focus:ring-2 focus:ring-[#8B5CF6] outline-none"
        >
          <option value="">All Categories</option>
          <option value="workshop">Workshop</option>
          <option value="hackathon">Hackathon</option>
          <option value="cultural">Cultural</option>
          <option value="sports">Sports</option>
          <option value="seminar">Seminar</option>
          <option value="networking">Networking</option>
          <option value="competition">Competition</option>
        </select>
      </div>

      {/* Event Cards Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#5141B8] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="bg-white dark:bg-[#191726] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] overflow-hidden shadow-xs hover:shadow-md hover:border-[#8B5CF6] dark:hover:border-[#8B5CF6] transition-all flex flex-col justify-between"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#F3EEFF] dark:bg-purple-950/60 text-[#5141B8] dark:text-purple-300 border border-[#E8DEFF] dark:border-purple-800/40">
                    {evt.category}
                  </span>
                  <span className="text-xs font-bold text-[#5141B8] dark:text-purple-300">
                    {evt.club_name}
                  </span>
                </div>

                <h3 className="font-bold text-lg text-[#211B35] dark:text-white mt-3">{evt.title}</h3>
                <p className="text-sm text-[#77738B] dark:text-[#B3ADC7] mt-2 line-clamp-2 leading-relaxed">{evt.description}</p>

                <div className="mt-4 space-y-2 text-xs text-[#77738B] dark:text-[#B3ADC7]">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    <span>
                      {new Date(evt.event_date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    <span>{evt.venue}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    <span>{evt.available_seats} / {evt.capacity} seats available</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#F8F7FC] dark:bg-[#211E30] border-t border-[#E9E5F2] dark:border-[#29243B] flex items-center justify-between">
                <span className="text-xs text-[#77738B] dark:text-[#B3ADC7] font-medium">
                  Deadline: {new Date(evt.registration_deadline).toLocaleDateString()}
                </span>

                {user?.role === 'student' && (
                  evt.registration_status ? (
                    <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 rounded-lg text-xs font-bold flex items-center">
                      <Check className="w-3.5 h-3.5 mr-1" /> {evt.registration_status}
                    </span>
                  ) : evt.available_seats <= 0 ? (
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-800/40">
                      Full
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRegister(evt.id)}
                      disabled={registeringId === evt.id}
                      className="px-3.5 py-1.5 bg-[#5141B8] hover:bg-[#34246F] dark:bg-[#6D5BD0] dark:hover:bg-[#8B7CF6] text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {registeringId === evt.id ? 'Registering...' : 'Register'}
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#191726] p-12 text-center rounded-2xl border border-[#E9E5F2] dark:border-[#383248]">
          <p className="text-[#77738B] dark:text-[#B3ADC7] text-sm">No events found matching your filter criteria.</p>
        </div>
      )}
    </div>
  );
};
