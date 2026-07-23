import React, { useState, useEffect, useRef } from 'react';
import {
  Clock, Upload,
  ChevronLeft, ShieldCheck, Lock,
  MapPin, Globe, Check, ChevronRight, AlertCircle
} from 'lucide-react';
import { PageType, Profile, Order as AcademicOrder } from '../types';
import { fallbackDb } from '../lib/supabase';


export function getBasePrice(category: string, countryName: string) {
  if (category === 'Simple Assignment') return 5;
  if (category === '2D Drafting (Multiview and Pictorial Drawing including TitleBlock)') return 2;
  if (countryName && countryName.toLowerCase() === 'ethiopia') return 7;
  return 20;
}

interface OrderProps {
  user: Profile | null;
  selectedServiceType: string | null;
  setSelectedServiceType: (service: string | null) => void;
  setCurrentPage: (page: PageType) => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
  detectedLocation?: { country: string; currency: string; symbol: string; exchangeRate: number; ip: string; city?: string; };
  setRedirectPage?: (page: PageType | null) => void;
}

const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width; let height = img.height;
        if (width > height) { if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; } }
        else { if (height > maxHeight) { width = Math.round((width * maxHeight) / height); height = maxHeight; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', quality)); }
        else { resolve(event.target?.result as string); }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const SERVICE_OPTIONS = [
  { value: 'Simple Assignment', label: 'Simple Assignment', desc: 'Short problems / quick analysis', icon: '📝' },
  { value: '2D Drafting (Multiview and Pictorial Drawing including TitleBlock)', label: '2D Drafting', desc: 'Multiview & Pictorial Drawing w/ TitleBlock', icon: '📐' },
  { value: 'Academic Writing', label: 'Academic Writing', desc: 'Thesis, Essay, Review', icon: '📚' },
  { value: 'Coding Project', label: 'Coding Project', desc: 'Python, React, MATLAB', icon: '💻' },
  { value: 'Engineering Drawing', label: 'Engineering Drawing', desc: 'CAD, SolidWorks', icon: '🔧' },
  { value: 'Data Analysis', label: 'Data Analysis', desc: 'SPSS, R, Excel', icon: '📊' },
  { value: 'STEM Problem Set', label: 'STEM Problem Set', desc: 'Math, Bio, Physics', icon: '🔬' },
  { value: 'Presentations', label: 'Presentations', desc: 'Slide Decks, Posters', icon: '🎯' },
];

const STEPS = ['Service', 'Details', 'Budget', 'Review', 'Payment'];

export default function Order({ user, selectedServiceType, setSelectedServiceType, setCurrentPage, showToast, detectedLocation, setRedirectPage }: OrderProps) {
  const [step, setStep] = useState(1);
  const budgetManuallyEditedRef = useRef(false);

  const [serviceType, setServiceType] = useState(selectedServiceType || 'Academic Writing');
  const [subject, setSubject] = useState('');
  const [academicLevel, setAcademicLevel] = useState('Undergraduate');

  const [description, setDescription] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [deadline, setDeadline] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 3); d.setHours(12, 0, 0, 0);
    const yr = d.getFullYear(); const mo = String(d.getMonth() + 1).padStart(2, '0'); const dy = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${dy}T12:00`;
  });

  const [country, setCountry] = useState(() => detectedLocation?.country || user?.country || 'Ethiopia');
  const [budget, setBudget] = useState('');
  const [expertPreference, setExpertPreference] = useState('auto');
  const [previousExpertName, setPreviousExpertName] = useState('');
  const [liveRates, setLiveRates] = useState<Record<string, number>>({ ETB: 120, GBP: 0.79, CAD: 1.36, EUR: 0.92, SAR: 3.75 });

  const [paymentChoice, setPaymentChoice] = useState<'now' | 'delivery' | null>(null);
  const [ethiopiaMethod, setEthiopiaMethod] = useState<'cbe' | 'telebirr' | 'boa' | 'crypto' | 'card'>('cbe');
  const [internationalMethod, setInternationalMethod] = useState<'crypto' | 'card'>('crypto');
  const [ethiopiaTxRef, setEthiopiaTxRef] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<string>('');
  const [paymentScreenshotName, setPaymentScreenshotName] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<AcademicOrder | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<any>(null);

  useEffect(() => {
    fetch('/api/payments/config')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setPaymentConfig(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.rates) {
            setLiveRates({
              ETB: data.rates.ETB ? parseFloat(data.rates.ETB.toFixed(2)) : 120,
              GBP: data.rates.GBP ? parseFloat(data.rates.GBP.toFixed(4)) : 0.79,
              CAD: data.rates.CAD ? parseFloat(data.rates.CAD.toFixed(4)) : 1.36,
              EUR: data.rates.EUR ? parseFloat(data.rates.EUR.toFixed(4)) : 0.92,
              SAR: data.rates.SAR ? parseFloat(data.rates.SAR.toFixed(4)) : 3.75,
            });
          }
        }
      } catch { /* use fallback */ }
    })();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (user) {
      if (detectedLocation) setCountry(detectedLocation.country);
      else if (user.country) setCountry(user.country);
    } else if (detectedLocation) setCountry(detectedLocation.country);
  }, [user, detectedLocation]);

  useEffect(() => { if (selectedServiceType) setServiceType(selectedServiceType); }, [selectedServiceType]);

  const getCurrencyDetails = () => {
    switch (country) {
      case 'Ethiopia': return { currency: 'ETB', symbol: 'Br', exchangeRate: liveRates.ETB };
      case 'United States': return { currency: 'USD', symbol: '$', exchangeRate: 1 };
      case 'United Kingdom': return { currency: 'GBP', symbol: '£', exchangeRate: liveRates.GBP };
      case 'Canada': return { currency: 'CAD', symbol: 'CA$', exchangeRate: liveRates.CAD };
      case 'Germany': return { currency: 'EUR', symbol: '€', exchangeRate: liveRates.EUR };
      case 'Saudi Arabia': return { currency: 'SAR', symbol: 'SR', exchangeRate: liveRates.SAR };
      default:
        if (detectedLocation) return { currency: detectedLocation.currency || 'USD', symbol: detectedLocation.symbol || '$', exchangeRate: detectedLocation.exchangeRate || 1 };
        return { currency: 'USD', symbol: '$', exchangeRate: 1 };
    }
  };

  const curr = getCurrencyDetails();
  const budgetInUSD = (Number(budget) || 0) / curr.exchangeRate;
  const needsDownpayment = budgetInUSD >= 100;

  useEffect(() => {
    if (budgetManuallyEditedRef.current) return;
    const c = getCurrencyDetails();
    const base = getBasePrice(serviceType, country);
    setBudget(String(Math.ceil(base * c.exchangeRate)));
  }, [serviceType, country, detectedLocation, liveRates]);

  const uploadFileToStorage = async (file: File, orderId: string): Promise<string | null> => {
    try {
      const compressed = await compressImage(file);
      return await fallbackDb.uploadFile(compressed, file.name || `order-${orderId}.png`);
    } catch {
      return null;
    }
  };

  const getMatchedExpert = () => {
    if (expertPreference === 'previous') return `Previous Expert: ${previousExpertName || 'Not specified'}`;
    if (expertPreference === 'near') return 'Expert Specialist Near Me (Timezone Match)';
    return 'Automated Best Match';
  };

  const buildOrderBase = (orderId: string, filePublicUrl?: string): AcademicOrder => {
    const matchedExpert = getMatchedExpert();
    return {
      id: orderId,
      client_id: user?.id || 'anonymous-' + Math.random().toString(36).substring(2, 6),
      client_name: user?.full_name || 'Guest Client',
      client_email: user?.email || '',
      service_type: serviceType,
      subject: subject.trim() || 'General / Unspecified',
      academic_level: academicLevel,
      deadline,
      description: description.trim() || 'No specific description provided.',
      special_instructions: [specialInstructions?.trim(), `Match: ${matchedExpert}`].filter(Boolean).join(' | '),
      budget_range: `${curr.symbol}${Number(budget).toLocaleString()} ${curr.currency} (≈ $${Math.round(budgetInUSD)} USD)`,
      status: 'pending',
      file_name: fileName || undefined,
      file_url: filePublicUrl,
      created_at: new Date().toISOString(),
    };
  };

  const handleSubmit = async () => {
    if (!paymentChoice) { if (showToast) showToast('Please select a payment option.', 'error'); return; }
    setIsSubmitting(true);
    try {
      const orderId = 'ord-' + Math.random().toString(36).substring(2, 7);
      let filePublicUrl: string | undefined;
      if (selectedFile) {
        if (showToast) showToast('Uploading assignment file...', 'success');
        const url = await uploadFileToStorage(selectedFile, orderId);
        filePublicUrl = url || undefined;
      }
      const base = buildOrderBase(orderId, filePublicUrl);
      const totalUSD = Math.max(1, Math.round(budgetInUSD));
      const isEthiopia = country.toLowerCase() === 'ethiopia';
      let newOrder: AcademicOrder;

      if (paymentChoice === 'delivery') {
        newOrder = {
          ...base,
          total_amount: totalUSD,
          currency: 'USD',
          special_instructions: ['Pay Upon Delivery', base.special_instructions].filter(Boolean).join(' | '),
        };
        if (showToast) showToast('Submitting order...', 'success');
      } else {
        if (!paymentScreenshot) {
          if (showToast) showToast('Please upload your payment receipt screenshot.', 'error');
          setIsSubmitting(false);
          return;
        }
        const refText = ethiopiaTxRef.trim();
        const activeMethod = isEthiopia ? ethiopiaMethod : internationalMethod;
        const methodLabel = isEthiopia
          ? `Ethiopia ${ethiopiaMethod.toUpperCase()}${refText ? ` Ref: ${refText}` : ' (Screenshot Attached)'}`
          : `${internationalMethod === 'crypto' ? 'Crypto' : 'Card'} Payment${refText ? ` Ref: ${refText}` : ' (Screenshot Attached)'}`;
        const paymentMethodType = activeMethod === 'crypto' ? 'crypto' : activeMethod === 'card' ? 'card' : 'bank_transfer';
        newOrder = {
          ...base,
          total_amount: totalUSD,
          currency: 'USD',
          special_instructions: [methodLabel, base.special_instructions].filter(Boolean).join(' | '),
          payment_method: isEthiopia ? `ethiopia_${ethiopiaMethod}` : internationalMethod,
          payment_method_type: paymentMethodType,
          payment_ref_number: refText || 'Screenshot Attached',
          payment_screenshot: paymentScreenshot,
          payment_status: 'pending',
        };
        if (showToast) showToast('Submitting order with payment proof...', 'success');
      }

      const created = await fallbackDb.createOrder(newOrder);
      if (!created) throw new Error('Server rejected the order. Please try again.');
      setSuccessOrder(created);
      setSelectedServiceType(null);
      if (showToast) showToast(
        paymentChoice === 'delivery'
          ? 'Order submitted! Our team will review and contact you once ready.'
          : isEthiopia
            ? 'Payment proof received! Awaiting admin confirmation.'
            : 'Crypto payment registered. Awaiting admin confirmation.',
        'success'
      );
    } catch (err: any) {
      console.error('handleSubmit error:', err);
      if (showToast) showToast(err.message || 'Failed to submit order. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => { setSelectedServiceType(null); setCurrentPage(user ? 'dashboard' : 'home'); };

  const canProceed = () => {
    if (step === 1) return serviceType.trim() !== '';
    if (step === 2) {
      if (!deadline || deadline.trim() === '') return false;
      const deadlineMs = new Date(deadline).getTime();
      if (isNaN(deadlineMs) || deadlineMs <= Date.now() + 3600000) return false;
      return true;
    }
    if (step === 3) {
      const budgetVal = Number(budget);
      const minUSD = 3;
      const minLocal = Math.ceil(minUSD * curr.exchangeRate);
      const baseLocal = Math.ceil(getBasePrice(serviceType, country) * curr.exchangeRate);
      return budgetVal >= minLocal && budgetVal >= baseLocal;
    }
    if (step === 4) return true;
    if (step === 5) {
      if (paymentChoice === null) return false;
      if (paymentChoice === 'now') return ethiopiaTxRef.trim() !== '' && paymentScreenshot !== '';
      return true;
    }
    return true;
  };

  const handleNext = () => { if (canProceed() && step < 5) setStep(s => s + 1); };
  const handleBack = () => { if (step > 1) setStep(s => s - 1); };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 40 * 1024 * 1024) { if (showToast) showToast('File too large. Max 40MB.', 'error'); return; }
      setFileName(file.name); setSelectedFile(file);
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (file.size > 40 * 1024 * 1024) { if (showToast) showToast('File too large. Max 40MB.', 'error'); return; }
      setFileName(file.name); setSelectedFile(file);
    }
  };

  // ─── Auth Gate ───
  if (!user) {
    return (
      <div className="bg-[#0F172A] text-slate-100 min-h-[85vh] flex items-center justify-center font-sans px-4">
        <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-5">
          <div className="bg-amber-500/10 text-amber-500 p-3 rounded-full border border-amber-500/20 w-fit mx-auto">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Sign in required</h2>
          <p className="text-sm text-slate-400">You need an account to place an order.</p>
          <div className="space-y-2">
            <button onClick={() => { if (setRedirectPage) setRedirectPage('order'); setCurrentPage('login'); }}
              className="w-full bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-bold py-2.5 rounded-xl text-sm transition-colors cursor-pointer">
              Sign In
            </button>
            <button onClick={() => { if (setRedirectPage) setRedirectPage('order'); setCurrentPage('signup'); }}
              className="w-full bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold py-2.5 rounded-xl text-sm border border-slate-700 transition-colors cursor-pointer">
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Success Screen ───
  if (successOrder) {
    return (
      <div className="bg-[#0F172A] text-slate-100 min-h-[85vh] flex items-center justify-center font-sans px-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-5">
          <div className="bg-emerald-500/15 text-emerald-400 p-3 rounded-full border border-emerald-500/30 w-fit mx-auto">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold text-white">Order Submitted</h2>
          <p className="text-sm text-slate-400">Your assignment is registered. We'll be in touch shortly.</p>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Ref</span><span className="text-amber-400 font-mono font-bold">{successOrder.id}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Service</span><span className="text-white">{successOrder.service_type}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Budget</span><span className="text-amber-400 font-bold">{successOrder.budget_range}</span></div>
          </div>
          <button onClick={() => setCurrentPage('dashboard')}
            className="w-full bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-bold py-2.5 rounded-xl text-sm transition-colors cursor-pointer">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ─── Main Order Form ───
  return (
    <div className="bg-[#0F172A] text-slate-100 h-screen font-sans">

      {/* ── Top Bar ── */}
      <div className="fixed top-0 left-0 right-0 z-30 border-b border-slate-800/80 bg-[#0F172A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Row 1: Back + Title */}
          <div className="flex items-center gap-3 py-2">
            <button onClick={handleGoBack} className="shrink-0 p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-white truncate">Place Your Order</h1>
            </div>
          </div>
          {/* Row 2: Step indicator */}
          <div className="flex items-center gap-0.5 pb-2 overflow-x-auto">
            {STEPS.map((label, i) => {
              const num = i + 1;
              const isActive = num === step;
              const isDone = num < step;
              return (
                <React.Fragment key={i}>
                  <button
                    onClick={() => { if (isDone) setStep(num); }}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : isDone
                          ? 'text-emerald-400 hover:bg-slate-800 cursor-pointer'
                          : 'text-slate-600'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all ${
                      isActive
                        ? 'bg-amber-500 text-[#0F172A] shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                        : isDone
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 text-slate-500'
                    }`}>
                      {isDone ? <Check className="h-3 w-3" /> : num}
                    </span>
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={`w-2 sm:w-5 h-px mx-0 shrink-0 ${isDone ? 'bg-emerald-500/40' : 'bg-slate-800'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 sm:px-6 pt-[76px] pb-[56px] overflow-y-auto" style={{ height: '100dvh' }}>
        <div className="max-w-4xl mx-auto py-2">

          {/* ═══ STEP 1: Service ═══ */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white mb-0.5">What do you need help with?</h2>
                <p className="text-xs text-slate-400">Choose the type of project and tell us the subject.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SERVICE_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setServiceType(opt.value)}
                    className={`group p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      serviceType === opt.value
                        ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/20'
                        : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900'
                    }`}>
                    <span className="text-lg block mb-1">{opt.icon}</span>
                    <h4 className={`text-xs font-bold ${serviceType === opt.value ? 'text-amber-400' : 'text-white group-hover:text-amber-400 transition-colors'}`}>{opt.label}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{opt.desc}</p>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subject / Field</label>
                  <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                    placeholder="e.g. Mechanical Engineering, Calculus"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 rounded-xl py-2 px-3 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-600 min-h-[40px]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Level</label>
                  <select value={academicLevel} onChange={e => setAcademicLevel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 rounded-xl py-2 px-3 text-sm text-slate-100 outline-none transition-all appearance-none cursor-pointer">
                    <option value="High School">High School</option>
                    <option value="Undergraduate">Undergraduate (BSc / BA)</option>
                    <option value="Masters">MSc / Postgraduate</option>
                    <option value="PhD">PhD / Doctorate</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ═══ STEP 2: Details ═══ */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white mb-0.5">Describe your project</h2>
                <p className="text-xs text-slate-400">The more detail you give, the better your result.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assignment Description</label>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Paste your full question, instructions, data parameters, page requirements..."
                  className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 rounded-xl py-2.5 px-3 text-sm text-slate-100 outline-none transition-all resize-none placeholder:text-slate-600" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Special Instructions <span className="text-slate-600 font-normal">(optional)</span></label>
                  <input type="text" value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)}
                    placeholder="APA 7th, SolidWorks 2021, MATLAB R2022b..."
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 rounded-xl py-2 px-3 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-amber-500" /> Deadline</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 rounded-xl py-2 px-3 text-sm text-slate-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Attachments <span className="text-slate-600 font-normal">(optional)</span></label>
                <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl py-4 px-3 text-center transition-all cursor-pointer ${
                    isDragging ? 'border-amber-500 bg-amber-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-900/50'
                  }`}
                  onClick={() => document.getElementById('order-file-picker')?.click()}>
                  {fileName ? (
                    <p className="text-sm text-amber-400 font-semibold">{fileName}</p>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 text-slate-600 mx-auto mb-1" />
                      <p className="text-xs text-slate-500">Drop a file here or <span className="text-amber-400">browse</span></p>
                      <p className="text-[10px] text-slate-600 mt-0.5">PDF, DOCX, ZIP — up to 40 MB</p>
                    </>
                  )}
                  <input type="file" id="order-file-picker" onChange={handleFileChange} className="hidden" />
                </div>
              </div>
            </div>
          )}

          {/* ═══ STEP 3: Budget ═══ */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white mb-0.5">Budget & expert match</h2>
                <p className="text-xs text-slate-400">Set your budget and choose how we match you with a specialist.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Country</label>
                  <select value={country} onChange={e => setCountry(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 rounded-xl py-2 px-3 text-sm text-slate-100 outline-none transition-all appearance-none cursor-pointer">
                    {['Ethiopia', 'United States', 'United Kingdom', 'Canada', 'Germany', 'Saudi Arabia', 'Other'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Budget ({curr.currency})</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">{curr.symbol}</span>
                    <input type="text" value={budget}
                      onChange={e => { budgetManuallyEditedRef.current = true; setBudget(e.target.value.replace(/[^0-9]/g, '') || ''); }}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 rounded-xl py-2 pl-8 pr-3 text-sm text-slate-100 font-bold outline-none transition-all"
                      placeholder={`Min ${curr.symbol}${Math.ceil(getBasePrice(serviceType, country) * curr.exchangeRate)}`} />
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs">
                    <span className="text-slate-500">Base: <span className="text-amber-400 font-bold">{curr.symbol}{Math.ceil(getBasePrice(serviceType, country) * curr.exchangeRate)}</span></span>
                    {Number(budget) > 0 && <span className="text-slate-500">≈ <span className="text-white font-bold">${Math.round(budgetInUSD)} USD</span></span>}
                  </div>
                </div>
              </div>

              {needsDownpayment ? (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-xs text-amber-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Budget ≥ $100 USD — you'll choose to pay now or upon delivery in the final step.
                </div>
              ) : Number(budget) > 0 ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 text-xs text-emerald-400 flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0" />
                  Budget under $100 — no upfront payment required. Pay upon delivery.
                </div>
              ) : null}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Expert Preference</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'auto', icon: Globe, label: 'Auto-Match', desc: 'Best fit for you' },
                    { val: 'previous', icon: Clock, label: 'Previous', desc: 'Worked before' },
                    { val: 'near', icon: MapPin, label: 'Near Me', desc: 'Same timezone' },
                  ].map(opt => {
                    const Icon = opt.icon;
                    return (
                      <button key={opt.val} type="button" onClick={() => setExpertPreference(opt.val)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          expertPreference === opt.val
                            ? 'border-amber-500 bg-amber-500/10'
                            : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                        }`}>
                        <div className="flex items-center justify-between mb-0.5">
                          <Icon className={`h-3.5 w-3.5 ${expertPreference === opt.val ? 'text-amber-400' : 'text-slate-500'}`} />
                          {expertPreference === opt.val && <Check className="h-3 w-3 text-amber-400" />}
                        </div>
                        <h4 className={`text-xs font-bold ${expertPreference === opt.val ? 'text-white' : 'text-slate-300'}`}>{opt.label}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
                {expertPreference === 'previous' && (
                  <input type="text" value={previousExpertName} onChange={e => setPreviousExpertName(e.target.value)}
                    placeholder="Expert name or ID"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 rounded-xl py-2 px-3 text-sm text-slate-100 outline-none transition-all mt-2 placeholder:text-slate-600" />
                )}
              </div>
            </div>
          )}

          {/* ═══ STEP 4: Review ═══ */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white mb-0.5">Review your order</h2>
                <p className="text-xs text-slate-400">Double-check everything before proceeding to payment.</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800/80">
                {[
                  { label: 'Service', value: serviceType },
                  { label: 'Subject', value: subject || 'General' },
                  { label: 'Level', value: academicLevel },
                  { label: 'Deadline', value: new Date(deadline).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                  { label: 'Budget', value: `${curr.symbol}${Number(budget).toLocaleString()} ${curr.currency} (≈ $${Math.round(budgetInUSD)} USD)` },
                  { label: 'Expert', value: getMatchedExpert() },
                  { label: 'File', value: fileName || 'None' },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center px-3 py-2.5">
                    <span className="text-xs text-slate-500 font-medium">{row.label}</span>
                    <span className="text-xs text-white font-medium text-right max-w-[60%] truncate">{row.value}</span>
                  </div>
                ))}
                {description && (
                  <div className="px-3 py-2.5 space-y-0.5">
                    <span className="text-xs text-slate-500 font-medium">Description</span>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{description}</p>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your order is confidential. All work goes through quality review before delivery.
                </p>
              </div>
            </div>
          )}

          {/* ═══ STEP 5: Payment ═══ */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white mb-0.5">How would you like to pay?</h2>
                <p className="text-xs text-slate-400">Choose when you want to make your payment.</p>
              </div>

              {/* Pay Later / Pay Now toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setPaymentChoice('delivery')}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    paymentChoice === 'delivery'
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                  }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">🚚</span>
                    {paymentChoice === 'delivery' && <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"><Check className="h-3 w-3 text-white" /></div>}
                  </div>
                  <h4 className="text-sm font-bold text-white">Pay Later</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">Pay after you've reviewed the completed work.</p>
                </button>

                <button type="button" onClick={() => setPaymentChoice('now')}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    paymentChoice === 'now'
                      ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                  }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">⚡</span>
                    {paymentChoice === 'now' && <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center"><Check className="h-3 w-3 text-[#0F172A]" /></div>}
                  </div>
                  <h4 className="text-sm font-bold text-white">Pay Now</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">Upfront payment to start immediately.</p>
                </button>
              </div>

              {/* ── Pay Now: Ethiopia ── */}
              {paymentChoice === 'now' && country.toLowerCase() === 'ethiopia' && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3">
                  <p className="text-xs text-slate-300">Transfer <strong className="text-amber-400">{curr.symbol}{Number(budget).toLocaleString()} {curr.currency}</strong> to:</p>

                  {/* Method tabs */}
                  <div className="flex gap-1.5">
                    {([
                      { key: 'cbe', label: 'CBE', sub: 'Bank' },
                      { key: 'telebirr', label: 'Telebirr', sub: 'Mobile' },
                      { key: 'boa', label: 'BOA', sub: 'Bank' },
                      { key: 'crypto', label: 'Crypto', sub: '-5%' },
                      { key: 'card', label: 'Card', sub: 'Visa/MC' },
                    ] as const).map(m => (
                      <button key={m.key} type="button" onClick={() => setEthiopiaMethod(m.key)}
                        className={`flex-1 py-2 px-1 rounded-lg border text-center transition-all cursor-pointer min-h-[40px] ${
                          ethiopiaMethod === m.key
                            ? 'border-amber-500 bg-amber-500/10 text-white'
                            : 'border-slate-800 bg-slate-950/50 text-slate-500 hover:border-slate-700'
                        }`}>
                        <span className="block text-[10px] font-bold">{m.label}</span>
                        <span className="block text-[8px] opacity-60">{m.sub}</span>
                      </button>
                    ))}
                  </div>

                  {/* Account details */}
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 font-mono text-[11px] space-y-0.5">
                    {ethiopiaMethod === 'cbe' && paymentConfig?.ethiopia?.cbe && (
                      <>
                        <p className="font-bold text-slate-300">{paymentConfig.ethiopia.cbe.accountName}</p>
                        <p className="text-amber-400 font-bold select-all text-xs">{paymentConfig.ethiopia.cbe.accountNumber}</p>
                      </>
                    )}
                    {ethiopiaMethod === 'telebirr' && paymentConfig?.ethiopia?.telebirr && (
                      <>
                        <p className="font-bold text-slate-300">{paymentConfig.ethiopia.telebirr.name}</p>
                        <p className="text-amber-400 font-bold select-all text-xs">{paymentConfig.ethiopia.telebirr.number}</p>
                      </>
                    )}
                    {ethiopiaMethod === 'boa' && paymentConfig?.ethiopia?.boa && (
                      <>
                        <p className="font-bold text-slate-300">{paymentConfig.ethiopia.boa.accountName}</p>
                        <p className="text-amber-400 font-bold select-all text-xs">{paymentConfig.ethiopia.boa.accountNumber}</p>
                      </>
                    )}
                    {ethiopiaMethod === 'crypto' && paymentConfig?.crypto?.assets?.map((asset: any) =>
                      asset.networks.map((network: any) => (
                        <div key={`${asset.id}-${network.name}`}>
                          <p className="font-bold text-slate-300">{asset.name} — {network.name}</p>
                          <p className="text-amber-400 font-bold select-all text-[10px]">{network.address}</p>
                        </div>
                      ))
                    )}
                    {ethiopiaMethod === 'card' && paymentConfig?.card && (
                      <>
                        <p className="font-bold text-slate-300">{paymentConfig.card.holderName}</p>
                        <p className="text-amber-400 font-bold select-all text-xs tracking-wider">{paymentConfig.card.cardNumber}</p>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-300 mb-1">Transaction Reference</label>
                      <input type="text" value={ethiopiaTxRef} onChange={e => setEthiopiaTxRef(e.target.value)}
                        placeholder="e.g. TXN918237198"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2 px-2.5 text-xs text-slate-100 font-mono outline-none transition-all placeholder:text-slate-600" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-300 mb-1">Payment Screenshot</label>
                      <label className="flex items-center justify-center bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-500 rounded-lg py-2 px-2.5 text-xs text-slate-300 cursor-pointer transition-all">
                        <Upload className="h-3.5 w-3.5 text-amber-500 mr-1.5" />
                        <span className="truncate">{paymentScreenshotName || 'Upload receipt'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={async e => {
                          if (e.target.files?.[0]) {
                            const f = e.target.files[0]; setPaymentScreenshotName(f.name);
                            try { const c = await compressImage(f); setPaymentScreenshot(c); } catch { const r = new FileReader(); r.onloadend = () => setPaymentScreenshot(r.result as string); r.readAsDataURL(f); }
                          }
                        }} />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Pay Now: International ── */}
              {paymentChoice === 'now' && country.toLowerCase() !== 'ethiopia' && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3">
                  {/* Method tabs */}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setInternationalMethod('crypto')}
                      className={`flex-1 py-2 rounded-lg border text-center transition-all cursor-pointer ${
                        internationalMethod === 'crypto'
                          ? 'border-amber-500 bg-amber-500/10 text-white'
                          : 'border-slate-800 bg-slate-950/50 text-slate-500 hover:border-slate-700'
                      }`}>
                      <span className="block text-[11px] font-bold">Crypto</span>
                      <span className="block text-[9px] opacity-60">-{paymentConfig?.crypto?.discountPercent || 5}% off</span>
                    </button>
                    <button type="button" onClick={() => setInternationalMethod('card')}
                      className={`flex-1 py-2 rounded-lg border text-center transition-all cursor-pointer ${
                        internationalMethod === 'card'
                          ? 'border-amber-500 bg-amber-500/10 text-white'
                          : 'border-slate-800 bg-slate-950/50 text-slate-500 hover:border-slate-700'
                      }`}>
                      <span className="block text-[11px] font-bold">Card</span>
                      <span className="block text-[9px] opacity-60">Visa / Mastercard</span>
                    </button>
                  </div>

                  {internationalMethod === 'crypto' && (
                    <div className="space-y-2">
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-xs text-emerald-400 font-bold">
                        ${((Number(budget) || 100) / curr.exchangeRate * (1 - (paymentConfig?.crypto?.discountPercent || 5) / 100)).toFixed(2)} USD <span className="text-[10px] font-normal opacity-70">after {paymentConfig?.crypto?.discountPercent || 5}% crypto discount</span>
                      </div>
                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 font-mono text-[11px] space-y-1.5">
                        {paymentConfig?.crypto?.assets?.map((asset: any) =>
                          asset.networks.map((network: any) => (
                            <div key={`${asset.id}-${network.name}`}>
                              <p className="font-bold text-slate-300">{asset.name} — {network.name}</p>
                              <p className="text-amber-400 font-bold select-all text-[10px]">{network.address}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {internationalMethod === 'card' && paymentConfig?.card && (
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 font-mono text-[11px] space-y-0.5">
                      <p className="text-slate-500 text-[9px] uppercase">Transfer to this card</p>
                      <p className="font-bold text-slate-300">{paymentConfig.card.holderName}</p>
                      <p className="text-amber-400 font-bold select-all text-xs tracking-wider">{paymentConfig.card.cardNumber}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-300 mb-1">Transaction Reference</label>
                      <input type="text" value={ethiopiaTxRef} onChange={e => setEthiopiaTxRef(e.target.value)}
                        placeholder="e.g. hash or reference"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2 px-2.5 text-xs text-slate-100 font-mono outline-none transition-all placeholder:text-slate-600" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-300 mb-1">Payment Screenshot</label>
                      <label className="flex items-center justify-center bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-500 rounded-lg py-2 px-2.5 text-xs text-slate-300 cursor-pointer transition-all">
                        <Upload className="h-3.5 w-3.5 text-amber-500 mr-1.5" />
                        <span className="truncate">{paymentScreenshotName || 'Upload receipt'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={async e => {
                          if (e.target.files?.[0]) {
                            const f = e.target.files[0]; setPaymentScreenshotName(f.name);
                            try { const c = await compressImage(f); setPaymentScreenshot(c); } catch { const r = new FileReader(); r.onloadend = () => setPaymentScreenshot(r.result as string); r.readAsDataURL(f); }
                          }
                        }} />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-800/80 bg-[#0F172A] px-4 sm:px-6 py-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {step > 1 ? (
            <button type="button" onClick={handleBack}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 font-semibold py-2 px-4 rounded-xl text-xs transition-all cursor-pointer">
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </button>
          ) : <div />}

          {step < 5 ? (
            <button type="button" onClick={handleNext} disabled={!canProceed()}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/30 disabled:cursor-not-allowed text-[#0F172A] font-bold py-2 px-5 rounded-xl text-xs transition-all cursor-pointer">
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={isSubmitting || !paymentChoice}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/30 disabled:cursor-not-allowed text-[#0F172A] font-bold py-2 px-5 rounded-xl text-xs transition-all cursor-pointer">
              {isSubmitting ? (
                <><span className="animate-spin h-3.5 w-3.5 border-2 border-[#0F172A] border-t-transparent rounded-full" /> Submitting...</>
              ) : (
                <><ShieldCheck className="h-3.5 w-3.5" /> {paymentChoice === 'delivery' ? 'Place Order' : 'Submit & Pay'}</>
              )}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
