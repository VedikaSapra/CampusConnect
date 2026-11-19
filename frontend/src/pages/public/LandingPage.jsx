import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import { 
  Sparkles, ArrowRight, Calendar, Users, Award, 
  CheckCircle2, Compass, ShieldCheck, Zap, ChevronRight, Star
} from 'lucide-react';
import { Button, Badge } from '../../components/common/UIComponents';

export const LandingPage = () => {
  const [stats, setStats] = useState({
    students: 1250,
    clubs: 24,
    events: 48,
    registrations: 3400
  });

  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [popularClubs, setPopularClubs] = useState([]);

  useEffect(() => {
    // Fetch live platform preview data
    const fetchLandingData = async () => {
      try {
        const [eventsRes, clubsRes] = await Promise.all([
          api.get('/events/', { params: { upcoming: 'true' } }),
          api.get('/clubs/'),
        ]);
        const events = eventsRes.data.results || eventsRes.data;
        const clubs = clubsRes.data.results || clubsRes.data;

        if (Array.isArray(events) && events.length > 0) setFeaturedEvents(events.slice(0, 3));
        if (Array.isArray(clubs) && clubs.length > 0) setPopularClubs(clubs.slice(0, 3));
      } catch (err) {
        console.error('Could not load live landing data', err);
      }
    };
    fetchLandingData();
  }, []);

  return (
    <div className="space-y-24 pb-20 overflow-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 lg:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Text */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-6 text-center lg:text-left"
          >
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#F3EEFF] dark:bg-purple-950/50 border border-[#E8DEFF] dark:border-purple-800/40 text-xs font-bold text-[#5141B8] dark:text-purple-300">
              <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Next-Gen Campus Community Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#211B35] dark:text-white leading-[1.1] tracking-tight">
              Your Campus. <br />
              <span className="bg-gradient-to-r from-[#5141B8] via-[#8B5CF6] to-[#A855F7] bg-clip-text text-transparent">
                Your People.
              </span> <br />
              Your Moments.
            </h1>

            <p className="text-base sm:text-lg text-[#77738B] dark:text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Discover student clubs, reserve seats for workshops and hackathons, receive real-time campus notices, and never miss an experience happening around university.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link to="/events" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto" icon={Calendar}>
                  Explore Events
                </Button>
              </Link>
              <Link to="/register" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto" icon={Users}>
                  Join Your Community
                </Button>
              </Link>
            </div>

            {/* Micro proof badges */}
            <div className="pt-6 flex items-center justify-center lg:justify-start space-x-6 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#27A66B]" />
                <span>Verified Students</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#27A66B]" />
                <span>Official Societies</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#27A66B]" />
                <span>Digital Passports</span>
              </div>
            </div>
          </motion.div>

          {/* Right Hero Graphic Showcase */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative mx-auto max-w-md">
              
              {/* Aurora Glow backdrop */}
              <div className="absolute -inset-4 bg-gradient-to-r from-[#5141B8]/20 via-[#8B5CF6]/30 to-[#A855F7]/20 rounded-3xl blur-2xl -z-10" />

              {/* Main Overlapping Card: Live Event Spotlight */}
              <div className="bg-white dark:bg-[#1E1833] rounded-3xl p-6 shadow-xl border border-[#E9E5F2] dark:border-purple-900/40 relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="electric">FEATURED HACKATHON</Badge>
                  <span className="text-xs font-bold text-[#27A66B] bg-[#F2FAF6] px-2.5 py-1 rounded-md">Live Registration</span>
                </div>

                <div className="h-40 rounded-2xl bg-gradient-to-tr from-[#34246F] via-[#5141B8] to-[#8B5CF6] p-5 text-white flex flex-col justify-between shadow-inner">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/20 backdrop-blur-md">Tech & Innovation</span>
                    <span className="text-xs font-bold">24 Hours</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Annual Campus Hackathon 2025</h3>
                    <p className="text-xs text-purple-200 mt-1">Computer Science Society • Main Auditorium</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="flex -space-x-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white">RS</div>
                    <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white">AJ</div>
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white">PK</div>
                  </div>
                  <span className="text-xs font-bold text-[#5141B8] dark:text-purple-300">48 seats reserved</span>
                </div>
              </div>

              {/* Floating Mini Card 1 */}
              <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-6 -right-6 bg-white dark:bg-[#251E3E] p-3.5 rounded-2xl shadow-lg border border-[#E9E5F2] dark:border-purple-900/50 flex items-center space-x-3 z-20"
              >
                <div className="w-9 h-9 rounded-xl bg-[#F3EEFF] text-[#5141B8] flex items-center justify-center font-bold">
                  <Award className="w-5 h-5 text-[#8B5CF6]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#211B35] dark:text-white">Membership Approved</p>
                  <p className="text-[10px] text-slate-400">CodeCraft Technical Club</p>
                </div>
              </motion.div>

              {/* Floating Mini Card 2 */}
              <motion.div 
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -bottom-6 -left-6 bg-white dark:bg-[#251E3E] p-3.5 rounded-2xl shadow-lg border border-[#E9E5F2] dark:border-purple-900/50 flex items-center space-x-3 z-20"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#27A66B] flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5 text-[#27A66B]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#211B35] dark:text-white">Digital Ticket Verified</p>
                  <p className="text-[10px] text-slate-400">Entry Confirmed via QR</p>
                </div>
              </motion.div>

            </div>
          </motion.div>

        </div>
      </section>

      {/* 2. STATS BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#34246F] via-[#5141B8] to-[#8B5CF6] rounded-3xl p-8 sm:p-10 text-white shadow-xl grid grid-cols-2 lg:grid-cols-4 gap-8 divide-y sm:divide-y-0 sm:divide-x divide-purple-400/20 text-center">
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">1,200+</p>
            <p className="text-xs sm:text-sm text-purple-200 font-medium uppercase tracking-wider">Active Students</p>
          </div>
          <div className="space-y-1 pt-6 sm:pt-0">
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">15+</p>
            <p className="text-xs sm:text-sm text-purple-200 font-medium uppercase tracking-wider">Campus Societies</p>
          </div>
          <div className="space-y-1 pt-6 sm:pt-0">
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">60+</p>
            <p className="text-xs sm:text-sm text-purple-200 font-medium uppercase tracking-wider">Events Organized</p>
          </div>
          <div className="space-y-1 pt-6 sm:pt-0">
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">100%</p>
            <p className="text-xs sm:text-sm text-purple-200 font-medium uppercase tracking-wider">Verified Community</p>
          </div>
        </div>
      </section>

      {/* 3. FEATURED UPCOMING EVENTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <Badge variant="electric">CAMPUS CALENDAR</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#211B35] dark:text-white mt-2">
              Featured Events & Workshops
            </h2>
            <p className="text-sm text-[#77738B] dark:text-slate-400 mt-1">
              Top-rated experiences organized by student clubs this month.
            </p>
          </div>
          <Link to="/events">
            <Button variant="ghost" size="sm" icon={ChevronRight}>
              View All Events
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(featuredEvents.length > 0 ? featuredEvents : [
            {
              id: 1,
              title: 'Python & AI Bootcamp 2025',
              category: 'workshop',
              club_name: 'CodeCraft Club',
              venue: 'Lab Block A',
              event_date: new Date(Date.now() + 86400000 * 4).toISOString(),
              available_seats: 18,
              capacity: 50
            },
            {
              id: 2,
              title: 'Inter-College Cultural Fiesta',
              category: 'cultural',
              club_name: 'Cultural Society',
              venue: 'Main Auditorium',
              event_date: new Date(Date.now() + 86400000 * 9).toISOString(),
              available_seats: 120,
              capacity: 300
            },
            {
              id: 3,
              title: 'Startup Pitch & Mentorship Night',
              category: 'entrepreneurship',
              club_name: 'E-Cell',
              venue: 'Seminar Hall 2',
              event_date: new Date(Date.now() + 86400000 * 14).toISOString(),
              available_seats: 25,
              capacity: 60
            }
          ]).map((evt) => (
            <div 
              key={evt.id} 
              className="bg-white dark:bg-[#1E1833] rounded-2xl border border-[#E9E5F2] dark:border-purple-900/40 p-6 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Badge variant="primary">{evt.category}</Badge>
                  <span className="text-xs font-semibold text-[#8B5CF6]">{evt.club_name}</span>
                </div>
                <h3 className="text-lg font-bold text-[#211B35] dark:text-white group-hover:text-[#5141B8] dark:group-hover:text-purple-300 transition-colors">
                  {evt.title}
                </h3>
                <div className="mt-4 space-y-2 text-xs text-[#77738B] dark:text-slate-400">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-[#8B5CF6]" />
                    <span>{new Date(evt.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Compass className="w-4 h-4 text-[#8B5CF6]" />
                    <span>{evt.venue}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-purple-900/30 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#27A66B]">
                  {evt.available_seats} seats remaining
                </span>
                <Link to="/events">
                  <Button size="sm">Register Now</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. WHY CAMPUSCONNECT (4 CORE VALUE PROPS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="electric">THE CAMPUSCONNECT ADVANTAGE</Badge>
          <h2 className="text-3xl font-extrabold text-[#211B35] dark:text-white">
            Everything your student life needs in one portal.
          </h2>
          <p className="text-sm text-[#77738B] dark:text-slate-400">
            Built specifically to solve disjointed WhatsApp groups, missing noticeboards, and messy event attendance spreadsheets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Compass,
              title: 'Discover Communities',
              desc: 'Browse approved technical, cultural, sports, and social societies with verified student leadership.'
            },
            {
              icon: Calendar,
              title: 'Instant Reservations',
              desc: 'Register for workshops with live capacity checking and automatic digital verification tickets.'
            },
            {
              icon: Zap,
              title: 'Official Bulletins',
              desc: 'Receive direct administrative and club notices without noise, spam, or lost group messages.'
            },
            {
              icon: ShieldCheck,
              title: 'Role-Based Control',
              desc: 'Dedicated role consoles tailored specifically for students, club officers, and university heads.'
            }
          ].map((feature, i) => (
            <div 
              key={i} 
              className="bg-white dark:bg-[#1E1833] p-6 rounded-2xl border border-[#E9E5F2] dark:border-purple-900/40 shadow-xs space-y-4 hover:border-[#8B5CF6]/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F3EEFF] dark:bg-purple-950/60 text-[#5141B8] dark:text-purple-300 flex items-center justify-center font-bold">
                <feature.icon className="w-6 h-6 text-[#8B5CF6]" />
              </div>
              <h3 className="font-bold text-base text-[#211B35] dark:text-white">{feature.title}</h3>
              <p className="text-xs text-[#77738B] dark:text-slate-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. 3-STEP PROCESS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#F3EEFF] dark:bg-[#1A142E] rounded-3xl p-8 sm:p-12 border border-[#E8DEFF] dark:border-purple-900/40 space-y-8">
          <div className="text-center max-w-xl mx-auto">
            <p className="text-xs font-bold text-[#8B5CF6] uppercase tracking-wider">How It Works</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#34246F] dark:text-white mt-1">
              Connect in 3 simple steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-[#211B35] p-6 rounded-2xl shadow-xs space-y-3 relative">
              <span className="w-8 h-8 rounded-full bg-[#5141B8] text-white flex items-center justify-center font-bold text-xs">1</span>
              <h4 className="font-bold text-base text-[#211B35] dark:text-white">Sign Up with College ID</h4>
              <p className="text-xs text-[#77738B] dark:text-slate-400 leading-relaxed">
                Create your student profile in 30 seconds with your department and year of study.
              </p>
            </div>

            <div className="bg-white dark:bg-[#211B35] p-6 rounded-2xl shadow-xs space-y-3 relative">
              <span className="w-8 h-8 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center font-bold text-xs">2</span>
              <h4 className="font-bold text-base text-[#211B35] dark:text-white">Request to Join Clubs</h4>
              <p className="text-xs text-[#77738B] dark:text-slate-400 leading-relaxed">
                Explore campus chapters and submit membership requests with single-click approvals.
              </p>
            </div>

            <div className="bg-white dark:bg-[#211B35] p-6 rounded-2xl shadow-xs space-y-3 relative">
              <span className="w-8 h-8 rounded-full bg-[#A855F7] text-white flex items-center justify-center font-bold text-xs">3</span>
              <h4 className="font-bold text-base text-[#211B35] dark:text-white">Attend & Collect Tickets</h4>
              <p className="text-xs text-[#77738B] dark:text-slate-400 leading-relaxed">
                Reserve workshop seats, receive your digital QR tickets, and submit post-event feedback.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="aurora-hero-bg rounded-3xl p-10 sm:p-14 text-white shadow-2xl space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to experience your campus at full volume?
          </h2>
          <p className="text-sm sm:text-base text-purple-100 max-w-xl mx-auto font-normal">
            Join hundreds of students and campus leaders already discovering, building, and celebrating moments together on CampusConnect.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register">
              <button className="px-6 py-3.5 bg-white text-[#34246F] font-bold rounded-2xl hover:bg-purple-50 transition-colors shadow-lg text-sm w-full sm:w-auto">
                Get Started as a Student
              </button>
            </Link>
            <Link to="/login">
              <button className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl border border-white/20 transition-colors text-sm w-full sm:w-auto">
                Club Officer Login
              </button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
