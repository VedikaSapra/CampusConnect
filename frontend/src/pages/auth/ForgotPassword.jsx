import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { Mail, Lock, Eye, EyeOff, KeyRound, ArrowRight, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/common/UIComponents';

export const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Reset with OTP
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { forgotPassword, resetPassword } = useAuth();
  const { toast } = useNotification();
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      toast.success('If an account exists, a recovery code has been sent to your email.');
      setStep(2);
    } catch (err) {
      toast.error('Unable to process recovery request.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword({
        email,
        otp,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      toast.success('Password updated successfully! Please sign in with your new password.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Password reset failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-[#11101A] transition-colors">
      {/* Left Aurora Brand */}
      <div className="hidden lg:flex lg:col-span-5 aurora-hero-bg text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between z-10">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">CampusConnect</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="space-y-6 z-10">
          <span className="text-xs font-bold uppercase tracking-widest text-purple-200 bg-white/10 px-3 py-1 rounded-full">
            Account Recovery
          </span>
          <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight">
            Regain secure access to your student profile.
          </h2>
          <p className="text-sm text-purple-100/90 leading-relaxed">
            Verify your registered identity with a short-lived recovery token sent directly to your university email.
          </p>
        </div>

        <p className="text-xs text-purple-300 z-10">
          © {new Date().getFullYear()} CampusConnect. All rights reserved.
        </p>
      </div>

      {/* Right Form Panel */}
      <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-12 lg:p-16">
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
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#F3EEFF] dark:bg-[#29243B] text-[#5141B8] dark:text-[#A78BFA] flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#211B35] dark:text-[#F5F3FF]">
              {step === 1 ? 'Forgot your password?' : 'Reset your password'}
            </h2>
            <p className="text-sm text-[#77738B] dark:text-[#B3ADC7] mt-1">
              {step === 1 
                ? 'Enter your registered email address and we will dispatch a recovery code.'
                : `Enter the code sent to ${email} along with your new password.`}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1.5 tracking-wider">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@campusconnect.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-[#F8F7FC] dark:bg-[#191726] text-sm focus:ring-2 focus:ring-[#8B5CF6] text-[#211B35] dark:text-[#F5F3FF] outline-none shadow-xs"
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                loading={loading}
                className="w-full"
                icon={ArrowRight}
              >
                Send Recovery Code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1.5 tracking-wider">
                  6-Digit Recovery Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-[#F8F7FC] dark:bg-[#191726] text-sm text-center font-mono font-bold tracking-widest focus:ring-2 focus:ring-[#8B5CF6] text-[#211B35] dark:text-[#F5F3FF] outline-none shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1.5 tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-[#F8F7FC] dark:bg-[#191726] text-sm focus:ring-2 focus:ring-[#8B5CF6] text-[#211B35] dark:text-[#F5F3FF] outline-none shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1.5 tracking-wider">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-[#F8F7FC] dark:bg-[#191726] text-sm focus:ring-2 focus:ring-[#8B5CF6] text-[#211B35] dark:text-[#F5F3FF] outline-none shadow-xs"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                loading={loading}
                className="w-full"
                icon={CheckCircle2}
              >
                Reset Password
              </Button>
            </form>
          )}

          <div className="pt-2 text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5141B8] dark:text-[#A78BFA] hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to sign in</span>
            </Link>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 pt-6">
          CampusConnect Platform • Identity Protection
        </div>
      </div>
    </div>
  );
};
