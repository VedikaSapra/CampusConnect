import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { 
  Users, Award, Calendar, CheckCircle2, 
  Clock, ArrowLeft, Mail, UserCheck, Megaphone 
} from 'lucide-react';
import { Button, Badge } from '../../components/common/UIComponents';

export const ClubDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useNotification();
  
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  const [joining, setJoining] = useState(false);

  const fetchClub = async () => {
    try {
      const res = await api.get(`/clubs/${id}/`);
      setClub(res.data);
    } catch (err) {
      console.error('Failed to load club details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClub();
  }, [id]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await api.post(`/clubs/${id}/join/`);
      toast.success('Membership request submitted successfully!');
      fetchClub();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit join request.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="bg-white dark:bg-[#1E1833] p-12 text-center rounded-3xl border border-[#E9E5F2] dark:border-purple-900/40">
        <p className="text-slate-500">Club society not found.</p>
        <Link to="/clubs" className="text-[#8B5CF6] font-bold text-xs mt-2 inline-block">
          ← Back to Clubs
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      
      {/* Back button */}
      <Link to="/clubs" className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-[#5141B8] transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Society Directory</span>
      </Link>

      {/* Header Banner Presentation */}
      <div className="bg-white dark:bg-[#1E1833] rounded-3xl border border-[#E9E5F2] dark:border-purple-900/40 overflow-hidden shadow-xs">
        
        {/* Cover graphic */}
        <div className="h-44 sm:h-56 aurora-hero-bg relative flex items-end p-6 sm:p-8">
          <div className="flex items-center space-x-4 z-10">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white dark:bg-[#251E3E] p-2 shadow-xl border-2 border-white flex items-center justify-center font-extrabold text-2xl text-[#5141B8] dark:text-purple-300">
              {club.name[0]}
            </div>
            <div className="text-white">
              <Badge variant="primary" size="xs">{club.category}</Badge>
              <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">{club.name}</h1>
              <p className="text-xs text-purple-200 mt-0.5">{club.member_count} registered members</p>
            </div>
          </div>
        </div>

        {/* Action bar below banner */}
        <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#1E1833]">
          <div className="flex space-x-6 text-xs text-[#77738B] dark:text-slate-400">
            {club.faculty_coordinator && (
              <div>
                <p className="font-semibold text-slate-400 uppercase text-[10px]">Faculty Advisor</p>
                <p className="font-bold text-[#211B35] dark:text-white mt-0.5">{club.faculty_coordinator}</p>
              </div>
            )}
            <div>
              <p className="font-semibold text-slate-400 uppercase text-[10px]">Community Status</p>
              <p className="font-bold text-[#27A66B] mt-0.5">Officially Recognized</p>
            </div>
          </div>

          {/* Student Join Button or Status Badge */}
          {user?.role === 'student' && (
            club.membership_status === 'approved' ? (
              <Badge variant="success" size="md">
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Active Member
              </Badge>
            ) : club.membership_status === 'pending' ? (
              <Badge variant="warning" size="md">
                <Clock className="w-4 h-4 mr-1.5" />
                Membership Pending Approval
              </Badge>
            ) : (
              <Button
                onClick={handleJoin}
                loading={joining}
                size="md"
                icon={UserCheck}
              >
                Join Society
              </Button>
            )
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-3 border-b border-[#E9E5F2] dark:border-purple-900/40 pb-2">
        {['about', 'events', 'leadership'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-[#5141B8] text-white shadow-xs'
                : 'text-slate-500 hover:text-[#5141B8] hover:bg-[#F3EEFF] dark:text-slate-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'about' && (
        <div className="bg-white dark:bg-[#1E1833] p-8 rounded-3xl border border-[#E9E5F2] dark:border-purple-900/40 space-y-4 shadow-xs">
          <h3 className="text-lg font-bold text-[#211B35] dark:text-white">Society Mission & Overview</h3>
          <p className="text-sm text-[#77738B] dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {club.description}
          </p>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="bg-white dark:bg-[#1E1833] p-8 rounded-3xl border border-[#E9E5F2] dark:border-purple-900/40 shadow-xs">
          <h3 className="text-lg font-bold text-[#211B35] dark:text-white mb-4">Society Events</h3>
          <p className="text-xs text-slate-400">
            Upcoming sessions organized by {club.name} can be reserved directly from the Events portal.
          </p>
          <div className="mt-4">
            <Link to="/events">
              <Button size="sm">Browse Campus Calendar</Button>
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'leadership' && (
        <div className="bg-white dark:bg-[#1E1833] p-8 rounded-3xl border border-[#E9E5F2] dark:border-purple-900/40 shadow-xs space-y-4">
          <h3 className="text-lg font-bold text-[#211B35] dark:text-white">Club Officers</h3>
          <div className="flex items-center space-x-3 p-4 rounded-2xl bg-[#F8F7FC] dark:bg-purple-950/30 border border-[#E9E5F2] dark:border-purple-900/40">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5141B8] to-[#8B5CF6] text-white flex items-center justify-center font-bold text-sm">
              {club.admin_user_detail?.full_name?.[0] || 'A'}
            </div>
            <div>
              <p className="text-sm font-bold text-[#211B35] dark:text-white">{club.admin_user_detail?.full_name || 'Assigned Officer'}</p>
              <p className="text-xs text-slate-400">{club.admin_user_detail?.email || 'officer@campusconnect.edu'}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
