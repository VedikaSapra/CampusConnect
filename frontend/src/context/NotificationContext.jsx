import { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  };

  const showNotification = (msg, type = 'info', dur = 4000) => {
    addToast(msg, type, dur);
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[#27A66B] dark:text-[#42C98A] flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-[#E7A33E] dark:text-[#F2B95E] flex-shrink-0" />,
    error: <XCircle className="w-5 h-5 text-[#E05265] dark:text-[#F07887] flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-[#5141B8] dark:text-[#A78BFA] flex-shrink-0" />,
  };

  const bgStyles = {
    success: 'bg-[#F2FAF6] dark:bg-[#12281D] border-[#B7EAD2] dark:border-[#1E4D38] text-[#1E7D51] dark:text-[#42C98A]',
    warning: 'bg-[#FEF8ED] dark:bg-[#2B200E] border-[#FCE2B8] dark:border-[#523A15] text-[#B87C24] dark:text-[#F2B95E]',
    error: 'bg-[#FDF2F4] dark:bg-[#2E1218] border-[#F8BCC5] dark:border-[#571E28] text-[#AB3344] dark:text-[#F07887]',
    info: 'bg-[#F3EEFF] dark:bg-[#211E30] border-[#D8C7FA] dark:border-[#383248] text-[#5141B8] dark:text-[#A78BFA]',
  };

  return (
    <NotificationContext.Provider value={{ toast, showNotification }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto p-4 rounded-2xl border shadow-xl flex items-start space-x-3 backdrop-blur-md ${bgStyles[t.type] || bgStyles.info}`}
            >
              {icons[t.type] || icons.info}
              <div className="flex-1 text-sm font-semibold leading-snug">{t.message}</div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
