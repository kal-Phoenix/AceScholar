import React, { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import { fallbackDb } from '../lib/supabase';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      await fallbackDb.postContactMessage({ name, email, subject, message });
      setSubmitStatus('success');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error('Contact submission failed:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#0F172A] text-slate-100 font-sans" id="contact-container">
      {/* Page Header */}
      <header className="relative bg-gradient-to-b from-[#0F172A] to-[#1E293B] py-10 sm:py-16 md:py-20 px-4 text-center border-b border-slate-800">
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
          <span className="text-amber-500 text-[10px] sm:text-xs font-bold tracking-widest uppercase">We&apos;re Here to Help</span>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">Contact Us</h1>
          <div className="h-1 w-16 bg-amber-500 mx-auto rounded"></div>
          <p className="text-xs sm:text-lg text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            Have questions about pricing, academic criteria, or custom bulk orders? Reach our coordinating desk directly.
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* Contact Form Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-5">

            {/* Sidebar Info */}
            <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 p-6 sm:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
              <div className="space-y-4 sm:space-y-6">
                <span className="text-amber-500 text-[10px] sm:text-xs font-bold tracking-widest uppercase font-mono">Direct Desk Line</span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">Get in Touch</h2>
                <div className="h-1 w-12 bg-amber-500 rounded"></div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Reach our coordinating desk for pricing inquiries, project consultations, or custom academic support.
                </p>
              </div>

              <div className="mt-8 sm:mt-12 space-y-4 sm:space-y-6">
                <div className="flex items-start space-x-3 text-xs sm:text-sm">
                  <Mail className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-semibold text-white">Desk Email</span>
                    <span className="text-slate-300">desk@acescholar.com</span>
                  </div>
                </div>
                <div className="flex items-start space-x-3 text-xs sm:text-sm">
                  <MessageSquare className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-semibold text-white">Coordinating Hub</span>
                    <span className="text-slate-300">Addis Ababa, Ethiopia</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 sm:mt-12 pt-6 border-t border-slate-800/60 text-[10px] sm:text-xs text-slate-400 font-mono flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span>Coordinators Active 24/7</span>
              </div>
            </div>

            {/* Form */}
            <div className="md:col-span-3 p-6 sm:p-10">
              {submitStatus === 'success' ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-8" id="contact-success-state">
                  <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="h-12 w-12" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">Inquiry Received Successfully</h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-sm">
                    Your message has been logged at our coordinating desk. A counselor will reach you via email within 2 hours.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSubmitStatus('idle')}
                      className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Send Another Message
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" id="contact-form">
                  <div className="space-y-1">
                    <h3 className="text-base sm:text-lg font-bold text-white">Send an Inquiry</h3>
                    <p className="text-xs text-slate-400">All submissions are completely confidential.</p>
                  </div>

                  {submitStatus === 'error' && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center space-x-3 text-red-400 text-xs sm:text-sm">
                      <ShieldAlert className="h-5 w-5 shrink-0" />
                      <span>Failed to submit message. Please try again.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300">Your Full Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Jean-Pierre Laurent"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2 px-3 text-slate-100 text-xs sm:text-sm outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300">Your Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. jp.laurent@sorbonne.fr"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2 px-3 text-slate-100 text-xs sm:text-sm outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">Subject</label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Master's Thesis mechanical modeling quote"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2 px-3 text-slate-100 text-xs sm:text-sm outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">Your Message / Requirements</label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Detail your requirements, project guidelines, software tools (SolidWorks, MATLAB, etc.) or academic citation styles..."
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2 px-3 text-slate-100 text-xs sm:text-sm outline-none transition-colors resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-[#0F172A] font-bold py-2.5 sm:py-3 rounded-lg shadow-lg hover:shadow-amber-500/15 active:scale-95 transition-all text-xs sm:text-sm flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin inline-block h-4 w-4 border-2 border-[#0F172A] border-t-transparent rounded-full mr-1"></span>
                        <span>Submitting Inquiry...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Submit Confidential Inquiry</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
