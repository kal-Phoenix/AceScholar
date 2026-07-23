import React, { useState } from 'react';
import { Clock, FileText, Check, HelpCircle, ChevronDown, Send } from 'lucide-react';
import { PageType } from '../types';
import { fallbackDb } from '../lib/supabase';

interface PricingProps {
  setCurrentPage: (page: PageType) => void;
  setSelectedServiceType?: (service: string) => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
  detectedLocation?: {
    country: string;
    currency: string;
    symbol: string;
    exchangeRate: number;
    ip: string;
    city?: string;
  };
}

export default function Pricing({ setCurrentPage, setSelectedServiceType, showToast, detectedLocation }: PricingProps) {
  const [activeCategory, setActiveCategory] = useState<'writing' | 'coding' | 'engineering' | 'data' | 'stem_presentation'>('writing');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Helper to dynamically convert price ranges based on detected location
  const formatPriceRange = (rangeStr: string) => {
    if (!detectedLocation) return rangeStr;
    
    const numbers = rangeStr.match(/\d+/g);
    if (!numbers || numbers.length === 0) return rangeStr;

    const symbol = detectedLocation.symbol;
    const rate = detectedLocation.exchangeRate;

    const converted = numbers.map(num => {
      const val = Number(num) * rate;
      if (detectedLocation.currency === 'ETB') {
        return Math.round(val / 10) * 10;
      }
      return Math.round(val);
    });

    const hasPlus = rangeStr.includes('+');
    if (converted.length === 1) {
      return `${symbol}${converted[0].toLocaleString()}${hasPlus ? '+' : ''}`;
    } else if (converted.length === 2) {
      return `${symbol}${converted[0].toLocaleString()} – ${symbol}${converted[1].toLocaleString()}${hasPlus ? '+' : ''}`;
    }

    return rangeStr;
  };

  // Quote form state
  const [quoteName, setQuoteName] = useState('');
  const [quoteEmail, setQuoteEmail] = useState('');
  const [quoteDesc, setQuoteDesc] = useState('');
  const [quoteDeadline, setQuoteDeadline] = useState('');

  const pricingCategories = {
    writing: {
      title: 'Academic Writing',
      serviceName: 'Academic Writing',
      tiers: [
        { name: 'Basic', range: '$20–$40', desc: 'Up to 5 pages of written work', delivery: '48hr delivery', bullets: ['Custom research scope', 'APA/Harvard citations', 'Fully edited report', 'Turnitin pass report'] },
        { name: 'Standard', range: '$40–$80', desc: '5–15 pages of deep analysis', delivery: '72hr delivery', bullets: ['Advanced research scope', 'Peer-reviewed sources', 'Comprehensive structuring', 'High-priority processing'] },
        { name: 'Premium', range: '$80–$200+', desc: '15+ pages or full thesis', delivery: 'Custom timeline', bullets: ['PhD level specialists', 'Complete thesis drafts', 'Detailed raw datasets', 'Direct writer communication'] }
      ]
    },
    coding: {
      title: 'Coding Projects',
      serviceName: 'Coding Project',
      tiers: [
        { name: 'Basic', range: '$20–$40', desc: 'Simple scripts and functions', delivery: '24hr delivery', bullets: ['Single script file', 'Code syntax review', 'Execution comments', '1-day turnaround'] },
        { name: 'Standard', range: '$50–$100', desc: 'Full app with documentation', delivery: '48hr delivery', bullets: ['Multi-file projects', 'Detailed PDF install guide', 'Fully verified test cases', 'Clean architectural separation'] },
        { name: 'Premium', range: '$100–$300+', desc: 'Complex systems & servers', delivery: 'Custom timeline', bullets: ['Full-stack implementations', 'Robust error logging', 'Database persistence included', 'Live Zoom code walkthrough'] }
      ]
    },
    engineering: {
      title: 'Engineering Drawings',
      serviceName: 'Engineering Drawing',
      tiers: [
        { name: 'Basic', range: '$20–$40', desc: '1–2 standard CAD drafts', delivery: '48hr delivery', bullets: ['2D projection designs', 'PDF/DXF formats', 'Exact dimensions', 'Geometric tolerances'] },
        { name: 'Standard', range: '$50–$100', desc: '3–5 drawings & assemblies', delivery: '72hr delivery', bullets: ['3D SolidWorks source files', 'Exploded views', 'Materials list (BOM)', 'Structural reports included'] },
        { name: 'Premium', range: '$100–$250+', desc: 'Full custom engine/project set', delivery: 'Custom timeline', bullets: ['Complete structural assembly', 'FEA stress test simulation', 'Parametric sheet modeling', 'Academic design manual'] }
      ]
    },
    data: {
      title: 'Data Analysis',
      serviceName: 'Data Analysis',
      tiers: [
        { name: 'Basic', range: '$20–$35', desc: 'Simple charts & summaries', delivery: '24hr delivery', bullets: ['Basic cleaning & filter', 'Descriptive tables', 'PNG/SVG visuals', 'Simple interpretation guide'] },
        { name: 'Standard', range: '$40–$80', desc: 'Full report & interpretation', delivery: '48hr delivery', bullets: ['SPSS / R / Python source', 'Hypothesis testing', 'Linear correlation testing', 'Detailed methodology block'] },
        { name: 'Premium', range: '$80–$200+', desc: 'Advanced statistical metrics', delivery: 'Custom timeline', bullets: ['Predictive machine modeling', 'Interactive bento dashboard', 'Clean markdown report', 'Custom data generation steps'] }
      ]
    },
    stem_presentation: {
      title: 'STEM & Presentations',
      serviceName: 'STEM',
      tiers: [
        { name: 'Basic', range: '$15–$30', desc: 'Calculus, algebra or quick slides', delivery: '24hr delivery', bullets: ['Formula-by-formula derivation', 'PDF scan of handwritten proofs', '10 PowerPoint slides', 'Basic outline formatting'] },
        { name: 'Standard', range: '$30–$60', desc: 'Physics / biochem solver or full deck', delivery: '48hr delivery', bullets: ['Simulation code files included', 'Step-by-step rigorous text', '20 highly designed slides', 'Custom charts and vector icons'] },
        { name: 'Premium', range: '$60–$120+', desc: 'PhD proofs or investor decks', delivery: 'Custom timeline', bullets: ['Advanced research standards', 'Interactive canvas plots', 'Investor pitch-level layout', 'Speaker notes script included'] }
      ]
    }
  };

  const faqs = [
    {
      q: 'How do I pay for my project?',
      a: 'We accept secure credit card payments, PayPal, and international wire transfers. For larger projects (above $150), we offer a flexible 50% milestone payment structure where you pay 50% upfront to initiate work and 50% once the project review draft is delivered.'
    },
    {
      q: 'Is my order confidential?',
      a: 'Your confidentiality is our absolute, foundational priority. All files, metadata, emails, and client records are completely encrypted. We never share student details, and completed work is handed directly to you without ever being uploaded to public indexers or plagiarism detection search libraries.'
    },
    {
      q: 'What if I am not satisfied with the work?',
      a: 'If the delivered work deviates from your original instructions, we will revise it for free. You have an unlimited revisions guarantee for 14 days after delivery. Simply request a revision through your dashboard detailing the specific changes needed.'
    },
    {
      q: 'How fast can you deliver?',
      a: 'We offer extreme high-speed turnarounds. For STEM assignments and presentations, we can deliver within 24 hours. Most standard projects have an average delivery of 48 hours.'
    },
    {
      q: 'Do you offer custom quotes for multi-disciplinary projects?',
      a: 'Absolutely. If your project blends coding, data analysis, and technical report writing, use the Free Quote form below or chat with us on WhatsApp for a combined quote.'
    }
  ];

  const handleOrderRedirect = (serviceType: string) => {
    if (setSelectedServiceType) {
      setSelectedServiceType(serviceType);
    }
    setCurrentPage('order');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteName || !quoteEmail || !quoteDesc) {
      if (showToast) showToast('Please fill out all required fields.', 'error');
      return;
    }

    // Store in Contact Messages as quote requests
    await fallbackDb.postContactMessage({
      name: quoteName,
      email: quoteEmail,
      subject: `Quote Request: ${quoteDeadline || 'No specified deadline'}`,
      message: quoteDesc,
    });

    setQuoteName('');
    setQuoteEmail('');
    setQuoteDesc('');
    setQuoteDeadline('');

    if (showToast) {
      showToast('Custom quote request submitted successfully! We will email you within 2 hours.', 'success');
    }
  };

  return (
    <div className="bg-[#0F172A] font-sans text-slate-100" id="pricing-page-container">
      
      {/* 1. PAGE HEADER */}
      <header className="relative overflow-hidden bg-gradient-to-b from-[#0F172A] via-[#1a1f3a] to-[#0F172A] py-8 sm:py-12 md:py-16 px-4 text-center border-b border-slate-800/40">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:20px_20px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-amber-500/6 rounded-full filter blur-[120px] pointer-events-none"></div>
        <div className="relative max-w-4xl mx-auto space-y-4 sm:space-y-5">
          <span className="text-amber-500 text-[10px] sm:text-xs font-bold tracking-widest uppercase">Honest Rates &bull; No Hidden Fees</span>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-white">Simple, Transparent Pricing</h1>
          <div className="h-1 w-20 bg-gradient-to-r from-amber-500 to-amber-600 mx-auto rounded-full"></div>
          <p className="text-xs sm:text-lg text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            No subscription requirements or surprise charges. Pay only for the depth and speed of the service you actively select.
          </p>
        </div>
      </header>
 
      {/* TABS SWAPPER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-16">
        <div className="flex overflow-x-auto items-center justify-start sm:justify-center gap-1.5 sm:gap-2 border-b border-slate-800 pb-3 sm:pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          {(Object.keys(pricingCategories) as Array<keyof typeof pricingCategories>).map((key) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeCategory === key
                  ? 'bg-amber-500 text-[#0F172A] shadow-md shadow-amber-500/10'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {pricingCategories[key].title}
            </button>
          ))}
        </div>
      </section>
 
      {/* 2. PRICING TABLES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
          {pricingCategories[activeCategory].tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`relative rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-500 card-hover overflow-hidden ${
                idx === 1
                  ? 'border-2 border-amber-500/40 bg-gradient-to-b from-amber-500/10 via-slate-900/60 to-slate-900/60 shadow-xl shadow-amber-500/10 scale-[1.02]'
                  : 'border border-slate-800/60 bg-slate-900/30 hover:border-slate-700/60'
              }`}
            >
              {/* Popular badge for middle tier */}
              {idx === 1 && (
                <div className="absolute -top-0 left-1/2 -translate-x-1/2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-[4px]" />
                    <div className="relative px-5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-b-xl">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
                        <span className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider">Most Popular</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="relative space-y-5 sm:space-y-7">
                {/* Title */}
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">{tier.name}</h3>
                  <p className="text-[10px] sm:text-xs text-slate-400 mt-1.5">{tier.desc}</p>
                </div>
 
                {/* Price Display */}
                <div className="flex items-baseline text-white">
                  <span className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight ${idx === 1 ? 'text-amber-400' : 'text-amber-500'}`}>
                    {formatPriceRange(tier.range)}
                  </span>
                </div>
 
                {/* Delivery details */}
                <div className="flex items-center space-x-1.5 text-[10px] sm:text-xs font-semibold text-amber-500 uppercase bg-amber-500/5 border border-amber-500/10 py-1.5 px-3 rounded-lg w-fit">
                  <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                  <span>{tier.delivery}</span>
                </div>
 
                {/* Bullets */}
                <ul className="space-y-2.5 sm:space-y-3.5 pt-5 sm:pt-7 border-t border-slate-800/60">
                  {tier.bullets.map((bullet, bIdx) => (
                    <li key={bIdx} className="flex items-start text-xs sm:text-sm text-slate-300">
                      <Check className={`h-4 w-4 sm:h-[18px] sm:w-[18px] mr-2 sm:mr-2.5 shrink-0 mt-0.5 ${idx === 1 ? 'text-amber-500' : 'text-emerald-500'}`} />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
 
              </div>
 
              {/* Action Button */}
              <div className="relative pt-7 sm:pt-9">
                <button
                  onClick={() => handleOrderRedirect(pricingCategories[activeCategory].serviceName)}
                  className={`w-full font-bold py-3 sm:py-3.5 px-5 rounded-xl sm:rounded-2xl transition-all duration-300 cursor-pointer text-xs sm:text-sm flex items-center justify-center space-x-2 ${
                    idx === 1
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#0F172A] shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/40 hover:border-slate-600'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Order {tier.name} Tier</span>
                </button>
              </div>
 
            </div>
          ))}
        </div>
      </section>
 
      {/* 3. FREE QUOTE SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10" id="quote-form-section">
        <div className="bg-gradient-to-r from-slate-900 to-[#1E293B] border border-slate-800 rounded-2xl p-5 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full filter blur-xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-2xl mx-auto text-center space-y-2 sm:space-y-3 mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-white">Have a complex project?</h3>
            <p className="text-slate-400 text-xs sm:text-sm">
              Submit your project scope below for a precise custom quote. Our review team will evaluate your document list and email you a direct proposal within 2 hours.
            </p>
          </div>
 
          <form onSubmit={handleQuoteSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 relative z-10">
            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 sm:mb-1.5">Full Name *</label>
              <input
                type="text"
                required
                value={quoteName}
                onChange={(e) => setQuoteName(e.target.value)}
                placeholder="e.g. Alex Mercer"
                className="w-full bg-[#0F172A] border border-slate-800 focus:border-amber-500 rounded-lg py-2 sm:py-2.5 px-3 sm:px-3.5 text-slate-100 text-xs sm:text-sm focus:outline-none transition-colors"
              />
            </div>
 
            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 sm:mb-1.5">Email Address *</label>
              <input
                type="email"
                required
                value={quoteEmail}
                onChange={(e) => setQuoteEmail(e.target.value)}
                placeholder="e.g. alex@example.com"
                className="w-full bg-[#0F172A] border border-slate-800 focus:border-amber-500 rounded-lg py-2 sm:py-2.5 px-3 sm:px-3.5 text-slate-100 text-xs sm:text-sm focus:outline-none transition-colors"
              />
            </div>
 
            <div className="sm:col-span-2">
              <label className="block text-[10px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 sm:mb-1.5">Target Deadline (Optional)</label>
              <input
                type="text"
                value={quoteDeadline}
                onChange={(e) => setQuoteDeadline(e.target.value)}
                placeholder="e.g. Next Wednesday, 10 PM GMT"
                className="w-full bg-[#0F172A] border border-slate-800 focus:border-amber-500 rounded-lg py-2 sm:py-2.5 px-3 sm:px-3.5 text-slate-100 text-xs sm:text-sm focus:outline-none transition-colors"
              />
            </div>
 
            <div className="sm:col-span-2">
              <label className="block text-[10px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 sm:mb-1.5">Project Brief & Details *</label>
              <textarea
                required
                value={quoteDesc}
                onChange={(e) => setQuoteDesc(e.target.value)}
                placeholder="Please describe files needed, system requirements, language preferences, page requirements, and references..."
                rows={4}
                className="w-full bg-[#0F172A] border border-slate-800 focus:border-amber-500 rounded-lg py-2 sm:py-2.5 px-3 sm:px-3.5 text-slate-100 text-xs sm:text-sm focus:outline-none transition-colors"
              />
            </div>
 
            <div className="sm:col-span-2 pt-1 sm:pt-2">
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-bold py-2.5 sm:py-3 px-4 rounded-xl shadow-lg hover:shadow-amber-500/10 transition-all flex items-center justify-center space-x-1.5 sm:space-x-2 cursor-pointer text-xs sm:text-sm"
              >
                <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Submit My Quote Request</span>
              </button>
            </div>
          </form>
        </div>
      </section>
 
      {/* 4. FAQ SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-20 border-t border-slate-900">
        <div className="text-center space-y-2 sm:space-y-3 mb-8 sm:mb-12">
          <HelpCircle className="h-6 sm:h-8 w-6 sm:w-8 text-amber-500 mx-auto" />
          <h2 className="text-xl sm:text-3xl font-bold text-white">Frequently Asked Questions</h2>
          <p className="text-slate-400 text-xs sm:text-sm">Everything you need to know about our premium academic consultancy services.</p>
        </div>
 
        <div className="space-y-3 sm:space-y-4">
          {faqs.map((faq, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div 
                key={idx}
                className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left focus:outline-none cursor-pointer"
                >
                  <span className="font-semibold text-white text-xs sm:text-base pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown className={`h-4 sm:h-5 w-4 sm:w-5 text-slate-400 transition-transform shrink-0 ${
                    isExpanded ? 'transform rotate-180 text-amber-500' : ''
                  }`} />
                </button>
                
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 border-t border-slate-800 text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
 
    </div>
  );
}
