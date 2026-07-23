import { ArrowRight, BookOpen, Code, Layers, BarChart3, Binary, Presentation, ShieldCheck, Users, ChevronRight, Star, Clock, CheckCircle2, Globe } from 'lucide-react';
import { PageType, Profile } from '../types';
import logoBg from '/No BG Logo.png';

interface HomeProps {
  setCurrentPage: (page: PageType) => void;
  user: Profile | null;
}

export default function Home({ setCurrentPage, user }: HomeProps) {
  const handleNav = (page: PageType) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const services = [
    {
      icon: <BookOpen className="h-6 w-6 text-amber-500" />,
      title: 'Academic Writing',
      desc: 'Flawless research papers, literature reviews, thesis chapters, and critical essays.',
    },
    {
      icon: <Code className="h-6 w-6 text-amber-500" />,
      title: 'Coding Projects',
      desc: 'Clean source code in Python, C++, React, MATLAB, full system setup & bugs fix.',
    },
    {
      icon: <Layers className="h-6 w-6 text-amber-500" />,
      title: 'Engineering Drawings',
      desc: 'Professional CAD models, SolidWorks blueprints, structural analysis, and technical reports.',
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-amber-500" />,
      title: 'Data Analysis',
      desc: 'Robust statistics, SPSS analysis, Excel modeling, predictive math, and data visualizations.',
    },
    {
      icon: <Binary className="h-6 w-6 text-amber-500" />,
      title: 'STEM Problem Sets',
      desc: 'Step-by-step rigorous solving for advanced math, chemistry, physics, and bio assignments.',
    },
    {
      icon: <Presentation className="h-6 w-6 text-amber-500" />,
      title: 'Presentations',
      desc: 'Polished slide decks, academic posters, pitch decks, and high-impact designs.',
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

  return (
    <div className="bg-[#0F172A] font-sans text-slate-100" id="homepage-container">
      
      {/* 2. HERO SECTION */}
      <section className="relative min-h-[60vh] sm:min-h-[70vh] flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1a1f3a] to-[#0F172A] animate-gradient"></div>
        
        {/* Subtle geometric grid background pattern with perspective */}
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none overflow-hidden">
          <svg className="w-[200%] h-[300%] absolute -top-1/2 -left-1/2" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
          </svg>
        </div>
        
        {/* Glowing orbs */}
        <div className="absolute top-20 left-[15%] w-[500px] h-[500px] bg-amber-500/8 rounded-full filter blur-[140px] pointer-events-none animate-pulse-glow"></div>
        <div className="absolute bottom-20 right-[10%] w-[400px] h-[400px] bg-amber-600/6 rounded-full filter blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/4 rounded-full filter blur-[160px] pointer-events-none"></div>

        {/* Logo watermark */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: `url(${logoBg})`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: '45%',
            filter: 'brightness(2) blur(1px)',
          }}
        />
 
        <div className="relative max-w-5xl mx-auto text-center space-y-6 sm:space-y-10 z-10">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2.5 glass rounded-full px-4 py-2 sm:px-5 sm:py-2.5 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-amber-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Global Private Academic Solutions</span>
          </div>
 
          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            Your Deadline is{' '}
            <span className="relative inline-block">
              <span className="text-shimmer">Safe With Us</span>
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-amber-500/40" viewBox="0 0 200 12" preserveAspectRatio="none">
                <path d="M0,8 Q50,0 100,8 T200,8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </span>
          </h1>
 
          {/* Subtitle */}
          <p className="text-sm sm:text-lg md:text-xl text-slate-300/90 max-w-3xl mx-auto leading-relaxed font-light px-2 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            Expert help with research papers, coding projects, engineering drawings, and more &mdash; delivered fast, securely, and with total confidentiality.
          </p>
 
          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-5 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            {['100% Confidential', 'Plagiarism Free', '24/7 Support'].map((badge) => (
              <div key={badge} className="flex items-center space-x-1.5 text-[10px] sm:text-xs text-slate-400">
                <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-500" />
                <span>{badge}</span>
              </div>
            ))}
          </div>
 
          {/* CTA Buttons */}
          <div className="flex flex-row justify-center items-center gap-3 sm:gap-5 pt-2 sm:pt-6 max-w-xs sm:max-w-none mx-auto px-2 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <button
              onClick={() => handleNav(user?.role === 'admin' ? 'admin' : user?.role === 'expert' ? 'expert' : 'order')}
              className="glow-btn relative flex-1 sm:flex-initial bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-bold text-xs sm:text-base px-4 py-3 sm:px-10 sm:py-4 rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 active:scale-95 transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>{user?.role === 'admin' ? 'Admin Panel' : user?.role === 'expert' ? 'Expert Workspace' : 'Place Order Now'}</span>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              onClick={() => handleNav('services')}
              className="flex-1 sm:flex-initial border border-slate-600/50 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs sm:text-base px-4 py-3 sm:px-10 sm:py-4 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer backdrop-blur-sm"
            >
              <span>Explore Services</span>
            </button>
          </div>
        </div>
      </section>
 
      {/* 3. SERVICES SNAPSHOT */}
      <section className="py-16 sm:py-20 md:py-28 max-w-7xl xl:max-w-[90%] 2xl:max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-16">
          <span className="text-amber-500 text-[10px] sm:text-xs font-bold tracking-widest uppercase">Our Expertise</span>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-white">
            What We Can Help You With
          </h2>
          <div className="h-1 w-20 bg-gradient-to-r from-amber-500 to-amber-600 mx-auto rounded-full"></div>
          <p className="text-slate-400 max-w-xl mx-auto text-xs sm:text-sm md:text-base">
            Professional assistance from verified graduate experts across engineering, science, literature, and mathematics.
          </p>
        </div>
 
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 stagger-children">
          {services.map((item, idx) => (
            <div 
              key={idx}
              className="group relative bg-slate-900/40 border border-slate-800/60 hover:border-amber-500/40 p-4 sm:p-8 rounded-2xl sm:rounded-3xl transition-all duration-500 flex flex-col justify-between card-hover cursor-pointer overflow-hidden"
              onClick={() => handleNav('services')}
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl sm:rounded-3xl"></div>
              
              <div className="relative space-y-3 sm:space-y-5">
                <div className="bg-gradient-to-br from-amber-500/15 to-amber-600/5 p-2 sm:p-3.5 rounded-xl sm:rounded-2xl w-fit group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 border border-amber-500/10">
                  <div className="h-5 w-5 sm:h-6 sm:w-6 [&_svg]:h-full [&_svg]:w-full flex items-center justify-center">
                    {item.icon}
                  </div>
                </div>
                <h3 className="text-sm sm:text-lg font-bold text-white group-hover:text-amber-400 transition-colors duration-300 line-clamp-1 sm:line-clamp-none">
                  {item.title}
                </h3>
                <p className="text-[11px] sm:text-sm text-slate-400 leading-relaxed line-clamp-3 sm:line-clamp-none">
                  {item.desc}
                </p>
              </div>
              <div className="relative pt-3 sm:pt-6 mt-3 sm:mt-4 border-t border-slate-800/60 flex items-center text-[9px] sm:text-xs font-semibold text-amber-500 group-hover:text-amber-400 overflow-hidden">
                <span className="truncate">Learn More About pricing & deliveries</span>
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-0.5 sm:ml-1 transform group-hover:translate-x-1.5 transition-transform duration-300 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </section>
 
      {/* 5. HOW IT WORKS */}
      <section className="bg-gradient-to-b from-slate-950/60 via-[#0F172A] to-slate-950/60 border-y border-slate-800/40 py-16 sm:py-20 md:py-28">
        <div className="max-w-7xl xl:max-w-[90%] 2xl:max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-16">
            <span className="text-amber-500 text-[10px] sm:text-xs font-bold tracking-widest uppercase">Simple Process</span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-white">How It Works</h2>
            <div className="h-1 w-20 bg-gradient-to-r from-amber-500 to-amber-600 mx-auto rounded-full"></div>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto">Get your academic challenges solved in three simple steps.</p>
          </div>
 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10 relative stagger-children">
            {steps.map((step, idx) => (
              <div key={idx} className="relative group">
                {/* Connection line on desktop */}
                {idx < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-5 lg:-right-6 transform -translate-y-1/2 z-10">
                    <div className="flex items-center">
                      <div className="w-8 lg:w-12 h-[2px] bg-gradient-to-r from-amber-500/60 to-amber-500/20"></div>
                      <div className="w-2 h-2 rounded-full bg-amber-500/60 -ml-1"></div>
                    </div>
                  </div>
                )}
                
                <div className="relative bg-slate-900/30 border border-slate-800/60 group-hover:border-amber-500/30 p-6 sm:p-8 rounded-2xl sm:rounded-3xl text-center space-y-4 sm:space-y-5 transition-all duration-500 card-hover h-full">
                  {/* Step number background */}
                  <span className="absolute top-3 right-4 sm:top-4 sm:right-6 text-5xl sm:text-7xl font-black text-slate-800/40 select-none font-mono group-hover:text-amber-500/10 transition-colors duration-500">
                    {step.num}
                  </span>
                  
                  <div className="relative bg-gradient-to-br from-amber-500 to-amber-600 text-[#0F172A] p-2.5 sm:p-3 rounded-xl sm:rounded-2xl inline-flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-shadow duration-500">
                    {step.icon}
                  </div>
                  <h3 className="relative text-base sm:text-xl font-bold text-white">{step.title}</h3>
                  <p className="relative text-xs sm:text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
 
      {/* 6. SOCIAL PROOF & TRUST SIGNALS */}
      <section className="py-16 sm:py-20 md:py-28 max-w-7xl xl:max-w-[90%] 2xl:max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-16">
          <span className="text-amber-500 text-[10px] sm:text-xs font-bold tracking-widest uppercase">Social Proof</span>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-white">
            Trusted by Students Worldwide
          </h2>
          <div className="h-1 w-20 bg-gradient-to-r from-amber-500 to-amber-600 mx-auto rounded-full"></div>
          <p className="text-slate-400 max-w-xl mx-auto text-xs sm:text-sm md:text-base">
            Join thousands of students who have achieved academic excellence with our expert support.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16 stagger-children">
          {[
            { value: '2,500+', label: 'Projects Completed', icon: <CheckCircle2 className="h-5 w-5 text-amber-500" /> },
            { value: '98%', label: 'On-time Delivery', icon: <Clock className="h-5 w-5 text-amber-500" /> },
            { value: '4.9/5', label: 'Average Rating', icon: <Star className="h-5 w-5 text-amber-500" /> },
            { value: '50+', label: 'Countries Served', icon: <Globe className="h-5 w-5 text-amber-500" /> },
          ].map((stat, idx) => (
            <div key={idx} className="relative bg-slate-900/40 border border-slate-800/60 group-hover:border-amber-500/20 p-5 sm:p-7 rounded-2xl sm:rounded-3xl text-center space-y-3 card-hover overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex justify-center">{stat.icon}</div>
              <span className="relative block text-2xl sm:text-4xl font-black text-white tracking-tight">{stat.value}</span>
              <span className="relative block text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider font-semibold">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 stagger-children">
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
            <div key={idx} className="relative bg-slate-900/30 border border-slate-800/60 p-6 sm:p-8 rounded-2xl sm:rounded-3xl space-y-5 hover:border-amber-500/20 transition-all duration-500 card-hover overflow-hidden">
              {/* Quote mark */}
              <div className="absolute top-4 right-5 text-6xl text-amber-500/10 font-serif leading-none select-none">&ldquo;</div>
              
              <div className="relative flex items-center space-x-0.5">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-amber-500 fill-amber-500" />
                ))}
              </div>
              <p className="relative text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="relative pt-4 border-t border-slate-800/60">
                <span className="block text-xs sm:text-sm font-bold text-white">{testimonial.name}</span>
                <span className="block text-[10px] sm:text-xs text-slate-500 mt-0.5">{testimonial.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. FINAL CTA BANNER */}
      <section className="relative overflow-hidden border-t border-slate-800/40 py-16 sm:py-24 px-4">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1a1f3a]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/8 rounded-full filter blur-[120px] pointer-events-none"></div>
        
        <div className="relative max-w-4xl mx-auto space-y-6 sm:space-y-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white md:text-5xl tracking-tight">
            Ready to get started?
          </h2>
          <p className="text-xs sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Place your order in 2 minutes. Receive expert assistance before your critical assignment deadline.
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleNav(user?.role === 'admin' ? 'admin' : user?.role === 'expert' ? 'expert' : 'order')}
              className="glow-btn relative bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-extrabold text-xs sm:text-base px-8 py-4 sm:px-10 sm:py-5 rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 active:scale-95 transition-all duration-300 inline-flex items-center space-x-2 cursor-pointer"
            >
              <span>{user?.role === 'admin' ? 'Go to Admin Panel' : user?.role === 'expert' ? 'Go to Expert Workspace' : 'Get Started Now'}</span>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </section>
 
    </div>
  );
}
