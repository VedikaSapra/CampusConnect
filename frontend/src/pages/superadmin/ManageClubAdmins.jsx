
import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import {
  Shield,
  Search,
  UserCheck,
  RefreshCw,
  X,
  Save,
  AlertCircle
} from 'lucide-react';
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
  const [error, setError] = useState('');

  const { showNotification } = useNotification();

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const [clubsRes, adminsRes] = await Promise.all([
        api.get('/clubs/'),
        api.get('/users/club-admins/')
      ]);

      setClubs(clubsRes.data?.results ?? clubsRes.data ?? []);
      setClubAdmins(adminsRes.data?.results ?? adminsRes.data ?? []);
    } catch (err) {
      console.error('Failed to load club administrators:', err);
      showNotification('Failed to load club admin data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open modal
  const openAssignModal = (club) => {
    setAssigningClubId(club.id);
    setSelectedAdminId(
      club.admin_user?.toString() ?? ''
    );
    setError('');
  };

  // Close modal
  const closeAssignModal = () => {
    if (saving) return;

    setAssigningClubId(null);
    setSelectedAdminId('');
    setError('');
  };

  // Assign officer
  const handleAssign = async () => {
    if (!selectedAdminId || saving || assigningClubId === null) {
      return;
    }

    const currentClub = clubs.find(
      club => club.id === assigningClubId
    );

    // Prevent selecting an administrator assigned elsewhere
    const alreadyAssignedClub = clubs.find(
      club =>
        Number(club.admin_user) === Number(selectedAdminId) &&
        club.id !== assigningClubId
    );

    if (alreadyAssignedClub) {
      setError(
        `This administrator is already assigned to ${alreadyAssignedClub.name}. Please select another administrator.`
      );
      return;
    }

    // Prevent unnecessary API request
    if (
      currentClub?.admin_user != null &&
      Number(currentClub.admin_user) === Number(selectedAdminId)
    ) {
      closeAssignModal();
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api.patch(`/clubs/${assigningClubId}/`, {
        admin_user: Number(selectedAdminId)
      });

      showNotification(
        'Club administrator updated successfully!',
        'success'
      );

      // Close modal after successful assignment
      setAssigningClubId(null);
      setSelectedAdminId('');
      setError('');

      await fetchData();
    } catch (err) {
      console.error('Assign Officer Error:', err);
      console.error('Status:', err.response?.status);
      console.error('Response:', err.response?.data);

      const data = err.response?.data;

      const message =
        data?.admin_user?.[0] ||
        data?.error ||
        data?.detail ||
        (data ? JSON.stringify(data) : null) ||
        'Failed to assign administrator.';

      setError(message);
      showNotification(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Filter clubs
  const filteredClubs = clubs.filter((club) => {
    const q = search.toLowerCase();
    const admin = club.admin_user_detail;

    return (
      !q ||
      club.name?.toLowerCase().includes(q) ||
      club.category?.toLowerCase().includes(q) ||
      (
        admin &&
        (
          `${admin.first_name} ${admin.last_name}`
            .toLowerCase()
            .includes(q) ||
          admin.email?.toLowerCase().includes(q)
        )
      )
    );
  });

  const selectedClub = clubs.find(
    club => club.id === assigningClubId
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#211B35] dark:text-white">
            Club Administrators
          </h1>

          <p className="text-sm text-[#77738B] dark:text-[#B3ADC7] mt-1">
            Assign and reassign registered club officers to student organizations.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#191726] border border-[#E9E5F2] dark:border-[#383248] text-[#5141B8] dark:text-purple-300 rounded-xl text-xs font-bold transition-all shadow-sm self-start sm:self-auto hover:bg-[#F8F7FC] dark:hover:bg-[#251E3E] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

        <input
          type="text"
          placeholder="Search clubs, categories, or assigned officers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-[#E9E5F2] dark:border-[#383248] rounded-xl text-sm focus:ring-2 focus:ring-[#8B5CF6] outline-none bg-white dark:bg-[#191726] text-[#211B35] dark:text-white shadow-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#191726] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-sm overflow-hidden">

        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#5141B8]" />
            <p className="text-sm">
              Loading societies and assigned administrators...
            </p>
          </div>
        ) : filteredClubs.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Shield className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-[#383248]" />

            <p className="font-bold text-slate-500 dark:text-[#B3ADC7]">
              No clubs or administrators match your query
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">

              <thead className="bg-[#F8F7FC] dark:bg-[#12111A] border-b border-[#E9E5F2] dark:border-[#383248]">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider">
                    Club
                  </th>

                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider">
                    Category
                  </th>

                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider">
                    Assigned Administrator
                  </th>

                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider">
                    Faculty Coordinator
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider">
                    Actions
                  </th>
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

                        {/* Club */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#F3EEFF] dark:bg-purple-950/60 text-[#5141B8] dark:text-purple-300 font-bold flex items-center justify-center text-xs flex-shrink-0 border border-[#E8DEFF] dark:border-purple-800/40">
                              {club.name?.[0] ?? 'C'}
                            </div>

                            <span className="font-bold text-[#211B35] dark:text-white">
                              {club.name}
                            </span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-5 py-3.5">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F3EEFF] dark:bg-purple-950/60 text-[#5141B8] dark:text-purple-300 capitalize border border-[#E8DEFF] dark:border-purple-800/40">
                            {club.category}
                          </span>
                        </td>

                        {/* Assigned Administrator */}
                        <td className="px-5 py-3.5">
                          {admin ? (
                            <div>
                              <p className="font-bold text-[#211B35] dark:text-white">
                                {admin.first_name} {admin.last_name}
                              </p>

                              <p className="text-xs text-[#77738B] dark:text-[#B3ADC7]">
                                {admin.email}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800/40">
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* Faculty Coordinator */}
                        <td className="px-5 py-3.5 text-xs text-[#77738B] dark:text-[#B3ADC7]">
                          {club.faculty_coordinator || '—'}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => openAssignModal(club)}
                            className="whitespace-nowrap px-3.5 py-1.5 bg-[#F3EEFF] dark:bg-purple-950/60 hover:bg-[#E8DEFF] dark:hover:bg-purple-900/60 text-[#5141B8] dark:text-purple-300 rounded-xl text-xs font-bold transition-all border border-[#E8DEFF] dark:border-purple-800/40"
                          >
                            {admin ? 'Change Officer' : 'Assign Officer'}
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

      {/* Change / Assign Officer Modal */}
      <AnimatePresence>
        {assigningClubId !== null && (
          <motion.div
            key="officer-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={closeAssignModal}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="officer-modal-title"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#191726] shadow-2xl overflow-hidden"
            >

              {/* Gradient Accent */}
              <div className="h-1 bg-gradient-to-r from-[#5141B8] via-[#8B5CF6] to-[#06B6D4]" />

              <div className="p-6 space-y-5">

                {/* Modal Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#F3EEFF] dark:bg-purple-950/60 flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-[#5141B8] dark:text-purple-300" />
                    </div>

                    <div>
                      <h2
                        id="officer-modal-title"
                        className="text-xl font-bold text-[#211B35] dark:text-white"
                      >
                        {selectedClub?.admin_user
                          ? 'Change Club Officer'
                          : 'Assign Club Officer'}
                      </h2>

                      <p className="text-sm text-[#77738B] dark:text-[#B3ADC7] mt-1">
                        {selectedClub?.name}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={closeAssignModal}
                    disabled={saving}
                    aria-label="Close dialog"
                    className="p-2 rounded-lg text-[#77738B] dark:text-[#B3ADC7] hover:bg-[#F3EEFF] dark:hover:bg-[#251E3E] transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Information */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F3EEFF] dark:bg-[#251E3E] border border-[#E8DEFF] dark:border-[#383248]">
                  <AlertCircle className="w-4 h-4 mt-0.5 text-[#5141B8] dark:text-purple-300 flex-shrink-0" />

                  <p className="text-xs leading-relaxed text-[#5141B8] dark:text-purple-200">
                    Each administrator can manage only one club.
                    Administrators already assigned to another club cannot be selected.
                  </p>
                </div>

                {/* Select Administrator */}
                <div className="space-y-2">
                  <label
                    htmlFor="club-officer-select"
                    className="text-xs font-bold uppercase tracking-wider text-[#77738B] dark:text-[#B3ADC7]"
                  >
                    Select Administrator
                  </label>

                  <select
                    id="club-officer-select"
                    value={selectedAdminId}
                    onChange={(e) => {
                      setSelectedAdminId(e.target.value);
                      setError('');
                    }}
                    disabled={saving}
                    className="w-full min-w-0 px-4 py-3 border border-[#E9E5F2] dark:border-[#383248] rounded-xl outline-none focus:ring-2 focus:ring-[#8B5CF6]/40 bg-[#F8F7FC] dark:bg-[#211E30] text-[#211B35] dark:text-white text-sm disabled:opacity-60"
                  >
                    <option value="">
                      Select an administrator
                    </option>

                    {clubAdmins.map((ca) => {
                      const assignedClub = clubs.find(
                        (club) =>
                          Number(club.admin_user) === Number(ca.id) &&
                          club.id !== assigningClubId
                      );

                      return (
                        <option
                          key={ca.id}
                          value={ca.id}
                          disabled={Boolean(assignedClub)}
                        >
                          {ca.first_name} {ca.last_name}
                          {assignedClub
                            ? ` — Already assigned to ${assignedClub.name}`
                            : ` (${ca.email})`}
                        </option>
                      );
                    })}
                  </select>

                  <p className="text-xs text-[#77738B] dark:text-[#B3ADC7]">
                    Administrators already managing another club are unavailable.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 text-red-500 flex-shrink-0" />
                    <p className="text-xs font-medium text-red-700 dark:text-red-300">
                      {error}
                    </p>
                  </div>
                )}

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 pt-3 border-t border-[#E9E5F2] dark:border-[#383248]">
                  <button
                    type="button"
                    onClick={closeAssignModal}
                    disabled={saving}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-[#E9E5F2] dark:border-[#383248] text-[#77738B] dark:text-[#B3ADC7] hover:bg-[#F8F7FC] dark:hover:bg-[#251E3E] disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleAssign}
                    disabled={saving || !selectedAdminId}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5141B8] hover:bg-[#40339C] text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
