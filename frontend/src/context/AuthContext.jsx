import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('cc_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [tokens, setTokens] = useState(() => {
    try {
      const savedTokens = localStorage.getItem('cc_tokens');
      return savedTokens ? JSON.parse(savedTokens) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Sync profile when token is active
  useEffect(() => {
    const verifyUser = async () => {
      if (tokens?.access) {
        try {
          const res = await api.get('/auth/profile/');
          setUser(res.data);
          localStorage.setItem('cc_user', JSON.stringify(res.data));
        } catch (err) {
          console.error('Failed to sync user profile:', err);
        }
      }
      setLoading(false);
    };
    verifyUser();
  }, [tokens]);

  /**
   * Unified login: Validates email and password.
   * If 2FA OTP is required, returns { requires_otp: true, email: ... }
   * If tokens are issued directly, sets user and returns user data.
   */
  const login = async (email, password) => {
    const res = await api.post('/auth/login/', { email, password });
    if (res.data?.requires_otp) {
      return res.data;
    }
    const { user: userData, tokens: tokenData } = res.data;
    if (userData && tokenData) {
      setUser(userData);
      setTokens(tokenData);
      localStorage.setItem('cc_user', JSON.stringify(userData));
      localStorage.setItem('cc_tokens', JSON.stringify(tokenData));
    }
    return res.data;
  };

  /**
   * Completes login or registration verification using 6-digit OTP
   */
  const verifyOTP = async (email, otp, purpose = 'login') => {
    const res = await api.post('/auth/otp/verify/', { email, otp, purpose });
    if (res.data?.tokens && res.data?.user) {
      setUser(res.data.user);
      setTokens(res.data.tokens);
      localStorage.setItem('cc_user', JSON.stringify(res.data.user));
      localStorage.setItem('cc_tokens', JSON.stringify(res.data.tokens));
    }
    return res.data;
  };

  /**
   * Resends verification code
   */
  const resendOTP = async (email, purpose = 'login') => {
    const res = await api.post('/auth/otp/resend/', { email, purpose });
    return res.data;
  };

  /**
   * Role-specific registration handlers
   */
  const registerStudent = async (data) => {
    const res = await api.post('/auth/register/student/', data);
    return res.data;
  };

  const registerClubAdmin = async (data) => {
    const res = await api.post('/auth/register/club-admin/', data);
    return res.data;
  };

  const registerSuperAdmin = async (data) => {
    const res = await api.post('/auth/register/super-admin/', data);
    return res.data;
  };

  /**
   * Google OAuth verification
   */
  const loginWithGoogle = async (credential) => {
    const res = await api.post('/auth/google/', { credential });
    const { user: userData, tokens: tokenData } = res.data;
    if (userData && tokenData) {
      setUser(userData);
      setTokens(tokenData);
      localStorage.setItem('cc_user', JSON.stringify(userData));
      localStorage.setItem('cc_tokens', JSON.stringify(tokenData));
    }
    return res.data;
  };

  /**
   * Password recovery
   */
  const forgotPassword = async (email) => {
    const res = await api.post('/auth/password/forgot/', { email });
    return res.data;
  };

  const resetPassword = async (payload) => {
    const res = await api.post('/auth/password/reset/', payload);
    return res.data;
  };

  const logout = async () => {
    try {
      if (tokens?.refresh) {
        await api.post('/auth/logout/', { refresh: tokens.refresh });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setTokens(null);
      localStorage.removeItem('cc_user');
      localStorage.removeItem('cc_tokens');
    }
  };

  const updateProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('cc_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      tokens, 
      loading, 
      login, 
      verifyOTP, 
      resendOTP,
      registerStudent,
      registerClubAdmin,
      registerSuperAdmin,
      loginWithGoogle,
      forgotPassword,
      resetPassword,
      logout, 
      updateProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
