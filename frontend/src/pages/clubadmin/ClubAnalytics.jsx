import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import {
  BarChart3, TrendingUp, Users, Calendar, CheckCircle, Star, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';

const COLORS = ['#5141B8', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

const StatCard = ({ title, value, icon: Icon, color, sub }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-[#211E30] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] p-5 shadow-sm"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-[#77738B] uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-black text-[#211B35] mt-1">{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </motion.div>
);

export const ClubAnalytics = () => {
  const [dashData, setDashData] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, eventsRes] = await Promise.all([
        api.get('/dashboard/club-admin/'),
        api.get('/events/my-club-events/'),
      ]);
      setDashData(dashRes.data);
      setEvents(eventsRes.data?.results ?? eventsRes.data ?? []);
    } catch {
      showNotification('Failed to load analytics.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mb-3" />
        <p className="text-sm">Loading analytics…</p>
      </div>
    );
  }

  const stats = dashData?.stats ?? {};
  const upcomingEvents = dashData?.upcoming_events ?? [];

  // Build bar chart data from events
  const eventBarData = events.slice(0, 8).map(e => ({
    name: e.title.length > 15 ? e.title.slice(0, 15) + '…' : e.title,
    capacity: e.capacity,
    registered: e.registered_count ?? 0,
  }));

  // Registration status pie from registrations per event
  const totalReg = upcomingEvents.reduce((s, e) => s + (e.registered ?? 0), 0);
  const totalCap = upcomingEvents.reduce((s, e) => s + (e.capacity ?? 0), 0);
  const fillRate = totalCap > 0 ? Math.round((totalReg / totalCap) * 100) : 0;
  const pieData = [
    { name: 'Registered', value: totalReg },
    { name: 'Available', value: Math.max(0, totalCap - totalReg) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#211B35]">Club Analytics</h1>
          <p className="text-sm text-[#77738B] mt-1">Performance overview for your club</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-[#F3EEFF] hover:bg-[#E8DEFF] text-[#5141B8] rounded-xl text-sm font-semibold transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Members" value={stats.total_members} icon={Users} color="bg-[#5141B8]" />
        <StatCard title="Pending Requests" value={stats.pending_membership_requests} icon={TrendingUp} color="bg-amber-500" />
        <StatCard title="Upcoming Events" value={stats.upcoming_events} icon={Calendar} color="bg-emerald-500" />
        <StatCard
          title="Avg. Rating"
          value={stats.average_rating ? `${stats.average_rating}★` : 'N/A'}
          icon={Star}
          color="bg-purple-500"
          sub="From event feedback"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart: Event registrations */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E9E5F2] p-5 shadow-sm">
          <h3 className="font-bold text-[#211B35] mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#5141B8]" /> Event Capacity vs Registrations
          </h3>
          {eventBarData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No events yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={eventBarData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3EEFF" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E9E5F2', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="capacity" fill="#E8DEFF" name="Capacity" radius={[4, 4, 0, 0]} />
                <Bar dataKey="registered" fill="#5141B8" name="Registered" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart: Fill rate */}
        <div className="bg-white dark:bg-[#211E30] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] p-5 shadow-sm flex flex-col">
          <h3 className="font-bold text-[#211B35] mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#5141B8]" /> Overall Fill Rate
          </h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#5141B8' : '#F3EEFF'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-3xl font-black text-[#5141B8]">{fillRate}%</p>
            <p className="text-xs text-slate-400 mt-0.5">{totalReg} of {totalCap} seats filled</p>
          </div>
        </div>
      </div>

      {/* Upcoming events table */}
      <div className="bg-white dark:bg-[#211E30] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E9E5F2]">
          <h3 className="font-bold text-[#211B35]">Upcoming Events Summary</h3>
        </div>
        {upcomingEvents.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">No upcoming events</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F7FC]">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] uppercase">Event</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] uppercase">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] uppercase">Registered</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] uppercase">Capacity</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#77738B] uppercase">Fill %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EEFF]">
                {upcomingEvents.map(e => {
                  const fill = e.capacity > 0 ? Math.round((e.registered / e.capacity) * 100) : 0;
                  return (
                    <tr key={e.id} className="hover:bg-[#F8F7FC] dark:hover:bg-[#211E30] transition-colors">
                      <td className="px-5 py-3 font-semibold text-[#211B35]">{e.title}</td>
                      <td className="px-5 py-3 text-[#77738B] text-xs">
                        {e.event_date ? new Date(e.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                      </td>
                      <td className="px-5 py-3 text-[#211B35] font-semibold">{e.registered}</td>
                      <td className="px-5 py-3 text-[#77738B]">{e.capacity}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-[#F3EEFF] rounded-full h-1.5">
                            <div
                              className="bg-[#5141B8] h-1.5 rounded-full"
                              style={{ width: `${Math.min(fill, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-[#5141B8]">{fill}%</span>
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
