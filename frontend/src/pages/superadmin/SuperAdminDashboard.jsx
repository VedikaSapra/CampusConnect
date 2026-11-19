import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import {
  BarChart3, TrendingUp, Users, Calendar, Award, RefreshCw,
  PieChart as PieIcon, ArrowUpRight, ShieldCheck, CheckCircle2,
  Video, Megaphone, Clock, Building2, UserCheck
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';

const COLORS = ['#5141B8', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

const StatCard = ({ title, value, icon: Icon, color, sub, link }) => {
  const Card = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
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

  return link ? <Link to={link}>{Card}</Link> : Card;
};

export const SuperAdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/super-admin/');
      setData(res.data);
    } catch {
      showNotification('Failed to load system reports.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mb-3 text-[#5141B8]" />
        <p className="text-sm font-semibold">Generating global platform analytics…</p>
      </div>
    );
  }

  const stats = data?.stats ?? {};
  const charts = data?.charts ?? {};
  const recentUsers = data?.recent_users ?? [];
  const recentEvents = data?.recent_events ?? [];

  const eventsByCategory = (charts.events_by_category ?? []).map(item => ({
    name: item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : 'General',
    count: item.count
  }));

  const clubsByCategory = (charts.clubs_by_category ?? []).map(item => ({
    name: item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : 'General',
    value: item.count
  }));

  const monthlyRegistrations = charts.monthly_registrations ?? [];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Platform Root Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#211B35] dark:text-white">
            System Overview & Global Analytics
          </h1>
          <p className="text-sm text-[#77738B] dark:text-slate-400 mt-1">
            Real-time university metrics, community growth, event participation, and system governance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#191726] border border-[#E9E5F2] dark:border-[#383248] text-[#5141B8] dark:text-purple-300 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <RefreshCw className="w-4 h-4" /> Refresh System
          </button>
          <Link
            to="/admin/events"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#5141B8] hover:bg-[#34246F] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Calendar className="w-4 h-4" /> Manage Events
          </Link>
        </div>
      </div>

      {/* Row 1: Primary Platform Scale */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats.total_students}
          icon={Users}
          color="bg-[#5141B8]"
          sub="Verified student profiles"
          link="/admin/users"
        />
        <StatCard
          title="Club Administrators"
          value={stats.total_club_admins}
          icon={UserCheck}
          color="bg-purple-600"
          sub="Appointed society heads"
          link="/admin/club-admins"
        />
        <StatCard
          title="Active Clubs"
          value={stats.approved_clubs ?? stats.total_clubs}
          icon={Award}
          color="bg-indigo-600"
          sub={`${stats.pending_clubs ?? 0} pending review`}
          link="/admin/clubs"
        />
        <StatCard
          title="Total Memberships"
          value={stats.total_memberships}
          icon={Users}
          color="bg-teal-500"
          sub="Active student-club connections"
        />
      </div>

      {/* Row 2: Events & Meetings Participation */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Events"
          value={stats.total_events}
          icon={Calendar}
          color="bg-emerald-500"
          sub={`${stats.upcoming_events ?? 0} upcoming • ${stats.completed_events ?? 0} past`}
          link="/admin/events"
        />
        <StatCard
          title="Event Registrations"
          value={stats.total_registrations}
          icon={TrendingUp}
          color="bg-amber-500"
          sub="Cumulative student signups"
        />
        <StatCard
          title="Total Check-Ins"
          value={stats.total_check_ins}
          icon={CheckCircle2}
          color="bg-pink-500"
          sub={`${stats.overall_attendance_rate ?? 0}% overall turnout`}
        />
        <StatCard
          title="Club Assemblies"
          value={stats.total_meetings}
          icon={Video}
          color="bg-violet-600"
          sub={`${stats.total_announcements ?? 0} notices published`}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Registration Trajectory */}
        <div className="lg:col-span-8 bg-white dark:bg-[#191726] p-6 rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#211B35] dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#5141B8] dark:text-purple-400" />
              Event Registration Trajectory (6-Month Activity)
            </h3>
            <span className="text-xs text-[#77738B] dark:text-slate-400 font-semibold">Monthly Aggregates</span>
          </div>

          <div className="h-72 w-full">
            {monthlyRegistrations.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No monthly registration trends recorded yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRegistrations} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E9E5F2" className="dark:opacity-10" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#77738B' }} />
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
                  <Line
                    type="monotone"
                    dataKey="registrations"
                    stroke="#5141B8"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#8B5CF6' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Clubs by Category Pie */}
        <div className="lg:col-span-4 bg-white dark:bg-[#191726] p-6 rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs space-y-4 flex flex-col justify-between">
          <h3 className="font-bold text-[#211B35] dark:text-white flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-[#5141B8] dark:text-purple-400" />
            Society Categories
          </h3>

          <div className="h-56 w-full">
            {clubsByCategory.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No clubs registered yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={clubsByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {clubsByCategory.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#F3EEFF] dark:border-[#29243B]">
            {clubsByCategory.slice(0, 5).map((c, i) => (
              <span key={i} className="text-[11px] flex items-center gap-1 font-bold text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {c.name} ({c.value})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Events by Category Bar Chart */}
      <div className="bg-white dark:bg-[#191726] p-6 rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[#211B35] dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#5141B8] dark:text-purple-400" />
            Campus Events Distribution by Category
          </h3>
          <span className="text-xs text-[#77738B] dark:text-slate-400 font-semibold">All University Societies</span>
        </div>

        <div className="h-60 w-full">
          {eventsByCategory.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">No events recorded</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventsByCategory} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
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
                <Bar dataKey="count" fill="#5141B8" radius={[4, 4, 0, 0]}>
                  {eventsByCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Two Columns: Recent Registrations & Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations Table */}
        <div className="bg-white dark:bg-[#191726] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E9E5F2] dark:border-[#383248] flex items-center justify-between">
            <h3 className="font-bold text-[#211B35] dark:text-white">Recent User Signups</h3>
            <Link to="/admin/users" className="text-xs font-bold text-[#5141B8] dark:text-purple-300 hover:underline">
              Manage All Users →
            </Link>
          </div>
          <div className="divide-y divide-[#F3EEFF] dark:divide-[#29243B]">
            {recentUsers.map(u => (
              <div key={u.id} className="p-3.5 flex items-center justify-between hover:bg-[#F8F7FC] dark:hover:bg-[#211E30] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#5141B8] to-[#8B5CF6] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {u.first_name?.[0] || 'U'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#211B35] dark:text-white">{u.full_name || u.username}</p>
                    <p className="text-[11px] text-slate-400">{u.email}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                  {u.role.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Published Events */}
        <div className="bg-white dark:bg-[#191726] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E9E5F2] dark:border-[#383248] flex items-center justify-between">
            <h3 className="font-bold text-[#211B35] dark:text-white">Recent Published Events</h3>
            <Link to="/admin/events" className="text-xs font-bold text-[#5141B8] dark:text-purple-300 hover:underline">
              Manage All Events →
            </Link>
          </div>
          <div className="divide-y divide-[#F3EEFF] dark:divide-[#29243B]">
            {recentEvents.map(e => (
              <div key={e.id} className="p-3.5 flex items-center justify-between hover:bg-[#F8F7FC] dark:hover:bg-[#211E30] transition-colors">
                <div>
                  <p className="text-xs font-bold text-[#211B35] dark:text-white">{e.title}</p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{e.club_name || 'College Wide'}</span>
                    <span>•</span>
                    <span>{e.event_date ? new Date(e.event_date).toLocaleDateString() : 'TBD'}</span>
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-[#5141B8] dark:text-purple-300 bg-[#F3EEFF] dark:bg-[#251E3E]">
                  {e.registered_count || 0} / {e.capacity} Seats
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
