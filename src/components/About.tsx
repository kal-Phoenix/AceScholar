import { ShieldCheck, Zap, Award, RotateCcw, Target, Shield, CalendarDays } from 'lucide-react';
import { PageType } from '../types';

interface AboutProps {
  setCurrentPage: (page: PageType) => void;
}

export default function About({ setCurrentPage }: AboutProps) {
  const handleRedirect = () => {
    setCurrentPage('order');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const features = [
    {
      icon: <Zap className="h-6 w-6 text-amber-500" />,
      title: 'Fast Delivery',
      desc: '48-hour average turnaround time on most complex projects and dissertation chapters.'
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-amber-500" />,
      title: '100% Confidential',
      desc: 'Your identity, institution, payments, and work files are protected under military-grade encryption.'
    },
    {
      icon: <Award className="h-6 w-6 text-[#F59E0B]" />,
      title: 'Expert Team',
      desc: 'Top-tier graduates, researchers, and professional coders matching your specific academic subject area.'
    },
    {
      icon: <RotateCcw className="h-6 w-6 text-amber-500" />,
      title: 'Free Revisions',
      desc: 'Not completely satisfied? We provide unlimited free revisions for 14 days until your criteria are met.'
    }
  ];

  const values = [
    {
      icon: <Target className="h-5 w-5 text-amber-500" />,
      title: 'Uncompromised Quality',
      desc: 'We never cut corners. Every equation, drawing tolerance, or bibliography reference is verified double-blind.'
    },
    {
      icon: <Shield className="h-5 w-5 text-amber-500" />,
      title: 'Strict Confidentiality',
      desc: 'Your personal data is sanitized from all document meta headers. We are a silent partner to your success.'
    },
    {
      icon: <CalendarDays className="h-5 w-5 text-amber-500" />,
      title: 'Unbending Reliability',
      desc: 'We respect schedules. If we accept an assignment with a set deadline, delivery on or ahead of time is absolute.'
    }
  ];

  return (
    <div className="bg-[#0F172A] font-sans text-slate-100" id="about-page-container">
      
      {/* 1. PAGE HEADER */}
      <header className="relative overflow-hidden bg-gradient-to-b from-[#0F172A] via-[#1a1f3a] to-[#0F172A] py-8 sm:py-12 md:py-16 px-4 text-center border-b border-slate-800/40">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:20px_20px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-amber-500/6 rounded-full filter blur-[120px] pointer-events-none"></div>
        <div className="relative max-w-4xl mx-auto space-y-4 sm:space-y-5">
          <span className="text-amber-500 text-[10px] sm:text-xs font-bold tracking-widest uppercase">Our Mission & Identity</span>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-white">About Us</h1>
          <div className="h-1 w-20 bg-gradient-to-r from-amber-500 to-amber-600 mx-auto rounded-full"></div>
          <p className="text-xs sm:text-lg text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            A tight-knit consortium of premium postgraduate graduates dedicated to your global academic and technical project success.
          </p>
        </div>
      </header>
 
      {/* 2. OUR STORY SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center">
          
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-3xl font-extrabold text-white">Our Story</h2>
            <div className="h-1 w-12 bg-amber-500 rounded"></div>
            <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <p>
                We started as rigorous postgraduate students who intimately understood the crushing pressure of strict deadlines, convoluted computer simulations, complex CAD requirements, and extreme academic standards.
              </p>
              <p>
                What began as a localized peer-review syndicate has grown into an elite, private network of expert graduates spanning engineering, computer science, and data sciences across major metropolitan centers, with a dedicated coordination hub in Addis Ababa, Ethiopia.
              </p>
              <p>
                Today, we provide help to students worldwide, assisting them in preparing model answers, literature review outlines, pristine mechanical drawings, and high-performance algorithms. We help them deliver their best work &mdash; on time, every single time.
              </p>
            </div>
          </div>
 
          {/* Right Column: Abstract SVG geometric illustration */}
          <div className="relative flex justify-center">
            <div className="bg-slate-900 border border-slate-800 p-5 sm:p-8 rounded-2xl w-full max-w-md relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-24 h-24 bg-amber-500/5 rounded-full filter blur-xl"></div>
              
              <svg viewBox="0 0 200 200" className="w-full h-auto text-amber-500/10 stroke-amber-500/30 stroke-[1] fill-none">
                {/* Background grid */}
                <line x1="0" y1="50" x2="200" y2="50" />
                <line x1="0" y1="100" x2="200" y2="100" strokeDasharray="4 4" />
                <line x1="0" y1="150" x2="200" y2="150" />
                <line x1="50" y1="0" x2="50" y2="200" />
                <line x1="100" y1="0" x2="100" y2="200" strokeDasharray="4 4" />
                <line x1="150" y1="0" x2="150" y2="200" />
                
                {/* Concentric academic structures */}
                <circle cx="100" cy="100" r="40" className="stroke-amber-500/40" />
                <circle cx="100" cy="100" r="70" className="stroke-amber-500/15" />
                
                {/* Geometrics */}
                <polygon points="100,20 170,140 30,140" className="stroke-amber-500/20" />
                <rect x="60" y="60" width="80" height="80" className="stroke-amber-500/10" transform="rotate(45 100 100)" />
                
                {/* Highlights */}
                <circle cx="100" cy="20" r="4" fill="#f59e0b" className="animate-pulse" />
                <circle cx="170" cy="140" r="4" fill="#f59e0b" />
                <circle cx="30" cy="140" r="4" fill="#f59e0b" />
                <circle cx="100" cy="100" r="6" fill="#f59e0b" />
              </svg>
 
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 bg-slate-950/80 border border-slate-800 p-3 sm:p-4 rounded-xl text-center">
                <span className="block text-lg sm:text-xl font-extrabold text-amber-500">100% Verified</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Postgraduate Specialist Panel</span>
              </div>
            </div>
          </div>
 
        </div>
      </section>
 
      {/* 3. WHY CHOOSE US */}
      <section className="bg-gradient-to-b from-slate-950/60 via-[#0F172A] to-slate-950/60 border-y border-slate-800/40 py-6 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-16">
            <span className="text-amber-500 text-[10px] sm:text-xs font-bold tracking-widest uppercase">Why Us</span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-white">Why Choose Us</h2>
            <div className="h-1 w-20 bg-gradient-to-r from-amber-500 to-amber-600 mx-auto rounded-full"></div>
            <p className="text-slate-400 text-xs sm:text-sm">Four unbending pillars that define our service standards.</p>
          </div>
 
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-8 stagger-children">
            {features.map((feat, idx) => (
              <div 
                key={idx}
                className="group relative bg-slate-900/30 border border-slate-800/60 hover:border-amber-500/30 p-6 sm:p-7 rounded-2xl sm:rounded-3xl transition-all duration-500 card-hover overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl sm:rounded-3xl"></div>
                <div className="relative bg-gradient-to-br from-amber-500/15 to-amber-600/5 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl w-fit mb-4 sm:mb-5 border border-amber-500/10">
                  {feat.icon}
                </div>
                <h3 className="relative font-bold text-sm sm:text-lg text-white mb-2 sm:mb-3">{feat.title}</h3>
                <p className="relative text-[11px] sm:text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
 
      {/* 4. OUR VALUES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="text-center space-y-2 sm:space-y-3 mb-8 sm:mb-14">
          <h2 className="text-xl sm:text-3xl font-bold text-white">Our Values</h2>
          <div className="h-1 w-16 bg-amber-500 mx-auto rounded"></div>
          <p className="text-slate-400 text-xs sm:text-sm">Principles we live by, from initial brief to final delivery.</p>
        </div>
 
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 stagger-children">
          {values.map((v, idx) => (
            <div 
              key={idx}
              className="bg-slate-900/50 border border-slate-800/80 p-5 sm:p-8 rounded-2xl space-y-3 sm:space-y-4"
            >
              <div className="bg-amber-500/10 p-2 sm:p-2.5 rounded-lg w-fit">
                {v.icon}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">{v.title}</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>
 
      {/* 5. GUARANTEE SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4">
        <div className="bg-gradient-to-r from-amber-500/5 via-amber-500/15 to-amber-500/5 border border-amber-500/30 p-5 sm:p-10 rounded-2xl text-center space-y-3 sm:space-y-4">
          <div className="bg-amber-500 text-[#0F172A] p-2 sm:p-2.5 rounded-full w-fit mx-auto ring-4 ring-amber-500/10">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.5]" />
          </div>
          <h3 className="text-base sm:text-xl font-bold text-white uppercase tracking-wider">Our Absolute Promise</h3>
          <p className="text-xs sm:text-base text-slate-200 max-w-2xl mx-auto leading-relaxed">
            &ldquo;If you are not 100% satisfied with the quality of our work, or if it deviates from your initial guidelines in any way, we will revise it for free. No questions asked. Your academic excellence is our duty.&rdquo;
          </p>
        </div>
      </section>
 
      {/* 6. CTA */}
      <section className="py-6 sm:py-10 text-center px-4">
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5">
          <h2 className="text-lg sm:text-3xl font-extrabold text-white">Join thousands of students who trust us</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Take the pressure off your shoulders. Delegate your technical calculations, blueprints, or literature summaries to expert graduates today.
          </p>
          <div className="pt-1 sm:pt-2">
            <button
              onClick={handleRedirect}
              className="bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-extrabold text-xs sm:text-sm px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-xl shadow-lg hover:shadow-amber-500/10 transition-all cursor-pointer"
            >
              Place Your Order Now
            </button>
          </div>
        </div>
      </section>
 
    </div>
  );
}
