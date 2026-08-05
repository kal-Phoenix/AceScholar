import React, { useState, useRef, useEffect } from 'react';
import { UserPlus, Mail, Lock, User, CheckCircle2, AlertCircle, GraduationCap, ArrowRight, ArrowLeft } from 'lucide-react';
import { PageType } from '../types';

interface SignupProps {
  setCurrentPage: (page: PageType) => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
}

export default function Signup({ setCurrentPage, showToast }: SignupProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const sErrors: Record<string, string> = {};

    if (!fullName.trim()) sErrors.fullName = 'Full Name is required';
    if (!email.trim()) {
      sErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      sErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      sErrors.password = 'Password is required';
    } else if (password.length < 8) {
      sErrors.password = 'Password must be at least 8 characters long';
    } else if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      sErrors.password = 'Password must include uppercase, lowercase, and a number';
    }

    if (password !== confirmPassword) {
      sErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreeTerms) {
      sErrors.agreeTerms = 'You must accept our safety and confidentiality terms';
    }

    setErrors(sErrors);
    return Object.keys(sErrors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          full_name: fullName.trim()
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Signup failed.');
      }

      setIsSuccess(true);

    } catch (err: any) {
      console.error(err);
      if (showToast) showToast(err.message || 'Signup failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return <EmailVerificationScreen email={email} setCurrentPage={setCurrentPage} showToast={showToast} />;
  }

  return (
    <div className="bg-[#0F172A] font-sans text-slate-100 min-h-[60vh] flex items-center justify-center px-4 py-10" id="signup-page-container">
      
      <div className="max-w-md w-full space-y-6 animate-fade-in-up">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-[#0F172A] p-3 rounded-2xl inline-flex items-center justify-center shadow-lg shadow-amber-500/20">
            <GraduationCap className="h-6 w-6 font-bold" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Create Your Account</h2>
          <p className="text-sm text-slate-400">Join thousands of students getting expert academic support.</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-7 sm:p-8 rounded-2xl shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-sm">
          
          {/* Subtle glow */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full filter blur-2xl pointer-events-none"></div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Full Name *</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 group-focus-within:text-amber-500 transition-colors">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Mercer"
                  className={`w-full bg-[#0F172A] border rounded-xl py-3 pl-11 pr-4 text-slate-100 text-sm focus:outline-none transition-all duration-200 placeholder:text-slate-600 ${
                    errors.fullName ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-amber-500'
                  }`}
                />
              </div>
              {errors.fullName && (
                <p className="text-red-400 text-xs mt-1 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.fullName}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Email Address *</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 group-focus-within:text-amber-500 transition-colors">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className={`w-full bg-[#0F172A] border rounded-xl py-3 pl-11 pr-4 text-slate-100 text-sm focus:outline-none transition-all duration-200 placeholder:text-slate-600 ${
                    errors.email ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-amber-500'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs mt-1 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Password *</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 group-focus-within:text-amber-500 transition-colors">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className={`w-full bg-[#0F172A] border rounded-xl py-3 pl-11 pr-4 text-slate-100 text-sm focus:outline-none transition-all duration-200 placeholder:text-slate-600 ${
                    errors.password ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-amber-500'
                  }`}
                />
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.password}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Confirm Password *</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 group-focus-within:text-amber-500 transition-colors">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className={`w-full bg-[#0F172A] border rounded-xl py-3 pl-11 pr-4 text-slate-100 text-sm focus:outline-none transition-all duration-200 placeholder:text-slate-600 ${
                    errors.confirmPassword ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-amber-500'
                  }`}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-xs mt-1 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="pt-2">
              <label className="flex items-start space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded-lg text-amber-500 bg-slate-900 border-slate-800 focus:ring-amber-500 focus:ring-offset-0 h-4 w-4 shrink-0"
                />
                <span className="text-xs text-slate-400 select-none group-hover:text-slate-300 transition-colors leading-relaxed">
                  I agree to the Terms of Service and understand that this is a premium academic assistance consult service. *
                </span>
              </label>
              {errors.agreeTerms && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.agreeTerms}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-amber-500/20 transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer text-sm disabled:opacity-50 active:scale-[0.98] mt-2"
            >
              {isLoading ? (
                <span className="animate-spin h-4 w-4 border-2 border-[#0F172A] border-t-transparent rounded-full"></span>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center pt-2 text-sm text-slate-500">
            <span>Already have an account? </span>
            <button
              onClick={() => {
                setCurrentPage('login');
              }}
              className="text-amber-500 hover:text-amber-400 font-semibold cursor-pointer hover:underline inline-flex items-center space-x-1 transition-colors"
            >
              <span>Sign In</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL VERIFICATION SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function EmailVerificationScreen({
  email,
  setCurrentPage,
  showToast,
}: {
  email: string;
  setCurrentPage: (page: PageType) => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
}) {
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const resendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (resendIntervalRef.current) {
        clearInterval(resendIntervalRef.current);
        resendIntervalRef.current = null;
      }
    };
  }, []);

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to resend');
      if (showToast) showToast('Verification email resent! Check your inbox.', 'success');
      setResendCooldown(60);
      if (resendIntervalRef.current) clearInterval(resendIntervalRef.current);
      resendIntervalRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            if (resendIntervalRef.current) {
              clearInterval(resendIntervalRef.current);
              resendIntervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      if (showToast) showToast(err.message || 'Resend failed.', 'error');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="bg-[#0F172A] font-sans text-slate-100 min-h-[60vh] flex items-center justify-center px-4 py-10" id="email-verification-screen">
      <div className="max-w-md w-full space-y-6 animate-fade-in-up">

        <div className="text-center space-y-3">
          {/* Animated envelope icon */}
          <div className="relative inline-flex">
            <div className="bg-amber-500/15 text-amber-400 p-5 rounded-2xl ring-4 ring-amber-500/10 animate-pulse-glow">
              <Mail className="h-10 w-10" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1.5 ring-2 ring-[#0F172A] shadow-lg">
              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Check Your Email</h2>
            <p className="text-sm text-slate-400">We sent a verification link to</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-7 sm:p-8 rounded-2xl shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-sm">
          
          {/* Glow accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/5 rounded-full filter blur-2xl pointer-events-none" />

          {/* Email badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2">
              <Mail className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="text-amber-400 font-semibold text-sm">{email}</span>
            </div>
          </div>

          {/* Steps */}
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-5 space-y-3.5">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">What to do next</p>
            {[
              { step: '1', text: 'Open your email inbox' },
              { step: '2', text: 'Find the email from AceScholar' },
              { step: '3', text: 'Click the "Confirm your email" link' },
              { step: '4', text: 'Return here and sign in to your account' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">
                  {step}
                </span>
                <span className="text-sm text-slate-300">{text}</span>
              </div>
            ))}
          </div>

          {/* Spam note */}
          <p className="text-center text-xs text-slate-500">
            Can't find it? Check your <span className="text-slate-400 font-medium">spam or junk</span> folder.
          </p>

          {/* Resend button */}
          <button
            onClick={handleResend}
            disabled={resendLoading || resendCooldown > 0}
            className="w-full bg-transparent border border-slate-700/50 text-slate-400 hover:bg-slate-800/50 hover:text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            id="resend-verification-btn"
          >
            <Mail className="h-4 w-4" />
            {resendLoading
              ? 'Sending...'
              : resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : 'Resend Verification Email'}
          </button>

          {/* Sign in CTA */}
          <button
            onClick={() => {
              setCurrentPage('login');
            }}
            className="w-full bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-amber-500/20 transition-all duration-300 text-sm cursor-pointer flex items-center justify-center space-x-2 active:scale-[0.98]"
            id="go-to-signin-btn"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go to Sign In</span>
          </button>

        </div>
      </div>
    </div>
  );
}
