import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Search, Users, Check, Clock, RefreshCw } from 'lucide-react';

export const ClubList = () => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [joiningId, setJoiningId] = useState(null);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clubs/', {
        params: {
          search: search || undefined,
          category: category || undefined,
        },
      });
      setClubs(res.data.results || res.data || []);
    } catch (err) {
      console.error('Error fetching clubs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, [category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchClubs();
  };

  const handleJoin = async (clubId) => {
    setJoiningId(clubId);
    try {
      await api.post(`/clubs/${clubId}/join/`);
      fetchClubs();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to request membership.');
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#211B35] dark:text-white">Explore Campus Clubs</h1>
          <p className="text-sm text-[#77738B] dark:text-[#B3ADC7] mt-1">Discover student societies, sports communities, and academic chapters.</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search clubs by name or keywords..."
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
          <option value="technical">Technical</option>
          <option value="cultural">Cultural</option>
          <option value="sports">Sports</option>
          <option value="social">Social Service</option>
          <option value="entrepreneurship">Entrepreneurship</option>
        </select>
      </div>

      {/* Club Cards Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#5141B8] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : clubs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club) => (
            <div
              key={club.id}
              className="bg-white dark:bg-[#191726] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] overflow-hidden shadow-xs hover:shadow-md hover:border-[#8B5CF6] dark:hover:border-[#8B5CF6] transition-all flex flex-col justify-between"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#F3EEFF] dark:bg-purple-950/60 text-[#5141B8] dark:text-purple-300 border border-[#E8DEFF] dark:border-purple-800/40">
                    {club.category}
                  </span>
                  <div className="flex items-center text-xs text-[#77738B] dark:text-[#B3ADC7] space-x-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{club.member_count} members</span>
                  </div>
                </div>

                <h3 className="font-bold text-lg text-[#211B35] dark:text-white mt-3">{club.name}</h3>
                <p className="text-sm text-[#77738B] dark:text-[#B3ADC7] mt-2 line-clamp-3 leading-relaxed">{club.description}</p>
                {club.faculty_coordinator && (
                  <p className="text-xs text-[#77738B] dark:text-slate-400 mt-3">
                    <span className="font-semibold text-slate-500 dark:text-slate-300">Coordinator:</span> {club.faculty_coordinator}
                  </p>
                )}
              </div>

              <div className="p-4 bg-[#F8F7FC] dark:bg-[#211E30] border-t border-[#E9E5F2] dark:border-[#29243B] flex items-center justify-between">
                <Link
                  to={`/clubs/${club.id}`}
                  className="text-xs font-bold text-[#5141B8] dark:text-[#A78BFA] hover:underline"
                >
                  View Details
                </Link>

                {user?.role === 'student' && (
                  club.membership_status === 'approved' ? (
                    <span className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
                      <Check className="w-3.5 h-3.5 mr-1" /> Joined
                    </span>
                  ) : club.membership_status === 'pending' ? (
                    <span className="flex items-center text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800/40">
                      <Clock className="w-3.5 h-3.5 mr-1" /> Pending
                    </span>
                  ) : (
                    <button
                      onClick={() => handleJoin(club.id)}
                      disabled={joiningId === club.id}
                      className="px-3.5 py-1.5 bg-[#5141B8] hover:bg-[#34246F] dark:bg-[#6D5BD0] dark:hover:bg-[#8B7CF6] text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {joiningId === club.id ? 'Requesting...' : 'Join Club'}
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#191726] p-12 text-center rounded-2xl border border-[#E9E5F2] dark:border-[#383248]">
          <p className="text-[#77738B] dark:text-[#B3ADC7] text-sm">No clubs found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
};
