import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, AlertCircle } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'super_admin') navigate('/admin/dashboard');
      else if (user.role === 'club_admin') navigate('/club-admin/dashboard');
      else navigate('/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.non_field_errors?.[0] || err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex p-3 bg-indigo-600 text-white rounded-2xl shadow-md mb-3">
          <LogIn className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Sign in to CampusConnect</h2>
        <p className="mt-2 text-sm text-slate-600">
          Or{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            create a student account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 sm:rounded-2xl sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-center space-x-2 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="you@campusconnect.edu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="••••••••"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-xs text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          {/* Quick Demo Logins Helper */}
          <div className="mt-6 border-t border-slate-200 pt-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Credentials (Demo)</p>
            <div className="space-y-2 text-xs">
              <button 
                type="button" 
                onClick={() => { setEmail('admin@campusconnect.edu'); setPassword('Admin@1234'); }}
                className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 flex justify-between border border-slate-200"
              >
                <span className="font-semibold text-slate-700">Super Admin</span>
                <span className="text-slate-500">admin@campusconnect.edu</span>
              </button>
              <button 
                type="button" 
                onClick={() => { setEmail('techadmin@campusconnect.edu'); setPassword('Admin@1234'); }}
                className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 flex justify-between border border-slate-200"
              >
                <span className="font-semibold text-slate-700">Club Admin</span>
                <span className="text-slate-500">techadmin@campusconnect.edu</span>
              </button>
              <button 
                type="button" 
                onClick={() => { setEmail('alice@student.edu'); setPassword('Student@1234'); }}
                className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 flex justify-between border border-slate-200"
              >
                <span className="font-semibold text-slate-700">Student</span>
                <span className="text-slate-500">alice@student.edu</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
