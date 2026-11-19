import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import {
  BarChart3, TrendingUp, Users, Calendar, CheckCircle, Star,
  RefreshCw, PlusCircle, Megaphone, Video, ArrowRight, ArrowUpRight, UserCheck,
  CheckCircle2, XCircle, Clock
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ title, value, icon: Icon, color, sub, link }) => {
  const CardContent = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#191726] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] p-5 shadow-xs hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase tracking-wider">{title}</p>
          <p className="text-2xl sm:text-3xl font-black text-[#211B35] dark:text-white mt-1 group-hover:text-[#5141B8] dark:group-hover:text-purple-300 transition-colors">
            {value ?? '0'}
          </p>
          {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 ${color} rounded-2xl flex items-center justify-center shadow-xs flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </motion.div>
  );

  return link ? <Link to={link}>{CardContent}</Link> : CardContent;
};

export const ClubAdminDashboard = () => {
  const { user } = useAuth();
  const [dashData, setDashData] = useState(null);
  const [events, setEvents] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [decidingId, setDecidingId] = useState(null);
  const { showNotification } = useNotification();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, eventsRes, meetingsRes] = await Promise.all([
        api.get('/dashboard/club-admin/'),
        api.get('/events/my-club-events/'),
        api.get('/meetings/?upcoming=true'),
      ]);
      setDashData(dashRes.data);
      setEvents(eventsRes.data?.results ?? eventsRes.data ?? []);
      setMeetings(meetingsRes.data?.results ?? meetingsRes.data ?? []);
    } catch {
      showNotification('Failed to load club dashboard metrics.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMembershipDecision = async (membershipId, status) => {
    setDecidingId(membershipId);
    try {
      await api.patch(`/clubs/memberships/${membershipId}/`, { status });
      showNotification(`Membership request ${status}!`, 'success');
      fetchData();
    } catch (err) {
      showNotification(err.response?.data?.error || 'Failed to update request', 'error');
    } finally {
      setDecidingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mb-3 text-[#5141B8]" />
        <p className="text-sm font-semibold">Loading club overview & analytics…</p>
      </div>
    );
  }

  const stats = dashData?.stats ?? {};
  const upcomingEvents = dashData?.upcoming_events ?? [];
  const recentRequests = dashData?.recent_membership_requests ?? [];
  const recentAnnouncements = dashData?.recent_announcements ?? [];

  // Bar chart data from events
  const eventBarData = events.slice(0, 8).map(e => ({
    name: e.title.length > 14 ? e.title.slice(0, 14) + '…' : e.title,
    capacity: e.capacity,
    registered: e.registered_count ?? 0,
  }));

  // Pie chart calculation
  const totalReg = upcomingEvents.reduce((s, e) => s + (e.registered ?? 0), 0);
  const totalCap = upcomingEvents.reduce((s, e) => s + (e.capacity ?? 0), 0);
  const fillRate = totalCap > 0 ? Math.round((totalReg / totalCap) * 100) : 0;
  const pieData = [
    { name: 'Registered', value: totalReg },
    { name: 'Available', value: Math.max(0, totalCap - totalReg) },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold mb-2">
            <span>Official Organizer Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#211B35] dark:text-white">
            Club Executive Dashboard
          </h1>
          <p className="text-sm text-[#77738B] dark:text-slate-400 mt-1">
            Real-time analytics, event attendance, community meetings, and membership governance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#191726] border border-[#E9E5F2] dark:border-[#383248] hover:bg-[#F3EEFF] dark:hover:bg-[#29243B] text-[#5141B8] dark:text-purple-300 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <Link
            to="/club-admin/events/create"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#5141B8] hover:bg-[#34246F] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4" /> Create Event
          </Link>
        </div>
      </div>

      {/* Primary Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Approved Members"
          value={stats.total_members}
          icon={Users}
          color="bg-[#5141B8]"
          sub="Official registered members"
          link="/club-admin/members"
        />
        <StatCard
          title="Pending Requests"
          value={stats.pending_membership_requests}
          icon={UserCheck}
          color="bg-amber-500"
          sub={stats.pending_membership_requests > 0 ? 'Requires your approval' : 'All caught up'}
          link="/club-admin/requests"
        />
        <StatCard
          title="Upcoming Events"
          value={stats.upcoming_events}
          icon={Calendar}
          color="bg-emerald-500"
          sub={`${stats.total_events || 0} total events hosted`}
          link="/club-admin/events"
        />
        <StatCard
          title="Club Meetings"
          value={stats.total_meetings ?? meetings.length}
          icon={Video}
          color="bg-purple-600"
          sub={`${stats.upcoming_meetings || 0} scheduled upcoming`}
          link="/club-admin/meetings"
        />
      </div>

      {/* Secondary Performance Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Event Registrations"
          value={stats.total_registrations}
          icon={TrendingUp}
          color="bg-indigo-600"
          sub="Cumulative student signups"
          link="/club-admin/registrations"
        />
        <StatCard
          title="Event Attendance Rate"
          value={`${stats.event_attendance_rate || 0}%`}
          icon={CheckCircle}
          color="bg-teal-500"
          sub={`${stats.checked_in_attendees || 0} verified check-ins`}
          link="/club-admin/check-in"
        />
        <StatCard
          title="Meeting Attendees"
          value={stats.total_meeting_attendees || 0}
          icon={CheckCircle2}
          color="bg-pink-500"
          sub="Cumulative meeting check-ins"
          link="/club-admin/meetings"
        />
        <StatCard
          title="Avg. Student Rating"
          value={stats.average_rating ? `${stats.average_rating}★` : '5.0★'}
          icon={Star}
          color="bg-amber-400"
          sub="From attendee feedback"
        />
      </div>

      {/* Quick Access Action Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/club-admin/meetings"
          className="p-3.5 rounded-2xl bg-[#F3EEFF] dark:bg-[#1F1933] border border-[#E8DEFF] dark:border-purple-900/40 hover:scale-[1.02] transition-transform flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <Video className="w-4 h-4 text-[#5141B8] dark:text-purple-300" />
            <span className="text-xs font-bold text-[#34246F] dark:text-white">Schedule Meeting</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[#5141B8] dark:text-purple-300" />
        </Link>
        <Link
          to="/club-admin/announcements"
          className="p-3.5 rounded-2xl bg-[#F3EEFF] dark:bg-[#1F1933] border border-[#E8DEFF] dark:border-purple-900/40 hover:scale-[1.02] transition-transform flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <Megaphone className="w-4 h-4 text-[#5141B8] dark:text-purple-300" />
            <span className="text-xs font-bold text-[#34246F] dark:text-white">Post Notice</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[#5141B8] dark:text-purple-300" />
        </Link>
        <Link
          to="/club-admin/check-in"
          className="p-3.5 rounded-2xl bg-[#F3EEFF] dark:bg-[#1F1933] border border-[#E8DEFF] dark:border-purple-900/40 hover:scale-[1.02] transition-transform flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-[#5141B8] dark:text-purple-300" />
            <span className="text-xs font-bold text-[#34246F] dark:text-white">QR Scanner</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[#5141B8] dark:text-purple-300" />
        </Link>
        <Link
          to="/club-admin/chat"
          className="p-3.5 rounded-2xl bg-[#F3EEFF] dark:bg-[#1F1933] border border-[#E8DEFF] dark:border-purple-900/40 hover:scale-[1.02] transition-transform flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-[#5141B8] dark:text-purple-300" />
            <span className="text-xs font-bold text-[#34246F] dark:text-white">Community Chat</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[#5141B8] dark:text-purple-300" />
        </Link>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart: Event registrations */}
        <div className="lg:col-span-2 bg-white dark:bg-[#191726] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#211B35] dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#5141B8] dark:text-purple-400" />
              Event Capacity vs Registrations
            </h3>
            <span className="text-xs text-slate-400">Recent Club Events</span>
          </div>

          {eventBarData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-slate-400 text-sm">
              No events organized yet. Click "Create Event" to publish one.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={eventBarData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E9E5F2" className="dark:opacity-10" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#77738B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#77738B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#191726',
                    borderColor: '#383248',
                    borderRadius: '12px',
                    color: '#F5F3FF',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="capacity" fill="#C4B5FD" name="Seat Capacity" radius={[4, 4, 0, 0]} />
                <Bar dataKey="registered" fill="#5141B8" name="Student Signups" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart: Seat Fill Rate */}
        <div className="bg-white dark:bg-[#191726] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] p-5 shadow-xs flex flex-col justify-between">
          <h3 className="font-bold text-[#211B35] dark:text-white flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-[#5141B8] dark:text-purple-400" />
            Overall Seat Fill Rate
          </h3>
          <div className="flex-1 flex flex-col items-center justify-center py-2">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                >
                  <Cell fill="#5141B8" />
                  <Cell fill="#E8DEFF" className="dark:opacity-20" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-3xl font-black text-[#5141B8] dark:text-purple-300 mt-1">{fillRate}%</p>
            <p className="text-xs text-slate-400 mt-0.5">{totalReg} of {totalCap} seats reserved</p>
          </div>
          <Link
            to="/club-admin/registrations"
            className="text-center text-xs font-bold text-[#5141B8] dark:text-purple-300 hover:underline pt-2 border-t border-[#F3EEFF] dark:border-[#29243B]"
          >
            Review all attendee registrations →
          </Link>
        </div>
      </div>

      {/* Two Columns: Recent Membership Requests & Upcoming Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Membership Requests */}
        <div className="bg-white dark:bg-[#191726] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E9E5F2] dark:border-[#383248] flex items-center justify-between">
            <h3 className="font-bold text-[#211B35] dark:text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-500" />
              Recent Membership Applications
            </h3>
            <Link to="/club-admin/requests" className="text-xs font-bold text-[#5141B8] dark:text-purple-300 hover:underline">
              View All ({stats.pending_membership_requests || 0})
            </Link>
          </div>

          {recentRequests.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No pending membership applications.
            </div>
          ) : (
            <div className="divide-y divide-[#F3EEFF] dark:divide-[#29243B]">
              {recentRequests.map((req) => (
                <div key={req.id} className="p-4 flex items-center justify-between gap-3 hover:bg-[#F8F7FC] dark:hover:bg-[#211E30] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {req.student_detail?.first_name?.[0] || 'S'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#211B35] dark:text-white">
                        {req.student_detail?.first_name} {req.student_detail?.last_name}
                      </p>
                      <p className="text-xs text-[#77738B] dark:text-slate-400">
                        {req.student_detail?.department || req.student_detail?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleMembershipDecision(req.id, 'approved')}
                      disabled={decidingId === req.id}
                      className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                      title="Approve"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMembershipDecision(req.id, 'rejected')}
                      disabled={decidingId === req.id}
                      className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors"
                      title="Decline"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scheduled Club Meetings */}
        <div className="bg-white dark:bg-[#191726] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E9E5F2] dark:border-[#383248] flex items-center justify-between">
            <h3 className="font-bold text-[#211B35] dark:text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Scheduled Club Meetings
            </h3>
            <Link to="/club-admin/meetings" className="text-xs font-bold text-[#5141B8] dark:text-purple-300 hover:underline">
              Manage Meetings
            </Link>
          </div>

          {meetings.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <Video className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No upcoming meetings scheduled.</p>
              <Link to="/club-admin/meetings" className="text-xs text-[#5141B8] dark:text-purple-300 font-bold mt-1 inline-block">
                + Schedule a meeting now
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#F3EEFF] dark:divide-[#29243B]">
              {meetings.slice(0, 4).map((m) => (
                <div key={m.id} className="p-4 flex items-center justify-between gap-3 hover:bg-[#F8F7FC] dark:hover:bg-[#211E30] transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                        {m.meeting_type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {m.date} • {m.start_time}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-[#211B35] dark:text-white mt-1">{m.title}</p>
                    <p className="text-xs text-[#77738B] dark:text-slate-400">
                      {m.meeting_mode === 'online' ? 'Online' : m.venue} • {m.total_going || 0} attending
                    </p>
                  </div>
                  <Link
                    to="/club-admin/meetings"
                    className="px-3 py-1.5 text-xs font-bold text-[#5141B8] dark:text-purple-300 bg-[#F3EEFF] dark:bg-[#211E30] hover:bg-[#E8DEFF] rounded-lg transition-colors"
                  >
                    Attendance
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Events Table */}
      <div className="bg-white dark:bg-[#191726] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E9E5F2] dark:border-[#383248] flex items-center justify-between">
          <h3 className="font-bold text-[#211B35] dark:text-white">Upcoming Events Summary</h3>
          <Link to="/club-admin/events" className="text-xs font-bold text-[#5141B8] dark:text-purple-300 hover:underline">
            Manage All Events →
          </Link>
        </div>
        {upcomingEvents.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">No upcoming events scheduled</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F7FC] dark:bg-[#12111A]">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase">Event Title</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase">Registered</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase">Capacity</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase">Fill %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EEFF] dark:divide-[#29243B]">
                {upcomingEvents.map(e => {
                  const fill = e.capacity > 0 ? Math.round((e.registered / e.capacity) * 100) : 0;
                  return (
                    <tr key={e.id} className="hover:bg-[#F8F7FC] dark:hover:bg-[#211E30] transition-colors">
                      <td className="px-5 py-3 font-semibold text-[#211B35] dark:text-white">{e.title}</td>
                      <td className="px-5 py-3 text-[#77738B] dark:text-slate-400 text-xs">
                        {e.event_date ? new Date(e.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                      </td>
                      <td className="px-5 py-3 text-[#211B35] dark:text-white font-semibold">{e.registered}</td>
                      <td className="px-5 py-3 text-[#77738B] dark:text-slate-400">{e.capacity}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-[#F3EEFF] dark:bg-[#29243B] rounded-full h-1.5 w-24">
                            <div
                              className="bg-[#5141B8] dark:bg-purple-500 h-1.5 rounded-full"
                              style={{ width: `${Math.min(fill, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-[#5141B8] dark:text-purple-300">{fill}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
