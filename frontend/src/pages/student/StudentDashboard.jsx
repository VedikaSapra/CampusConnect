import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Users, Calendar, Award, Megaphone, Clock, ChevronRight, Video, CheckCircle2, XCircle, ArrowUpRight, Sparkles } from 'lucide-react';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingRsvp, setSubmittingRsvp] = useState(null);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard/student/');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching student dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRSVP = async (meetingId, rsvpStatus) => {
    setSubmittingRsvp(meetingId);
    try {
      const res = await api.post(`/meetings/${meetingId}/rsvp/`, { rsvp_status: rsvpStatus });
      setData(prev => ({
        ...prev,
        upcoming_meetings: prev?.upcoming_meetings?.map(m =>
          m.id === meetingId
            ? { ...m, my_rsvp: rsvpStatus, my_attendance_token: res.data.attendance_token || m.my_attendance_token }
            : m
        )
      }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit RSVP.');
    } finally {
      setSubmittingRsvp(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-8 h-8 border-4 border-[#5141B8] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-[#5141B8] via-[#6351DE] to-[#8B5CF6] rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Welcome back, {user?.first_name}! 👋</h1>
          <p className="text-indigo-100 text-sm mt-1">Here is what is happening across your campus communities today.</p>
        </div>
        <Link
          to="/events"
          className="px-4 py-2.5 bg-white text-[#5141B8] font-bold rounded-xl hover:bg-purple-50 shadow-xs text-sm transition-colors whitespace-nowrap"
        >
          Explore Events
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-[#191726] p-5 rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-[#F3EEFF] dark:bg-purple-950/60 text-[#5141B8] dark:text-purple-300 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider">Joined Clubs</p>
            <p className="text-2xl font-black text-[#211B35] dark:text-white mt-0.5">{data?.stats?.joined_clubs || 0}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#191726] p-5 rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider">Pending Requests</p>
            <p className="text-2xl font-black text-[#211B35] dark:text-white mt-0.5">{data?.stats?.pending_memberships || 0}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#191726] p-5 rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider">Upcoming Events</p>
            <p className="text-2xl font-black text-[#211B35] dark:text-white mt-0.5">{data?.stats?.upcoming_events || 0}</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Registered events & Recommended */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#191726] p-6 rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-[#211B35] dark:text-white flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-[#8B5CF6]" />
                <span>My Upcoming Registered Events</span>
              </h2>
              <Link to="/student/my-registrations" className="text-xs font-bold text-[#5141B8] dark:text-[#A78BFA] hover:underline">
                View all
              </Link>
            </div>

            {data?.upcoming_registrations?.length > 0 ? (
              <div className="space-y-3">
                {data.upcoming_registrations.map((reg) => (
                  <div key={reg.id} className="p-4 rounded-xl border border-[#E9E5F2] dark:border-[#29243B] bg-[#F8F7FC] dark:bg-[#211E30] flex justify-between items-center hover:bg-[#F3EEFF] dark:hover:bg-[#251E3E] transition-colors">
                    <div>
                      <p className="font-bold text-[#211B35] dark:text-white">{reg.event_title}</p>
                      <p className="text-xs text-[#77738B] dark:text-[#B3ADC7] mt-1">
                        {new Date(reg.event_date).toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                      reg.status === 'approved' 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40' 
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
                    }`}>
                      {reg.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#77738B] dark:text-[#B3ADC7] py-6 text-center">No upcoming event registrations.</p>
            )}
          </div>

          {/* Upcoming Club Meetings */}
          <div className="bg-white dark:bg-[#191726] p-6 rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-[#211B35] dark:text-white flex items-center space-x-2">
                <Video className="w-5 h-5 text-[#8B5CF6]" />
                <span>Upcoming Club Meetings</span>
              </h2>
              <Link to="/student/meetings" className="text-xs font-bold text-[#5141B8] dark:text-[#A78BFA] hover:underline">
                View all
              </Link>
            </div>

            {data?.upcoming_meetings?.length > 0 ? (
              <div className="space-y-3">
                {data.upcoming_meetings.map((meeting) => {
                  const isGoing = meeting.my_rsvp === 'going';
                  const isDeclined = meeting.my_rsvp === 'not_going';

                  return (
                    <div key={meeting.id} className="p-4 rounded-xl border border-[#E9E5F2] dark:border-[#29243B] bg-[#F8F7FC] dark:bg-[#211E30] flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-[#F3EEFF] dark:hover:bg-[#251E3E] transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#F3EEFF] dark:bg-purple-950/60 text-[#5141B8] dark:text-purple-300">
                            {meeting.club_name}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-500">
                            {meeting.meeting_mode}
                          </span>
                        </div>
                        <p className="font-bold text-[#211B35] dark:text-white text-sm">{meeting.title}</p>
                        <p className="text-xs text-[#77738B] dark:text-[#B3ADC7]">
                          {new Date(`${meeting.date}T00:00:00`).toLocaleDateString('en-US', {
                            weekday: 'short', month: 'short', day: 'numeric'
                          })} • {meeting.start_time} - {meeting.end_time} {meeting.venue ? `• ${meeting.venue}` : ''}
                        </p>
                      </div>

                      {/* RSVP Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleRSVP(meeting.id, 'going')}
                          disabled={submittingRsvp === meeting.id}
                          className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isGoing
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800/40'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isGoing ? 'Going ✓' : 'Going'}
                        </button>
                        <button
                          onClick={() => handleRSVP(meeting.id, 'not_going')}
                          disabled={submittingRsvp === meeting.id}
                          className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
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
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[#77738B] dark:text-[#B3ADC7] py-4 text-center">No upcoming club meetings scheduled.</p>
            )}
          </div>

          {/* Recommended Events */}
          <div className="bg-white dark:bg-[#191726] p-6 rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-[#211B35] dark:text-white flex items-center space-x-2">
                <Award className="w-5 h-5 text-[#8B5CF6]" />
                <span>Recommended Events for You</span>
              </h2>
              <Link to="/events" className="text-xs font-bold text-[#5141B8] dark:text-[#A78BFA] hover:underline">
                Explore all
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data?.recommended_events?.slice(0, 4).map((evt) => (
                <div key={evt.id} className="p-4 rounded-xl border border-[#E9E5F2] dark:border-[#29243B] bg-[#F8F7FC] dark:bg-[#211E30] hover:border-[#8B5CF6] dark:hover:border-[#8B5CF6] transition-all flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#F3EEFF] dark:bg-purple-950/60 text-[#5141B8] dark:text-purple-300 border border-[#E8DEFF] dark:border-purple-800/40">
                      {evt.category}
                    </span>
                    <h3 className="font-bold text-[#211B35] dark:text-white text-sm mt-2 line-clamp-1">{evt.title}</h3>
                    <p className="text-xs text-[#77738B] dark:text-[#B3ADC7] mt-1">{evt.club_name} • {evt.venue}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#E9E5F2] dark:border-[#29243B] flex justify-between items-center">
                    <span className="text-xs text-[#77738B] dark:text-[#B3ADC7] font-medium">
                      {evt.available_seats} seats left
                    </span>
                    <Link
                      to={`/events/${evt.id}`}
                      className="text-xs font-bold text-[#5141B8] dark:text-[#A78BFA] hover:underline flex items-center"
                    >
                      Details <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Recent Announcements */}
        <div className="bg-white dark:bg-[#191726] p-6 rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-[#211B35] dark:text-white flex items-center space-x-2">
              <Megaphone className="w-5 h-5 text-[#8B5CF6]" />
              <span>Announcements</span>
            </h2>
            <Link to="/announcements" className="text-xs font-bold text-[#5141B8] dark:text-[#A78BFA] hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-4">
            {data?.recent_announcements?.length > 0 ? (
              data.recent_announcements.map((ann) => (
                <div key={ann.id} className="p-3.5 rounded-xl bg-[#F8F7FC] dark:bg-[#211E30] border border-[#E9E5F2] dark:border-[#29243B]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#F3EEFF] dark:bg-purple-950/60 text-[#5141B8] dark:text-purple-300">
                      {ann.club_name || 'College Wide'}
                    </span>
                    <span className="text-[11px] text-[#77738B] dark:text-[#B3ADC7]">
                      {new Date(ann.published_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-[#211B35] dark:text-white text-sm mt-2">{ann.title}</h4>
                  <p className="text-xs text-[#77738B] dark:text-[#B3ADC7] mt-1 line-clamp-2">{ann.content}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#77738B] dark:text-[#B3ADC7] py-6 text-center">No new announcements.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
