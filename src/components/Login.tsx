import React, { useState, useRef, useEffect } from 'react';
import { LogIn, Mail, Lock, GraduationCap, AlertTriangle, RefreshCw } from 'lucide-react';
import { PageType, Profile } from '../types';
import { supabase } from '../lib/supabase';

interface LoginProps {
  setCurrentPage: (page: PageType) => void;
  setUser: (user: Profile | null) => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
  redirectPage?: PageType | null;
  setRedirectPage?: (page: PageType | null) => void;
}

export default function Login({ setCurrentPage, setUser, showToast, redirectPage, setRedirectPage }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const resendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (resendIntervalRef.current) {
        clearInterval(resendIntervalRef.current);
        resendIntervalRef.current = null;
      }
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      if (showToast) showToast('Please enter both email and password.', 'error');
      return;
    }

    setIsLoading(true);
    setUnverifiedEmail(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Special case: email not yet verified — show inline banner
        if (res.status === 403 && data.email_not_confirmed) {
          setUnverifiedEmail(data.email || email);
          return;
        }
        throw new Error(data.error || 'Invalid email or password.');
      }

      const user = data;
      if (!user || !user.id) throw new Error('Authentication returned an empty user profile.');

      // Store user profile (includes access_token for JWT auth)
      localStorage.setItem('ace_scholar_current_user', JSON.stringify(user));
      setUser(user);

      // Initialize Supabase client session for automatic token refresh
      if (supabase && user.access_token && user.refresh_token) {
        await supabase.auth.setSession({
          access_token: user.access_token,
          refresh_token: user.refresh_token,
        });
      }

      if (showToast) showToast('Logged in successfully!', 'success');

      let targetPage: PageType = 'dashboard';
      if (user.role === 'admin') {
        targetPage = 'admin';
      } else if (user.role === 'expert') {
        targetPage = 'expert';
      } else if (redirectPage) {
        targetPage = redirectPage;
        if (setRedirectPage) setRedirectPage(null);
      }
      setCurrentPage(targetPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err: any) {
      console.error(err);
      if (showToast) showToast(err.message || 'Login failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading || !unverifiedEmail) return;
    setResendLoading(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: unverifiedEmail }),
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
    <div className="bg-[#0F172A] font-sans text-slate-100 min-h-[50vh] flex items-center justify-center px-4 py-8" id="login-page-container">
      
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl space-y-6 relative overflow-hidden animate-fade-in-up">
        
        {/* Subtle glow */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full filter blur-xl pointer-events-none"></div>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="bg-amber-500 text-[#0F172A] p-2 rounded-lg inline-flex items-center justify-center mb-1">
            <GraduationCap className="h-5 w-5 font-bold" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">AceScholar Sign In</h2>
          <p className="text-xs text-slate-400">Access your private workspace and check order timelines.</p>
        </div>

        {/* Email not confirmed banner — shown when Supabase rejects login due to unverified email */}
        {unverifiedEmail && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-3" id="email-not-confirmed-banner">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-amber-300">Email not verified</p>
                <p className="text-xs text-amber-200/70">
                  Confirm <span className="font-medium text-amber-300">{unverifiedEmail}</span> before signing in.
                  Check your inbox for the verification link, or resend it below.
                </p>
              </div>
            </div>
            <button
              onClick={handleResend}
              disabled={resendLoading || resendCooldown > 0}
              className="w-full flex items-center justify-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-semibold text-xs py-2 px-3 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              id="resend-from-login-btn"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
              {resendLoading
                ? 'Sending...'
                : resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : 'Resend Verification Email'}
            </button>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#0F172A] border border-slate-800 focus:border-amber-500 rounded-lg py-2.5 pl-10 pr-3.5 text-slate-100 text-sm focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Password</label>
              <button
                type="button"
                onClick={() => setCurrentPage('forgot-password')}
                className="text-[10px] text-amber-500 hover:text-amber-400 font-semibold cursor-pointer hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0F172A] border border-slate-800 focus:border-amber-500 rounded-lg py-2.5 pl-10 pr-3.5 text-slate-100 text-sm focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-amber-500/10 transition-all flex items-center justify-center space-x-2 cursor-pointer text-sm disabled:opacity-50"
          >
            <LogIn className="h-4 w-4" />
            <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
          </button>
        </form>

        {/* Footer */}
        <div className="text-center pt-2 text-xs text-slate-500">
          <span>Don't have an account? </span>
          <button
            onClick={() => setCurrentPage('signup')}
            className="text-amber-500 hover:underline hover:text-amber-400 font-semibold cursor-pointer"
          >
            Sign Up
          </button>
        </div>

      </div>

    </div>
  );
}
