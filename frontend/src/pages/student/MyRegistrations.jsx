import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Calendar, MapPin, XCircle, CheckCircle, Clock } from 'lucide-react';

export const MyRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

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
    if (!confirm('Are you sure you want to cancel this registration?')) return;
    setCancellingId(eventId);
    try {
      await api.delete(`/events/${eventId}/register/`);
      fetchRegistrations();
    } catch (err) {
      alert(err.response?.data?.error || 'Cancellation failed.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Event Registrations</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your active registrations and view participation history.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : registrations.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="divide-y divide-slate-100">
            {registrations.map((reg) => (
              <div key={reg.id} className="p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{reg.event_title}</h3>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                    <span className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {new Date(reg.event_date).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                    <span>Registered on {new Date(reg.registered_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center ${
                    reg.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    reg.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {reg.status === 'approved' && <CheckCircle className="w-3.5 h-3.5 mr-1" />}
                    {reg.status === 'pending' && <Clock className="w-3.5 h-3.5 mr-1" />}
                    <span className="capitalize">{reg.status}</span>
                  </span>

                  {reg.status !== 'cancelled' && (
                    <button
                      onClick={() => handleCancel(reg.event)}
                      disabled={cancellingId === reg.event}
                      className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {cancellingId === reg.event ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <p className="text-slate-500 text-sm">You have not registered for any events yet.</p>
        </div>
      )}
    </div>
  );
};
