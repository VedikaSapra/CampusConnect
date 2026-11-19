import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { UserCheck, UserX, Clock, Search, RefreshCw, Mail, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';

export const MembershipRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [search, setSearch] = useState('');
  const { showNotification } = useNotification();

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/clubs/my-club/members/?status=pending');
      setRequests(res.data?.results ?? res.data ?? []);
    } catch {
      showNotification('Failed to load membership requests.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAction = async (membershipId, action, name) => {
    setProcessing(`${membershipId}-${action}`);
    try {
      await api.patch(`/clubs/memberships/${membershipId}/`, { status: action });
      showNotification(
        action === 'approved' ? `${name} approved!` : `${name}'s request rejected.`,
        action === 'approved' ? 'success' : 'warning'
      );
      setRequests(prev => prev.filter(r => r.id !== membershipId));
    } catch (err) {
      const msg = err.response?.data?.error || `Failed to ${action} request.`;
      showNotification(msg, 'error');
    } finally {
      setProcessing(null);
    }
  };

  const filtered = requests.filter(r => {
    const q = search.toLowerCase();
    const s = r.student_detail;
    return !q ||
      (s?.first_name + ' ' + s?.last_name).toLowerCase().includes(q) ||
      s?.email?.toLowerCase().includes(q) ||
      s?.department?.toLowerCase().includes(q);
  });

  const getInitials = (s) =>
    s ? `${s.first_name?.[0] ?? ''}${s.last_name?.[0] ?? ''}`.toUpperCase() : '?';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#211B35] dark:text-white">Membership Requests</h1>
          <p className="text-sm text-[#77738B] dark:text-[#B3ADC7] mt-1">
            {loading ? 'Loading…' : `${requests.length} pending request${requests.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#191726] border border-[#E9E5F2] dark:border-[#383248] text-[#5141B8] dark:text-purple-300 rounded-xl text-xs font-bold transition-all shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search requests by student name, email, department…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-[#E9E5F2] dark:border-[#383248] rounded-xl text-sm focus:ring-2 focus:ring-[#8B5CF6] outline-none bg-white dark:bg-[#191726] text-[#211B35] dark:text-white shadow-xs"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="bg-white dark:bg-[#191726] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] py-20 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#5141B8]" />
            <p className="text-sm">Loading requests…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-[#191726] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] py-20 text-center">
            <Clock className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-[#383248]" />
            <p className="font-bold text-slate-500 dark:text-[#B3ADC7]">{search ? 'No matching requests' : 'No pending requests'}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">All caught up! New requests will appear here.</p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((r, i) => {
              const s = r.student_detail;
              const name = `${s?.first_name ?? ''} ${s?.last_name ?? ''}`.trim();
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-[#191726] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-xs hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#5141B8] flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">
                    {getInitials(s)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#211B35] dark:text-white text-base">{name || 'Unknown Student'}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      <span className="flex items-center gap-1 text-xs text-[#77738B] dark:text-[#B3ADC7]">
                        <Mail className="w-3.5 h-3.5 text-[#8B5CF6]" /> {s?.email}
                      </span>
                      {s?.department && (
                        <span className="flex items-center gap-1 text-xs text-[#77738B] dark:text-[#B3ADC7]">
                          <BookOpen className="w-3.5 h-3.5 text-[#8B5CF6]" /> {s.department}
                          {s?.year_of_study ? ` · Year ${s.year_of_study}` : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Requested {r.requested_at ? new Date(r.requested_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAction(r.id, 'approved', name)}
                      disabled={!!processing}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      {processing === `${r.id}-approved` ? 'Approving…' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleAction(r.id, 'rejected', name)}
                      disabled={!!processing}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      {processing === `${r.id}-rejected` ? 'Rejecting…' : 'Reject'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
