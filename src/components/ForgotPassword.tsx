import React, { useState } from 'react';
import { Mail, ArrowLeft, GraduationCap, CheckCircle2 } from 'lucide-react';
import { PageType } from '../types';
import { fallbackDb } from '../lib/supabase';

interface ForgotPasswordProps {
  setCurrentPage: (page: PageType) => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
}

export default function ForgotPassword({ setCurrentPage, showToast }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      if (showToast) showToast('Please enter your email address.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const result = await fallbackDb.forgotPassword(email);
      if (result.success) {
        setSent(true);
        if (showToast) showToast('Password reset email sent. Check your inbox.', 'success');
      } else {
        if (showToast) showToast(result.error || 'Failed to send reset email.', 'error');
      }
    } catch (err) {
      if (showToast) showToast('An unexpected error occurred.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-[#0F172A] text-slate-100 min-h-[85vh] flex items-center justify-center font-sans px-4">
        <div className="max-w-md w-full text-center space-y-6 bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
          <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto border border-emerald-500/20">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Check Your Email</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              We've sent a password reset link to <span className="font-medium text-white">{email}</span>.
              Click the link in the email to reset your password.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => setCurrentPage('login')}
              className="w-full bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-bold py-2.5 px-4 rounded-lg transition-colors cursor-pointer text-sm"
            >
              Back to Sign In
            </button>
            <button
              onClick={() => { setSent(false); setEmail(''); }}
              className="text-xs text-slate-500 hover:text-slate-400 cursor-pointer"
            >
              Try a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0F172A] text-slate-100 min-h-[85vh] flex items-center justify-center font-sans px-4">
        <div className="max-w-md w-full space-y-6 animate-fade-in-up">
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto border border-amber-500/20">
            <GraduationCap className="h-7 w-7 text-amber-500" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Reset Your Password</h1>
          <p className="text-xs text-slate-400">Enter your email and we'll send you a reset link.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-amber-500/10 transition-all flex items-center justify-center space-x-2 cursor-pointer text-sm disabled:opacity-50"
            >
              <Mail className="h-4 w-4" />
              <span>{isLoading ? 'Sending...' : 'Send Reset Link'}</span>
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setCurrentPage('login')}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-500 cursor-pointer transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Sign In</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
