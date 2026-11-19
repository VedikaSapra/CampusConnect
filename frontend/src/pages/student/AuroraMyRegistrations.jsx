import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { 
  Calendar, MapPin, XCircle, Ticket, 
  CheckCircle, Clock, QrCode, Sparkles 
} from 'lucide-react';
import { Button, Badge } from '../../components/common/UIComponents';
import { TicketModal } from '../../components/modals/TicketModal';

export const AuroraMyRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const { toast } = useNotification();

  const fetchRegistrations = async () => {
    try {
      const res = await api.get('/events/my-registrations/');
      setRegistrations(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to load registrations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleCancel = async (eventId) => {
    if (!confirm('Are you sure you want to cancel your seat for this event?')) return;
    setCancellingId(eventId);
    try {
      await api.delete(`/events/${eventId}/register/`);
      toast.success('Registration cancelled successfully.');
      fetchRegistrations();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cancellation failed.');
    } finally {
      setCancellingId(null);
    }
  };

  const filteredRegistrations = registrations.filter((r) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'approved') return r.status === 'approved';
    if (activeTab === 'pending') return r.status === 'pending';
    if (activeTab === 'cancelled') return r.status === 'cancelled';
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <Badge variant="electric">MY PASSES & TICKETS</Badge>
        <h1 className="text-2xl font-extrabold text-[#211B35] dark:text-white mt-1">
          Registered Workshops & Events
        </h1>
        <p className="text-xs text-[#77738B] dark:text-slate-400">
          Access your digital event QR tickets for campus entry and manage active reservations.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-[#E9E5F2] dark:border-purple-900/40 pb-2">
        {['all', 'approved', 'pending', 'cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-[#5141B8] text-white shadow-xs'
                : 'text-slate-500 hover:text-[#5141B8] hover:bg-[#F3EEFF] dark:text-slate-400 dark:hover:bg-purple-950/40'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredRegistrations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredRegistrations.map((reg) => (
            <div
              key={reg.id}
              className="bg-white dark:bg-[#1E1833] rounded-3xl border border-[#E9E5F2] dark:border-purple-900/40 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Badge variant={reg.status === 'approved' ? 'success' : reg.status === 'pending' ? 'warning' : 'neutral'}>
                    {reg.status.toUpperCase()}
                  </Badge>
                  <span className="text-[11px] text-slate-400">
                    Reg #{reg.id.toString().padStart(5, '0')}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#211B35] dark:text-white leading-snug">
                  {reg.event_title}
                </h3>

                <div className="mt-3 space-y-1.5 text-xs text-[#77738B] dark:text-slate-400">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-[#8B5CF6]" />
                    <span>
                      {new Date(reg.event_date).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-purple-900/30 flex items-center justify-between">
                {reg.status === 'approved' ? (
                  <Button
                    size="sm"
                    icon={QrCode}
                    onClick={() => setSelectedTicket(reg)}
                  >
                    View Digital Pass
                  </Button>
                ) : (
                  <span className="text-xs text-slate-400 font-medium italic">
                    {reg.status === 'pending' ? 'Awaiting Organizer Approval' : 'Booking Cancelled'}
                  </span>
                )}

                {reg.status !== 'cancelled' && (
                  <button
                    onClick={() => handleCancel(reg.event)}
                    disabled={cancellingId === reg.event}
                    className="text-xs font-semibold text-[#E05265] hover:underline cursor-pointer disabled:opacity-50"
                  >
                    {cancellingId === reg.event ? 'Cancelling...' : 'Cancel Seat'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1E1833] p-12 text-center rounded-3xl border border-[#E9E5F2] dark:border-purple-900/40">
          <p className="text-slate-500 text-sm">No registrations found in this category.</p>
        </div>
      )}

      {/* Ticket Modal */}
      <TicketModal
        registration={selectedTicket}
        isOpen={Boolean(selectedTicket)}
        onClose={() => setSelectedTicket(null)}
      />

    </div>
  );
};
