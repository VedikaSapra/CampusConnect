import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Users, Clock, CheckCircle, RefreshCw } from 'lucide-react';

export const MyClubs = () => {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyClubs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clubs/my-memberships/');
      setMemberships(res.data.results || res.data || []);
    } catch (err) {
      console.error('Error fetching memberships', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyClubs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#211B35] dark:text-white">My Club Memberships</h1>
          <p className="text-sm text-[#77738B] dark:text-[#B3ADC7] mt-1">Societies and campus chapters you have joined or requested to join.</p>
        </div>
        <button
          onClick={fetchMyClubs}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#191726] border border-[#E9E5F2] dark:border-[#383248] text-[#5141B8] dark:text-purple-300 rounded-xl text-xs font-bold transition-all shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#5141B8] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : memberships.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memberships.map((m) => (
            <div
              key={m.id}
              className="bg-white dark:bg-[#191726] p-6 rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs flex flex-col justify-between hover:border-[#8B5CF6] dark:hover:border-[#8B5CF6] transition-all"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded-md flex items-center border ${
                    m.status === 'approved' 
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40' 
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
                  }`}>
                    {m.status === 'approved' ? <CheckCircle className="w-3.5 h-3.5 mr-1" /> : <Clock className="w-3.5 h-3.5 mr-1" />}
                    <span className="capitalize">{m.status}</span>
                  </span>
                  <span className="text-[11px] text-[#77738B] dark:text-[#B3ADC7]">
                    Requested {new Date(m.requested_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-[#211B35] dark:text-white mt-2">{m.club_name}</h3>
              </div>

              <div className="mt-5 pt-4 border-t border-[#E9E5F2] dark:border-[#29243B] flex justify-end">
                <Link
                  to={`/clubs/${m.club}`}
                  className="text-xs font-bold text-[#5141B8] dark:text-[#A78BFA] hover:underline"
                >
                  View Club Page →
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#191726] p-12 text-center rounded-2xl border border-[#E9E5F2] dark:border-[#383248]">
          <Users className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-[#383248]" />
          <p className="text-[#77738B] dark:text-[#B3ADC7] text-sm">You have not requested to join any clubs yet.</p>
        </div>
      )}
    </div>
  );
};
