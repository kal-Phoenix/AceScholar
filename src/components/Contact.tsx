import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, ShieldAlert, MapPin } from 'lucide-react';
import { fallbackDb } from '../lib/supabase';
import ScrollReveal from './ScrollReveal';
import RippleButton from './RippleButton';

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
      <header className="relative bg-gradient-to-b from-[#0F172A] via-[#1a1f3a] to-[#0F172A] py-10 sm:py-14 md:py-18 px-4 text-center border-b border-slate-800/40 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:20px_20px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-amber-500/6 rounded-full filter blur-[120px] pointer-events-none"></div>
        <div className="relative max-w-4xl mx-auto space-y-4 sm:space-y-5">
          <ScrollReveal>
            <span className="text-amber-500 text-xs sm:text-sm font-bold tracking-widest uppercase">We&apos;re Here to Help</span>
          </ScrollReveal>
          <ScrollReveal delay={1}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">Contact Us</h1>
          </ScrollReveal>
          <ScrollReveal delay={2}>
            <div className="h-1 w-16 bg-gradient-to-r from-amber-500 to-amber-600 mx-auto rounded-full"></div>
          </ScrollReveal>
          <ScrollReveal delay={3}>
            <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
              Questions about pricing, deadlines, or how something works? Send us a message and we'll get back to you.
            </p>
          </ScrollReveal>
        </div>
      </header>

      <div className="max-w-6xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <ScrollReveal>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-5">

            {/* Sidebar Info */}
            <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800/80 p-7 sm:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800/60 relative overflow-hidden">
              {/* Ambient glow */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full filter blur-2xl pointer-events-none"></div>
              
              <div className="relative space-y-5 sm:space-y-6">
                <span className="text-amber-500 text-xs sm:text-sm font-bold tracking-widest uppercase font-mono">Get In Touch</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Contact Us</h2>
                <div className="h-1 w-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"></div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Send us your project details, pricing questions, or anything else. We respond fast.
                </p>
              </div>

              <div className="relative mt-8 sm:mt-12 space-y-5">
                <div className="flex items-start space-x-4 text-sm">
                  <div className="bg-amber-500/10 p-2.5 rounded-xl shrink-0">
                    <Mail className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <span className="block font-semibold text-white">Email</span>
                    <span className="text-slate-300 text-sm">{import.meta.env.VITE_DESK_EMAIL || 'ace.support1@gmail.com'}</span>
                  </div>
                </div>
                <div className="flex items-start space-x-4 text-sm">
                  <div className="bg-amber-500/10 p-2.5 rounded-xl shrink-0">
                    <MapPin className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <span className="block font-semibold text-white">Based In</span>
                    <span className="text-slate-300 text-sm">{import.meta.env.VITE_OFFICE_LOCATION || 'Addis Ababa, Ethiopia'}</span>
                  </div>
                </div>
              </div>

              <div className="relative mt-8 sm:mt-12 pt-6 border-t border-slate-800/60 text-xs text-slate-400 font-mono flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/30"></div>
                <span>Online 24/7</span>
              </div>
            </div>

            {/* Form */}
            <div className="md:col-span-3 p-7 sm:p-10">
              {submitStatus === 'success' ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-5 py-8 animate-scale-in" id="contact-success-state">
                  <div className="bg-emerald-500/10 text-emerald-400 p-5 rounded-2xl border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white">Inquiry Received</h3>
                  <p className="text-sm text-slate-300 max-w-sm leading-relaxed">
                    Got it. We'll reply to your email within a few hours.
                  </p>
                  <button
                    onClick={() => setSubmitStatus('idle')}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer border border-slate-700/50 hover:border-slate-600"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" id="contact-form">
                  <div className="space-y-1">
                    <h3 className="text-lg sm:text-xl font-bold text-white">Send an Inquiry</h3>
                    <p className="text-sm text-slate-400">All submissions are completely confidential.</p>
                  </div>

                  {submitStatus === 'error' && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center space-x-3 text-red-400 text-sm animate-scale-in">
                      <ShieldAlert className="h-5 w-5 shrink-0" />
                      <span>Failed to submit message. Please try again.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Your Full Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Jean-Pierre Laurent"
                        className="w-full bg-[#0F172A] border border-slate-800 focus:border-amber-500 rounded-xl py-3 px-4 text-slate-100 text-sm outline-none transition-all duration-200 placeholder:text-slate-600"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Your Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. jp.laurent@sorbonne.fr"
                        className="w-full bg-[#0F172A] border border-slate-800 focus:border-amber-500 rounded-xl py-3 px-4 text-slate-100 text-sm outline-none transition-all duration-200 placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Subject</label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Master's Thesis mechanical modeling quote"
                      className="w-full bg-[#0F172A] border border-slate-800 focus:border-amber-500 rounded-xl py-3 px-4 text-slate-100 text-sm outline-none transition-all duration-200 placeholder:text-slate-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Your Message / Requirements</label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Detail your requirements, project guidelines, software tools (SolidWorks, MATLAB, etc.) or academic citation styles..."
                      className="w-full bg-[#0F172A] border border-slate-800 focus:border-amber-500 rounded-xl py-3 px-4 text-slate-100 text-sm outline-none transition-all duration-200 resize-none placeholder:text-slate-600"
                    ></textarea>
                  </div>

                  <RippleButton
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-[#0F172A] font-bold py-3.5 rounded-xl shadow-lg hover:shadow-amber-500/15 active:scale-[0.98] transition-all duration-300 text-sm flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin inline-block h-4 w-4 border-2 border-[#0F172A] border-t-transparent rounded-full"></span>
                        <span>Submitting Inquiry...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Submit Confidential Inquiry</span>
                      </>
                    )}
                  </RippleButton>
                </form>
              )}
            </div>

          </div>
        </div>
        </ScrollReveal>

      </div>
    </div>
  );
}
