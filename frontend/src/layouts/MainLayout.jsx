import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { useAuth } from '../context/AuthContext';

export const MainLayout = ({ roleRequired }) => {
  const { user } = useAuth();
  const effectiveRole = roleRequired || user?.role;

  return (
    <div className="min-h-screen bg-[#ECEEF4] dark:bg-[#11101A] text-[#1D1830] dark:text-[#F5F3FF] flex flex-col transition-colors duration-200">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {user && <Sidebar role={effectiveRole} />}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto bg-[#ECEEF4] dark:bg-[#11101A] transition-colors duration-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
