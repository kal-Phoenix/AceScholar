import { ShieldCheck, Zap, Award, RotateCcw, Target, Shield, CalendarDays, ArrowRight } from 'lucide-react';
import { PageType } from '../types';
import ScrollReveal from './ScrollReveal';
import TiltCard from './TiltCard';
import RippleButton from './RippleButton';

interface AboutProps {
  setCurrentPage: (page: PageType) => void;
}

export default function About({ setCurrentPage }: AboutProps) {
  const handleRedirect = () => {
    setCurrentPage('order');
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
      desc: 'Your personal info, files, and orders are private and never shared.'
    },
    {
      icon: <Award className="h-6 w-6 text-[#F59E0B]" />,
      title: 'Expert Team',
      desc: 'Graduates, researchers, and developers matching your subject area.'
    },
    {
      icon: <RotateCcw className="h-6 w-6 text-amber-500" />,
      title: 'Free Revisions',
      desc: '14 days of free revisions after delivery to ensure everything meets your instructions.'
    }
  ];

  const values = [
    {
      icon: <Target className="h-6 w-6 text-amber-500" />,
      title: 'Quality First',
      desc: 'Every proof, code file, drawing, or paper is thoroughly checked before it reaches you.'
    },
    {
      icon: <Shield className="h-6 w-6 text-amber-500" />,
      title: 'Strict Confidentiality',
      desc: 'Your personal data is stripped from all files. Your identity is completely secure.'
    },
    {
      icon: <CalendarDays className="h-6 w-6 text-amber-500" />,
      title: 'Reliable Timing',
      desc: 'We take deadlines seriously. When we accept a project, on-time delivery is guaranteed.'
    }
  ];

  return (
    <div className="bg-[#0F172A] font-sans text-slate-100" id="about-page-container">
      
      {/* PAGE HEADER */}
      <header className="relative overflow-hidden bg-gradient-to-b from-[#0F172A] via-[#1a1f3a] to-[#0F172A] py-10 sm:py-14 md:py-20 px-4 text-center border-b border-slate-800/40">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:20px_20px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-amber-500/6 rounded-full filter blur-[120px] pointer-events-none animate-ambient"></div>
        <div className="relative max-w-4xl mx-auto space-y-4 sm:space-y-5">
          <ScrollReveal>
            <span className="text-amber-500 text-xs sm:text-sm font-bold tracking-widest uppercase">Our Mission & Identity</span>
          </ScrollReveal>
          <ScrollReveal delay={1}>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-white">About Us</h1>
          </ScrollReveal>
          <ScrollReveal delay={2}>
            <div className="h-1 w-20 bg-gradient-to-r from-amber-500 to-amber-600 mx-auto rounded-full"></div>
          </ScrollReveal>
          <ScrollReveal delay={3}>
            <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
              A team of graduate researchers, engineers, and developers helping students succeed in their technical and academic projects.
            </p>
          </ScrollReveal>
        </div>
      </header>

      {/* OUR STORY SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
          
          <ScrollReveal direction="left">
            <div className="space-y-5 sm:space-y-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Our Story</h2>
              <div className="h-1 w-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"></div>
              <div className="space-y-4 text-sm sm:text-base text-slate-300 leading-relaxed">
                <p>
                  AceScholar was started by postgraduate students who understood firsthand how stressful tight deadlines, complex software simulations, and heavy research workloads can be.
                </p>
                <p>
                  We grew into a dedicated team of specialists in engineering, computer science, mathematics, and academic writing — based out of Addis Ababa, Ethiopia, and serving clients around the world.
                </p>
                <p>
                  Our goal is simple: deliver high-quality work, on time, with absolute privacy. Whether you need a full codebase, CAD blueprints, data analysis, or research assistance, we've got you covered.
                </p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right">
            {/* Right Column: Abstract SVG geometric illustration */}
            <div className="relative flex justify-center">
              <div className="bg-slate-900/60 border border-slate-800/80 p-6 sm:p-8 rounded-2xl w-full max-w-md relative overflow-hidden shadow-2xl backdrop-blur-sm group">
                <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full filter blur-2xl group-hover:bg-amber-500/10 transition-colors duration-500"></div>
                
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

                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 bg-slate-950/80 border border-slate-800 p-3.5 sm:p-4 rounded-xl text-center backdrop-blur-sm">
                  <span className="block text-lg sm:text-xl font-extrabold text-amber-500">100% Verified</span>
                  <span className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest font-semibold">Postgraduate Specialist Panel</span>
                </div>
              </div>
            </div>
          </ScrollReveal>

        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="bg-gradient-to-b from-slate-950/60 via-[#0F172A] to-slate-950/60 border-y border-slate-800/40 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-16">
            <span className="text-amber-500 text-xs sm:text-sm font-bold tracking-widest uppercase">Why Us</span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-white">Why Choose Us</h2>
            <div className="h-1 w-20 bg-gradient-to-r from-amber-500 to-amber-600 mx-auto rounded-full"></div>
            <p className="text-slate-400 text-sm sm:text-base">Four unbending pillars that define our service standards.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 stagger-children">
            {features.map((feat, idx) => (
              <TiltCard key={idx} maxTilt={5}>
                <div 
                  className="group relative bg-slate-900/30 border border-slate-800/60 hover:border-amber-500/30 p-6 sm:p-7 rounded-2xl sm:rounded-3xl transition-all duration-500 card-hover overflow-hidden h-full"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl sm:rounded-3xl"></div>
                  <div className="relative bg-gradient-to-br from-amber-500/15 to-amber-600/5 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl w-fit mb-4 sm:mb-5 border border-amber-500/10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                    {feat.icon}
                  </div>
                  <h3 className="relative font-bold text-sm sm:text-lg text-white mb-2 sm:mb-3">{feat.title}</h3>
                  <p className="relative text-xs sm:text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* OUR VALUES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="text-center space-y-2 sm:space-y-3 mb-8 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Our Values</h2>
          <div className="h-1 w-16 bg-gradient-to-r from-amber-500 to-amber-600 mx-auto rounded-full"></div>
          <p className="text-slate-400 text-sm sm:text-base">Principles we live by, from initial brief to final delivery.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 stagger-children">
          {values.map((v, idx) => (
            <TiltCard key={idx} maxTilt={5}>
              <div 
                className="bg-slate-900/50 border border-slate-800/80 p-6 sm:p-8 rounded-2xl space-y-4 hover:border-amber-500/20 transition-all duration-500 group h-full"
              >
                <div className="bg-amber-500/10 p-2.5 rounded-xl w-fit group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                  {v.icon}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">{v.title}</h3>
                <p className="text-sm sm:text-sm text-slate-400 leading-relaxed">{v.desc}</p>
              </div>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* GUARANTEE SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <ScrollReveal direction="scale">
          <div className="bg-gradient-to-r from-amber-500/5 via-amber-500/15 to-amber-500/5 border border-amber-500/30 p-6 sm:p-10 rounded-2xl text-center space-y-4 sm:space-y-5 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-amber-500/10 rounded-full filter blur-[80px] pointer-events-none"></div>
            <div className="relative bg-amber-500 text-[#0F172A] p-2.5 sm:p-3 rounded-full w-fit mx-auto ring-4 ring-amber-500/10 shadow-lg shadow-amber-500/20">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.5]" />
            </div>
            <h3 className="relative text-base sm:text-xl font-bold text-white uppercase tracking-wider">Our Absolute Promise</h3>
            <p className="relative text-sm sm:text-base text-slate-200 max-w-2xl mx-auto leading-relaxed">
              &ldquo;If you are not 100% satisfied with the quality of our work, or if it deviates from your initial guidelines in any way, we will revise it for free. No questions asked. Your academic excellence is our duty.&rdquo;
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* CTA */}
      <section className="py-10 sm:py-14 text-center px-4">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6">
            <h2 className="text-xl sm:text-3xl font-extrabold text-white">Join thousands of students who trust us</h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto">
              Take the pressure off your shoulders. Delegate your technical calculations, blueprints, or literature summaries to expert graduates today.
            </p>
            <div className="pt-2">
              <RippleButton
                onClick={handleRedirect}
                className="bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-extrabold text-sm sm:text-base px-8 py-3.5 sm:px-10 sm:py-4 rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all duration-300 cursor-pointer inline-flex items-center space-x-2 active:scale-[0.98]"
              >
                <span>Place Your Order Now</span>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </RippleButton>
            </div>
          </div>
        </ScrollReveal>
      </section>

    </div>
  );
}
