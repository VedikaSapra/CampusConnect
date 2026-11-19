import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  MapPin, Clock, Users, Sparkles, Filter 
} from 'lucide-react';
import { Badge, Button } from '../../components/common/UIComponents';

export const EventCalendar = () => {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events/');
        const data = res.data.results || res.data;
        setEvents(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load events for calendar', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Calendar math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Get events on a specific day
  const getEventsForDay = (day) => {
    return events.filter((e) => {
      const eDate = new Date(e.event_date);
      return (
        eDate.getFullYear() === year &&
        eDate.getMonth() === month &&
        eDate.getDate() === day
      );
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Badge variant="electric">CAMPUS SCHEDULE</Badge>
          <h1 className="text-2xl font-extrabold text-[#211B35] dark:text-white mt-1">
            Interactive Event Calendar
          </h1>
          <p className="text-xs text-[#77738B] dark:text-slate-400">
            Track university workshops, competitions, and society meetups across the academic semester.
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center space-x-3 bg-white dark:bg-[#1E1833] p-1.5 rounded-2xl border border-[#E9E5F2] dark:border-purple-900/40 shadow-xs">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl text-slate-500 hover:text-[#5141B8] hover:bg-[#F3EEFF] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-[#34246F] dark:text-white min-w-[130px] text-center">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl text-slate-500 hover:text-[#5141B8] hover:bg-[#F3EEFF] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Calendar Grid */}
      <div className="bg-white dark:bg-[#1E1833] rounded-3xl border border-[#E9E5F2] dark:border-purple-900/40 p-6 shadow-xs overflow-hidden">
        
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 mb-3 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {d}
            </div>
          ))}
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7 gap-2">
          {/* Leading empty days */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[90px] rounded-2xl bg-slate-50/50 dark:bg-purple-950/10 border border-transparent" />
          ))}

          {/* Actual Month Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = getEventsForDay(day);
            const isToday =
              new Date().getFullYear() === year &&
              new Date().getMonth() === month &&
              new Date().getDate() === day;

            return (
              <div
                key={day}
                className={`min-h-[90px] p-2 rounded-2xl border transition-all flex flex-col justify-between ${
                  isToday
                    ? 'border-[#8B5CF6] bg-[#F3EEFF]/40 dark:bg-purple-900/20'
                    : 'border-[#E9E5F2] dark:border-purple-900/20 bg-white dark:bg-[#251E3E] hover:border-[#8B5CF6]/50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                      isToday
                        ? 'bg-[#8B5CF6] text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {day}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5141B8]" />
                  )}
                </div>

                {/* Day events pills */}
                <div className="space-y-1 mt-1 overflow-hidden">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className="w-full text-left truncate text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#F3EEFF] dark:bg-purple-950/50 text-[#5141B8] dark:text-purple-300 hover:bg-[#8B5CF6] hover:text-white transition-colors"
                      title={ev.title}
                    >
                      {ev.title}
                    </button>
                  ))}
                  {dayEvents.length > 2 && (
                    <p className="text-[9px] text-slate-400 font-bold px-1">
                      +{dayEvents.length - 2} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Selected Event Details Card */}
      {selectedEvent && (
        <div className="bg-[#F3EEFF] dark:bg-purple-950/40 p-6 rounded-3xl border border-[#E8DEFF] dark:border-purple-900/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in">
          <div>
            <div className="flex items-center space-x-2">
              <Badge variant="primary">{selectedEvent.category}</Badge>
              <span className="text-xs font-bold text-[#8B5CF6]">{selectedEvent.club_name}</span>
            </div>
            <h3 className="text-lg font-bold text-[#34246F] dark:text-white mt-2">
              {selectedEvent.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center space-x-3">
              <span>{selectedEvent.venue}</span>
              <span>•</span>
              <span>{new Date(selectedEvent.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </p>
          </div>
          <Link to="/events">
            <Button size="sm">Go to Event Details</Button>
          </Link>
        </div>
      )}

    </div>
  );
};
