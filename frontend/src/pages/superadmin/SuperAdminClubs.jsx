import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { 
  Users, Award, Calendar, CheckSquare, 
  Plus, Trash2, CheckCircle2, XCircle, Search 
} from 'lucide-react';
import { Button, Badge } from '../../components/common/UIComponents';
import { useNotification } from '../../context/NotificationContext';

export const SuperAdminClubs = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClub, setNewClub] = useState({
    name: '',
    category: 'technical',
    description: '',
    faculty_coordinator: '',
  });

  const { toast } = useNotification();

  const fetchClubs = async () => {
    try {
      const res = await api.get('/clubs/');
      const data = res.data.results || res.data;
      setClubs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load clubs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  const handleCreateClub = async (e) => {
    e.preventDefault();
    try {
      await api.post('/clubs/', newClub);
      toast.success('Club created and approved successfully!');
      setShowCreateModal(false);
      setNewClub({ name: '', category: 'technical', description: '', faculty_coordinator: '' });
      fetchClubs();
    } catch (err) {
      toast.error('Failed to create club.');
    }
  };

  const handleDeleteClub = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this club?')) return;
    try {
      await api.delete(`/clubs/${id}/`);
      toast.success('Club deleted successfully.');
      fetchClubs();
    } catch (err) {
      toast.error('Failed to delete club.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Badge variant="electric">ADMINISTRATION</Badge>
          <h1 className="text-2xl font-extrabold text-[#211B35] dark:text-white mt-1">
            Campus Club Governance
          </h1>
          <p className="text-xs text-[#77738B] dark:text-slate-400">
            Provision, inspect, and moderate all collegiate chapters and student societies.
          </p>
        </div>

        <Button
          size="sm"
          icon={Plus}
          onClick={() => setShowCreateModal(true)}
        >
          Create New Club
        </Button>
      </div>

      {/* Clubs Table */}
      <div className="bg-white dark:bg-[#1E1833] rounded-3xl border border-[#E9E5F2] dark:border-purple-900/40 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-purple-900/30 text-left text-xs">
            <thead className="bg-[#F8F7FC] dark:bg-purple-950/40 text-[#77738B] dark:text-slate-400 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-6">Club Name</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6">Advisor</th>
                <th className="py-3.5 px-6">Members</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-purple-900/30">
              {clubs.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-purple-950/20">
                  <td className="py-4 px-6 font-bold text-[#211B35] dark:text-white">
                    {c.name}
                  </td>
                  <td className="py-4 px-6 capitalize">
                    <Badge variant="primary" size="xs">{c.category}</Badge>
                  </td>
                  <td className="py-4 px-6 text-slate-500 dark:text-slate-300">
                    {c.faculty_coordinator || '—'}
                  </td>
                  <td className="py-4 px-6 font-semibold text-[#5141B8] dark:text-purple-300">
                    {c.member_count} members
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-[#27A66B]">
                      {c.is_approved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleDeleteClub(c.id)}
                      className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Delete Club"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1E1833] rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#E9E5F2] dark:border-purple-900/40 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-[#211B35] dark:text-white">Create New Society</h3>
            
            <form onSubmit={handleCreateClub} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Club Name</label>
                <input
                  type="text"
                  required
                  value={newClub.name}
                  onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                  placeholder="e.g. AI & Robotics Society"
                  className="w-full px-3 py-2 rounded-xl border border-[#E9E5F2] text-sm bg-[#F8F7FC] dark:bg-purple-950/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category</label>
                <select
                  value={newClub.category}
                  onChange={(e) => setNewClub({ ...newClub, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E9E5F2] text-sm bg-[#F8F7FC] dark:bg-purple-950/30"
                >
                  <option value="technical">Technical</option>
                  <option value="cultural">Cultural</option>
                  <option value="sports">Sports</option>
                  <option value="social">Social Service</option>
                  <option value="entrepreneurship">Entrepreneurship</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Faculty Coordinator</label>
                <input
                  type="text"
                  value={newClub.faculty_coordinator}
                  onChange={(e) => setNewClub({ ...newClub, faculty_coordinator: e.target.value })}
                  placeholder="e.g. Dr. Jane Smith"
                  className="w-full px-3 py-2 rounded-xl border border-[#E9E5F2] text-sm bg-[#F8F7FC] dark:bg-purple-950/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={newClub.description}
                  onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                  placeholder="Brief mission and overview..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E9E5F2] text-sm bg-[#F8F7FC] dark:bg-purple-950/30"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button size="sm" type="submit">
                  Save Club
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
