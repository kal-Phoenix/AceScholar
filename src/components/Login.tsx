import React, { useState, useRef, useEffect } from 'react';
import { LogIn, Mail, Lock, GraduationCap, AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react';
import { PageType, Profile } from '../types';
import { supabase, setSession } from '../lib/supabase';

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
        if (res.status === 403 && data.email_not_confirmed) {
          setUnverifiedEmail(data.email || email);
          return;
        }
        throw new Error(data.error || 'Invalid email or password.');
      }

      const user = data;
      if (!user || !user.id) throw new Error('Authentication returned an empty user profile.');

      setUser(user);

      if (user.access_token && user.refresh_token) {
        const session = {
          access_token: user.access_token,
          refresh_token: user.refresh_token,
          token_type: 'bearer' as const,
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user: { id: user.id, email: user.email, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: user.created_at },
        };
        setSession(session);
        if (supabase) {
          await supabase.auth.setSession({
            access_token: user.access_token,
            refresh_token: user.refresh_token,
          });
        }
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
    <div className="bg-[#0F172A] font-sans text-slate-100 min-h-[60vh] flex items-center justify-center px-4 py-10" id="login-page-container">
      
      <div className="max-w-md w-full space-y-6 animate-fade-in-up">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-[#0F172A] p-3 rounded-2xl inline-flex items-center justify-center shadow-lg shadow-amber-500/20">
            <GraduationCap className="h-6 w-6 font-bold" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Welcome Back</h2>
          <p className="text-sm text-slate-400">Sign in to access your private workspace and track order timelines.</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-7 sm:p-8 rounded-2xl shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-sm">
          
          {/* Subtle glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full filter blur-2xl pointer-events-none"></div>

          {/* Email not confirmed banner */}
          {unverifiedEmail && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-3 animate-scale-in" id="email-not-confirmed-banner">
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
                className="w-full flex items-center justify-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-semibold text-xs py-2.5 px-3 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Email Address</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 group-focus-within:text-amber-500 transition-colors">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-[#0F172A] border border-slate-800 focus:border-amber-500 rounded-xl py-3 pl-11 pr-4 text-slate-100 text-sm focus:outline-none transition-all duration-200 placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
                <button
                  type="button"
                  onClick={() => setCurrentPage('forgot-password')}
                  className="text-xs text-amber-500 hover:text-amber-400 font-semibold cursor-pointer hover:underline transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 group-focus-within:text-amber-500 transition-colors">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-[#0F172A] border border-slate-800 focus:border-amber-500 rounded-xl py-3 pl-11 pr-4 text-slate-100 text-sm focus:outline-none transition-all duration-200 placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-amber-500/20 transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer text-sm disabled:opacity-50 active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="animate-spin h-4 w-4 border-2 border-[#0F172A] border-t-transparent rounded-full"></span>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center pt-2 text-sm text-slate-500">
            <span>Don't have an account? </span>
            <button
              onClick={() => setCurrentPage('signup')}
              className="text-amber-500 hover:text-amber-400 font-semibold cursor-pointer hover:underline inline-flex items-center space-x-1 transition-colors"
            >
              <span>Sign Up</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
