import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { OTPVerificationForm } from '../../components/auth/OTPVerificationForm';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { 
  LogIn, Sparkles, Mail, Lock, Eye, EyeOff, 
  CheckCircle2, ArrowRight, ArrowLeft, ShieldCheck, KeyRound
} from 'lucide-react';
import { Button } from '../../components/common/UIComponents';

export const AuroraLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // 2FA OTP state
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState('login');

  const { login, verifyOTP, resendOTP } = useAuth();
  const { toast } = useNotification();
  const navigate = useNavigate();

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(email, password);

      if (res?.requires_otp) {
        setRequiresOtp(true);
        setOtpPurpose(res.purpose || 'login');
        toast.info(res.message || 'Verification code sent to your email.');
        return;
      }

      // If tokens issued directly
      redirectUser(res);
    } catch (err) {
      const errorMsg = 
        err.response?.data?.error ||
        err.response?.data?.non_field_errors?.[0] || 
        err.response?.data?.detail || 
        'Invalid email or password combination.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (code) => {
    const res = await verifyOTP(email, code, otpPurpose);
    toast.success(`Verification complete! Welcome back, ${res.user?.first_name || 'Member'}!`);
    redirectUser(res.user);
  };

  const handleResendOTP = async () => {
    await resendOTP(email, otpPurpose);
    toast.success('A new verification code has been dispatched.');
  };

  const redirectUser = (userObj) => {
    if (!userObj) return;
    if (userObj.role === 'super_admin') navigate('/admin/dashboard');
    else if (userObj.role === 'club_admin') navigate('/club-admin/dashboard');
    else navigate('/student/dashboard');
  };

  const handleQuickLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setRequiresOtp(false);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-[#11101A] transition-colors">
      
      {/* Left Aurora Branded Panel (Desktop) */}
      <div className="hidden lg:flex lg:col-span-5 aurora-hero-bg text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-purple-400/20 blur-3xl pointer-events-none" />

        {/* Brand Header & Theme Toggle */}
        <div className="flex items-center justify-between z-10">
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-md group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">CampusConnect</span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Value statement */}
        <div className="space-y-6 z-10">
          <span className="text-xs font-bold uppercase tracking-widest text-purple-200 bg-white/10 px-3 py-1 rounded-full">
            Your Campus. Your People. Your Moments.
          </span>
          <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight">
            Discover communities and connect with fellow students.
          </h2>
          <p className="text-sm text-purple-100/90 leading-relaxed">
            One secure collegiate identity connects you directly to student societies, live QR event check-ins, campus group chats, and college-wide announcements.
          </p>

          <div className="space-y-3 pt-2 text-xs text-purple-200">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Two-step encrypted authentication with Email OTP</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Role-governed student, club leader, and administrator access</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Instant Google OAuth 2.0 single sign-on</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <p className="text-xs text-purple-300 z-10">
          © {new Date().getFullYear()} CampusConnect Aurora Platform.
        </p>
      </div>

      {/* Right Login / OTP Form Panel */}
      <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-12 lg:p-16">
        {/* Mobile Header */}
        <div className="flex items-center justify-between lg:hidden mb-6">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#34246F] to-[#8B5CF6] flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-[#211B35] dark:text-[#F5F3FF]">CampusConnect</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="max-w-md w-full mx-auto my-auto space-y-7">
          {/* Back to Home Navigation */}
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#77738B] dark:text-[#B3ADC7] hover:text-[#5141B8] dark:hover:text-[#A78BFA] transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Home</span>
            </Link>
          </div>
          
          {requiresOtp ? (
            /* STEP 2: 2FA OTP VERIFICATION */
            <OTPVerificationForm
              email={email}
              purpose={otpPurpose}
              onVerify={handleVerifyOTP}
              onResend={handleResendOTP}
              onBack={() => setRequiresOtp(false)}
            />
          ) : (
            /* STEP 1: PASSWORD + GOOGLE SIGN-IN */
            <>
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#211B35] dark:text-[#F5F3FF] tracking-tight">
                  Sign in to CampusConnect
                </h2>
                <p className="text-sm text-[#77738B] dark:text-[#B3ADC7] mt-2">
                  New to CampusConnect?{' '}
                  <Link to="/register" className="font-bold text-[#5141B8] dark:text-[#A78BFA] hover:underline">
                    Create your profile
                  </Link>
                </p>
              </div>

              {/* Google Sign-In */}
              <div className="space-y-4">
                <GoogleSignInButton text="signin_with" />

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-[#E9E5F2] dark:border-[#383248] w-full" />
                  <span className="bg-white dark:bg-[#11101A] px-3 text-xs uppercase font-bold text-[#77738B] dark:text-[#B3ADC7] tracking-wider absolute">
                    Or sign in with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1.5 tracking-wider">
                    Email Address or Username
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@campusconnect.edu"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-[#F8F7FC] dark:bg-[#191726] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] text-[#211B35] dark:text-[#F5F3FF] transition-all shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] tracking-wider">
                      Password
                    </label>
                    <Link to="/forgot-password" className="text-xs text-[#5141B8] dark:text-[#A78BFA] hover:underline font-semibold">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-[#F8F7FC] dark:bg-[#191726] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] text-[#211B35] dark:text-[#F5F3FF] transition-all shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="remember_me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#5141B8] rounded border-slate-300 focus:ring-[#5141B8]"
                  />
                  <label htmlFor="remember_me" className="text-xs text-[#77738B] dark:text-[#B3ADC7] cursor-pointer">
                    Remember my credentials on this device
                  </label>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  loading={loading}
                  className="w-full"
                  icon={LogIn}
                >
                  Verify Credentials
                </Button>
              </form>

              {/* Instant Quick Demo Logins Container */}
              <div className="border-t border-[#E9E5F2] dark:border-[#383248] pt-5 space-y-2.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                  One-Click Demo Credentials
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('alice@student.edu', 'Student@1234')}
                    className="p-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-[#F8F7FC] dark:bg-[#211E30] text-center hover:border-[#8B5CF6] transition-all cursor-pointer shadow-xs"
                  >
                    <p className="text-xs font-bold text-[#5141B8] dark:text-[#A78BFA]">Student</p>
                    <p className="text-[10px] text-slate-400 truncate">alice@student</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('techadmin@campusconnect.edu', 'Admin@1234')}
                    className="p-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-[#F8F7FC] dark:bg-[#211E30] text-center hover:border-[#8B5CF6] transition-all cursor-pointer shadow-xs"
                  >
                    <p className="text-xs font-bold text-[#8B5CF6]">Club Admin</p>
                    <p className="text-[10px] text-slate-400 truncate">techadmin</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin@campusconnect.edu', 'Admin@1234')}
                    className="p-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-[#F8F7FC] dark:bg-[#211E30] text-center hover:border-[#8B5CF6] transition-all cursor-pointer shadow-xs"
                  >
                    <p className="text-xs font-bold text-[#27A66B] dark:text-[#42C98A]">Super Admin</p>
                    <p className="text-[10px] text-slate-400 truncate">admin</p>
                  </button>
                </div>
              </div>
            </>
          )}

        </div>

        <div className="text-center text-xs text-slate-400 pt-6">
          Protected by CampusConnect Aurora Security • Encrypted Sessions
        </div>
      </div>

    </div>
  );
};
