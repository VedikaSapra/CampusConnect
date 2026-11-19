import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import {
  Video, Calendar, Clock, MapPin, Users, CheckCircle,
  XCircle, RefreshCw, QrCode, CheckCircle2, ChevronDown,
  Building2, ArrowRight, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export const StudentMeetings = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedMeetingForPass, setSelectedMeetingForPass] = useState(null);
  const [submittingRsvp, setSubmittingRsvp] = useState(null);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/meetings/my-meetings/');
      setMeetings(res.data?.results ?? res.data ?? []);
    } catch {
      showNotification('Failed to load your club meetings.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleRSVP = async (meetingId, rsvpStatus) => {
    setSubmittingRsvp(meetingId);
    try {
      const res = await api.post(`/meetings/${meetingId}/rsvp/`, { rsvp_status: rsvpStatus });
      showNotification(res.data.message || `RSVP updated to ${rsvpStatus}!`, 'success');
      // Update local state
      setMeetings(prev => prev.map(m =>
        m.id === meetingId
          ? { ...m, my_rsvp: rsvpStatus, my_attendance_token: res.data.attendance_token || m.my_attendance_token }
          : m
      ));
    } catch (err) {
      showNotification(err.response?.data?.error || 'Failed to submit RSVP.', 'error');
    } finally {
      setSubmittingRsvp(null);
    }
  };

  const filteredMeetings = meetings.filter(m => {
    if (activeTab === 'all') return true;
    if (activeTab === 'upcoming') return m.status === 'upcoming' || m.status === 'ongoing';
    if (activeTab === 'past') return m.status === 'completed';
    if (activeTab === 'confirmed') return m.my_rsvp === 'going';
    return true;
  });

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold mb-2">
            <span>Official Society Assemblies</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#211B35] dark:text-white">
            My Club Meetings
          </h1>
          <p className="text-sm text-[#77738B] dark:text-slate-400 mt-1">
            Browse internal general bodies, team discussions, and planning sessions from clubs you've joined.
          </p>
        </div>
        <button
          onClick={fetchMeetings}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#191726] border border-[#E9E5F2] dark:border-[#383248] text-[#5141B8] dark:text-purple-300 rounded-xl text-xs font-bold transition-all shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-[#191726] rounded-xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs overflow-x-auto w-fit">
        {[
          { id: 'upcoming', label: 'Upcoming Assemblies' },
          { id: 'confirmed', label: 'My Confirmed (Going)' },
          { id: 'past', label: 'Past Meetings' },
          { id: 'all', label: 'All' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#5141B8] text-white shadow-xs'
                : 'text-[#77738B] dark:text-[#B3ADC7] hover:text-[#211B35] dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Meetings List */}
      {loading ? (
        <div className="py-24 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#5141B8]" />
          <p className="text-sm font-semibold">Loading your meetings…</p>
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="bg-white dark:bg-[#191726] rounded-3xl border border-[#E9E5F2] dark:border-[#383248] p-12 text-center text-slate-400">
          <Video className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#5141B8]" />
          <p className="font-bold text-slate-700 dark:text-slate-300">No {activeTab} meetings found</p>
          <p className="text-xs mt-1">When your approved clubs schedule meetings, they will appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredMeetings.map((m) => {
              const isGoing = m.my_rsvp === 'going';
              const isDeclined = m.my_rsvp === 'not_going';

              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white dark:bg-[#191726] rounded-3xl border border-[#E9E5F2] dark:border-[#383248] p-6 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row justify-between gap-6"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EEFF] dark:bg-purple-950/60 text-[#5141B8] dark:text-purple-300 text-xs font-bold border border-[#E8DEFF] dark:border-purple-800/40">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{m.club_name}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {m.meeting_type.replace('_', ' ')}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/30">
                        {m.meeting_mode.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <h2 className="text-lg sm:text-xl font-extrabold text-[#211B35] dark:text-white">
                        {m.title}
                      </h2>
                      {m.description && (
                        <p className="text-xs text-[#77738B] dark:text-slate-400 mt-1">
                          {m.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#77738B] dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#5141B8] dark:text-purple-400" />
                        <span>{new Date(`${m.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#5141B8] dark:text-purple-400" />
                        <span>{m.start_time} - {m.end_time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#5141B8] dark:text-purple-400" />
                        <span>{m.meeting_mode === 'online' ? 'Online Video Call' : m.venue}</span>
                      </div>
                    </div>

                    {m.agenda && (
                      <div className="p-3 bg-[#F8F7FC] dark:bg-[#12111A] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] text-xs">
                        <p className="font-bold text-[#34246F] dark:text-purple-300 uppercase text-[10px] tracking-wider mb-0.5">Agenda</p>
                        <p className="text-slate-600 dark:text-slate-300">{m.agenda}</p>
                      </div>
                    )}
                  </div>

                  {/* Right Action Column: RSVP & Pass */}
                  <div className="sm:w-64 flex flex-col justify-between pt-4 sm:pt-0 border-t sm:border-t-0 sm:border-l border-[#F3EEFF] dark:border-[#29243B] sm:pl-6 space-y-4">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Your Participation RSVP
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleRSVP(m.id, 'going')}
                          disabled={submittingRsvp === m.id || m.status !== 'upcoming'}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            isGoing
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800/40'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isGoing ? 'Going ✓' : 'Going'}
                        </button>
                        <button
                          onClick={() => handleRSVP(m.id, 'not_going')}
                          disabled={submittingRsvp === m.id || m.status !== 'upcoming'}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            isDeclined
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 border border-rose-200 dark:border-rose-800/40'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {isDeclined ? 'Declined' : 'Decline'}
                        </button>
                      </div>
                    </div>

                    {/* Links & Attendance Pass Button */}
                    <div className="space-y-2">
                      {m.meeting_mode !== 'in_person' && m.meeting_link && (
                        <a
                          href={m.meeting_link}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2.5 px-3 bg-[#5141B8] hover:bg-[#34246F] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Join Video Call
                        </a>
                      )}

                      <button
                        onClick={() => setSelectedMeetingForPass(m)}
                        className="w-full py-2.5 px-3 bg-white dark:bg-[#1E1833] border border-[#E9E5F2] dark:border-purple-900/40 hover:bg-[#F3EEFF] dark:hover:bg-[#251E3E] text-[#5141B8] dark:text-purple-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <QrCode className="w-3.5 h-3.5" /> View Meeting Pass
                      </button>

                      {m.my_attendance_status === 'present' && (
                        <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-[11px] font-bold text-center">
                          ✓ Attendance Verified Present
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ATTENDANCE PASS & TOKEN DIALOG */}
      <AnimatePresence>
        {selectedMeetingForPass && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#191726] rounded-3xl border border-[#E9E5F2] dark:border-[#383248] p-6 sm:p-8 max-w-sm w-full shadow-2xl relative text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5141B8] to-[#8B5CF6] text-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                <QrCode className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-black text-[#211B35] dark:text-white">
                Member Assembly Pass
              </h3>
              <p className="text-xs text-[#77738B] dark:text-slate-400 mt-1 mb-5">
                Present this verification code at entry or to the club executive.
              </p>

              <div className="bg-[#F8F7FC] dark:bg-[#12111A] p-4 rounded-2xl border border-[#E9E5F2] dark:border-[#383248] space-y-2 mb-5">
                <p className="text-[10px] uppercase font-bold text-slate-400">Attendee Token</p>
                <p className="text-sm font-mono font-bold text-[#5141B8] dark:text-purple-300 break-all select-all">
                  {selectedMeetingForPass.my_attendance_token || 'Token generated upon RSVP'}
                </p>
                <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                  {user?.first_name} {user?.last_name} • {selectedMeetingForPass.club_name}
                </p>
              </div>

              <button
                onClick={() => setSelectedMeetingForPass(null)}
                className="w-full py-2.5 rounded-xl bg-[#5141B8] text-white text-xs font-bold hover:bg-[#34246F] transition-all"
              >
                Close Pass
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
