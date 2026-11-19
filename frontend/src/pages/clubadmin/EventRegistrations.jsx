import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { CheckSquare, Search, RefreshCw, Filter, UserCheck, UserX, Clock, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40' },
  approved:  { label: 'Approved',  color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40' },
  rejected:  { label: 'Rejected',  color: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/40' },
  cancelled: { label: 'Cancelled', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700' },
};

export const EventRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { showNotification } = useNotification();

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/events/my-club-registrations/?${params}`);
      setRegistrations(res.data?.results ?? res.data ?? []);
    } catch {
      showNotification('Failed to load registrations.', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchRegistrations(); }, [fetchRegistrations]);

  const handleAction = async (regId, action) => {
    setProcessing(`${regId}-${action}`);
    try {
      await api.patch(`/events/registrations/${regId}/`, { status: action });
      showNotification(
        action === 'approved' ? 'Registration approved!' : 'Registration rejected.',
        action === 'approved' ? 'success' : 'warning'
      );
      setRegistrations(prev =>
        prev.map(r => r.id === regId ? { ...r, status: action } : r)
      );
    } catch (err) {
      showNotification(err.response?.data?.error || 'Action failed.', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const filtered = registrations.filter(r => {
    const q = search.toLowerCase();
    const s = r.student_detail;
    return !q ||
      (s?.first_name + ' ' + s?.last_name).toLowerCase().includes(q) ||
      s?.email?.toLowerCase().includes(q) ||
      r.event_title?.toLowerCase().includes(q);
  });

  const getInitials = (s) =>
    s ? `${s.first_name?.[0] ?? ''}${s.last_name?.[0] ?? ''}`.toUpperCase() : '?';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#211B35] dark:text-white">Event Registrations</h1>
          <p className="text-sm text-[#77738B] dark:text-[#B3ADC7] mt-1">
            {loading ? 'Loading…' : `${registrations.length} total registration${registrations.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={fetchRegistrations}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#191726] border border-[#E9E5F2] dark:border-[#383248] text-[#5141B8] dark:text-purple-300 rounded-xl text-xs font-bold transition-all shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, email or event…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-[#E9E5F2] dark:border-[#383248] rounded-xl text-sm focus:ring-2 focus:ring-[#8B5CF6] outline-none bg-white dark:bg-[#191726] text-[#211B35] dark:text-white shadow-xs"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 border border-[#E9E5F2] dark:border-[#383248] rounded-xl text-sm focus:ring-2 focus:ring-[#8B5CF6] outline-none bg-white dark:bg-[#191726] text-[#211B35] dark:text-white shadow-xs appearance-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-[#191726] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#5141B8]" />
            <p className="text-sm">Loading registrations…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <CheckSquare className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-[#383248]" />
            <p className="font-bold text-slate-500 dark:text-[#B3ADC7]">No registrations found</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try adjusting the filters above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F7FC] dark:bg-[#12111A] border-b border-[#E9E5F2] dark:border-[#383248]">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider">Student</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider hidden sm:table-cell">Event</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider hidden md:table-cell">Event Date</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider hidden lg:table-cell">Registered</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EEFF] dark:divide-[#29243B]">
                <AnimatePresence>
                  {filtered.map((reg, i) => {
                    const s = reg.student_detail;
                    const cfg = STATUS_CONFIG[reg.status] ?? STATUS_CONFIG.pending;
                    return (
                      <motion.tr
                        key={reg.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-[#F8F7FC] dark:hover:bg-[#251E3E] transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#5141B8] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {getInitials(s)}
                            </div>
                            <div>
                              <p className="font-bold text-[#211B35] dark:text-white">{s?.first_name} {s?.last_name}</p>
                              <p className="text-xs text-[#77738B] dark:text-[#B3ADC7]">{s?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden sm:table-cell">
                          <p className="font-medium text-[#211B35] dark:text-white">{reg.event_title}</p>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell text-[#77738B] dark:text-[#B3ADC7] text-xs">
                          {reg.event_date ? new Date(reg.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell text-[#77738B] dark:text-[#B3ADC7] text-xs">
                          {reg.registered_at ? new Date(reg.registered_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          {reg.status === 'pending' && (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleAction(reg.id, 'approved')}
                                disabled={!!processing}
                                className="p-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                                title="Approve"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleAction(reg.id, 'rejected')}
                                disabled={!!processing}
                                className="p-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-950/60 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                                title="Reject"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          {reg.status === 'approved' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                          {reg.status === 'rejected' && <XCircle className="w-4 h-4 text-red-400" />}
                          {reg.status === 'cancelled' && <XCircle className="w-4 h-4 text-slate-400" />}
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
    </div>
  );
};
