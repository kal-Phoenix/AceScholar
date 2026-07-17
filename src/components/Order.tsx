import React, { useState, useEffect } from 'react';
import {
  FileText, ClipboardList, Clock, DollarSign, Upload, Sparkles,
  ChevronLeft, ShieldCheck, HelpCircle, CreditCard, Lock, UserCheck,
  MapPin, Globe, Check, ChevronRight, BookOpen, Layers, Code, Pencil,
  BarChart2, Calculator, Presentation, X, AlertCircle
} from 'lucide-react';
import { PageType, Profile, Order as AcademicOrder } from '../types';
import { fallbackDb, supabase } from '../lib/supabase';
import IosDateTimePicker from './IosDateTimePicker';

const EXPERTS = [
  {
    id: 'exp-biruk', name: 'Eng. Biruk T.', degree: 'MSc in Mechanical Engineering', rating: 4.9,
    completedJobs: 184,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    specialty: '2D Drafting & SolidWorks CAD', location: 'Addis Ababa, Ethiopia', timezone: 'UTC+3',
    bonusInfo: 'Top CAD & Drawing Specialist'
  },
  {
    id: 'exp-sarah', name: 'Dr. Sarah Jenkins', degree: 'PhD in Literature & Academic Methods', rating: 4.8,
    completedJobs: 312,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    specialty: 'Academic Writing & Essay Design', location: 'London, United Kingdom', timezone: 'UTC+1',
    bonusInfo: 'Top Essay Specialist'
  },
  {
    id: 'exp-michael', name: 'Eng. Michael S.', degree: 'PhD in Applied Physics & Mathematics', rating: 4.9,
    completedJobs: 245,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
    specialty: 'STEM Problems & Numerical Analysis', location: 'California, United States', timezone: 'UTC-7',
    bonusInfo: 'Calculus & Physics Specialist'
  },
  {
    id: 'exp-almaz', name: 'Almaz D.', degree: 'BSc in Software Engineering', rating: 5.0,
    completedJobs: 92,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    specialty: 'Coding (Python, MATLAB, Web Dev)', location: 'Bahir Dar, Ethiopia', timezone: 'UTC+3',
    bonusInfo: 'Fastest 12h express coder'
  }
];

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

const STEPS = ['Project Details', 'Requirements', 'Budget & Expert', 'Review', 'Payment'];

