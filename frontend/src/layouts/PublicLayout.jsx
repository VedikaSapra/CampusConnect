import { Outlet, useLocation } from 'react-router-dom';
import { AuroraNavbar } from '../components/navigation/AuroraNavbar';
import { AuroraFooter } from '../components/navigation/AuroraFooter';

export const PublicLayout = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-[#ECEEF4] dark:bg-[#11101A] text-[#1D1830] dark:text-[#F5F3FF] transition-colors duration-200 overflow-x-hidden">
      <AuroraNavbar />
      <main className="flex-1 bg-[#ECEEF4] dark:bg-[#11101A] transition-colors duration-200">
        {isLandingPage ? (
          <Outlet />
        ) : (
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <Outlet />
          </div>
        )}
      </main>
      <AuroraFooter />
    </div>
  );
};
