import { ArrowRight, BookOpen, Code, Layers, BarChart3, Binary, Presentation, ShieldCheck, Clock, Users, Globe, ChevronRight } from 'lucide-react';
import { PageType, Profile } from '../types';

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

  const testimonials = [
    {
      quote: "The MATLAB simulation and CAD blueprints they built for my mechanical arm project were absolutely spotless. Highly professional work and saved me weeks.",
      name: "Jean-Pierre Laurent",
      country: "France",
      subject: "BSc Mechanical Engineering"
    },
    {
      quote: "My literature review draft came back 3 days early with rigorous citations and academic sources. Incredible attention to APA formatting guidelines.",
      name: "Sophia Martinez",
      country: "United States",
      subject: "MSc Environmental Science"
    },
    {
      quote: "An absolute lifesaver. The React client-server app built for my final project was fully commented, clean, and accompanied by a detailed PDF installation guide.",
      name: "Ahmed Al-Mansoor",
      country: "Saudi Arabia",
      subject: "BSc Computer Science"
    }
  ];

  return (
    <div className="bg-[#0F172A] font-sans text-slate-100 overflow-hidden" id="homepage-container">
      
      {/* 2. HERO SECTION */}
      <section className="relative min-h-[75vh] sm:min-h-[85vh] flex items-center justify-center bg-gradient-to-b from-[#0F172A] to-[#1E293B] px-4 sm:px-6 lg:px-8 py-10 sm:py-20">
        
        {/* Subtle geometric grid background pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        {/* Abstract glowing accents */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full filter blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full filter blur-[100px] pointer-events-none"></div>
 
        <div className="relative max-w-5xl mx-auto text-center space-y-4 sm:space-y-8">
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] sm:text-xs font-semibold px-3 py-1.5 sm:px-4 sm:py-2 rounded-full uppercase tracking-wider">
            <span>🛡️ Global Private Academic Solutions</span>
          </div>
 
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight">
            Your Deadline is <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Safe With Us</span>
          </h1>
 
          <p className="text-xs sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-light px-2">
            Expert help with research papers, coding projects, engineering drawings, and more &mdash; delivered fast, securely, and with total confidentiality.
          </p>
 
          <div className="flex flex-row justify-center items-center gap-2 sm:gap-4 pt-2 sm:pt-4 max-w-xs sm:max-w-none mx-auto px-2">
            <button
              onClick={() => handleNav(user?.role === 'admin' ? 'admin' : user?.role === 'expert' ? 'expert' : 'order')}
              className="flex-1 sm:flex-initial bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-bold text-[11px] sm:text-base px-3 py-2.5 sm:px-8 sm:py-4 rounded-xl shadow-lg hover:shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center space-x-1 sm:space-x-2 cursor-pointer truncate"
            >
              <span>{user?.role === 'admin' ? 'Go to Admin Panel' : user?.role === 'expert' ? 'Go to Expert Workspace' : 'Place Order'}</span>
              <ArrowRight className="h-3.5 w-3.5 sm:h-5 sm:w-5 flex-shrink-0" />
            </button>
            <button
              onClick={() => handleNav('services')}
              className="flex-1 sm:flex-initial border border-slate-700 bg-slate-900/40 hover:bg-slate-800 text-white font-semibold text-[11px] sm:text-base px-3 py-2.5 sm:px-8 sm:py-4 rounded-xl transition-all flex items-center justify-center space-x-1 sm:space-x-2 cursor-pointer truncate"
            >
              <span>See Services</span>
            </button>
          </div>
        </div>
      </section>
 
      {/* 3. TRUST BAR */}
      <section className="bg-white text-[#0F172A] py-6 sm:py-10 shadow-md">
        <div className="max-w-7xl xl:max-w-[90%] 2xl:max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
            
            <div className="space-y-0.5 sm:space-y-1">
              <p className="text-2xl sm:text-4xl font-extrabold text-[#0F172A]">
                500<span className="text-amber-500">+</span>
              </p>
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Projects Delivered</p>
            </div>
 
            <div className="space-y-0.5 sm:space-y-1 pt-4 md:pt-0">
              <p className="text-2xl sm:text-4xl font-extrabold text-[#0F172A]">
                48<span className="text-amber-500">hr</span>
              </p>
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Delivery</p>
            </div>
 
            <div className="space-y-0.5 sm:space-y-1 pt-4 md:pt-0">
              <p className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#0F172A] to-slate-800">
                100<span className="text-amber-500">%</span>
              </p>
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Confidential</p>
            </div>
 
            <div className="space-y-0.5 sm:space-y-1 pt-4 md:pt-0">
              <p className="text-2xl sm:text-4xl font-extrabold text-[#0F172A]">
                10<span className="text-amber-500">+</span>
              </p>
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Subjects Covered</p>
            </div>
 
          </div>
        </div>
      </section>
 
      {/* 4. SERVICES SNAPSHOT */}
      <section className="py-10 sm:py-16 md:py-20 max-w-7xl xl:max-w-[90%] 2xl:max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 sm:space-y-3 mb-8 sm:mb-14">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">
            What We Can Help You With
          </h2>
          <div className="h-1 w-16 sm:w-20 bg-amber-500 mx-auto rounded"></div>
          <p className="text-slate-400 max-w-xl mx-auto text-xs sm:text-sm md:text-base">
            Professional assistance from verified graduate experts across engineering, science, literature, and mathematics.
          </p>
        </div>
 
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {services.map((item, idx) => (
            <div 
              key={idx}
              className="bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 p-3.5 sm:p-8 rounded-xl sm:rounded-2xl hover:bg-slate-900 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
              onClick={() => handleNav('services')}
            >
              <div className="space-y-2.5 sm:space-y-4">
                <div className="bg-amber-500/10 p-1.5 sm:p-3 rounded-lg sm:rounded-xl w-fit group-hover:scale-110 transition-transform duration-300">
                  <div className="h-5 w-5 sm:h-6 sm:w-6 [&_svg]:h-full [&_svg]:w-full flex items-center justify-center">
                    {item.icon}
                  </div>
                </div>
                <h3 className="text-sm sm:text-lg font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1 sm:line-clamp-none">
                  {item.title}
                </h3>
                <p className="text-[11px] sm:text-sm text-slate-400 leading-relaxed line-clamp-3 sm:line-clamp-none">
                  {item.desc}
                </p>
              </div>
              <div className="pt-2.5 sm:pt-6 mt-3 sm:mt-4 border-t border-slate-800 flex items-center text-[9px] sm:text-xs font-semibold text-amber-500 group-hover:text-amber-400 overflow-hidden">
                <span className="truncate">Learn More About pricing & deliveries</span>
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-0.5 sm:ml-1 transform group-hover:translate-x-1 transition-transform shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </section>
 
      {/* 5. HOW IT WORKS */}
      <section className="bg-slate-950/40 border-y border-slate-900 py-10 sm:py-16 md:py-20">
        <div className="max-w-7xl xl:max-w-[90%] 2xl:max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 sm:space-y-3 mb-8 sm:mb-14">
            <h2 className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">How It Works</h2>
            <div className="h-1 w-16 sm:w-20 bg-amber-500 mx-auto rounded"></div>
            <p className="text-slate-400 text-xs sm:text-sm max-w-sm mx-auto">Get your academic challenges solved in three simple steps.</p>
          </div>
 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-10 relative">
            {steps.map((step, idx) => (
              <div key={idx} className="relative bg-slate-900/40 border border-slate-800/80 p-5 sm:p-8 rounded-2xl text-center space-y-3 sm:space-y-4">
                {/* Connection line on desktop */}
                {idx < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-10 text-amber-500/25">
                    <ArrowRight className="h-8 w-8" />
                  </div>
                )}
                
                <div className="bg-amber-500 text-[#0F172A] p-2 sm:p-2.5 rounded-xl inline-flex items-center justify-center font-bold text-base sm:text-lg mb-1">
                  {step.icon}
                </div>
                <span className="absolute top-2.5 right-4 sm:top-4 sm:right-6 text-2xl sm:text-4xl font-extrabold text-slate-800 select-none font-mono">
                  {step.num}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white">{step.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
 
      {/* 6. TESTIMONIALS */}
      <section className="py-10 sm:py-16 md:py-20 max-w-7xl xl:max-w-[90%] 2xl:max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 sm:space-y-3 mb-8 sm:mb-14">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">
            Trusted by Students Worldwide
          </h2>
          <div className="h-1 w-16 sm:w-20 bg-amber-500 mx-auto rounded"></div>
          <p className="text-slate-400 max-w-xl mx-auto text-xs sm:text-sm">
            Client confidentiality prevents using full university identities. Reviews are authenticated internally.
          </p>
        </div>
 
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
          {testimonials.map((t, idx) => (
            <div key={idx} className="bg-slate-900/50 border border-slate-800/80 p-5 sm:p-8 rounded-2xl flex flex-col justify-between relative">
              <span className="absolute top-2 right-4 sm:top-4 sm:right-6 text-5xl sm:text-7xl font-serif text-slate-800 select-none pointer-events-none">
                &ldquo;
              </span>
              <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed relative z-10 mb-4 sm:mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="border-t border-slate-800/80 pt-3 sm:pt-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-white">{t.name}</h4>
                  <p className="text-[10px] sm:text-[11px] text-amber-500 uppercase tracking-wider font-semibold">{t.subject}</p>
                </div>
                <div className="flex items-center space-x-1 bg-slate-800 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-[10px] sm:text-[11px] text-slate-400">
                  <Globe className="h-3 w-3" />
                  <span>{t.country}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
 
      {/* 7. FINAL CTA BANNER */}
      <section className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] border-t border-slate-800 text-center py-10 sm:py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white md:text-4xl">
            Ready to get started?
          </h2>
          <p className="text-xs sm:text-base text-slate-300 max-w-xl mx-auto">
            Place your order in 2 minutes. Receive expert assistance before your critical assignment deadline.
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleNav(user?.role === 'admin' ? 'admin' : user?.role === 'expert' ? 'expert' : 'order')}
              className="bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-extrabold text-xs sm:text-base px-5 py-3 sm:px-8 sm:py-4 rounded-xl shadow-lg hover:shadow-amber-500/20 active:scale-95 transition-all inline-flex items-center space-x-1 sm:space-x-2 cursor-pointer"
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
