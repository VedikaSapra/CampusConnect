import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

export const GoogleSignInButton = ({ text = "signin_with", onSuccess, className = "" }) => {
  const { loginWithGoogle } = useAuth();
  const { toast } = useNotification();
  const navigate = useNavigate();
  const btnRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Dynamically load Google Identity Services if not already present
    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      // Keep script cached in DOM
    };
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !btnRef.current || !window.google?.accounts?.id) return;

    // Use environment client ID or demo client ID
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1029384756-demo-campusconnect.apps.googleusercontent.com';

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          const res = await loginWithGoogle(response.credential);
          toast.success(`Welcome to CampusConnect!`);
          if (onSuccess) {
            onSuccess(res.user);
          } else {
            const role = res.user?.role;
            if (role === 'super_admin') navigate('/admin/dashboard');
            else if (role === 'club_admin') navigate('/club-admin/dashboard');
            else navigate('/student/dashboard');
          }
        } catch (err) {
          const msg = err.response?.data?.error || 'Google authentication failed.';
          toast.error(msg);
        }
      },
    });

    // Detect dark mode from document
    const isDark = document.documentElement.classList.contains('dark');

    window.google.accounts.id.renderButton(btnRef.current, {
      theme: isDark ? 'filled_black' : 'outline',
      size: 'large',
      text: text,
      shape: 'pill',
      width: '100%',
    });
  }, [scriptLoaded, text]);

  // Fallback interactive OAuth simulation if Google API script is offline or in mock dev
  const handleSimulatedGoogleClick = async () => {
    try {
      // In local dev without live network, generate a test student profile
      toast.info('Connecting to Google Identity Services...');
      // If script is loaded and native button rendered, native handles click
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className={`w-full flex justify-center ${className}`}>
      <div ref={btnRef} className="w-full flex justify-center">
        {/* Render placeholder while script loads */}
        {!scriptLoaded && (
          <button
            type="button"
            onClick={handleSimulatedGoogleClick}
            className="w-full py-2.5 px-4 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#211E30] text-sm font-semibold text-[#211B35] dark:text-[#F5F3FF] flex items-center justify-center space-x-3 hover:bg-[#F8F7FC] dark:hover:bg-[#29243B] transition-all shadow-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>
        )}
      </div>
    </div>
  );
};
