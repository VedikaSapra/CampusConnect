import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { Users, Search, UserX, Shield, Mail, BookOpen, RefreshCw, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';

export const ClubMembers = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [removing, setRemoving] = useState(null);
  const { showNotification } = useNotification();

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/clubs/my-club/members/?status=approved');
      setMembers(res.data?.results ?? res.data);
    } catch {
      showNotification('Failed to load members.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleRemove = async (membershipId, name) => {
    if (!window.confirm(`Remove ${name} from the club?`)) return;
    setRemoving(membershipId);
    try {
      await api.delete(`/clubs/memberships/${membershipId}/remove/`);
      showNotification(`${name} removed from club.`, 'success');
      setMembers(prev => prev.filter(m => m.id !== membershipId));
    } catch {
      showNotification('Failed to remove member.', 'error');
    } finally {
      setRemoving(null);
    }
  };

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    const s = m.student_detail;
    return !q ||
      (s?.first_name + ' ' + s?.last_name).toLowerCase().includes(q) ||
      s?.email?.toLowerCase().includes(q) ||
      s?.department?.toLowerCase().includes(q);
  });

  const getInitials = (s) =>
    s ? `${s.first_name?.[0] ?? ''}${s.last_name?.[0] ?? ''}`.toUpperCase() : '?';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#211B35] dark:text-white">Club Members</h1>
          <p className="text-sm text-[#77738B] dark:text-slate-400 mt-1">
            {loading ? 'Loading…' : `${members.length} approved member${members.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={fetchMembers}
          className="flex items-center gap-2 px-4 py-2 bg-[#F3EEFF] dark:bg-purple-950/40 hover:bg-[#E8DEFF] dark:hover:bg-purple-900/40 text-[#5141B8] dark:text-purple-300 rounded-xl text-sm font-semibold transition-all border border-[#E8DEFF] dark:border-purple-800/40"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, email, department or student ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-[#E9E5F2] dark:border-[#383248] rounded-xl text-sm focus:ring-2 focus:ring-[#5141B8] focus:border-transparent outline-none bg-white dark:bg-[#191726] text-[#211B35] dark:text-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#191726] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#5141B8]" />
            <p className="text-sm">Loading members…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-slate-500 dark:text-slate-400">{search ? 'No matching members' : 'No approved members yet'}</p>
            <p className="text-xs mt-1">Approve membership requests from the Requests tab</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F7FC] dark:bg-[#12111A] border-b border-[#E9E5F2] dark:border-[#383248]">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider">Member</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider hidden sm:table-cell">Email & ID</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider hidden md:table-cell">Department</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider hidden md:table-cell">Year</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider hidden lg:table-cell">Joined</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EEFF] dark:divide-[#29243B]">
                <AnimatePresence>
                  {filtered.map((m, i) => {
                    const s = m.student_detail;
                    return (
                      <motion.tr
                        key={m.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-[#F8F7FC] dark:hover:bg-[#211E30] transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#5141B8] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {getInitials(s)}
                            </div>
                            <div>
                              <p className="font-semibold text-[#211B35] dark:text-white">{s?.first_name} {s?.last_name}</p>
                              <p className="text-xs text-[#77738B] dark:text-slate-400">@{s?.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden sm:table-cell">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-[#77738B] dark:text-slate-300">
                              <Mail className="w-3.5 h-3.5" />
                              <span>{s?.email}</span>
                            </div>
                            {s?.student_id && (
                              <p className="text-[11px] font-mono text-purple-600 dark:text-purple-300">ID: {s.student_id}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <div className="flex items-center gap-1.5 text-[#77738B] dark:text-slate-300">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span className={s?.department ? 'text-[#211B35] dark:text-white font-medium' : 'text-slate-400 italic'}>
                              {s?.department || 'Not Provided'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell text-[#77738B] dark:text-slate-300">
                          <span className={s?.year_of_study ? 'text-[#211B35] dark:text-white font-medium' : 'text-slate-400 italic'}>
                            {s?.year_of_study ? `Year ${s.year_of_study}` : 'Not Provided'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell text-[#77738B] dark:text-slate-400 text-xs">
                          {m.requested_at || m.updated_at ? new Date(m.updated_at || m.requested_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleRemove(m.id, `${s?.first_name} ${s?.last_name}`)}
                            disabled={removing === m.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all disabled:opacity-50 ml-auto"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            {removing === m.id ? 'Removing…' : 'Remove'}
                          </button>
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
