import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import {
  Video, Calendar, Clock, MapPin, Users, CheckCircle,
  XCircle, Plus, Search, Filter, RefreshCw, X, Download,
  CheckCircle2, QrCode, AlertCircle, Share2, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

const EMPTY_FORM = {
  title: '',
  description: '',
  meeting_type: 'general',
  date: '',
  start_time: '',
  end_time: '',
  meeting_mode: 'in_person',
  venue: '',
  meeting_link: '',
  agenda: '',
  attendance_required: true,
  share_in_chat: true,
};

export const ClubMeetings = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Attendance Modal
  const [attendanceMeeting, setAttendanceMeeting] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [scanToken, setScanToken] = useState('');
  const [verifyingToken, setVerifyingToken] = useState(false);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/meetings/');
      setMeetings(res.data?.results ?? res.data ?? []);
    } catch {
      showNotification('Failed to load club meetings.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleOpenCreate = () => {
    setEditingMeeting(null);
    setFormData(EMPTY_FORM);
    setShowCreateModal(true);
  };

  const handleOpenEdit = (m) => {
    setEditingMeeting(m);
    setFormData({
      title: m.title,
      description: m.description,
      meeting_type: m.meeting_type,
      date: m.date,
      start_time: m.start_time,
      end_time: m.end_time,
      meeting_mode: m.meeting_mode,
      venue: m.venue,
      meeting_link: m.meeting_link || '',
      agenda: m.agenda || '',
      attendance_required: m.attendance_required,
      share_in_chat: false,
    });
    setShowCreateModal(true);
  };

  const handleSaveMeeting = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        venue: formData.venue || (formData.meeting_mode === 'online' ? 'Online' : 'TBD'),
      };
      if (editingMeeting) {
        await api.patch(`/meetings/${editingMeeting.id}/`, payload);
        showNotification('Meeting updated successfully!', 'success');
      } else {
        await api.post('/meetings/', payload);
        showNotification('Meeting scheduled & members notified!', 'success');
      }
      setShowCreateModal(false);
      fetchMeetings();
    } catch (err) {
      const data = err.response?.data;
      let errorMsg = 'Failed to save meeting.';
      if (typeof data === 'string') {
        errorMsg = data;
      } else if (data && typeof data === 'object') {
        if (data.error) errorMsg = data.error;
        else if (data.detail) errorMsg = data.detail;
        else {
          const firstKey = Object.keys(data)[0];
          const val = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey];
          errorMsg = `${firstKey}: ${val}`;
        }
      }
      showNotification(errorMsg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusAction = async (id, action) => {
    const confirmMsg = action === 'cancel'
      ? 'Cancel this meeting and notify all invited members?'
      : 'Mark this meeting as completed?';
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.post(`/meetings/${id}/${action}/`);
      showNotification(`Meeting ${action}ed!`, 'success');
      fetchMeetings();
    } catch {
      showNotification(`Failed to ${action} meeting.`, 'error');
    }
  };

  // Open Attendance Manager
  const openAttendance = async (meeting) => {
    setAttendanceMeeting(meeting);
    setLoadingAttendance(true);
    try {
      const res = await api.get(`/meetings/${meeting.id}/attendance/`);
      setAttendanceData(res.data);
    } catch {
      showNotification('Failed to load attendance list.', 'error');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleMarkAttendance = async (studentId, status) => {
    try {
      await api.post(`/meetings/${attendanceMeeting.id}/attendance/`, {
        student_id: studentId,
        status,
      });
      // Update local attendance state
      setAttendanceData(prev => {
        if (!prev) return prev;
        const updatedParticipants = prev.participants.map(p =>
          p.student === studentId ? { ...p, attendance_status: status } : p
        );
        const presentCount = updatedParticipants.filter(p => p.attendance_status === 'present').length;
        const total = updatedParticipants.length;
        return {
          ...prev,
          stats: {
            ...prev.stats,
            present: presentCount,
            attendance_rate: total > 0 ? Math.round((presentCount / total) * 100) : 0,
          },
          participants: updatedParticipants,
        };
      });
    } catch {
      showNotification('Failed to update attendance.', 'error');
    }
  };

  const handleVerifyQRToken = async (e) => {
    e.preventDefault();
    if (!scanToken.trim()) return;
    setVerifyingToken(true);
    try {
      const res = await api.post('/meetings/check-in/', { token: scanToken.trim() });
      if (res.data.already_checked_in) {
        showNotification(res.data.message, 'warning');
      } else {
        showNotification(res.data.message, 'success');
      }
      setScanToken('');
      // Refresh attendance
      if (attendanceMeeting) {
        openAttendance(attendanceMeeting);
      }
    } catch (err) {
      showNotification(err.response?.data?.error || 'Invalid attendance QR pass.', 'error');
    } finally {
      setVerifyingToken(false);
    }
  };

  const handleExportCSV = () => {
    if (!attendanceMeeting) return;
    window.open(`${api.defaults.baseURL}/meetings/${attendanceMeeting.id}/attendance/export/`, '_blank');
  };

  // Filter meetings
  const filteredMeetings = meetings.filter(m => {
    const q = search.toLowerCase();
    const matchQuery = !q || m.title.toLowerCase().includes(q) || (m.venue || '').toLowerCase().includes(q);
    const matchType = typeFilter === 'all' || m.meeting_type === typeFilter;

    if (!matchQuery || !matchType) return false;

    if (activeTab === 'all') return true;
    if (activeTab === 'upcoming') return m.status === 'upcoming' || m.status === 'ongoing';
    if (activeTab === 'completed') return m.status === 'completed';
    if (activeTab === 'cancelled') return m.status === 'cancelled';
    return true;
  });

  const stats = {
    total: meetings.length,
    upcoming: meetings.filter(m => m.status === 'upcoming').length,
    completed: meetings.filter(m => m.status === 'completed').length,
    cancelled: meetings.filter(m => m.status === 'cancelled').length,
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#211B35] dark:text-white">
            Club Meetings & General Assemblies
          </h1>
          <p className="text-sm text-[#77738B] dark:text-slate-400 mt-1">
            Organize official club assemblies, planning sessions, and track member RSVPs & check-in attendance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchMeetings}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#191726] border border-[#E9E5F2] dark:border-[#383248] text-[#5141B8] dark:text-purple-300 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#5141B8] hover:bg-[#34246F] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Schedule Meeting
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#191726] p-5 rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs">
          <p className="text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider">Total Meetings</p>
          <p className="text-2xl sm:text-3xl font-black text-[#211B35] dark:text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-[#191726] p-5 rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs">
          <p className="text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider">Upcoming</p>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.upcoming}</p>
        </div>
        <div className="bg-white dark:bg-[#191726] p-5 rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs">
          <p className="text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider">Completed</p>
          <p className="text-2xl sm:text-3xl font-black text-[#5141B8] dark:text-purple-300 mt-1">{stats.completed}</p>
        </div>
        <div className="bg-white dark:bg-[#191726] p-5 rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs">
          <p className="text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider">Cancelled</p>
          <p className="text-2xl sm:text-3xl font-black text-rose-500 mt-1">{stats.cancelled}</p>
        </div>
      </div>

      {/* Filters & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-[#191726] rounded-xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs overflow-x-auto">
          {['upcoming', 'completed', 'cancelled', 'all'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-[#5141B8] text-white shadow-xs'
                  : 'text-[#77738B] dark:text-[#B3ADC7] hover:text-[#211B35] dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search meetings…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#191726] text-xs outline-none focus:ring-2 focus:ring-[#5141B8] text-[#211B35] dark:text-white"
            />
          </div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#191726] text-xs font-bold text-[#211B35] dark:text-white outline-none"
          >
            <option value="all">All Types</option>
            <option value="general">General</option>
            <option value="planning">Planning</option>
            <option value="event_prep">Event Prep</option>
            <option value="committee">Committee</option>
            <option value="technical">Technical</option>
            <option value="volunteer">Volunteer</option>
          </select>
        </div>
      </div>

      {/* Meetings List */}
      {loading ? (
        <div className="py-24 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#5141B8]" />
          <p className="text-sm">Loading club meetings…</p>
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="bg-white dark:bg-[#191726] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] p-12 text-center text-slate-400">
          <Video className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#5141B8]" />
          <p className="font-bold text-slate-700 dark:text-slate-300">No {activeTab} meetings found</p>
          <p className="text-xs mt-1">Schedule a new meeting to coordinate with your members.</p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 bg-[#5141B8] text-white rounded-xl text-xs font-bold"
          >
            + Schedule Meeting
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredMeetings.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white dark:bg-[#191726] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                        {m.meeting_type.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        m.status === 'upcoming'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : m.status === 'completed'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-[#5141B8] dark:text-purple-300 uppercase">
                      {m.meeting_mode.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-[#211B35] dark:text-white leading-snug">
                    {m.title}
                  </h3>
                  {m.description && (
                    <p className="text-xs text-[#77738B] dark:text-slate-400 mt-1 line-clamp-2">
                      {m.description}
                    </p>
                  )}

                  <div className="mt-3 space-y-1.5 text-xs text-[#77738B] dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#5141B8] dark:text-purple-400" />
                      <span>{new Date(`${m.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span>•</span>
                      <Clock className="w-3.5 h-3.5 text-[#5141B8] dark:text-purple-400" />
                      <span>{m.start_time} - {m.end_time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#5141B8] dark:text-purple-400" />
                      <span className="truncate">
                        {m.meeting_mode === 'online' ? (
                          <a href={m.meeting_link} target="_blank" rel="noreferrer" className="text-[#5141B8] dark:text-purple-300 underline font-medium">
                            Join Online Call ↗
                          </a>
                        ) : m.venue}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RSVP & Attendance Stats */}
                <div className="pt-3 border-t border-[#F3EEFF] dark:border-[#29243B] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-medium">
                      RSVP: <strong className="text-emerald-600 dark:text-emerald-400">{m.total_going || 0} Going</strong> ({m.total_invited || 0} invited)
                    </span>
                    <span className="text-slate-500 font-medium">
                      Present: <strong className="text-[#5141B8] dark:text-purple-300">{m.total_attended || 0}</strong>
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => openAttendance(m)}
                    className="flex-1 py-2 px-3 bg-[#F3EEFF] dark:bg-[#251E3E] hover:bg-[#E8DEFF] text-[#5141B8] dark:text-purple-300 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Attendance Desk
                  </button>

                  {m.status === 'upcoming' && (
                    <>
                      <button
                        onClick={() => handleStatusAction(m.id, 'complete')}
                        className="py-2 px-3 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold transition-all"
                        title="Mark Completed"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleStatusAction(m.id, 'cancel')}
                        className="py-2 px-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition-all"
                        title="Cancel Meeting"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* CREATE / EDIT MEETING MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#191726] rounded-3xl border border-[#E9E5F2] dark:border-[#383248] p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative my-8"
            >
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-extrabold text-[#211B35] dark:text-white mb-1">
                {editingMeeting ? 'Edit Club Meeting' : 'Schedule Club Assembly'}
              </h2>
              <p className="text-xs text-[#77738B] dark:text-slate-400 mb-6">
                All approved members of your club will automatically receive notifications and calendar entries.
              </p>

              <form onSubmit={handleSaveMeeting} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                    Meeting Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Weekly Executive Planning & Sprint Review"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] text-sm text-[#211B35] dark:text-white outline-none focus:ring-2 focus:ring-[#5141B8]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                      Meeting Type *
                    </label>
                    <select
                      value={formData.meeting_type}
                      onChange={e => setFormData({ ...formData, meeting_type: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] text-sm text-[#211B35] dark:text-white outline-none"
                    >
                      <option value="general">General Meeting</option>
                      <option value="planning">Planning Meeting</option>
                      <option value="event_prep">Event Preparation</option>
                      <option value="committee">Committee Meeting</option>
                      <option value="technical">Technical Discussion</option>
                      <option value="volunteer">Volunteer Meeting</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                      Mode *
                    </label>
                    <select
                      value={formData.meeting_mode}
                      onChange={e => setFormData({ ...formData, meeting_mode: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] text-sm text-[#211B35] dark:text-white outline-none"
                    >
                      <option value="in_person">In Person</option>
                      <option value="online">Online (Video Call)</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                      Meeting Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] text-sm text-[#211B35] dark:text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.start_time}
                      onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] text-sm text-[#211B35] dark:text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                      End Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.end_time}
                      onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] text-sm text-[#211B35] dark:text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                      Venue / Room
                    </label>
                    <input
                      type="text"
                      value={formData.venue}
                      onChange={e => setFormData({ ...formData, venue: e.target.value })}
                      placeholder="e.g. Science Block Room 304"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] text-sm text-[#211B35] dark:text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                      Online Meeting Link
                    </label>
                    <input
                      type="url"
                      value={formData.meeting_link}
                      onChange={e => setFormData({ ...formData, meeting_link: e.target.value })}
                      placeholder="e.g. https://meet.google.com/xyz-abc"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] text-sm text-[#211B35] dark:text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                    Agenda & Objectives
                  </label>
                  <textarea
                    rows={3}
                    value={formData.agenda}
                    onChange={e => setFormData({ ...formData, agenda: e.target.value })}
                    placeholder="List the key discussion items, proposals, or questions for this assembly…"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] text-sm text-[#211B35] dark:text-white outline-none"
                  />
                </div>

                {!editingMeeting && (
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="share_in_chat"
                      checked={formData.share_in_chat}
                      onChange={e => setFormData({ ...formData, share_in_chat: e.target.checked })}
                      className="w-4 h-4 text-[#5141B8] rounded border-slate-300"
                    />
                    <label htmlFor="share_in_chat" className="text-xs font-semibold text-[#211B35] dark:text-slate-300 cursor-pointer">
                      Automatically post meeting announcement in Official Club Group Chat
                    </label>
                  </div>
                )}

                <div className="pt-4 flex justify-end gap-3 border-t border-[#F3EEFF] dark:border-[#29243B]">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-[#5141B8] hover:bg-[#34246F] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                  >
                    {saving ? 'Publishing…' : editingMeeting ? 'Update Meeting' : 'Schedule & Notify'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ATTENDANCE DESK MODAL */}
      <AnimatePresence>
        {attendanceMeeting && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#191726] rounded-3xl border border-[#E9E5F2] dark:border-[#383248] p-6 sm:p-8 max-w-4xl w-full shadow-2xl relative my-8 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-start justify-between pb-4 border-b border-[#F3EEFF] dark:border-[#29243B]">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 mb-1">
                    Meeting Attendance Desk
                  </div>
                  <h2 className="text-xl font-extrabold text-[#211B35] dark:text-white">
                    {attendanceMeeting.title}
                  </h2>
                  <p className="text-xs text-[#77738B] dark:text-slate-400">
                    {attendanceMeeting.date} • {attendanceMeeting.start_time} • {attendanceMeeting.venue}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[#211B35] dark:text-white text-xs font-bold"
                  >
                    <Download className="w-3.5 h-3.5" /> Export CSV
                  </button>
                  <button
                    onClick={() => { setAttendanceMeeting(null); setAttendanceData(null); }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Attendance Quick Stats & QR Check-in Form */}
              <div className="py-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="bg-[#F8F7FC] dark:bg-[#12111A] p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Invited</p>
                  <p className="text-xl font-black text-[#211B35] dark:text-white">{attendanceData?.stats?.total_invited || 0}</p>
                </div>
                <div className="bg-[#F8F7FC] dark:bg-[#12111A] p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Confirmed Going</p>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{attendanceData?.stats?.confirmed_going || 0}</p>
                </div>
                <div className="bg-[#F8F7FC] dark:bg-[#12111A] p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Present Attendees</p>
                  <p className="text-xl font-black text-[#5141B8] dark:text-purple-300">{attendanceData?.stats?.present || 0}</p>
                </div>
                <div className="bg-[#F8F7FC] dark:bg-[#12111A] p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Attendance Rate</p>
                  <p className="text-xl font-black text-teal-600 dark:text-teal-400">{attendanceData?.stats?.attendance_rate || 0}%</p>
                </div>
              </div>

              {/* Fast QR Token Scanner Input */}
              <form onSubmit={handleVerifyQRToken} className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <QrCode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-600" />
                  <input
                    type="text"
                    placeholder="Scan or enter student attendance token (e.g. mtg_xxxxxx)…"
                    value={scanToken}
                    onChange={e => setScanToken(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] text-[#211B35] dark:text-white outline-none focus:ring-2 focus:ring-[#5141B8]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={verifyingToken || !scanToken.trim()}
                  className="px-4 py-2 bg-[#5141B8] text-white rounded-xl text-xs font-bold disabled:opacity-50 shadow-xs"
                >
                  {verifyingToken ? 'Verifying…' : 'Record Check-In'}
                </button>
              </form>

              {/* Attendance Table */}
              <div className="flex-1 overflow-y-auto border border-[#E9E5F2] dark:border-[#383248] rounded-2xl">
                {loadingAttendance ? (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#5141B8]" />
                    Loading attendee records…
                  </div>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="bg-[#F8F7FC] dark:bg-[#12111A] sticky top-0 border-b border-[#E9E5F2] dark:border-[#383248]">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase">Member</th>
                        <th className="text-left px-4 py-2.5 font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase">Department & ID</th>
                        <th className="text-left px-4 py-2.5 font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase">RSVP</th>
                        <th className="text-left px-4 py-2.5 font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase">Attendance</th>
                        <th className="text-right px-4 py-2.5 font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase">Mark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3EEFF] dark:divide-[#29243B]">
                      {attendanceData?.participants?.map(p => {
                        const s = p.student_detail;
                        return (
                          <tr key={p.id} className="hover:bg-[#F8F7FC] dark:hover:bg-[#211E30] transition-colors">
                            <td className="px-4 py-2.5">
                              <p className="font-bold text-[#211B35] dark:text-white">{s?.first_name} {s?.last_name}</p>
                              <p className="text-[11px] text-[#77738B] dark:text-slate-400">@{s?.username}</p>
                            </td>
                            <td className="px-4 py-2.5 text-[#77738B] dark:text-slate-400">
                              <p>{s?.department || 'Not Provided'}</p>
                              {s?.student_id && <p className="font-mono text-[10px] text-purple-600 dark:text-purple-300">ID: {s.student_id}</p>}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.rsvp_status === 'going'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : p.rsvp_status === 'not_going'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                                {p.rsvp_status === 'going' ? 'Going' : p.rsvp_status === 'not_going' ? 'Declined' : 'No Reply'}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.attendance_status === 'present'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : p.attendance_status === 'absent'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                  : p.attendance_status === 'excused'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                              }`}>
                                {p.attendance_status.toUpperCase()}
                              </span>
                              {p.check_in_time && (
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {new Date(p.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleMarkAttendance(p.student, 'present')}
                                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${
                                    p.attendance_status === 'present'
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100'
                                  }`}
                                >
                                  Present
                                </button>
                                <button
                                  onClick={() => handleMarkAttendance(p.student, 'absent')}
                                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${
                                    p.attendance_status === 'absent'
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100'
                                  }`}
                                >
                                  Absent
                                </button>
                                <button
                                  onClick={() => handleMarkAttendance(p.student, 'excused')}
                                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${
                                    p.attendance_status === 'excused'
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 hover:bg-amber-100'
                                  }`}
                                >
                                  Excused
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
