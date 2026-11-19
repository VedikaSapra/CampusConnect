import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Only 'light' or 'dark' – no system default
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('cc_theme_mode');
    // Migrate any old 'system' preference to 'light'
    if (!saved || saved === 'system') return 'light';
    return saved;
  });

  const applyTheme = useCallback((targetTheme) => {
    if (targetTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.style.colorScheme = 'light';
    }
  }, []);

  useEffect(() => {
    // Persist and apply immediately
    localStorage.setItem('cc_theme_mode', mode);
    localStorage.setItem('cc_theme', mode);
    applyTheme(mode);
  }, [mode, applyTheme]);

  const setLight = () => setMode('light');
  const setDark = () => setMode('dark');

  const toggleTheme = () => {
    setMode(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{
      theme: mode,
      mode,
      setMode,
      setLight,
      setDark,
      toggleTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
