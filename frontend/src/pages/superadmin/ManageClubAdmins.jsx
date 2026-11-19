import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { Shield, Search, UserCheck, RefreshCw, CheckCircle2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';

export const ManageClubAdmins = () => {
  const [clubs, setClubs] = useState([]);
  const [clubAdmins, setClubAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [assigningClubId, setAssigningClubId] = useState(null);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [clubsRes, adminsRes] = await Promise.all([
        api.get('/clubs/'),
        api.get('/users/club-admins/'),
      ]);
      setClubs(clubsRes.data?.results ?? clubsRes.data ?? []);
      setClubAdmins(adminsRes.data?.results ?? adminsRes.data ?? []);
    } catch {
      showNotification('Failed to load club admin data.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAssign = async (clubId) => {
    if (!selectedAdminId) return;
    setSaving(true);
    try {
      await api.patch(`/clubs/${clubId}/`, { admin_user: selectedAdminId });
      showNotification('Club administrator updated!', 'success');
      setAssigningClubId(null);
      setSelectedAdminId('');
      fetchData();
    } catch (err) {
      showNotification(err.response?.data?.error || 'Failed to assign administrator.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredClubs = clubs.filter(c => {
    const q = search.toLowerCase();
    const admin = c.admin_user_detail;
    return !q ||
      c.name?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q) ||
      (admin && (
        `${admin.first_name} ${admin.last_name}`.toLowerCase().includes(q) ||
        admin.email?.toLowerCase().includes(q)
      ));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#211B35] dark:text-white">Club Administrators</h1>
          <p className="text-sm text-[#77738B] dark:text-[#B3ADC7] mt-1">
            Assign and reassign registered club officers to student organizations.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#191726] border border-[#E9E5F2] dark:border-[#383248] text-[#5141B8] dark:text-purple-300 rounded-xl text-xs font-bold transition-all shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search clubs, categories, or assigned officers…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-[#E9E5F2] dark:border-[#383248] rounded-xl text-sm focus:ring-2 focus:ring-[#8B5CF6] outline-none bg-white dark:bg-[#191726] text-[#211B35] dark:text-white shadow-xs"
        />
      </div>

      <div className="bg-white dark:bg-[#191726] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#5141B8]" />
            <p className="text-sm">Loading societies and assigned administrators…</p>
          </div>
        ) : filteredClubs.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Shield className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-[#383248]" />
            <p className="font-bold text-slate-500 dark:text-[#B3ADC7]">No clubs or administrators match your query</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F7FC] dark:bg-[#12111A] border-b border-[#E9E5F2] dark:border-[#383248]">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider">Club</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider">Assigned Administrator</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider">Faculty Coordinator</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EEFF] dark:divide-[#29243B]">
                <AnimatePresence>
                  {filteredClubs.map((club, i) => {
                    const admin = club.admin_user_detail;
                    return (
                      <motion.tr
                        key={club.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="hover:bg-[#F8F7FC] dark:hover:bg-[#251E3E] transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#F3EEFF] dark:bg-purple-950/60 text-[#5141B8] dark:text-purple-300 font-bold flex items-center justify-center text-xs flex-shrink-0 border border-[#E8DEFF] dark:border-purple-800/40">
                              {club.name?.[0] ?? 'C'}
                            </div>
                            <span className="font-bold text-[#211B35] dark:text-white">{club.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F3EEFF] dark:bg-purple-950/60 text-[#5141B8] dark:text-purple-300 capitalize border border-[#E8DEFF] dark:border-purple-800/40">
                            {club.category}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {admin ? (
                            <div>
                              <p className="font-bold text-[#211B35] dark:text-white">{admin.first_name} {admin.last_name}</p>
                              <p className="text-xs text-[#77738B] dark:text-[#B3ADC7]">{admin.email}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800/40">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-[#77738B] dark:text-[#B3ADC7]">
                          {club.faculty_coordinator || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {assigningClubId === club.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <select
                                value={selectedAdminId}
                                onChange={(e) => setSelectedAdminId(e.target.value)}
                                className="px-3 py-1.5 text-xs border border-[#E9E5F2] dark:border-[#383248] rounded-xl outline-none bg-white dark:bg-[#12111A] text-[#211B35] dark:text-white"
                              >
                                <option value="">Select an Admin</option>
                                {clubAdmins.map(ca => (
                                  <option key={ca.id} value={ca.id}>
                                    {ca.first_name} {ca.last_name} ({ca.email})
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleAssign(club.id)}
                                disabled={saving || !selectedAdminId}
                                className="px-3 py-1.5 bg-[#5141B8] hover:bg-[#34246F] text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer shadow-xs"
                              >
                                {saving ? 'Saving…' : 'Save'}
                              </button>
                              <button
                                onClick={() => { setAssigningClubId(null); setSelectedAdminId(''); }}
                                className="px-3 py-1.5 border border-slate-200 dark:border-[#383248] text-slate-500 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-[#251E3E] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setAssigningClubId(club.id);
                                setSelectedAdminId(club.admin_user?.toString() ?? '');
                              }}
                              className="px-3.5 py-1.5 bg-[#F3EEFF] dark:bg-purple-950/60 hover:bg-[#E8DEFF] text-[#5141B8] dark:text-purple-300 rounded-xl text-xs font-bold transition-all border border-[#E8DEFF] dark:border-purple-800/40 cursor-pointer"
                            >
                              {admin ? 'Change Officer' : 'Assign Officer'}
                            </button>
                          )}
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
