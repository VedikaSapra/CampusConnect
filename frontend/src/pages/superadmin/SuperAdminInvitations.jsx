
import { useState } from 'react';
import {
    ShieldCheck,
    Mail,
    KeyRound,
    Copy,
    Check,
    Clock3,
    Loader2,
    AlertCircle,
    Sparkles
} from 'lucide-react';
import api from '../../api/axios';

export const SuperAdminInvitations = () => {
    const [email, setEmail] = useState('');
    const [invitation, setInvitation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const generateInvitation = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError('');
        setInvitation(null);
        setCopied(false);

        try {
            const res = await api.post('/auth/invitations/', {
                email: email.trim().toLowerCase()
            });

            setInvitation(res.data);
        } catch (err) {
            const data = err.response?.data;

            setError(
                data?.error ||
                data?.detail ||
                data?.email?.[0] ||
                err.message ||
                'Unable to generate invitation.'
            );
        } finally {
            setLoading(false);
        }
    };

    const copyCode = async () => {
        if (!invitation?.invitation_code) return;

        try {
            await navigator.clipboard.writeText(
                invitation.invitation_code
            );
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setError('Unable to copy. Please copy the code manually.');
        }
    };

    return (
        <div className="space-y-5">

            {/* Main Invitation Card */}
            <div className="relative overflow-hidden rounded-2xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#191726] shadow-sm">

                {/* Gradient accent */}
                <div className="h-1 bg-gradient-to-r from-[#5141B8] via-[#8B5CF6] to-[#06B6D4]" />

                <div className="p-5 sm:p-7 space-y-6">

                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-6 h-6 text-[#5141B8] dark:text-purple-400" />
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-black text-[#211B35] dark:text-white">
                                    Generate Administrator Invitation
                                </h3>

                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">
                                    Restricted Access
                                </span>
                            </div>

                            <p className="mt-1 text-sm text-[#77738B] dark:text-[#B3ADC7]">
                                Invite trusted administrators using secure, email-linked registration tokens.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={generateInvitation} className="space-y-4">
                        <div className="space-y-2">
                            <label
                                htmlFor="admin-invitation-email"
                                className="text-xs font-bold uppercase tracking-wider text-[#77738B] dark:text-[#B3ADC7]"
                            >
                                Administrator Email Address
                            </label>

                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#77738B] dark:text-[#B3ADC7]" />

                                <input
                                    id="admin-invitation-email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    placeholder="Enter administrator email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-[#F8F7FC] dark:bg-[#211E30] pl-11 pr-4 py-3.5 text-sm font-medium text-[#211B35] dark:text-white placeholder:text-[#A49EB4] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/40 focus:border-[#8B5CF6] transition-all"
                                />
                            </div>

                            <p className="text-xs text-[#77738B] dark:text-[#B3ADC7]">
                                The recipient must register using this exact email address.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5141B8] hover:bg-[#40339C] disabled:opacity-60 disabled:cursor-not-allowed px-5 py-3 text-sm font-bold text-white shadow-sm transition-all"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating Invitation...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Generate Secure Invitation
                                </>
                            )}
                        </button>
                    </form>

                    {error && (
                        <div
                            role="alert"
                            className="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-4"
                        >
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                            <p className="text-sm font-medium text-red-700 dark:text-red-300">
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Generated Invitation */}
                    {invitation?.invitation_code && (
                        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-950/10 overflow-hidden">

                            <div className="flex items-center gap-2 border-b border-emerald-200 dark:border-emerald-900/40 px-5 py-3">
                                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                                    Invitation Generated Successfully
                                </span>
                            </div>

                            <div className="p-5 space-y-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-[#77738B] dark:text-[#B3ADC7] mb-2">
                                        Secure Invitation Token
                                    </p>

                                    <div className="flex items-center gap-3 rounded-xl border border-[#E9E5F2] dark:border-[#383248] bg-white dark:bg-[#211E30] p-3">
                                        <KeyRound className="w-4 h-4 text-[#5141B8] dark:text-purple-400 shrink-0" />

                                        <code className="flex-1 min-w-0 break-all text-sm font-bold text-[#211B35] dark:text-white">
                                            {invitation.invitation_code}
                                        </code>

                                        <button
                                            type="button"
                                            onClick={copyCode}
                                            title="Copy invitation code"
                                            className="shrink-0 rounded-lg p-2 text-[#5141B8] dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950/40 transition-colors"
                                        >
                                            {copied ? (
                                                <Check className="w-4 h-4" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="rounded-xl bg-white/70 dark:bg-[#211E30] p-3">
                                        <div className="flex items-center gap-2 text-xs text-[#77738B] dark:text-[#B3ADC7] mb-1">
                                            <Mail className="w-3.5 h-3.5" />
                                            Recipient
                                        </div>
                                        <p className="text-sm font-semibold text-[#211B35] dark:text-white break-all">
                                            {email}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-white/70 dark:bg-[#211E30] p-3">
                                        <div className="flex items-center gap-2 text-xs text-[#77738B] dark:text-[#B3ADC7] mb-1">
                                            <Clock3 className="w-3.5 h-3.5" />
                                            Expiration
                                        </div>
                                        <p className="text-sm font-semibold text-[#211B35] dark:text-white">
                                            {invitation.expires_at
                                                ? new Date(invitation.expires_at).toLocaleString()
                                                : 'Not provided'}
                                        </p>
                                    </div>
                                </div>

                                <p className="text-xs text-[#77738B] dark:text-[#B3ADC7]">
                                    Share this token privately with the intended recipient. It can be used only once.
                                </p>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
