import React, { useState, useEffect } from 'react';
import { Lock, CheckCircle2, GraduationCap, AlertTriangle } from 'lucide-react';
import { PageType } from '../types';
import { fallbackDb } from '../lib/supabase';

interface ResetPasswordProps {
  setCurrentPage: (page: PageType) => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
}

export default function ResetPassword({ setCurrentPage, showToast }: ResetPasswordProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<{ accessToken: string; refreshToken: string } | null>(null);

  // Parse hash fragment for access_token and refresh_token from Supabase redirect
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && refreshToken) {
        setTokens({ accessToken, refreshToken });
      } else {
        setError('Invalid or expired reset link. Please request a new one.');
      }
    } else {
      setError('No reset token found. Please use the link from your email.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || password.length < 8) {
      if (showToast) showToast('Password must be at least 8 characters.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      if (showToast) showToast('Passwords do not match.', 'error');
      return;
    }
    if (!tokens) {
      if (showToast) showToast('No valid reset token. Please request a new link.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const result = await fallbackDb.resetPassword(tokens.accessToken, tokens.refreshToken, password);
      if (result.success) {
        setSuccess(true);
        if (showToast) showToast('Password updated successfully!', 'success');
      } else {
        setError(result.error || 'Failed to reset password.');
        if (showToast) showToast(result.error || 'Failed to reset password.', 'error');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-[#0F172A] text-slate-100 min-h-[85vh] flex items-center justify-center font-sans px-4">
        <div className="max-w-md w-full text-center space-y-6 bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
          <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto border border-emerald-500/20">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Password Updated</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your password has been changed successfully. You can now sign in with your new password.
            </p>
          </div>
          <button
            onClick={() => setCurrentPage('login')}
            className="w-full bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-bold py-2.5 px-4 rounded-lg transition-colors cursor-pointer text-sm"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0F172A] text-slate-100 min-h-[85vh] flex items-center justify-center font-sans px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto border border-amber-500/20">
            <GraduationCap className="h-7 w-7 text-amber-500" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Set New Password</h1>
          <p className="text-xs text-slate-400">Choose a strong password for your account.</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-300">{error}</p>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full bg-[#0F172A] border border-slate-800 focus:border-amber-500 rounded-lg py-2.5 pl-10 pr-3.5 text-slate-100 text-sm focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-[#0F172A] border border-slate-800 focus:border-amber-500 rounded-lg py-2.5 pl-10 pr-3.5 text-slate-100 text-sm focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !tokens}
              className="w-full bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-amber-500/10 transition-all flex items-center justify-center space-x-2 cursor-pointer text-sm disabled:opacity-50"
            >
              <Lock className="h-4 w-4" />
              <span>{isLoading ? 'Updating...' : 'Update Password'}</span>
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setCurrentPage('login')}
              className="text-xs text-slate-500 hover:text-amber-500 cursor-pointer transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
