import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { User, CheckCircle, AlertCircle, Lock } from 'lucide-react';

export const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    department: user?.department || '',
    year_of_study: user?.year_of_study || '',
  });

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    new_password2: '',
  });

  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setErrorMsg('');
    try {
      const res = await api.put('/auth/profile/', formData);
      updateProfile(res.data);
      setProfileMsg('Profile updated successfully.');
    } catch (err) {
      setErrorMsg('Failed to update profile.');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg('');
    setErrorMsg('');
    if (passwordData.new_password !== passwordData.new_password2) {
      setErrorMsg('New passwords do not match.');
      return;
    }
    try {
      await api.post('/auth/change-password/', passwordData);
      setPasswordMsg('Password changed successfully.');
      setPasswordData({ old_password: '', new_password: '', new_password2: '' });
    } catch (err) {
      setErrorMsg(err.response?.data?.old_password?.[0] || 'Failed to change password.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#211B35] dark:text-white">Account Settings</h1>
        <p className="text-sm text-[#77738B] dark:text-[#B3ADC7] mt-1">Manage personal details, department info, and credentials.</p>
      </div>

      {profileMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500 text-emerald-700 dark:text-emerald-300 rounded-r-xl text-sm flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{profileMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border-l-4 border-red-500 text-red-700 dark:text-red-300 rounded-r-xl text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white dark:bg-[#191726] p-6 sm:p-8 rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs">
        <h2 className="text-lg font-bold text-[#211B35] dark:text-white mb-6">Personal Information</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase mb-1">First Name</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] text-[#211B35] dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#8B5CF6] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase mb-1">Last Name</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] text-[#211B35] dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#8B5CF6] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase mb-1">Email</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 border border-[#E9E5F2] dark:border-[#383248] bg-[#F8F7FC] dark:bg-[#211E30] text-[#77738B] dark:text-slate-400 rounded-xl text-sm opacity-80 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] text-[#211B35] dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#8B5CF6] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase mb-1">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] text-[#211B35] dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#8B5CF6] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase mb-1">Year of Study</label>
              <input
                type="number"
                value={formData.year_of_study}
                onChange={(e) => setFormData({ ...formData, year_of_study: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] text-[#211B35] dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#8B5CF6] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase mb-1">Bio / About Me</label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] text-[#211B35] dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#8B5CF6] outline-none resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#5141B8] hover:bg-[#34246F] dark:bg-[#6D5BD0] dark:hover:bg-[#8B7CF6] text-white rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Password Change Form */}
      <div className="bg-white dark:bg-[#191726] p-6 sm:p-8 rounded-2xl border border-[#E9E5F2] dark:border-[#383248] shadow-xs">
        <h2 className="text-lg font-bold text-[#211B35] dark:text-white mb-6 flex items-center gap-2">
          <Lock className="w-5 h-5 text-[#8B5CF6]" />
          <span>Security & Password</span>
        </h2>
        {passwordMsg && (
          <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500 text-emerald-700 dark:text-emerald-300 rounded-r-xl text-sm">
            {passwordMsg}
          </div>
        )}
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase mb-1">Current Password</label>
            <input
              type="password"
              required
              value={passwordData.old_password}
              onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] text-[#211B35] dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#8B5CF6] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase mb-1">New Password</label>
              <input
                type="password"
                required
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] text-[#211B35] dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#8B5CF6] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#77738B] dark:text-[#B3ADC7] uppercase mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={passwordData.new_password2}
                onChange={(e) => setPasswordData({ ...passwordData, new_password2: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#12111A] text-[#211B35] dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#8B5CF6] outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#34246F] hover:bg-[#211B35] dark:bg-[#2A1F52] dark:hover:bg-[#382B6B] text-white rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