export default function Order({ user, selectedServiceType, setSelectedServiceType, setCurrentPage, showToast, detectedLocation, setRedirectPage }: OrderProps) {
  const [step, setStep] = useState(1);

  // Step 1 fields
  const [serviceType, setServiceType] = useState(selectedServiceType || 'Academic Writing');
  const [subject, setSubject] = useState('');
  const [academicLevel, setAcademicLevel] = useState('Undergraduate');

  // Step 2 fields
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

  // Step 3 fields
  const [country, setCountry] = useState(() => detectedLocation?.country || user?.country || 'Ethiopia');
  const [budget, setBudget] = useState('');
  const [expertPreference, setExpertPreference] = useState('auto');
  const [selectedExpertId, setSelectedExpertId] = useState<string>('auto');
  const [previousExpertName, setPreviousExpertName] = useState('');
  const [liveRates, setLiveRates] = useState<Record<string, number>>({ ETB: 120, GBP: 0.79, CAD: 1.36, EUR: 0.92, SAR: 3.75 });

  // Step 5 payment
  const [paymentChoice, setPaymentChoice] = useState<'now' | 'delivery' | null>(null);
  const [ethiopiaMethod, setEthiopiaMethod] = useState<'cbe' | 'telebirr' | 'boa'>('cbe');
  const [ethiopiaTxRef, setEthiopiaTxRef] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<string>('');
  const [paymentScreenshotName, setPaymentScreenshotName] = useState<string>('');
  const [paddleCardName, setPaddleCardName] = useState('');
  const [paddleCardNumber, setPaddleCardNumber] = useState('');
  const [paddleCardExpiry, setPaddleCardExpiry] = useState('');
  const [paddleCardCvv, setPaddleCardCvv] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<AcademicOrder | null>(null);

  // Live exchange rates
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
    const c = getCurrencyDetails();
    const base = getBasePrice(serviceType, country);
    setBudget(String(Math.ceil(base * c.exchangeRate)));
  }, [serviceType, country, detectedLocation, liveRates]);

  const uploadFileToStorage = async (file: File, orderId: string): Promise<string | null> => {
    if (!supabase) return null;
    const ext = file.name.split('.').pop();
    const path = `orders/${orderId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('order-files').upload(path, file, { contentType: file.type, upsert: true });
    if (error) return null;
    const { data: urlData } = supabase.storage.from('order-files').getPublicUrl(path);
    return urlData?.publicUrl || null;
  };

  const getMatchedExpert = () => {
    if (expertPreference === 'previous') return `Previous Expert: ${previousExpertName || 'Not specified'}`;
    if (expertPreference === 'near') return 'Expert Specialist Near Me (Timezone Match)';
    if (expertPreference === 'choose' && selectedExpertId !== 'auto') {
      const exp = EXPERTS.find(e => e.id === selectedExpertId);
      if (exp) return `Selected Expert: ${exp.name} (${exp.specialty})`;
    }
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

      // Upload assignment attachment file if one was selected
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
        // Pay Upon Delivery — no payment yet, don't set payment_status or screenshot
        newOrder = {
          ...base,
          total_amount: totalUSD,
          currency: 'USD',
          special_instructions: ['Pay Upon Delivery', base.special_instructions].filter(Boolean).join(' | '),
          // payment_status intentionally omitted — admin activates invoice when work is done
        };
        if (showToast) showToast('Submitting order...', 'success');
      } else {
        // Pay Now — validate screenshot
        if (!paymentScreenshot) {
          if (showToast) showToast('Please upload your payment receipt screenshot.', 'error');
          setIsSubmitting(false);
          return;
        }

        const refText = ethiopiaTxRef.trim();
        const methodLabel = isEthiopia
          ? `Ethiopia ${ethiopiaMethod.toUpperCase()}${refText ? ` Ref: ${refText}` : ' (Screenshot Attached)'}`
          : `Crypto Payment${refText ? ` Ref: ${refText}` : ' (Screenshot Attached)'}`;

        newOrder = {
          ...base,
          total_amount: totalUSD,
          currency: 'USD',
          special_instructions: [methodLabel, base.special_instructions].filter(Boolean).join(' | '),
          payment_method: isEthiopia ? `ethiopia_${ethiopiaMethod}` : 'crypto',
          payment_method_type: isEthiopia ? 'bank_transfer' : 'crypto',
          payment_ref_number: refText || 'Screenshot Attached',
          payment_screenshot: paymentScreenshot,
          payment_status: 'pending',   // signals admin to verify
        };
        if (showToast) showToast('Submitting order with payment proof...', 'success');
      }

      // Use the proper POST /api/orders endpoint (not bulk sync)
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

  // Validation per step
  const canProceed = () => {
    if (step === 1) return serviceType.trim() !== '';
    if (step === 2) {
      if (!deadline || deadline.trim() === '') return false;
      // Validate that deadline is in the future (at least 1 hour from now)
      const deadlineMs = new Date(deadline).getTime();
      if (isNaN(deadlineMs) || deadlineMs <= Date.now() + 3600000) {
        return false;
      }
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
      if (paymentChoice === 'now') {
        return ethiopiaTxRef.trim() !== '' && paymentScreenshot !== '';
      }
      return true;
    }
    return true;
  };

  const handleNext = () => { if (canProceed() && step < 5) setStep(s => s + 1); };
  const handleBack = () => { if (step > 1) setStep(s => s - 1); };

  // File handlers
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

  if (!user) {
    return (
      <div className="bg-[#0F172A] text-slate-100 min-h-[85vh] py-12 px-4 sm:px-6 flex items-center justify-center font-sans" id="order-signin-required-container">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-center space-y-6">
          <div className="bg-amber-500/10 text-amber-500 p-4 rounded-full border border-amber-500/20 w-fit mx-auto">
            <Lock className="h-10 w-10 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Authentication Required</h2>
            <p className="text-xs sm:text-sm text-slate-400">You must be logged in to place academic orders.</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <button onClick={() => { if (setRedirectPage) setRedirectPage('order'); setCurrentPage('login'); }}
              className="w-full bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-bold py-3 rounded-xl text-sm shadow-lg cursor-pointer flex items-center justify-center space-x-2">
              <UserCheck className="h-4 w-4" /><span>Sign In to Continue</span>
            </button>
            <button onClick={() => { if (setRedirectPage) setRedirectPage('order'); setCurrentPage('signup'); }}
              className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold py-3 rounded-xl text-sm border border-slate-700 cursor-pointer">
              Create Free Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (successOrder) {
    return (
      <div className="bg-[#0F172A] text-slate-100 min-h-[85vh] py-12 px-4 sm:px-6 flex items-center justify-center font-sans" id="order-success-container">
        <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-10 text-center space-y-6">
          <div className="bg-emerald-500/15 text-emerald-400 p-4 rounded-full border border-emerald-500/30 w-fit mx-auto animate-bounce">
            <ShieldCheck className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Order Submitted!</h2>
            <p className="text-xs sm:text-sm text-slate-300">Your assignment specifications are registered securely.</p>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 sm:p-6 text-left font-mono text-xs sm:text-sm space-y-3">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">ORDER REF:</span>
              <span className="text-amber-500 font-bold">{successOrder.id}</span>
            </div>
            <div className="flex justify-between"><span className="text-slate-400">SERVICE:</span><span className="text-slate-200">{successOrder.service_type}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">SUBJECT:</span><span className="text-slate-200">{successOrder.subject}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">LEVEL:</span><span className="text-slate-200">{successOrder.academic_level}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">DEADLINE:</span>
              <span className="text-slate-200">{new Date(successOrder.deadline).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="flex justify-between"><span className="text-slate-400">BUDGET:</span><span className="text-amber-400 font-bold">{successOrder.budget_range}</span></div>
          </div>
          <button onClick={() => setCurrentPage('dashboard')}
            className="w-full bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-bold py-3 rounded-lg text-sm shadow-lg cursor-pointer">
            Go to My Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0F172A] text-slate-100 min-h-screen font-sans py-8 px-4 sm:px-6 lg:px-8" id="order-form-container">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Back Button */}
        <button onClick={handleGoBack} className="inline-flex items-center space-x-1 text-slate-400 hover:text-white transition-colors text-sm cursor-pointer">
          <ChevronLeft className="h-4 w-4" /><span>Back</span>
        </button>

        {/* Header */}
        <header className="space-y-1">
          <span className="text-amber-500 text-xs font-bold tracking-widest uppercase">Secure Order Form</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Place Your Academic Order</h1>
          <p className="text-xs sm:text-sm text-slate-400 font-light">Complete the steps below to connect with a specialist. Revisions are always free.</p>
        </header>

        {/* Step Progress Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step {step} of {STEPS.length}</span>
            <span className="text-xs font-bold text-amber-400">{STEPS[step - 1]}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className={`h-1.5 w-full rounded-full transition-all duration-500 ${i < step ? 'bg-amber-500' : i === step - 1 ? 'bg-amber-500/50' : 'bg-slate-800'}`} />
                <span className={`hidden sm:block text-[9px] font-bold uppercase tracking-wider ${i < step ? 'text-amber-400' : i === step - 1 ? 'text-slate-300' : 'text-slate-600'}`}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-8 space-y-6" id="order-step-card">

          {/* ─── STEP 1: Project Details ─── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">Select Your Service</h3>
              </div>

              {/* Service Type Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SERVICE_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setServiceType(opt.value)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${serviceType === opt.value ? 'border-amber-500 bg-amber-500/10' : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'}`}>
                    <span className="text-xl block mb-1">{opt.icon}</span>
                    <h4 className={`text-xs font-bold leading-tight ${serviceType === opt.value ? 'text-amber-400' : 'text-white'}`}>{opt.label}</h4>
                    <p className="text-[9px] text-slate-500 mt-0.5 font-light leading-tight">{opt.desc}</p>
                    {serviceType === opt.value && <Check className="h-3 w-3 text-amber-500 mt-1" />}
                  </button>
                ))}
              </div>

              {/* Subject & Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Specific Subject / Field</label>
                  <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                    placeholder="e.g. Mechanical Engineering, Calculus, Literature"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2 px-3 text-slate-100 text-sm outline-none transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Academic Level *</label>
                  <select value={academicLevel} onChange={e => setAcademicLevel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2 px-3 text-slate-100 text-sm outline-none transition-colors">
                    <option value="High School">High School</option>
                    <option value="Undergraduate">Undergraduate (BSc/BA)</option>
                    <option value="Masters">MSc / Postgraduate</option>
                    <option value="PhD">PhD / Doctorate</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 2: Requirements ─── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <ClipboardList className="h-5 w-5 text-amber-500" />
                <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">Describe Your Requirements</h3>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Assignment Description / Prompt</label>
                <textarea rows={5} value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Copy and paste your complete question prompts, instructions, data parameters, required page counts, system definitions..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2 px-3 text-slate-100 text-sm outline-none transition-colors resize-none font-light" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Special Instructions (Optional)</label>
                <input type="text" value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. APA 7th style, SolidWorks 2021, MATLAB R2022b, 12 peer-reviewed journals"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2 px-3 text-slate-100 text-sm outline-none transition-colors" />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-amber-500" /><span>Exact Project Deadline *</span>
                </label>
                <IosDateTimePicker value={deadline} onChange={setDeadline} />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">Attach Guidelines / Prompt Files (Optional)</label>
                <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${isDragging ? 'border-amber-500 bg-amber-500/5' : 'border-slate-800 hover:border-amber-500/50 bg-slate-950/40'}`}
                  onClick={() => document.getElementById('order-file-picker')?.click()}>
                  <Upload className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">{fileName ? <span className="text-amber-400 font-semibold">📎 {fileName}</span> : 'Drag & drop or click to attach (PDF, DOCX, ZIP, etc.)'}</p>
                  <input type="file" id="order-file-picker" onChange={handleFileChange} className="hidden" />
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 3: Budget & Expert ─── */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <DollarSign className="h-5 w-5 text-amber-500" />
                <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">Budget & Expert Match</h3>
              </div>

              {/* Country */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Your Country (for currency)</label>
                <select value={country} onChange={e => setCountry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2 px-3 text-slate-100 text-sm outline-none transition-colors">
                  {['Ethiopia', 'United States', 'United Kingdom', 'Canada', 'Germany', 'Saudi Arabia', 'Other'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Budget */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Your Budget ({curr.currency}) *</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400 text-xs font-mono font-bold">{curr.symbol}</span>
                  <input type="text" value={budget}
                    onChange={e => setBudget(e.target.value.replace(/[^0-9]/g, '') || '')}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2 pl-8 pr-3 text-slate-100 text-sm outline-none transition-colors font-mono font-bold"
                    placeholder={`Min ${curr.symbol}${Math.ceil(getBasePrice(serviceType, country) * curr.exchangeRate)}`} required />
                </div>
                <div className="flex flex-wrap gap-3 text-xs mt-1">
                  <span className="text-slate-400">Base price: <span className="text-amber-400 font-bold">{curr.symbol}{Math.ceil(getBasePrice(serviceType, country) * curr.exchangeRate)} {curr.currency}</span></span>
                  {Number(budget) > 0 && <span className="text-slate-400">≈ <span className="text-white font-bold">${Math.round(budgetInUSD)} USD</span></span>}
                </div>
                {needsDownpayment && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-xs text-amber-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Budget ≥ $100 USD — You will choose to <strong>Pay Now</strong> or <strong>Pay Upon Delivery</strong> in the final step.</span>
                  </div>
                )}
                {!needsDownpayment && Number(budget) > 0 && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 text-xs text-emerald-400 flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0" />
                    <span>Budget under $100 — <strong>No upfront payment required.</strong> Pay upon delivery.</span>
                  </div>
                )}
              </div>

              {/* Expert Preference */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">Expert Preference</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {[
                    { val: 'auto', icon: <Globe className="h-4 w-4 text-amber-500" />, label: 'Auto-Match', desc: 'Best overall fit' },
                    { val: 'choose', icon: <UserCheck className="h-4 w-4 text-amber-500" />, label: 'Pick Expert', desc: 'Choose specialist' },
                    { val: 'previous', icon: <Clock className="h-4 w-4 text-amber-500" />, label: 'Previous', desc: 'Worked before' },
                    { val: 'near', icon: <MapPin className="h-4 w-4 text-amber-500" />, label: 'Near Me', desc: 'Timezone-aligned' },
                  ].map(opt => (
                    <button key={opt.val} type="button" onClick={() => { setExpertPreference(opt.val); if (opt.val !== 'choose') setSelectedExpertId('auto'); }}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${expertPreference === opt.val ? 'border-amber-500 bg-amber-500/10 text-white' : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 text-slate-300'}`}>
                      <div className="flex items-center justify-between">{opt.icon}{expertPreference === opt.val && <Check className="h-3.5 w-3.5 text-amber-500" />}</div>
                      <h4 className="text-xs font-bold mt-1.5">{opt.label}</h4>
                      <p className="text-[9px] text-slate-400 mt-0.5 font-light">{opt.desc}</p>
                    </button>
                  ))}
                </div>

                {expertPreference === 'choose' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {EXPERTS.map(exp => (
                      <div key={exp.id} onClick={() => setSelectedExpertId(exp.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex space-x-3 ${selectedExpertId === exp.id ? 'border-amber-500 bg-amber-500/5' : 'border-slate-850 bg-slate-950/60 hover:border-slate-750'}`}>
                        <img src={exp.avatar} alt={exp.name} referrerPolicy="no-referrer" className="h-10 w-10 rounded-full object-cover border border-slate-700 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-white truncate">{exp.name}</h4>
                            <span className="text-[10px] text-amber-400 font-mono shrink-0">★ {exp.rating}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">{exp.specialty}</p>
                          <p className="text-[10px] text-slate-500">{exp.completedJobs} completed</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {expertPreference === 'previous' && (
                  <input type="text" value={previousExpertName} onChange={e => setPreviousExpertName(e.target.value)}
                    placeholder="e.g. Expert #401, Dr. Alex, or Eng. Biruk"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2 px-3 text-slate-100 text-xs outline-none transition-colors mt-2" />
                )}
              </div>
            </div>
          )}

          {/* ─── STEP 4: Review ─── */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <FileText className="h-5 w-5 text-amber-500" />
                <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">Review Your Order</h3>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl divide-y divide-slate-800">
                {[
                  { label: 'Service Type', value: serviceType },
                  { label: 'Subject / Field', value: subject || 'General / Unspecified' },
                  { label: 'Academic Level', value: academicLevel },
                  { label: 'Deadline', value: new Date(deadline).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                  { label: 'Budget', value: `${curr.symbol}${Number(budget).toLocaleString()} ${curr.currency} (≈ $${Math.round(budgetInUSD)} USD)` },
                  { label: 'Expert Match', value: getMatchedExpert() },
                  { label: 'Payment Mode', value: needsDownpayment ? 'To be selected (≥$100 threshold)' : 'Pay Upon Delivery (< $100)' },
                  { label: 'Attached File', value: fileName || 'None' },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-start px-4 py-3 gap-3">
                    <span className="text-xs text-slate-500 uppercase font-bold tracking-wider shrink-0 min-w-[100px]">{row.label}</span>
                    <span className="text-xs text-white font-medium text-right">{row.value}</span>
                  </div>
                ))}
                {description && (
                  <div className="px-4 py-3 space-y-1">
                    <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Description</span>
                    <p className="text-xs text-slate-300 font-light leading-relaxed line-clamp-4">{description}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                <p className="text-xs text-slate-300 font-light leading-relaxed">
                  We strictly defend student confidentiality. All deliverables pass rigorous quality checks. Review above details and proceed to payment.
                </p>
              </div>
            </div>
          )}

          {/* ─── STEP 5: Payment ─── */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <CreditCard className="h-5 w-5 text-amber-500" />
                <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">Payment Options</h3>
              </div>

              {/* Payment Option Cards */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {/* Pay Later */}
                <button type="button" onClick={() => setPaymentChoice('delivery')}
                  className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${paymentChoice === 'delivery' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-950/40 hover:border-emerald-500/40'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">🚚</span>
                    {paymentChoice === 'delivery' && <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center"><Check className="h-3 w-3 text-white" /></div>}
                  </div>
                  <h4 className="text-sm font-extrabold text-white">Pay Later</h4>
                  <p className="text-xs text-slate-400 mt-1 font-light leading-relaxed">
                    Submit your order now — pay only after the admin reviews and notifies you that your assignment is completed and you've seen a preview.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded">No upfront cost</span>
                    <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded">Secure escrow</span>
                  </div>
                </button>

                {/* Pay Now */}
                <button type="button" onClick={() => setPaymentChoice('now')}
                  className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${paymentChoice === 'now' ? 'border-amber-500 bg-amber-500/10' : 'border-slate-800 bg-slate-950/40 hover:border-amber-500/40'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">⚡</span>
                    {paymentChoice === 'now' && <div className="h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center"><Check className="h-3 w-3 text-[#0F172A]" /></div>}
                  </div>
                  <h4 className="text-sm font-extrabold text-white">Pay Now</h4>
                  <p className="text-xs text-slate-400 mt-1 font-light leading-relaxed">
                    Make an upfront payment to get your specialist started immediately. Remaining balance (if any) is collected after delivery.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded">Instant start</span>
                    <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded">Priority queue</span>
                  </div>
                </button>
              </div>

              {/* Pay Now form — Ethiopia */}
              {paymentChoice === 'now' && country.toLowerCase() === 'ethiopia' && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 animate-in fade-in duration-150">
                  <p className="text-xs text-slate-300">Transfer <strong className="text-amber-400">{curr.symbol}{Number(budget).toLocaleString()} {curr.currency}</strong> to our accounts:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['cbe', 'telebirr', 'boa'] as const).map(m => (
                      <button key={m} type="button" onClick={() => setEthiopiaMethod(m)}
                        className={`p-2.5 rounded-lg border flex flex-col items-center cursor-pointer transition-all text-center ${ethiopiaMethod === m ? 'border-amber-500 bg-amber-500/10 text-white font-bold' : 'border-slate-850 bg-slate-950/40 text-slate-400'}`}>
                        <span className="text-xs uppercase">{m}</span>
                        <span className="text-[8px] opacity-70 mt-0.5">{m === 'cbe' ? 'Comm. Bank' : m === 'telebirr' ? 'Mobile Pay' : 'Abyssinia'}</span>
                      </button>
                    ))}
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl text-xs space-y-1 font-mono">
                    {ethiopiaMethod === 'cbe' && <><p className="font-bold text-slate-200">CBE — AceScholar Academic Solutions</p><p className="text-amber-400 font-bold select-all">1000459928374</p></>}
                    {ethiopiaMethod === 'telebirr' && <><p className="font-bold text-slate-200">Telebirr — AceScholar Solutions</p><p className="text-amber-400 font-bold select-all">7718223</p></>}
                    {ethiopiaMethod === 'boa' && <><p className="font-bold text-slate-200">BOA — AceScholar Services Group</p><p className="text-amber-400 font-bold select-all">881920038</p></>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase">Transaction Reference ID *</label>
                    <input type="text" value={ethiopiaTxRef} onChange={e => setEthiopiaTxRef(e.target.value)}
                      placeholder="e.g. TXN918237198"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2 px-3 text-slate-100 text-xs font-mono outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase">Upload Payment Screenshot *</label>
                    <label className="flex items-center justify-center bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-500 rounded-lg py-2 px-4 text-slate-300 text-xs font-semibold cursor-pointer transition-colors space-x-2">
                      <Upload className="h-4 w-4 text-amber-500" />
                      <span>{paymentScreenshotName || 'Upload Receipt Screenshot'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={async e => {
                        if (e.target.files?.[0]) {
                          const f = e.target.files[0]; setPaymentScreenshotName(f.name);
                          try { const c = await compressImage(f); setPaymentScreenshot(c); } catch { const r = new FileReader(); r.onloadend = () => setPaymentScreenshot(r.result as string); r.readAsDataURL(f); }
                        }
                      }} />
                    </label>
                  </div>
                </div>
              )}

              {/* Pay Now form — International */}
              {paymentChoice === 'now' && country.toLowerCase() !== 'ethiopia' && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Crypto Downpayment (5% Discount Applied)</h4>
                    <span className="bg-emerald-500 text-slate-950 font-bold font-mono text-[9px] px-2 py-0.5 rounded uppercase">Save 5%</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-850 text-xs flex justify-between items-center">
                    <div>
                      <span className="block text-slate-500 text-[9px]">Downpayment Price (5% Off)</span>
                      <strong className="text-emerald-400 font-mono text-sm">
                        ${((Number(budget) || 100) / curr.exchangeRate * 0.95).toFixed(2)} USD
                      </strong>
                    </div>
                  </div>
                  <div className="bg-slate-900 border border-slate-850 rounded-xl p-3 text-xs space-y-2 font-mono">
                    <div>
                      <span className="block text-slate-500 text-[8px]">USDT Address (TRC-20)</span>
                      <strong className="text-white text-xs select-all">TXd82PqE8YhN1x9bB8P7Kz32LqW7k3Qp5Z</strong>
                    </div>
                    <div>
                      <span className="block text-slate-500 text-[8px]">Bitcoin (BTC) Address</span>
                      <strong className="text-white text-xs select-all">1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa</strong>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase">Transaction Hash / Reference *</label>
                    <input type="text" value={ethiopiaTxRef} onChange={e => setEthiopiaTxRef(e.target.value)}
                      placeholder="e.g. hash or reference number"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2 px-3 text-slate-100 text-xs font-mono outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase">Upload Payment Screenshot *</label>
                    <label className="flex items-center justify-center bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-500 rounded-lg py-2 px-4 text-slate-300 text-xs font-semibold cursor-pointer transition-colors space-x-2">
                      <Upload className="h-4 w-4 text-amber-500" />
                      <span>{paymentScreenshotName || 'Upload Receipt Screenshot'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={async e => {
                        if (e.target.files?.[0]) {
                          const f = e.target.files[0]; setPaymentScreenshotName(f.name);
                          try { const c = await compressImage(f); setPaymentScreenshot(c); } catch { const r = new FileReader(); r.onloadend = () => setPaymentScreenshot(r.result as string); r.readAsDataURL(f); }
                        }
                      }} />
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className={`pt-4 border-t border-slate-800 flex items-center ${step > 1 ? 'justify-between' : 'justify-end'} gap-3`}>
            {step > 1 && (
              <button type="button" onClick={handleBack}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 font-bold py-2.5 px-5 rounded-xl text-sm transition-all cursor-pointer">
                <ChevronLeft className="h-4 w-4" /><span>Back</span>
              </button>
            )}

            {step < 5 ? (
              <button type="button" onClick={handleNext} disabled={!canProceed()}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/40 disabled:cursor-not-allowed text-[#0F172A] font-extrabold py-2.5 px-6 rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-amber-500/10">
                <span>Next</span><ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={isSubmitting || !paymentChoice}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/40 disabled:cursor-not-allowed text-[#0F172A] font-extrabold py-2.5 px-6 rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-amber-500/10">
                {isSubmitting ? (
                  <><span className="animate-spin inline-block h-4 w-4 border-2 border-[#0F172A] border-t-transparent rounded-full" /><span>Submitting...</span></>
                ) : (
                  <><ShieldCheck className="h-4 w-4" /><span>{paymentChoice === 'delivery' ? 'Confirm Order' : 'Submit & Pay'}</span></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
