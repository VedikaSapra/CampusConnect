import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = ({ compact = false, showLabels = false, className = '' }) => {
  const { mode, setLight, setDark } = useTheme();

  const isDark = mode === 'dark';

  return (
    <button
      type="button"
      onClick={() => isDark ? setLight() : setDark()}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`flex items-center gap-1.5 p-2 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#211E30] text-[#211B35] dark:text-[#F5F3FF] hover:bg-[#F3EEFF] dark:hover:bg-[#29243B] transition-all shadow-xs cursor-pointer ${className}`}
    >
      {isDark
        ? <Sun className="w-4 h-4 text-amber-400" />
        : <Moon className="w-4 h-4 text-[#8B5CF6]" />
      }
      {showLabels && (
        <span className="text-xs font-semibold">{isDark ? 'Light' : 'Dark'}</span>
      )}
    </button>
  );
};
