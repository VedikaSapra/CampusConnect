import { motion } from 'framer-motion';
import { GraduationCap, Award, Shield } from 'lucide-react';

export const RegistrationRoleSelector = ({ selectedRole, onSelectRole }) => {
  const roles = [
    {
      id: 'student',
      title: 'Student Registration',
      subtitle: 'Join clubs, explore workshops, get event passes, and connect with peers.',
      badge: 'Immediate Access',
      icon: GraduationCap,
      color: 'from-blue-500 to-indigo-600',
      borderAccent: 'border-blue-500/30'
    },
    {
      id: 'club_admin',
      title: 'Club Administrator',
      subtitle: 'Apply to lead or register an official student chapter or campus society.',
      badge: 'Super Admin Approved',
      icon: Award,
      color: 'from-[#5141B8] to-[#8B5CF6]',
      borderAccent: 'border-purple-500/30'
    },
    {
      id: 'super_admin',
      title: 'Super Administrator',
      subtitle: 'Platform governance and institutional oversight for verified personnel.',
      badge: 'Invitation Only',
      icon: Shield,
      color: 'from-emerald-500 to-teal-700',
      borderAccent: 'border-emerald-500/30'
    }
  ];

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold uppercase tracking-wider text-[#77738B] dark:text-[#B3ADC7] mb-2">
        Select Your Registration Path
      </label>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {roles.map((r) => {
          const Icon = r.icon;
          const isSelected = selectedRole === r.id;

          return (
            <motion.div
              key={r.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectRole(r.id)}
              className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-[#5141B8] dark:border-[#8B7CF6] bg-[#F3EEFF]/80 dark:bg-[#29243B] ring-2 ring-[#8B5CF6]/50 shadow-md'
                  : 'border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#211E30] hover:border-[#8B5CF6]/40 hover:bg-[#F8F7FC] dark:hover:bg-[#29243B]/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${r.color} text-white flex items-center justify-center shadow-xs`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 dark:bg-[#191726] border border-[#E9E5F2] dark:border-[#383248] text-[#77738B] dark:text-[#B3ADC7]">
                    {r.badge}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-[#211B35] dark:text-[#F5F3FF]">
                  {r.title}
                </h4>
                <p className="text-xs text-[#77738B] dark:text-[#B3ADC7] mt-1 leading-relaxed">
                  {r.subtitle}
                </p>
              </div>

              {isSelected && (
                <div className="mt-3 pt-2 border-t border-[#8B5CF6]/20 flex items-center gap-1.5 text-xs font-bold text-[#5141B8] dark:text-[#A78BFA]">
                  <span>Active Selection</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
