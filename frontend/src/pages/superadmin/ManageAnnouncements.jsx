import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { Megaphone, Plus, Pencil, Trash2, RefreshCw, X, Calendar, Globe, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';

const EMPTY_FORM = { title: '', content: '', target_audience: 'all', expires_at: '' };

export const ManageAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const { showNotification } = useNotification();

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/announcements/');
      setAnnouncements(res.data?.results ?? res.data ?? []);
    } catch {
      showNotification('Failed to load announcements.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (ann) => {
    setEditing(ann);
    setForm({
      title: ann.title,
      content: ann.content,
      target_audience: ann.target_audience,
      expires_at: ann.expires_at ? ann.expires_at.slice(0, 16) : '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        content: form.content,
        target_audience: form.target_audience,
        ...(form.expires_at ? { expires_at: form.expires_at } : {}),
      };
      if (editing) {
        const res = await api.patch(`/announcements/${editing.id}/`, payload);
        setAnnouncements(prev => prev.map(a => a.id === editing.id ? res.data : a));
        showNotification('Announcement updated!', 'success');
      } else {
        const res = await api.post('/announcements/', payload);
        setAnnouncements(prev => [res.data, ...prev]);
        showNotification('Announcement published!', 'success');
      }
      setShowModal(false);
    } catch (err) {
      const data = err.response?.data;
      const msg = typeof data === 'string' ? data : Object.values(data ?? {})[0]?.[0] ?? 'Failed to save.';
      showNotification(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    setDeleting(id);
    try {
      await api.delete(`/announcements/${id}/`);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      showNotification('Deleted.', 'success');
    } catch {
      showNotification('Failed to delete.', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const getAudienceConfig = (ann) => {
    if (ann.target_audience === 'all') return { label: 'College Wide', icon: Globe, color: 'bg-blue-100 text-blue-700 border-blue-200' };
    if (ann.target_audience === 'club') return { label: ann.club_name ?? 'Club', icon: Users, color: 'bg-purple-100 text-purple-700 border-purple-200' };
    return { label: 'Students', icon: Users, color: 'bg-green-100 text-green-700 border-green-200' };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#211B35] dark:text-white">Manage Announcements</h1>
          <p className="text-sm text-[#77738B] dark:text-[#B3ADC7] mt-1">Create and manage college-wide platform announcements.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAnnouncements}
            className="flex items-center gap-2 px-4 py-2 bg-[#F3EEFF] dark:bg-purple-950/40 hover:bg-[#E8DEFF] dark:hover:bg-purple-900/40 text-[#5141B8] dark:text-purple-300 rounded-xl text-sm font-semibold transition-all border border-[#E8DEFF] dark:border-purple-800/40"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#5141B8] hover:bg-[#34246F] dark:bg-[#6D5BD0] dark:hover:bg-[#8B7CF6] text-white rounded-xl text-sm font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> New Announcement
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-[#211E30] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] py-20 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#5141B8] dark:text-purple-400" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white dark:bg-[#211E30] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] py-20 text-center">
          <Megaphone className="w-10 h-10 mx-auto mb-3 text-[#E9E5F2] dark:text-[#383248]" />
          <p className="font-semibold text-slate-500 dark:text-[#B3ADC7]">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {announcements.map((ann, i) => {
              const aud = getAudienceConfig(ann);
              const AudIcon = aud.icon;
              return (
                <motion.div
                  key={ann.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white dark:bg-[#211E30] rounded-2xl border border-[#E9E5F2] dark:border-[#383248] p-5 shadow-sm hover:shadow-md dark:hover:shadow-purple-900/20 transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 mb-1.5">
                        <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${aud.color}`}>
                          <AudIcon className="w-3 h-3" /> {aud.label}
                        </span>
                        {!ann.is_active && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            Inactive
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-[#211B35] dark:text-white text-base">{ann.title}</h3>
                      <p className="text-sm text-[#77738B] dark:text-[#B3ADC7] mt-1 line-clamp-2">{ann.content}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-400 dark:text-slate-500">
                        <span>By {ann.author_detail?.first_name} {ann.author_detail?.last_name}</span>
                        {ann.published_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(ann.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                        {ann.expires_at && <span>Expires {new Date(ann.expires_at).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(ann)}
                        className="p-2 hover:bg-[#F3EEFF] dark:hover:bg-purple-950/40 text-[#5141B8] dark:text-purple-400 rounded-lg transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ann.id)}
                        disabled={deleting === ann.id}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 dark:text-red-400 rounded-lg transition-all disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-[#211E30] rounded-2xl shadow-2xl w-full max-w-lg p-6 relative border border-[#E9E5F2] dark:border-[#383248]"
            >
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 dark:hover:bg-[#29243B] rounded-lg">
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
              <h2 className="text-xl font-bold text-[#211B35] dark:text-white mb-5">{editing ? 'Edit Announcement' : 'New Announcement'}</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-[#B3ADC7] uppercase mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Announcement title"
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-[#383248] bg-white dark:bg-[#191726] text-[#211B35] dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#5141B8] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-[#B3ADC7] uppercase mb-1">Content *</label>
                  <textarea
                    required
                    rows={5}
                    value={form.content}
                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    placeholder="Full announcement content…"
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-[#383248] bg-white dark:bg-[#191726] text-[#211B35] dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#5141B8] outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-[#B3ADC7] uppercase mb-1">Target Audience</label>
                  <select
                    value={form.target_audience}
                    onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-[#383248] bg-white dark:bg-[#191726] text-[#211B35] dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#5141B8] outline-none"
                  >
                    <option value="all">College Wide (Everyone)</option>
                    <option value="students">Students Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-[#B3ADC7] uppercase mb-1">Expiry Date (optional)</label>
                  <input
                    type="datetime-local"
                    value={form.expires_at}
                    onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-[#383248] bg-white dark:bg-[#191726] text-[#211B35] dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#5141B8] outline-none"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-200 dark:border-[#383248] text-slate-600 dark:text-[#B3ADC7] rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-[#29243B]">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="px-5 py-2 bg-[#5141B8] hover:bg-[#34246F] text-white rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50">
                    {saving ? 'Saving…' : editing ? 'Update' : 'Publish'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
