import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MainLayout } from './MainLayout';
import { PublicLayout } from './PublicLayout';

/**
 * AdaptiveLayout:
 * - If user is logged in, renders inside MainLayout with role-specific Sidebar preserved!
 * - If user is a public guest, renders inside PublicLayout with Aurora public navigation & footer.
 */
export const AdaptiveLayout = () => {
  const { user } = useAuth();

  if (user) {
    return <MainLayout />;
  }

  return <PublicLayout />;
};
