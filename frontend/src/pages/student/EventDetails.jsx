import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { 
  Calendar, MapPin, Users, Clock, ArrowLeft, 
  CheckCircle2, AlertTriangle, ShieldCheck, Share2 
} from 'lucide-react';
import { Button, Badge } from '../../components/common/UIComponents';

export const EventDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useNotification();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  const fetchEvent = async () => {
    try {
      const res = await api.get(`/events/${id}/`);
      setEvent(res.data);
    } catch (err) {
      console.error('Failed to load event details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const handleRegister = async () => {
    setRegistering(true);
    try {
      await api.post(`/events/${id}/register/`);
      toast.success('Registration successful!');
      fetchEvent();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="bg-white dark:bg-[#1E1833] p-12 text-center rounded-3xl border border-[#E9E5F2] dark:border-purple-900/40">
        <p className="text-slate-500">Event not found or has been removed.</p>
        <Link to="/events" className="text-[#8B5CF6] font-bold text-xs mt-2 inline-block">
          ← Back to Events
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      
      {/* Back button */}
      <Link to="/events" className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-[#5141B8] transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Events Calendar</span>
      </Link>

      {/* Main Event Showcase Card */}
      <div className="bg-white dark:bg-[#1E1833] rounded-3xl border border-[#E9E5F2] dark:border-purple-900/40 overflow-hidden shadow-xs">
        
        {/* Banner Graphic Header */}
        <div className="h-56 sm:h-72 aurora-hero-bg p-8 text-white flex flex-col justify-between relative">
          <div className="flex justify-between items-start z-10">
            <Badge variant="primary" size="md">{event.category.toUpperCase()}</Badge>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/20 backdrop-blur-md">
              Organized by {event.club_name}
            </span>
          </div>

          <div className="z-10 space-y-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              {event.title}
            </h1>
            <p className="text-xs text-purple-200 flex items-center space-x-2">
              <MapPin className="w-3.5 h-3.5" />
              <span>{event.venue}</span>
            </p>
          </div>
        </div>

        {/* Content & Booking Section */}
        <div className="p-8 space-y-8">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#F8F7FC] dark:bg-purple-950/20 border border-[#E9E5F2] dark:border-purple-900/30">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Date</p>
              <p className="text-xs font-bold text-[#211B35] dark:text-white mt-0.5">
                {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Time</p>
              <p className="text-xs font-bold text-[#211B35] dark:text-white mt-0.5">
                {new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Seats</p>
              <p className="text-xs font-bold text-[#27A66B] mt-0.5">
                {event.available_seats} / {event.capacity} left
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Deadline</p>
              <p className="text-xs font-bold text-[#E05265] mt-0.5">
                {new Date(event.registration_deadline).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-[#211B35] dark:text-white">About This Event</h3>
            <p className="text-sm text-[#77738B] dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Booking Action Bar */}
          <div className="pt-6 border-t border-slate-100 dark:border-purple-900/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-xs text-slate-400 font-medium">Admission</p>
              <p className="text-lg font-extrabold text-[#5141B8] dark:text-purple-300">Free Student Entry</p>
            </div>

            {user?.role === 'student' && (
              event.registration_status ? (
                <div className="flex items-center space-x-3">
                  <Badge variant="success" size="md">
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Registered ({event.registration_status})
                  </Badge>
                  <Link to="/student/my-registrations">
                    <Button size="sm" variant="secondary">View Ticket</Button>
                  </Link>
                </div>
              ) : event.available_seats <= 0 ? (
                <Badge variant="error" size="md">Event Fully Booked</Badge>
              ) : (
                <Button
                  size="lg"
                  loading={registering}
                  onClick={handleRegister}
                  icon={CheckCircle2}
                >
                  Confirm Event Registration
                </Button>
              )
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
