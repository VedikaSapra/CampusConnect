import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { RegistrationRoleSelector } from '../../components/auth/RegistrationRoleSelector';
import { OTPVerificationForm } from '../../components/auth/OTPVerificationForm';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { 
  UserPlus, Sparkles, User, Mail, Lock, Eye, EyeOff, 
  GraduationCap, Award, Shield, CheckCircle2, Building2, FileText, ArrowLeft
} from 'lucide-react';
import { Button } from '../../components/common/UIComponents';

export const AuroraRegister = () => {
  const [selectedRole, setSelectedRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP State
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [applicationStatus, setApplicationStatus] = useState(null);

  // Common & Role Fields
  const [formData, setFormData] = useState({
    // General
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password2: '',
    phone: '',

    // Student specific
    student_id: '',
    department: '',
    year_of_study: '1',

    // Club Admin specific
    club_name: '',
    club_category: 'technical',
    club_description: '',
    reason: '',

    // Super Admin specific
    invitation_code: '',
  });

  const { registerStudent, registerClubAdmin, registerSuperAdmin, verifyOTP, resendOTP } = useAuth();
  const { toast } = useNotification();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.password2) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      let res;
      if (selectedRole === 'student') {
        res = await registerStudent({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          student_id: formData.student_id,
          department: formData.department,
          year_of_study: parseInt(formData.year_of_study) || 1,
          password: formData.password,
          password2: formData.password2,
          phone: formData.phone,
        });
      } else if (selectedRole === 'club_admin') {
        res = await registerClubAdmin({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          password2: formData.password2,
          club_name: formData.club_name,
          club_category: formData.club_category,
          club_description: formData.club_description,
          reason: formData.reason,
        });
      } else if (selectedRole === 'super_admin') {
        res = await registerSuperAdmin({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          password: formData.password,
          password2: formData.password2,
          invitation_code: formData.invitation_code,
        });
      }

      setRegisteredEmail(formData.email);
      setRequiresOtp(true);
      toast.info('Verification code dispatched to your email.');
    } catch (err) {
      const data = err.response?.data;
      if (typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        const msg = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey];
        toast.error(`${firstKey}: ${msg}`);
      } else {
        toast.error('Registration failed. Please verify your details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (code) => {
    const res = await verifyOTP(registeredEmail, code, 'register');
    
    if (res.approval_status === 'pending') {
      setApplicationStatus('pending');
      toast.success('Email verified! Your club administrator application is awaiting Super Admin approval.');
      return;
    }

    toast.success('Registration and email verification complete!');
    if (res.user?.role === 'super_admin') navigate('/admin/dashboard');
    else if (res.user?.role === 'club_admin') navigate('/club-admin/dashboard');
    else navigate('/student/dashboard');
  };

  const handleResendOTP = async () => {
    await resendOTP(registeredEmail, 'register');
    toast.success('A new 6-digit verification code has been dispatched.');
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-[#11101A] transition-colors">
      
      {/* Left Aurora Brand Panel */}
      <div className="hidden lg:flex lg:col-span-5 aurora-hero-bg text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-purple-400/20 blur-3xl pointer-events-none" />

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
            Collegiate Onboarding
          </span>
          <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight">
            Choose your campus pathway and get connected.
          </h2>
          <p className="text-sm text-purple-100/90 leading-relaxed">
            Create an official student account, apply for student chapter governance, or activate verified administrative credentials.
          </p>

          <div className="space-y-3 pt-2 text-xs text-purple-200">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Dedicated student, club leader, and administrator workflows</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Email verification with encrypted one-time passwords</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Super Administrator approval queue for club chapters</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-purple-300 z-10">
          © {new Date().getFullYear()} CampusConnect Aurora Platform.
        </p>
      </div>

      {/* Right Form Panel */}
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

        <div className="max-w-xl w-full mx-auto my-auto space-y-6">
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

          {/* APPLICATION PENDING BANNER */}
          {applicationStatus === 'pending' ? (
            <div className="p-8 rounded-3xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#191726] text-center space-y-4 shadow-lg animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-extrabold text-[#211B35] dark:text-[#F5F3FF]">
                Application Under Review
              </h3>
              <p className="text-sm text-[#77738B] dark:text-[#B3ADC7] max-w-md mx-auto leading-relaxed">
                Thank you, <span className="font-bold text-[#211B35] dark:text-[#F5F3FF]">{formData.first_name}</span>. Your email has been verified. Your application to lead <span className="font-bold text-[#5141B8] dark:text-[#A78BFA]">{formData.club_name}</span> is currently queued for institutional review by the Super Administrator.
              </p>
              <div className="p-4 rounded-xl bg-[#F8F7FC] dark:bg-[#211E30] text-xs text-[#77738B] dark:text-[#B3ADC7] space-y-1">
                <p>Status: <span className="font-bold text-amber-600 dark:text-amber-400 uppercase">Awaiting Approval</span></p>
                <p>You will receive notification once access is granted.</p>
              </div>
              <Link to="/login" className="inline-block mt-4">
                <Button variant="outline" size="md">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          ) : requiresOtp ? (
            /* OTP VERIFICATION STEP */
            <OTPVerificationForm
              email={registeredEmail}
              purpose="register"
              onVerify={handleVerifyOTP}
              onResend={handleResendOTP}
              onBack={() => setRequiresOtp(false)}
            />
          ) : (
            /* REGISTRATION FORM */
            <>
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#211B35] dark:text-[#F5F3FF] tracking-tight">
                  Join CampusConnect
                </h2>
                <p className="text-sm text-[#77738B] dark:text-[#B3ADC7] mt-1">
                  Already registered?{' '}
                  <Link to="/login" className="font-bold text-[#5141B8] dark:text-[#A78BFA] hover:underline">
                    Sign in to your account
                  </Link>
                </p>
              </div>

              {/* Step 1: Role Selection Cards */}
              <RegistrationRoleSelector
                selectedRole={selectedRole}
                onSelectRole={setSelectedRole}
              />

              {/* Fast Google Registration for Students */}
              {selectedRole === 'student' && (
                <div className="space-y-4 pt-2">
                  <GoogleSignInButton text="signup_with" />
                  <div className="relative flex items-center justify-center">
                    <div className="border-t border-[#E9E5F2] dark:border-[#383248] w-full" />
                    <span className="bg-white dark:bg-[#11101A] px-3 text-xs uppercase font-bold text-[#77738B] dark:text-[#B3ADC7] tracking-wider absolute">
                      Or complete student profile
                    </span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                {/* Names */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      required
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="Alice"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-[#F8F7FC] dark:bg-[#191726] text-sm focus:ring-2 focus:ring-[#8B5CF6] text-[#211B35] dark:text-[#F5F3FF] shadow-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      required
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="Johnson"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-[#F8F7FC] dark:bg-[#191726] text-sm focus:ring-2 focus:ring-[#8B5CF6] text-[#211B35] dark:text-[#F5F3FF] shadow-xs outline-none"
                    />
                  </div>
                </div>

                {/* College Email */}
                <div>
                  <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                    College Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="student@college.edu"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-[#F8F7FC] dark:bg-[#191726] text-sm focus:ring-2 focus:ring-[#8B5CF6] text-[#211B35] dark:text-[#F5F3FF] shadow-xs outline-none"
                  />
                </div>

                {/* ROLE 1: STUDENT SPECIFIC FIELDS */}
                {selectedRole === 'student' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                          Student ID *
                        </label>
                        <input
                          type="text"
                          name="student_id"
                          required
                          value={formData.student_id}
                          onChange={handleChange}
                          placeholder="CS-2026-081"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-[#F8F7FC] dark:bg-[#191726] text-sm focus:ring-2 focus:ring-[#8B5CF6] text-[#211B35] dark:text-[#F5F3FF] shadow-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                          Department
                        </label>
                        <input
                          type="text"
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          placeholder="Computer Science"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-[#F8F7FC] dark:bg-[#191726] text-sm focus:ring-2 focus:ring-[#8B5CF6] text-[#211B35] dark:text-[#F5F3FF] shadow-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                          Year
                        </label>
                        <select
                          name="year_of_study"
                          value={formData.year_of_study}
                          onChange={handleChange}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-[#F8F7FC] dark:bg-[#191726] text-sm focus:ring-2 focus:ring-[#8B5CF6] text-[#211B35] dark:text-[#F5F3FF] shadow-xs outline-none"
                        >
                          <option value="1">1st Year</option>
                          <option value="2">2nd Year</option>
                          <option value="3">3rd Year</option>
                          <option value="4">4th Year</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* ROLE 2: CLUB ADMIN SPECIFIC FIELDS */}
                {selectedRole === 'club_admin' && (
                  <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#5141B8] dark:text-[#A78BFA]">
                      <Building2 className="w-4 h-4" />
                      <span>Club Leadership Application Details</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                          Club Name *
                        </label>
                        <input
                          type="text"
                          name="club_name"
                          required
                          value={formData.club_name}
                          onChange={handleChange}
                          placeholder="e.g. Robotics & AI Club"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#191726] text-sm focus:ring-2 focus:ring-[#8B5CF6] text-[#211B35] dark:text-[#F5F3FF] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                          Category *
                        </label>
                        <select
                          name="club_category"
                          value={formData.club_category}
                          onChange={handleChange}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#191726] text-sm focus:ring-2 focus:ring-[#8B5CF6] text-[#211B35] dark:text-[#F5F3FF] outline-none"
                        >
                          <option value="technical">Technical</option>
                          <option value="cultural">Cultural</option>
                          <option value="sports">Sports</option>
                          <option value="social">Social Service</option>
                          <option value="academic">Academic</option>
                          <option value="arts">Arts & Media</option>
                          <option value="entrepreneurship">Entrepreneurship</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                        Club Mission / Description *
                      </label>
                      <textarea
                        rows={2}
                        name="club_description"
                        required
                        value={formData.club_description}
                        onChange={handleChange}
                        placeholder="Purpose and key activities of this club..."
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#191726] text-sm focus:ring-2 focus:ring-[#8B5CF6] text-[#211B35] dark:text-[#F5F3FF] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                        Reason for Requesting Administrator Access *
                      </label>
                      <textarea
                        rows={2}
                        name="reason"
                        required
                        value={formData.reason}
                        onChange={handleChange}
                        placeholder="e.g. Elected president of the society for academic year 2026-2027..."
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#191726] text-sm focus:ring-2 focus:ring-[#8B5CF6] text-[#211B35] dark:text-[#F5F3FF] outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* ROLE 3: SUPER ADMIN SPECIFIC FIELDS */}
                {selectedRole === 'super_admin' && (
                  <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      <Shield className="w-4 h-4" />
                      <span>Authorized Super Administrator Provisioning</span>
                    </div>
                    <p className="text-xs text-[#77738B] dark:text-[#B3ADC7]">
                      Super Administrator registration is strictly restricted. An active invitation code created by existing institutional administration is required.
                    </p>

                    <div>
                      <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                        Invitation Token / Code *
                      </label>
                      <input
                        type="text"
                        name="invitation_code"
                        required
                        value={formData.invitation_code}
                        onChange={handleChange}
                        placeholder="CC-ADMIN-XXXXXXXXXXXXXXXX"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#191726] text-sm font-mono focus:ring-2 focus:ring-emerald-500 text-[#211B35] dark:text-[#F5F3FF] outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Passwords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-[#F8F7FC] dark:bg-[#191726] text-sm focus:ring-2 focus:ring-[#8B5CF6] text-[#211B35] dark:text-[#F5F3FF] shadow-xs outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-[#77738B] dark:text-[#B3ADC7] mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password2"
                      required
                      value={formData.password2}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-[#F8F7FC] dark:bg-[#191726] text-sm focus:ring-2 focus:ring-[#8B5CF6] text-[#211B35] dark:text-[#F5F3FF] shadow-xs outline-none"
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <Button
                    type="submit"
                    size="lg"
                    loading={loading}
                    className="w-full"
                    icon={UserPlus}
                  >
                    {selectedRole === 'club_admin' ? 'Submit Club Administrator Application' : 'Create Account & Verify OTP'}
                  </Button>
                </div>
              </form>
            </>
          )}

        </div>

        <div className="text-center text-xs text-slate-400 pt-6">
          CampusConnect Platform • Role-Governed Access
        </div>
      </div>

    </div>
  );
};
