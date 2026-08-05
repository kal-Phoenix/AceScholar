import { useState, useEffect, useRef } from 'react';
import { ArrowRight, BookOpen, Code, Layers, BarChart3, Binary, Presentation, ShieldCheck, Users, ChevronRight, Star, Clock, CheckCircle2, Globe, Sparkles, MousePointer2 } from 'lucide-react';
import { PageType, Profile } from '../types';
import {
  STAT_PROJECTS_COMPLETED, STAT_ON_TIME_DELIVERY, STAT_AVERAGE_RATING, STAT_COUNTRIES_SERVED,
} from '../lib/constants';
import logoBg from '/No BG Logo.png';
import ScrollReveal from './ScrollReveal';
import RippleButton from './RippleButton';
import TiltCard from './TiltCard';

interface HomeProps {
  setCurrentPage: (page: PageType) => void;
  setSelectedServiceType?: (service: string) => void;
  user: Profile | null;
}

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 1500;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function Home({ setCurrentPage, setSelectedServiceType, user }: HomeProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Parallax scroll handler
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNav = (page: PageType) => {
    setCurrentPage(page);
  };

  const services = [
    {
      icon: <BookOpen className="h-6 w-6 text-amber-500" />,
      title: 'Academic Writing',
      desc: 'Flawless research papers, literature reviews, thesis chapters, and critical essays.',
      serviceType: 'Academic Writing',
    },
    {
      icon: <Code className="h-6 w-6 text-amber-500" />,
      title: 'Coding Projects',
      desc: 'Clean source code in Python, C++, React, MATLAB, full system setup & bugs fix.',
      serviceType: 'Coding Project',
    },
    {
      icon: <Layers className="h-6 w-6 text-amber-500" />,
      title: 'Engineering Drawings',
      desc: 'Professional CAD models, SolidWorks blueprints, structural analysis, and technical reports.',
      serviceType: 'Engineering Drawing',
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-amber-500" />,
      title: 'Data Analysis',
      desc: 'Robust statistics, SPSS analysis, Excel modeling, predictive math, and data visualizations.',
      serviceType: 'Data Analysis',
    },
    {
      icon: <Binary className="h-6 w-6 text-amber-500" />,
      title: 'STEM Problem Sets',
      desc: 'Step-by-step rigorous solving for advanced math, chemistry, physics, and bio assignments.',
      serviceType: 'STEM Problem Set',
    },
    {
      icon: <Presentation className="h-6 w-6 text-amber-500" />,
      title: 'Presentations',
      desc: 'Polished slide decks, academic posters, pitch decks, and high-impact designs.',
      serviceType: 'Presentations',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Submit Your Order',
      desc: 'Fill out our secure, 2-minute order form detailing your instructions, references, and deadline.',
      icon: <Layers className="h-5 w-5 text-[#0F172A]" />
    },
    {
      num: '02',
      title: 'We Assign an Expert',
      desc: 'We match your project with a high-caliber graduate specialist holding matching academic credentials.',
      icon: <Users className="h-5 w-5 text-[#0F172A]" />
    },
    {
      num: '03',
      title: 'You Receive Your Work',
      desc: 'Review and download completed work ahead of your deadline. Free revisions are always available.',
      icon: <ShieldCheck className="h-5 w-5 text-[#0F172A]" />
    },
  ];

  const parallaxOffset = scrollY * 0.3;

  return (
    <div className="bg-[#0F172A] font-sans text-slate-100" id="homepage-container">
      
      {/* HERO SECTION */}
      <section ref={heroRef} className="relative min-h-[50vh] sm:min-h-[60vh] flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1a1f3a] to-[#0F172A] animate-gradient"></div>
        
        {/* Morphing blob decorations */}
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-amber-500/10 rounded-full filter blur-[80px] animate-morph pointer-events-none" style={{ animationDelay: '0s' }}></div>
        <div className="absolute bottom-[10%] right-[5%] w-80 h-80 bg-amber-600/8 rounded-full filter blur-[100px] animate-morph pointer-events-none" style={{ animationDelay: '3s' }}></div>

        {/* Parallax grid background */}
        <div 
          className="absolute inset-0 opacity-[0.06] pointer-events-none overflow-hidden"
          style={{ transform: `translateY(${parallaxOffset * 0.5}px)` }}
        >
          <svg className="w-[200%] h-[300%] absolute -top-1/2 -left-1/2" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
          </svg>
        </div>
        
        {/* Glowing orbs with parallax */}
        <div 
          className="absolute top-20 left-[15%] w-[500px] h-[500px] bg-amber-500/8 rounded-full filter blur-[140px] pointer-events-none animate-ambient"
          style={{ transform: `translateY(${parallaxOffset * 0.8}px)` }}
        ></div>
        <div 
          className="absolute bottom-20 right-[10%] w-[400px] h-[400px] bg-amber-600/6 rounded-full filter blur-[120px] pointer-events-none animate-ambient"
          style={{ transform: `translateY(${-parallaxOffset * 0.6}px)`, animationDelay: '2s' }}
        ></div>
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/4 rounded-full filter blur-[160px] pointer-events-none animate-ambient"
          style={{ transform: `translate(-50%, calc(-50% + ${parallaxOffset * 0.4}px))`, animationDelay: '1s' }}
        ></div>

        {/* Rotating orbit ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none opacity-[0.04]">
          <div className="absolute inset-0 border border-amber-500/30 rounded-full animate-rotate-slow"></div>
          <div className="absolute inset-8 border border-amber-500/20 rounded-full animate-rotate-slow" style={{ animationDirection: 'reverse', animationDuration: '25s' }}></div>
          <div className="absolute inset-16 border border-amber-500/10 rounded-full animate-rotate-slow" style={{ animationDuration: '35s' }}></div>
        </div>

        {/* Logo watermark */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: `url(${logoBg})`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: '45%',
            filter: 'brightness(2) blur(1px)',
            transform: `translateY(${parallaxOffset * 0.2}px)`,
          }}
        />

        <div className={`relative max-w-5xl mx-auto text-center space-y-6 sm:space-y-8 z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          
          {/* Badge */}
          <div className="inline-flex items-center space-x-2.5 glass rounded-full px-4 py-2 sm:px-5 sm:py-2.5" style={{ animationDelay: '100ms' }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-amber-400 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Fast & Confidential Academic Support</span>
          </div>

          {/* Main Heading with letter stagger */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08]" style={{ animationDelay: '200ms' }}>
            {'Your Deadline is'.split(' ').map((word, i) => (
              <span key={i} className="inline-block hero-letter mr-[0.3em]" style={{ animationDelay: `${300 + i * 80}ms` }}>
                {word}
              </span>
            ))}{' '}
            <span className="relative inline-block">
              <span className="text-shimmer">Safe With Us</span>
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-amber-500/40" viewBox="0 0 200 12" preserveAspectRatio="none">
                <path d="M0,8 Q50,0 100,8 T200,8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg md:text-xl text-slate-300/90 max-w-3xl mx-auto leading-relaxed font-light px-2 hero-letter" style={{ animationDelay: '900ms' }}>
            Expert help with research papers, coding projects, engineering drawings, and more &mdash; delivered fast, securely, and with total confidentiality.
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 hero-letter" style={{ animationDelay: '1050ms' }}>
            {['100% Confidential', 'Plagiarism Free', '24/7 Support'].map((badge) => (
              <div key={badge} className="flex items-center space-x-2 text-xs sm:text-sm text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>{badge}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap justify-center items-center gap-2 sm:gap-5 pt-2 sm:pt-4 hero-letter" style={{ animationDelay: '1200ms', display: 'flex' }}>
            <RippleButton
              onClick={() => handleNav(user?.role === 'admin' ? 'admin' : user?.role === 'expert' ? 'expert' : 'order')}
              className="glow-btn relative bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-bold text-[11px] sm:text-base px-2.5 py-2 sm:px-10 sm:py-4 rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 active:scale-95 transition-all duration-300 flex items-center justify-center space-x-1 sm:space-x-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
              <span>{user?.role === 'admin' ? 'Admin' : user?.role === 'expert' ? 'Expert' : 'Place Order Now'}</span>
            </RippleButton>
            <RippleButton
              onClick={() => handleNav('services')}
              className="border border-slate-600/50 bg-white/5 hover:bg-white/10 text-white font-semibold text-[11px] sm:text-base px-2.5 py-2 sm:px-10 sm:py-4 rounded-xl transition-all duration-300 flex items-center justify-center cursor-pointer backdrop-blur-sm hover:border-slate-500 whitespace-nowrap shrink-0"
            >
              <span>Explore Services</span>
            </RippleButton>
          </div>

          {/* Scroll down indicator */}
          <div className="hero-letter pt-4" style={{ animationDelay: '1400ms' }}>
            <div className="animate-scroll-bounce flex flex-col items-center space-y-1 text-slate-500">
              <MousePointer2 className="h-4 w-4 rotate-[-90deg]" />
              <span className="text-[10px] uppercase tracking-widest font-semibold">Scroll to explore</span>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES SNAPSHOT */}
      <section className="py-10 sm:py-14 md:py-20 max-w-7xl xl:max-w-[90%] 2xl:max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-16">
            <span className="text-amber-500 text-xs sm:text-sm font-bold tracking-widest uppercase">Our Expertise</span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-white">
              What We Can Help You With
            </h2>
            <div className="h-1 w-20 bg-gradient-to-r from-amber-500 to-amber-600 mx-auto rounded-full"></div>
            <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
              Professional assistance from verified graduate experts across engineering, science, literature, and mathematics.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 stagger-children">
          {services.map((item, idx) => (
            <ScrollReveal key={idx} delay={idx % 3} direction="up">
                <div 
                  className="group relative bg-slate-900/40 border border-slate-800/60 hover:border-amber-500/30 p-5 sm:p-7 rounded-2xl sm:rounded-3xl transition-all duration-500 flex flex-col justify-between cursor-pointer overflow-hidden spotlight-card h-full"
                  onClick={() => {
                    if (setSelectedServiceType) setSelectedServiceType(item.serviceType);
                    setCurrentPage('order');
                  }}
                >
                  <div className="relative space-y-3 sm:space-y-4">
                    <div className="bg-gradient-to-br from-amber-500/15 to-amber-600/5 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl w-fit group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 border border-amber-500/10">
                      <div className="h-5 w-5 sm:h-6 sm:w-6 [&_svg]:h-full [&_svg]:w-full flex items-center justify-center">
                        {item.icon}
                      </div>
                    </div>
                    <h3 className="text-sm sm:text-lg font-bold text-white group-hover:text-amber-400 transition-colors duration-300 line-clamp-1 sm:line-clamp-none">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed line-clamp-3 sm:line-clamp-none">
                      {item.desc}
                    </p>
                  </div>
                  <div className="relative pt-3 sm:pt-5 mt-3 sm:mt-4 border-t border-slate-800/60 flex items-center text-xs sm:text-sm font-semibold text-amber-500 group-hover:text-amber-400 overflow-hidden">
                    <span className="truncate">Learn More</span>
                    <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1 transform group-hover:translate-x-1.5 transition-transform duration-300 shrink-0" />
                  </div>
                </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-gradient-to-b from-slate-950/60 via-[#0F172A] to-slate-950/60 border-y border-slate-800/40 py-10 sm:py-14 md:py-20 relative overflow-hidden">
        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 w-full h-24 overflow-hidden opacity-[0.03] pointer-events-none">
          <svg viewBox="0 0 1440 320" className="w-[200%] h-full animate-wave">
            <path fill="currentColor" className="text-amber-500" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>

        <div className="max-w-7xl xl:max-w-[90%] 2xl:max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 relative">
          <ScrollReveal>
            <div className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-16">
              <span className="text-amber-500 text-xs sm:text-sm font-bold tracking-widest uppercase">Simple Process</span>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-white">How It Works</h2>
              <div className="h-1 w-20 bg-gradient-to-r from-amber-500 to-amber-600 mx-auto rounded-full"></div>
              <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto">Get your academic challenges solved in three simple steps.</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8 relative">
            {steps.map((step, idx) => (
              <ScrollReveal key={idx} delay={idx} direction="up">
                <div className="relative group">
                  {/* Connection line on desktop */}
                  {idx < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-5 lg:-right-6 transform -translate-y-1/2 z-10">
                      <div className="flex items-center">
                        <div className="w-8 lg:w-12 h-0.5 bg-gradient-to-r from-amber-500/60 to-amber-500/20 rounded-full"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60 -ml-1 animate-pulse-ring"></div>
                      </div>
                    </div>
                  )}
                  
                  <TiltCard className="h-full" maxTilt={4}>
                    <div className="relative bg-slate-900/30 border border-slate-800/60 group-hover:border-amber-500/30 p-6 sm:p-8 rounded-2xl sm:rounded-3xl text-center space-y-4 sm:space-y-5 transition-all duration-500 card-hover h-full spotlight-card" >
                      {/* Step number background */}
                      <span className="absolute top-3 right-4 sm:top-4 sm:right-6 text-5xl sm:text-7xl font-black text-slate-800/40 select-none font-mono group-hover:text-amber-500/10 transition-colors duration-500">
                        {step.num}
                      </span>
                      
                      <div className="relative bg-gradient-to-br from-amber-500 to-amber-600 text-[#0F172A] p-2.5 rounded-xl sm:rounded-2xl inline-flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-shadow duration-500">
                        {step.icon}
                      </div>
                      <h3 className="relative text-base sm:text-xl font-bold text-white">{step.title}</h3>
                      <p className="relative text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                    </div>
                  </TiltCard>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF & TRUST SIGNALS */}
      <section className="py-10 sm:py-14 md:py-20 max-w-7xl xl:max-w-[90%] 2xl:max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-16">
            <span className="text-amber-500 text-xs sm:text-sm font-bold tracking-widest uppercase">Client Reviews</span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-white">
              Trusted by Students Worldwide
            </h2>
            <div className="h-1 w-20 bg-gradient-to-r from-amber-500 to-amber-600 mx-auto rounded-full"></div>
            <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
              Join thousands of students who have achieved academic excellence with our expert support.
            </p>
          </div>
        </ScrollReveal>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {[
            { value: STAT_PROJECTS_COMPLETED, suffix: '+', label: 'Projects Completed', icon: <CheckCircle2 className="h-5 w-5 text-amber-500" /> },
            { value: STAT_ON_TIME_DELIVERY, suffix: '%', label: 'On-time Delivery', icon: <Clock className="h-5 w-5 text-amber-500" /> },
            { value: STAT_AVERAGE_RATING, suffix: '/5', label: 'Average Rating', icon: <Star className="h-5 w-5 text-amber-500" /> },
            { value: STAT_COUNTRIES_SERVED, suffix: '+', label: 'Countries Served', icon: <Globe className="h-5 w-5 text-amber-500" /> },
          ].map((stat, idx) => (
            <ScrollReveal key={idx} delay={idx} direction="scale">
              <div className="group relative bg-slate-900/40 border border-slate-800/60 p-5 sm:p-7 rounded-2xl sm:rounded-3xl text-center space-y-3 card-hover overflow-hidden hover:border-amber-500/20 transition-all duration-500 spotlight-card" >
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex justify-center">{stat.icon}</div>
                <span className="relative block text-2xl sm:text-4xl font-black text-white tracking-tight">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </span>
                <span className="relative block text-xs sm:text-sm text-slate-400 uppercase tracking-wider font-semibold">{stat.label}</span>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {[
            {
              quote: "AceScholar delivered my thesis literature review 12 hours ahead of deadline. The quality was exceptional — my supervisor praised the depth of analysis.",
              name: "Sarah M.",
              role: "PhD Candidate, University of London",
              rating: 5,
            },
            {
              quote: "The coding project was delivered with clean, well-documented Python code and a comprehensive setup guide. Saved me weeks of work.",
              name: "James K.",
              role: "Computer Science, MIT",
              rating: 5,
            },
            {
              quote: "Professional CAD drawings delivered exactly to specification. The attention to geometric tolerances was impressive. Highly recommend.",
              name: "Amina H.",
              role: "Mechanical Engineering, Addis Ababa University",
              rating: 5,
            },
          ].map((testimonial, idx) => (
            <ScrollReveal key={idx} delay={idx} direction="up">
              <TiltCard className="h-full" maxTilt={3}>
                <div className="relative bg-slate-900/30 border border-slate-800/60 p-6 sm:p-8 rounded-2xl sm:rounded-3xl space-y-5 hover:border-amber-500/20 transition-all duration-500 card-hover overflow-hidden spotlight-card h-full" >
                  {/* Quote mark */}
                  <div className="absolute top-4 right-5 text-6xl text-amber-500/10 font-serif leading-none select-none">&ldquo;</div>
                  
                  <div className="relative flex items-center space-x-0.5">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-amber-500 fill-amber-500" />
                    ))}
                  </div>
                  <p className="relative text-sm text-slate-300 leading-relaxed italic">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div className="relative pt-4 border-t border-slate-800/60">
                    <span className="block text-sm font-bold text-white">{testimonial.name}</span>
                    <span className="block text-xs text-slate-400 mt-0.5">{testimonial.role}</span>
                  </div>
                </div>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* FINAL CTA BANNER */}
      <section className="relative overflow-hidden border-t border-slate-800/40 py-10 sm:py-14 px-4">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1a1f3a]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/8 rounded-full filter blur-[120px] pointer-events-none animate-ambient"></div>
        
        <ScrollReveal direction="scale">
          <div className="relative max-w-4xl mx-auto space-y-6 sm:space-y-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white md:text-5xl tracking-tight">
              Ready to get started?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
              Place your order in 2 minutes. Receive expert assistance before your critical assignment deadline.
            </p>
            <div className="pt-2">
              <RippleButton
                onClick={() => handleNav(user?.role === 'admin' ? 'admin' : user?.role === 'expert' ? 'expert' : 'order')}
                className="glow-btn relative bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-extrabold text-sm sm:text-base px-8 py-4 sm:px-10 sm:py-5 rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 active:scale-95 transition-all duration-300 inline-flex items-center space-x-2 cursor-pointer"
              >
                <span>{user?.role === 'admin' ? 'Go to Admin Panel' : user?.role === 'expert' ? 'Go to Expert Workspace' : 'Get Started Now'}</span>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </RippleButton>
            </div>
          </div>
        </ScrollReveal>
      </section>

    </div>
  );
}
