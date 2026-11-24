import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import {
  Users, Search, Filter, Shield, UserX, Mail, ChevronDown,
  RefreshCw, Trash2, CheckCircle2, XCircle, Clock, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';

const ROLE_CONFIG = {
  student: { label: 'Student', color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40' },
  club_admin: { label: 'Club Admin', color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40' },
  super_admin: { label: 'Super Admin', color: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/40' },
};

export const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [processing, setProcessing] = useState(null);
  const { showNotification } = useNotification();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('approval_status', statusFilter);
      if (search) params.set('search', search);

      const res = await api.get(`/users/?${params}`);
      setUsers(res.data?.results ?? res.data ?? []);
    } catch {
      showNotification('Failed to load users list.', 'error');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, search]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 250);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const handleRoleChange = async (userId, newRole, oldRole) => {
    if (newRole === oldRole) return;
    setProcessing(`role-${userId}`);
    try {
      await api.patch(`/users/${userId}/role/`, { role: newRole });
      showNotification(`Role changed to ${newRole.replace('_', ' ')}!`, 'success');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      showNotification(err.response?.data?.error || 'Failed to change role.', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleApproveClubAdmin = async (userId, action, name) => {
    setProcessing(`approve-${userId}`);
    try {
      const res = await api.post(`/users/${userId}/approve-club-admin/`, { decision: action });
      showNotification(res.data.message || `Officer ${action}d!`, 'success');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, approval_status: action === 'approve' ? 'approved' : 'rejected' } : u));
    } catch (err) {
      showNotification(err.response?.data?.error || 'Action failed.', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Delete user "${name}"? This action is irreversible.`)) return;
    setProcessing(`delete-${userId}`);
    try {
      await api.delete(`/users/${userId}/`);
      showNotification('User deleted.', 'success');
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      showNotification(err.response?.data?.error || 'Failed to delete user.', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const getInitials = (u) => {
    const f = u.first_name?.[0] ?? u.username?.[0] ?? '?';
    const l = u.last_name?.[0] ?? '';
    return `${f}${l}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#211B35] dark:text-white">Manage Users</h1>
          <p className="text-sm text-[#77738B] dark:text-[#B3ADC7] mt-1">
            Browse accounts, update roles, review club admin applications, and manage permissions.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#191726] border border-[#E9E5F2] dark:border-[#383248] text-[#5141B8] dark:text-purple-300 rounded-xl text-xs font-bold transition-all shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email or username…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-[#E9E5F2] dark:border-[#383248] rounded-xl text-sm focus:ring-2 focus:ring-[#8B5CF6] outline-none bg-white dark:bg-[#191726] text-[#211B35] dark:text-white shadow-xs"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 border border-[#E9E5F2] dark:border-[#383248] rounded-xl text-sm focus:ring-2 focus:ring-[#8B5CF6] outline-none bg-white dark:bg-[#191726] text-[#211B35] dark:text-white appearance-none cursor-pointer shadow-xs"
          >
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="club_admin">Club Admins</option>
            <option value="super_admin">Super Admins</option>
          </select>
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-[#E9E5F2] dark:border-[#383248] rounded-xl text-sm focus:ring-2 focus:ring-[#8B5CF6] outline-none bg-white dark:bg-[#191726] text-[#211B35] dark:text-white appearance-none cursor-pointer shadow-xs"
          >
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Application</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-[#191726] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs overflow-hidden transition-colors">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#5141B8]" />
            <p className="text-sm">Loading users…</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-[#383248]" />
            <p className="font-bold text-slate-500 dark:text-[#B3ADC7]">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F7FC] dark:bg-[#12111A] border-b border-[#E9E5F2] dark:border-[#383248]">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider hidden sm:table-cell">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider">Approval / Verification</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EEFF] dark:divide-[#29243B]">
                <AnimatePresence>
                  {users.map((u, i) => {
                    const roleCfg = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.student;
                    const isPending = u.role === 'club_admin' && u.approval_status === 'pending';
                    return (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="hover:bg-[#F8F7FC] dark:hover:bg-[#251E3E] transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#5141B8] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {getInitials(u)}
                            </div>
                            <div>
                              <p className="font-bold text-[#211B35] dark:text-white">
                                {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.username}
                              </p>
                              <p className="text-xs text-[#77738B] dark:text-[#B3ADC7]">@{u.username}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 hidden sm:table-cell text-[#77738B] dark:text-[#B3ADC7] text-xs">
                          {u.email}
                        </td>

                        <td className="px-5 py-3.5">
                          <select
                            value={u.role}
                            onChange={e => handleRoleChange(u.id, e.target.value, u.role)}
                            disabled={processing === `role-${u.id}`}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${roleCfg.color} bg-white dark:bg-[#12111A] disabled:opacity-50 outline-none`}
                          >
                            <option value="student" className="bg-white dark:bg-[#191726] text-[#211B35] dark:text-white">Student</option>
                            <option value="club_admin" className="bg-white dark:bg-[#191726] text-[#211B35] dark:text-white">Club Admin</option>
                            <option value="super_admin" className="bg-white dark:bg-[#191726] text-[#211B35] dark:text-white">Super Admin</option>
                          </select>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            {u.approval_status === 'pending' ? (
                              <span className="flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800/40">
                                <Clock className="w-3.5 h-3.5" /> Pending Review
                              </span>
                            ) : u.approval_status === 'rejected' ? (
                              <span className="flex items-center gap-1 text-xs font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-800/40">
                                <XCircle className="w-3.5 h-3.5" /> Rejected
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Active Verified
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleApproveClubAdmin(u.id, 'approve', u.first_name)}
                                  disabled={!!processing}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                                  title="Approve Club Administrator"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleApproveClubAdmin(u.id, 'reject', u.first_name)}
                                  disabled={!!processing}
                                  className="px-2.5 py-1 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                  title="Reject Application"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              disabled={processing === `delete-${u.id}`}
                              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                              title="Delete User Account"
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
    </div>
  );
};
