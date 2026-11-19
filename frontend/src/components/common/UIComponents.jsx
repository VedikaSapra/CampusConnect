import { motion } from 'framer-motion';

export const Badge = ({ children, variant = 'primary', size = 'sm', className = '' }) => {
  const variants = {
    primary: 'bg-[#F3EEFF] dark:bg-[#29243B] text-[#5141B8] dark:text-[#A78BFA] border border-[#E8DEFF] dark:border-[#383248]',
    purple: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40',
    electric: 'bg-[#8B5CF6]/10 text-[#8B5CF6] dark:text-[#C084FC] border border-[#8B5CF6]/30',
    success: 'bg-[#F2FAF6] dark:bg-[#12281D] text-[#27A66B] dark:text-[#42C98A] border border-[#B7EAD2] dark:border-[#1E4D38]',
    warning: 'bg-[#FEF8ED] dark:bg-[#2B200E] text-[#E7A33E] dark:text-[#F2B95E] border border-[#FCE2B8] dark:border-[#523A15]',
    error: 'bg-[#FDF2F4] dark:bg-[#2E1218] text-[#E05265] dark:text-[#F07887] border border-[#F8BCC5] dark:border-[#571E28]',
    neutral: 'bg-slate-100 dark:bg-[#211E30] text-slate-700 dark:text-[#B3ADC7] border border-slate-200 dark:border-[#383248]',
  };

  const sizes = {
    xs: 'px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
    sm: 'px-2.5 py-1 text-xs font-semibold',
    md: 'px-3 py-1.5 text-sm font-medium',
  };

  return (
    <span className={`inline-flex items-center rounded-lg ${variants[variant] || variants.primary} ${sizes[size] || sizes.sm} ${className}`}>
      {children}
    </span>
  );
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  const variants = {
    primary: 'aurora-gradient-btn text-white font-semibold shadow-xs',
    secondary: 'bg-white dark:bg-[#211E30] text-[#34246F] dark:text-[#F5F3FF] border border-[#E9E5F2] dark:border-[#383248] hover:bg-[#F3EEFF] dark:hover:bg-[#29243B] hover:border-[#D8C7FA]',
    ghost: 'text-[#77738B] dark:text-[#B3ADC7] hover:text-[#5141B8] dark:hover:text-[#A78BFA] hover:bg-[#F3EEFF] dark:hover:bg-[#29243B]',
    danger: 'bg-red-50 dark:bg-red-950/20 text-[#E05265] dark:text-[#F07887] border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/30',
    outline: 'border-2 border-[#5141B8] dark:border-[#8B7CF6] text-[#5141B8] dark:text-[#8B7CF6] hover:bg-[#5141B8] hover:text-white dark:hover:bg-[#8B7CF6] dark:hover:text-[#11101A]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-xl',
    md: 'px-4 py-2 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-2xl font-semibold',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`inline-flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      <span>{children}</span>
    </motion.button>
  );
};
