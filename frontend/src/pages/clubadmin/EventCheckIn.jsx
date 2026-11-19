import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  CheckCircle2, AlertTriangle, XCircle,
  Users, QrCode, Search, RefreshCw, Clock, ShieldCheck, KeyRound, Check
} from 'lucide-react';
import { Badge, Button } from '../../components/common/UIComponents';

export const EventCheckIn = () => {
  const { user } = useAuth();
  const { toast } = useNotification();

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [stats, setStats] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [manualToken, setManualToken] = useState('');

  // Verification states
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [checkingInToken, setCheckingInToken] = useState(null);
  const [rosterSearch, setRosterSearch] = useState('');

  // 1. Fetch upcoming events organized by this club
  const fetchClubEvents = async () => {
    try {
      const res = await api.get('/events/my-club-events/');
      const data = res.data.results || res.data;
      if (Array.isArray(data) && data.length > 0) {
        setEvents(data);
        setSelectedEventId(data[0].id.toString());
      }
    } catch (err) {
      // Fallback: fetch all events filtered by club
      try {
        const res2 = await api.get('/events/');
        const data2 = res2.data.results || res2.data;
        if (Array.isArray(data2) && data2.length > 0) {
          setEvents(data2);
          setSelectedEventId(data2[0].id.toString());
        }
      } catch (err2) {
        console.error('Failed to load events', err2);
      }
    }
  };

  useEffect(() => {
    fetchClubEvents();
  }, []);

  // 2. Fetch live attendance roster for selected event
  const fetchAttendanceStats = async (eventId) => {
    if (!eventId) return;
    try {
      const res = await api.get(`/events/${eventId}/attendance/`);
      setStats(res.data.stats);
      setAttendees(res.data.attendees || []);
    } catch (err) {
      console.error('Failed to load attendance metrics', err);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      fetchAttendanceStats(selectedEventId);
      setVerificationResult(null);
    }
  }, [selectedEventId]);

  // 3. Token verification logic
  const handleTokenVerification = async (rawToken) => {
    if (!rawToken || !rawToken.trim()) {
      toast.error('Please enter a verification token or pass ID.');
      return;
    }
    setVerifying(true);
    let token = rawToken.trim();

    // If payload is JSON (from QR code export or raw ticket string), extract token
    try {
      const parsed = JSON.parse(token);
      if (parsed.token) token = parsed.token;
      else if (parsed.reg_id) {
        const match = attendees.find(a => a.pass_id === parsed.reg_id);
        if (match) token = match.token;
      }
    } catch (e) { }

    try {
      const res = await api.post('/events/passes/verify/', {
        token: token.trim(),
        event_id: selectedEventId
      });
      setVerificationResult(res.data);
    } catch (err) {
      setVerificationResult({
        valid: false,
        status: 'error',
        message: err.response?.data?.message || err.response?.data?.error || 'Pass token validation failed.'
      });
    } finally {
      setVerifying(false);
    }
  };

  // 4. Confirm Check-In
  const handleConfirmCheckIn = async (token) => {
    setCheckingInToken(token);
    try {
      await api.post('/events/passes/check-in/', { token });
      toast.success('Attendee verified and checked in successfully!');
      setVerificationResult(null);
      setManualToken('');
      fetchAttendanceStats(selectedEventId);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to complete check-in.');
    } finally {
      setCheckingInToken(null);
    }
  };

  const filteredAttendees = attendees.filter(a => {
    if (!rosterSearch) return true;
    const q = rosterSearch.toLowerCase();
    return (
      a.student_name?.toLowerCase().includes(q) ||
      a.pass_id?.toLowerCase().includes(q) ||
      a.department?.toLowerCase().includes(q) ||
      a.token?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold mb-1">
            <KeyRound className="w-3.5 h-3.5" />
            <span>DIGITAL PASS TOKEN VERIFICATION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#211B35] dark:text-white mt-1">
            Event Check-in & Pass Verification
          </h1>
          <p className="text-xs sm:text-sm text-[#77738B] dark:text-slate-400 mt-1 max-w-2xl">
            Verify student pass tokens, validate registration credentials, and monitor attendee arrival status in real time.
          </p>
        </div>

        {/* Event Selector */}
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-[#191726] text-[#211B35] dark:text-white border border-[#E9E5F2] dark:border-[#383248] focus:ring-2 focus:ring-[#8B5CF6] outline-none shadow-xs cursor-pointer"
        >
          {events.map((ev) => (
            <option key={ev.id} value={ev.id} className="text-slate-900 bg-white dark:text-slate-100 dark:bg-slate-800 py-1.5">
              {ev.title} ({ev.registered_count} Reg)
            </option>
          ))}
        </select>
      </div>

      {/* Attendance Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white dark:bg-[#191726] p-4 rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Registered</p>
            <p className="text-2xl font-black text-[#211B35] dark:text-white mt-1">{stats.total_registered}</p>
          </div>
          <div className="bg-white dark:bg-[#191726] p-4 rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Approved Passes</p>
            <p className="text-2xl font-black text-[#5141B8] dark:text-purple-300 mt-1">{stats.total_approved}</p>
          </div>
          <div className="bg-white dark:bg-[#191726] p-4 rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Checked In</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.total_checked_in}</p>
          </div>
          <div className="bg-white dark:bg-[#191726] p-4 rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Not Yet Arrived</p>
            <p className="text-2xl font-black text-amber-500 mt-1">{Math.max(0, (stats.total_approved || 0) - (stats.total_checked_in || 0))}</p>
          </div>
          <div className="bg-white dark:bg-[#191726] p-4 rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs col-span-2 lg:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Attendance Rate</p>
            <p className="text-2xl font-black text-[#8B5CF6] mt-1">{stats.attendance_percentage}%</p>
          </div>
        </div>
      )}

      {/* Verification Desk & Live Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left: Dedicated Token Verification Console */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-[#191726] p-6 rounded-3xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs space-y-5">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F3EEFF] dark:bg-purple-950/60 text-[#5141B8] dark:text-purple-300 flex items-center justify-center font-bold">
                <KeyRound className="w-5 h-5 text-[#8B5CF6]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#211B35] dark:text-white">
                  Pass Token Verification
                </h3>
                <p className="text-xs text-[#77738B] dark:text-slate-400">
                  Enter student attendance token or digital pass code.
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleTokenVerification(manualToken);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#77738B] dark:text-[#B3ADC7] mb-1.5">
                  Attendee Token / Pass Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. pass_abc123 or paste full token..."
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm font-mono bg-[#F8F7FC] dark:bg-[#12111A] border border-[#E9E5F2] dark:border-[#383248] text-[#211B35] dark:text-white outline-none focus:ring-2 focus:ring-[#8B5CF6] shadow-xs"
                  />
                  {manualToken && (
                    <button
                      type="button"
                      onClick={() => setManualToken('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={verifying || !manualToken.trim()}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-[#5141B8] to-[#8B5CF6] hover:from-[#4333A6] hover:to-[#7C3AED] text-white shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {verifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Token...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Pass Token</span>
                  </>
                )}
              </button>
            </form>

            {/* Verification Result Dialog / Card */}
            {verificationResult && (
              <div
                className={`p-5 rounded-2xl border shadow-sm space-y-3 transition-all ${verificationResult.valid
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-100'
                  : verificationResult.status === 'already_used'
                    ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-100'
                    : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40 text-rose-900 dark:text-rose-100'
                  }`}
              >
                <div className="flex items-start space-x-2.5">
                  {verificationResult.valid ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  ) : verificationResult.status === 'already_used' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-bold">
                      {verificationResult.message}
                    </p>
                    <p className="text-xs opacity-75 mt-0.5">
                      Status: <span className="font-mono font-bold uppercase">{verificationResult.status}</span>
                    </p>
                  </div>
                </div>

                {verificationResult.pass_data && (
                  <div className="p-3 bg-white/70 dark:bg-[#191726]/80 rounded-xl border border-black/5 dark:border-white/5 text-xs space-y-1.5 font-sans">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Attendee:</span>
                      <span className="font-bold text-[#211B35] dark:text-white">{verificationResult.pass_data.student_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Department:</span>
                      <span className="text-[#211B35] dark:text-white">{verificationResult.pass_data.student_department || 'General'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Event:</span>
                      <span className="text-[#211B35] dark:text-white">{verificationResult.pass_data.event_title}</span>
                    </div>
                  </div>
                )}

                {verificationResult.valid && (
                  <button
                    onClick={() => handleConfirmCheckIn(verificationResult.pass_data.verification_token)}
                    disabled={checkingInToken === verificationResult.pass_data.verification_token}
                    className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {checkingInToken ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>Confirm Attendee Entry</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Attendee Roster with Quick Action */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-[#191726] rounded-3xl border border-[#E9E5F2] dark:border-[#383248] p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-[#211B35] dark:text-white">
                  Event Roster & Manual Check-In
                </h3>
                <p className="text-xs text-[#77738B] dark:text-slate-400">
                  {filteredAttendees.length} student(s) registered for this event.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search attendee..."
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-[#F8F7FC] dark:bg-[#12111A] border border-[#E9E5F2] dark:border-[#383248] text-[#211B35] dark:text-white outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                  />
                </div>
                <button
                  onClick={() => fetchAttendanceStats(selectedEventId)}
                  className="p-2 rounded-xl text-slate-400 hover:text-[#5141B8] hover:bg-[#F3EEFF] dark:hover:bg-[#251E3E] transition-colors border border-[#E9E5F2] dark:border-[#383248]"
                  title="Refresh Roster"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E9E5F2] dark:divide-[#29243B] text-left text-xs">
                <thead>
                  <tr className="text-slate-400 uppercase text-[10px] font-bold">
                    <th className="py-2.5">Student</th>
                    <th className="py-2.5">Pass ID</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E5F2] dark:divide-[#29243B]">
                  {filteredAttendees.length > 0 ? (
                    filteredAttendees.map((att) => (
                      <tr key={att.pass_id} className="hover:bg-[#F8F7FC] dark:hover:bg-[#211E30] transition-colors">
                        <td className="py-3 font-semibold text-[#211B35] dark:text-white">
                          <p>{att.student_name}</p>
                          <p className="text-[10px] text-slate-400 font-normal">{att.department || 'General'}</p>
                        </td>
                        <td className="py-3 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                          {att.pass_id}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${att.status === 'checked_in'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                              : att.status === 'approved'
                                ? 'bg-purple-50 dark:bg-purple-950/40 text-[#5141B8] dark:text-purple-300 border border-[#E8DEFF] dark:border-purple-800/40'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                          >
                            {att.status
                              ? String(att.status).replaceAll('_', ' ')
                              : att.is_checked_in === true
                                ? 'CHECKED IN'
                                : 'NOT ARRIVED'}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {att.status === 'checked_in' ? (
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                if (att.token) {
                                  handleConfirmCheckIn(att.token);
                                } else {
                                  setManualToken(att.pass_id);
                                  handleTokenVerification(att.pass_id);
                                }
                              }}
                              disabled={checkingInToken === att.token}
                              className="px-3 py-1.5 bg-[#5141B8] hover:bg-[#34246F] text-white rounded-lg text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                            >
                              Check In
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                        No attendees found matching current criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};       
