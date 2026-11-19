import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, MapPin, Users, Ticket, 
  CheckCircle2, Sparkles, Download, ShieldCheck, ExternalLink 
} from 'lucide-react';
import { Button, Badge } from '../common/UIComponents';

export const TicketModal = ({ registration, isOpen, onClose }) => {
  if (!isOpen || !registration) return null;

  // Extract secure verification token from pass record or registration
  const passToken = registration.pass_data?.verification_token || registration.verification_token;
  
  // Destination URL pointing to the designed React verification page
  const frontendOrigin = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
  const qrVerificationUrl = passToken 
    ? `${frontendOrigin}/verify-pass/${passToken}/`
    : `${frontendOrigin}/verify-pass/reg-${registration.id}/`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative max-w-sm w-full bg-white dark:bg-[#1E1833] rounded-3xl shadow-2xl overflow-hidden border border-[#E9E5F2] dark:border-purple-900/40"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors z-20"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Ticket Header Graphic */}
          <div className="aurora-hero-bg p-6 text-white text-center relative space-y-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold tracking-widest uppercase">
              <Sparkles className="w-3 h-3" />
              <span>Official Event Pass</span>
            </div>
            <h3 className="text-xl font-extrabold tracking-tight leading-snug">
              {registration.event_title}
            </h3>
            <p className="text-xs text-purple-200">
              Registration Pass ID: #{registration.id.toString().padStart(6, '0')}
            </p>
          </div>

          {/* Ticket Body */}
          <div className="p-6 space-y-6">
            
            {/* QR Code Presentation */}
            <div className="bg-[#F8F7FC] dark:bg-purple-950/40 p-5 rounded-2xl border border-dashed border-[#8B5CF6]/40 flex flex-col items-center justify-center space-y-3">
              <div className="p-3 bg-white rounded-xl shadow-xs">
                <QRCodeSVG
                  value={qrVerificationUrl}
                  size={150}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center space-x-1.5 text-xs text-[#27A66B] font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verified by CampusConnect</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Scan to open attendee verification terminal
                </p>
              </div>
            </div>

            {/* Event Metadata */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-purple-900/30">
                <span className="text-slate-400">Attendee Name</span>
                <span className="font-bold text-[#211B35] dark:text-white">
                  {registration.student_detail?.full_name || 'Registered Student'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-purple-900/30">
                <span className="text-slate-400">Date & Time</span>
                <span className="font-bold text-[#211B35] dark:text-white">
                  {new Date(registration.event_date).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Entry Status</span>
                <Badge variant={registration.status === 'approved' ? 'success' : 'warning'}>
                  {registration.status.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                variant="secondary"
                className="w-full"
                size="sm"
                icon={Download}
                onClick={() => window.print()}
              >
                Print / Save Ticket
              </Button>

              {passToken && (
                <a
                  href={`/verify-pass/${passToken}/`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center space-x-1 text-[11px] font-semibold text-[#8B5CF6] hover:underline pt-1 text-center"
                >
                  <span>Preview verification screen</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
