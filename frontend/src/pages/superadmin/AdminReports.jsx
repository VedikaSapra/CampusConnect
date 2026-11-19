import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import {
  BarChart3, TrendingUp, Users, Calendar, Award, RefreshCw,
  PieChart as PieIcon, ArrowUpRight, ShieldCheck
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';

const COLORS = ['#5141B8', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

export const AdminReports = () => {
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
        <p className="text-sm font-semibold">Generating platform analytics report…</p>
      </div>
    );
  }

  const stats = data?.stats ?? {};
  const charts = data?.charts ?? {};

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#211B35]">Platform Analytics & Reports</h1>
          <p className="text-sm text-[#77738B] mt-1">
            Real-time aggregate activity, user growth metrics, and event distribution.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-[#F3EEFF] hover:bg-[#E8DEFF] text-[#5141B8] rounded-xl text-sm font-semibold transition-all self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Reports
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#211E30] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#77738B] uppercase">Total Students</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Users className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-extrabold text-[#211B35] mt-2">{stats.total_students ?? 0}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Registered accounts
          </p>
        </div>

        <div className="bg-white dark:bg-[#211E30] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#77738B] uppercase">Active Clubs</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl"><Award className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-extrabold text-[#5141B8] mt-2">{stats.total_clubs ?? 0}</p>
          <p className="text-xs text-[#77738B] mt-1">{stats.pending_clubs ?? 0} pending review</p>
        </div>

        <div className="bg-white dark:bg-[#211E30] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#77738B] uppercase">Total Events</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Calendar className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-600 mt-2">{stats.total_events ?? 0}</p>
          <p className="text-xs text-[#77738B] mt-1">Conducted & upcoming</p>
        </div>

        <div className="bg-white dark:bg-[#211E30] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#77738B] uppercase">Registrations</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><TrendingUp className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-extrabold text-amber-600 mt-2">{stats.total_registrations ?? 0}</p>
          <p className="text-xs text-[#77738B] mt-1">Student event entries</p>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Registrations Timeline */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-[#E9E5F2] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#211B35] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#5141B8]" />
              Event Registration Trajectory
            </h3>
            <span className="text-xs text-[#77738B] font-semibold">Monthly aggregate</span>
          </div>
          <div className="h-72 w-full">
            {monthlyRegistrations.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No monthly registration trends recorded yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRegistrations} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3EEFF" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E9E5F2' }} />
                  <Line type="monotone" dataKey="registrations" stroke="#5141B8" strokeWidth={3} dot={{ r: 4, fill: '#8B5CF6' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Clubs by Category Pie */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-[#E9E5F2] shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-[#211B35] flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#8B5CF6]" />
              Clubs by Category
            </h3>
            <p className="text-xs text-[#77738B] mt-0.5">Distribution of campus communities</p>
          </div>
          <div className="h-56 w-full flex items-center justify-center">
            {clubsByCategory.length === 0 ? (
              <p className="text-slate-400 text-sm">No club categories</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={clubsByCategory} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {clubsByCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="text-center text-xs text-[#77738B]">
            Total Approved: <span className="font-bold text-[#5141B8]">{stats.total_clubs ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Events By Category Bar Chart */}
      <div className="bg-white p-6 rounded-2xl border border-[#E9E5F2] shadow-xs space-y-4">
        <h3 className="font-bold text-[#211B35] flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#5141B8]" />
          Platform Events by Category
        </h3>
        <div className="h-64 w-full">
          {eventsByCategory.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              No category distribution data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventsByCategory} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3EEFF" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E9E5F2' }} />
                <Bar dataKey="count" fill="#8B5CF6" radius={[6, 6, 0, 0]} name="Events Count" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
