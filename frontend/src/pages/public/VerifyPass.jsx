import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { 
  CheckCircle2, AlertTriangle, XCircle, Clock, 
  Sparkles, Calendar, MapPin, Users, ShieldCheck, 
  UserCheck, AlertCircle, RefreshCw, ArrowLeft, LogIn 
} from 'lucide-react';
import { Badge, Button } from '../../components/common/UIComponents';

export const VerifyPass = () => {
  const { token } = useParams();
  const { user } = useAuth();
  const { toast } = useNotification();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);

  // Fetch verification details from Django API
  const verifyPassToken = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get(`/events/passes/verify/?token=${token}`);
      setData(res.data);
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData) {
        setData(errorData);
      } else {
        setErrorMsg('Unable to connect to CampusConnect server. Please check your network.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      verifyPassToken();
    }
  }, [token]);

  // Confirm Check-In action (authorized organizers only)
  const handleConfirmCheckIn = async () => {
    setCheckingIn(true);
    try {
      const res = await api.post('/events/passes/check-in/', { token });
      toast.success(res.data.message || 'Check-in recorded successfully!');
      setCheckInSuccess(true);
      // Refresh state to show check-in timestamp
      setData((prev) => ({
        ...prev,
        valid: false,
        status: 'already_used',
        can_check_in: false,
        message: `Pass checked in successfully on ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        pass_data: res.data.pass_data || prev?.pass_data
      }));
    } catch (err) {
      const msg = err.response?.data?.error || 'Check-in failed. Please verify organizer permissions.';
      toast.error(msg);
    } finally {
      setCheckingIn(false);
    }
  };

  // Determine status color & typography
  const getStatusConfig = (status, isValid) => {
    if (isValid || status === 'verified' || checkInSuccess) {
      return {
        bg: 'bg-[#F2FAF6] border-[#B7EAD2]',
        icon: <CheckCircle2 className="w-8 h-8 text-[#27A66B]" />,
        title: checkInSuccess ? 'Successfully Checked In' : 'Registration Verified',
        subtext: checkInSuccess 
          ? 'Attendee entry has been recorded and authorized.' 
          : 'This attendee has a valid and approved registration for this event.',
        badge: 'VALID FOR ENTRY',
        badgeVariant: 'success'
      };
    }
    if (status === 'already_used') {
      return {
        bg: 'bg-[#FEF8ED] border-[#FCE2B8]',
        icon: <AlertTriangle className="w-8 h-8 text-[#E7A33E]" />,
        title: 'Attendee Already Checked In',
        subtext: 'This pass has already been presented and verified for entry.',
        badge: 'PASS ALREADY USED',
        badgeVariant: 'warning'
      };
    }
    if (status === 'pending') {
      return {
        bg: 'bg-[#FEF8ED] border-[#FCE2B8]',
        icon: <Clock className="w-8 h-8 text-[#E7A33E]" />,
        title: 'Registration Pending Approval',
        subtext: 'This registration has not yet been approved by the club organizers.',
        badge: 'PENDING APPROVAL',
        badgeVariant: 'warning'
      };
    }
    if (status === 'cancelled') {
      return {
        bg: 'bg-[#FDF2F4] border-[#F8BCC5]',
        icon: <XCircle className="w-8 h-8 text-[#E05265]" />,
        title: 'Registration Cancelled',
        subtext: 'This registration was cancelled. Entry cannot be granted.',
        badge: 'CANCELLED REGISTRATION',
        badgeVariant: 'error'
      };
    }
    if (status === 'rejected') {
      return {
        bg: 'bg-[#FDF2F4] border-[#F8BCC5]',
        icon: <XCircle className="w-8 h-8 text-[#E05265]" />,
        title: 'Registration Rejected',
        subtext: 'This registration was declined by the event organizer.',
        badge: 'REJECTED PASS',
        badgeVariant: 'error'
      };
    }
    if (status === 'revoked' || status === 'inactive') {
      return {
        bg: 'bg-[#FDF2F4] border-[#F8BCC5]',
        icon: <XCircle className="w-8 h-8 text-[#E05265]" />,
        title: 'Pass Expired / Revoked',
        subtext: 'This digital ticket has expired or was revoked by administrators.',
        badge: 'INVALID PASS',
        badgeVariant: 'error'
      };
    }
    return {
      bg: 'bg-[#FDF2F4] border-[#F8BCC5]',
      icon: <XCircle className="w-8 h-8 text-[#E05265]" />,
      title: 'Invalid Pass',
      subtext: 'This QR code is invalid or does not match any record in CampusConnect.',
      badge: 'UNRECOGNIZED QR CODE',
      badgeVariant: 'error'
    };
  };

  const statusConfig = getStatusConfig(data?.status, data?.valid);
  const pass = data?.pass_data;

  return (
    <div className="min-h-screen bg-[#F8F7FC] dark:bg-[#150F24] flex flex-col justify-between selection:bg-purple-200">
      
      {/* 1. Minimal Header */}
      <header className="bg-white/80 dark:bg-[#1E1833]/90 backdrop-blur-md border-b border-[#E9E5F2] dark:border-purple-900/40 py-4 px-6 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#34246F] to-[#8B5CF6] flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-[#34246F] to-[#8B5CF6] dark:from-white dark:to-purple-300 bg-clip-text text-transparent">
                CampusConnect
              </span>
              <span className="block text-[8px] uppercase tracking-widest font-bold text-[#8B5CF6] -mt-0.5">
                Verification Portal
              </span>
            </div>
          </Link>

          <div className="flex items-center space-x-3 text-xs">
            {user ? (
              <span className="text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
                Signed in as <strong className="text-[#5141B8] dark:text-purple-300">{user.first_name}</strong> ({user.role?.replace('_', ' ')})
              </span>
            ) : (
              <Link to="/login" className="text-[#5141B8] dark:text-purple-300 font-bold hover:underline flex items-center space-x-1">
                <LogIn className="w-3.5 h-3.5" />
                <span>Organizer Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Verification Content */}
      <main className="flex-1 py-8 px-4 sm:px-6 max-w-xl w-full mx-auto space-y-6">
        
        {loading ? (
          <div className="bg-white dark:bg-[#1E1833] rounded-3xl p-10 border border-[#E9E5F2] dark:border-purple-900/40 shadow-xs text-center space-y-4">
            <div className="w-10 h-10 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-bold text-[#211B35] dark:text-white">Verifying Event Pass...</p>
            <p className="text-xs text-slate-400">Validating cryptographic token with campus registration authority...</p>
          </div>
        ) : errorMsg ? (
          <div className="bg-[#FDF2F4] rounded-3xl p-8 border border-[#F8BCC5] text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-[#E05265] mx-auto" />
            <h3 className="text-lg font-bold text-[#211B35]">Connection Error</h3>
            <p className="text-xs text-slate-600">{errorMsg}</p>
            <Button size="sm" onClick={verifyPassToken} icon={RefreshCw}>
              Retry Verification
            </Button>
          </div>
        ) : (
          <>
            {/* Status Banner */}
            <div className={`p-6 sm:p-7 rounded-3xl border shadow-sm space-y-3 ${statusConfig.bg}`}>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-0.5">
                  {statusConfig.icon}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-extrabold text-[#211B35] leading-tight">
                      {statusConfig.title}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {statusConfig.subtext}
                  </p>
                  <div className="mt-2.5">
                    <Badge variant={statusConfig.badgeVariant} size="xs">
                      {statusConfig.badge}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendee & Event Information Card */}
            {pass ? (
              <div className="bg-white dark:bg-[#1E1833] rounded-3xl border border-[#E9E5F2] dark:border-purple-900/40 p-6 sm:p-8 shadow-xs space-y-6">
                
                {/* Event Section */}
                <div className="space-y-3 pb-6 border-b border-slate-100 dark:border-purple-900/30">
                  <div className="flex justify-between items-start">
                    <Badge variant="primary" size="xs">{pass.event_category || 'EVENT'}</Badge>
                    <span className="text-xs font-semibold text-[#8B5CF6]">{pass.club_name}</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-[#211B35] dark:text-white leading-snug">
                    {pass.event_title}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs text-[#77738B] dark:text-slate-400 pt-1">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-[#8B5CF6]" />
                      <span>
                        {new Date(pass.event_date).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-[#8B5CF6]" />
                      <span className="truncate">{pass.event_venue}</span>
                    </div>
                  </div>
                </div>

                {/* Attendee Details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Registered Attendee
                  </h4>

                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#34246F] to-[#8B5CF6] text-white flex items-center justify-center font-extrabold text-lg shadow-sm flex-shrink-0">
                      {pass.student_name?.[0] || 'S'}
                    </div>
                    <div>
                      <p className="text-base font-extrabold text-[#211B35] dark:text-white leading-tight">
                        {pass.student_name}
                      </p>
                      <p className="text-xs text-slate-400">@{pass.student_username}</p>
                      <p className="text-xs text-[#5141B8] dark:text-purple-300 font-semibold mt-0.5">
                        {pass.student_department || 'University Student'} {pass.student_year ? `• Year ${pass.student_year}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Metadata fields */}
                  <div className="pt-2 divide-y divide-slate-100 dark:divide-purple-900/20 text-xs">
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-400">Registration ID:</span>
                      <span className="font-bold text-[#211B35] dark:text-white">#{pass.registration_id?.toString().padStart(6, '0')}</span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-400">Pass Security Token:</span>
                      <span className="font-mono text-slate-500 truncate max-w-[200px]">{pass.verification_token?.slice(0, 16)}...</span>
                    </div>
                    {pass.checked_in_at && (
                      <div className="py-2.5 flex justify-between bg-[#F2FAF6] px-3 rounded-xl mt-2">
                        <span className="text-[#1E7D51] font-semibold">Check-In Time:</span>
                        <span className="font-bold text-[#1E7D51]">{new Date(pass.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Organizer Action Bar */}
                <div className="pt-4 border-t border-slate-100 dark:border-purple-900/30 space-y-3">
                  {data?.valid && !checkInSuccess ? (
                    data?.can_check_in ? (
                      <Button
                        size="lg"
                        loading={checkingIn}
                        onClick={handleConfirmCheckIn}
                        icon={UserCheck}
                        className="w-full"
                      >
                        Confirm Attendee Check-In
                      </Button>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-[#F3EEFF] dark:bg-purple-950/40 border border-[#E8DEFF] dark:border-purple-900/40 text-center space-y-1">
                        <p className="text-xs font-bold text-[#5141B8] dark:text-purple-300">
                          Authorized Organizer Sign-In Required
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Only assigned club officers or super administrators can record event check-in.
                        </p>
                        {!user && (
                          <Link to="/login" className="inline-block pt-1">
                            <Button size="sm" variant="outline">
                              Sign In as Organizer
                            </Button>
                          </Link>
                        )}
                      </div>
                    )
                  ) : checkInSuccess ? (
                    <div className="p-3.5 rounded-2xl bg-[#F2FAF6] border border-[#B7EAD2] text-center text-xs font-bold text-[#1E7D51] flex items-center justify-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Check-In Recorded Successfully</span>
                    </div>
                  ) : null}
                </div>

              </div>
            ) : null}
          </>
        )}

      </main>

      {/* 3. Minimal Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-[#E9E5F2] dark:border-purple-900/30">
        <p>CampusConnect • Official Event Entry & Digital Pass Verification Service</p>
      </footer>

    </div>
  );
};
