import { useState, useRef, useEffect } from 'react';
import { ShieldCheck, RefreshCw, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '../common/UIComponents';

export const OTPVerificationForm = ({ 
  email, 
  purpose = 'login', 
  onSuccess, 
  onBack, 
  onVerify, 
  onResend 
}) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [error, setError] = useState('');
  const inputsRef = useRef([]);

  useEffect(() => {
    // Focus first input box
    if (inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    // Handle paste of complete 6-digit code
    if (value.length > 1) {
      const pasted = value.slice(0, 6).split('');
      pasted.forEach((char, i) => {
        newDigits[i] = char;
      });
      setDigits(newDigits);
      const nextIdx = Math.min(pasted.length, 5);
      inputsRef.current[nextIdx]?.focus();
      return;
    }

    newDigits[index] = value;
    setDigits(newDigits);
    setError('');

    // Advance focus
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const code = digits.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (onVerify) {
        await onVerify(code);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Verification failed. Please check the code and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      if (onResend) {
        await onResend();
      }
      setCooldown(60);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend code. Please wait.');
    } finally {
      setResending(false);
    }
  };

  // Mask email address for privacy
  const maskedEmail = email
    ? email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => `${a}${'•'.repeat(Math.min(b.length, 5))}${c}`)
    : 'your email address';

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[#F3EEFF] dark:bg-[#29243B] text-[#5141B8] dark:text-[#A78BFA] flex items-center justify-center mx-auto shadow-xs">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-[#211B35] dark:text-[#F5F3FF]">
          Two-Step Verification
        </h2>
        <p className="text-xs text-[#77738B] dark:text-[#B3ADC7]">
          We sent a 6-digit verification code to <span className="font-bold text-[#211B35] dark:text-[#F5F3FF]">{maskedEmail}</span>
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs font-semibold text-red-600 dark:text-red-400 text-center animate-in fade-in">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 6 Digit Input Boxes */}
        <div className="flex justify-center items-center gap-2 sm:gap-3">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputsRef.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e.target.value ? e : e)}
              className="w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-extrabold rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-[#F8F7FC] dark:bg-[#191726] text-[#211B35] dark:text-[#F5F3FF] focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent outline-none shadow-xs transition-all"
            />
          ))}
        </div>

        <Button
          type="submit"
          size="lg"
          loading={loading}
          className="w-full"
          icon={ArrowRight}
        >
          Verify & Continue
        </Button>
      </form>

      {/* Resend Cooldown & Back */}
      <div className="flex flex-col items-center space-y-3 pt-2 text-xs">
        <div className="flex items-center gap-1.5 text-[#77738B] dark:text-[#B3ADC7]">
          <span>Didn't receive the code?</span>
          {cooldown > 0 ? (
            <span className="font-bold text-[#5141B8] dark:text-[#A78BFA]">
              Resend in {cooldown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="font-bold text-[#5141B8] dark:text-[#A78BFA] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              Resend Code
            </button>
          )}
        </div>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-[#77738B] dark:text-[#B3ADC7] hover:text-[#211B35] dark:hover:text-[#F5F3FF] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to sign in</span>
          </button>
        )}
      </div>
    </div>
  );
};
