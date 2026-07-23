import { BookOpen, Code, Layers, BarChart3, Binary, Presentation, Clock, DollarSign, ArrowRight, HelpCircle, FileText, Sparkles } from 'lucide-react';
import { PageType } from '../types';

interface ServicesProps {
  setCurrentPage: (page: PageType) => void;
  setSelectedServiceType?: (service: string) => void;
}

export default function Services({ setCurrentPage, setSelectedServiceType }: ServicesProps) {
  const categories = [
    {
      id: 'writing',
      icon: <BookOpen className="h-8 w-8 text-amber-500" />,
      name: 'Academic Writing',
      bullets: [
        'Research papers & Literature reviews',
        'Critical essays & Argumentative papers',
        'Master / PhD Thesis chapters',
        'Case studies & Business briefs'
      ],
      turnaround: '48hr delivery',
      price: 'From $20',
      serviceTypeSelect: 'Academic Writing'
    },
    {
      id: 'coding',
      icon: <Code className="h-8 w-8 text-amber-500" />,
      name: 'Coding Projects',
      bullets: [
        'Python, Java, C++, and MATLAB source',
        'Web development (React, Node, HTML)',
        'Database architecture (SQL, NoSQL)',
        'Algorithm design & code debugging'
      ],
      turnaround: '48hr delivery',
      price: 'From $30',
      serviceTypeSelect: 'Coding Project'
    },
    {
      id: 'engineering',
      icon: <Layers className="h-8 w-8 text-amber-500" />,
      name: 'Engineering Drawings',
      bullets: [
        'SolidWorks 3D models & CAD rendering',
        'AutoCAD blueprints & assembly files',
        'Finite Element Analysis (FEA) reports',
        'Technical engineering documentation'
      ],
      turnaround: '72hr delivery',
      price: 'From $25',
      serviceTypeSelect: 'Engineering Drawing'
    },
    {
      id: 'data',
      icon: <BarChart3 className="h-8 w-8 text-amber-500" />,
      name: 'Data Analysis',
      bullets: [
        'Excel macros & complex financial models',
        'SPSS, R, & Python statistical testing',
        'Data cleaning & predictive modeling',
        'Rich charts & interactive dashboards'
      ],
      turnaround: '48hr delivery',
      price: 'From $25',
      serviceTypeSelect: 'Data Analysis'
    },
    {
      id: 'stem',
      icon: <Binary className="h-8 w-8 text-amber-500" />,
      name: 'STEM Problem Sets',
      bullets: [
        'Advanced Calculus & Algebra solving',
        'Physics simulations & proof guides',
        'Organic chemistry synthesis solutions',
        'Genetics & cellular biology reports'
      ],
      turnaround: '24hr delivery',
      price: 'From $15',
      serviceTypeSelect: 'STEM'
    },
    {
      id: 'presentations',
      icon: <Presentation className="h-8 w-8 text-amber-500" />,
      name: 'Presentations',
      bullets: [
        'PowerPoint & Google Slides design',
        'Commercial Pitch decks & visual layouts',
        'Academic research poster sheets',
        'Custom diagrams & slide formatting'
      ],
      turnaround: '48hr delivery',
      price: 'From $20',
      serviceTypeSelect: 'Presentation'
    },
    {
      id: 'simple-assignment',
      icon: <FileText className="h-8 w-8 text-amber-500" />,
      name: 'Simple Assignment',
      bullets: [
        'Quick worksheet solutions',
        'Brief study guide summaries',
        'Single questions & fast review',
        'Concise definitions & short answers'
      ],
      turnaround: '12hr express',
      price: 'From $5',
      serviceTypeSelect: 'Simple Assignment'
    },
    {
      id: '2d-drafting',
      icon: <Sparkles className="h-8 w-8 text-amber-500" />,
      name: '2D Drafting',
      bullets: [
        'Multiview projection outlines',
        'Isometric & pictorial drawing layouts',
        'Custom border & titleblock setups',
        'Precision CAD drawing files & PDF'
      ],
      turnaround: '24hr delivery',
      price: 'From $2',
      serviceTypeSelect: '2D Drafting (Multiview and Pictorial Drawing including TitleBlock)'
    },
  ];

  const handleOrderRedirect = (serviceType: string) => {
    if (setSelectedServiceType) {
      setSelectedServiceType(serviceType);
    }
    setCurrentPage('order');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRedirect = (page: PageType) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-[#0F172A] font-sans text-slate-100" id="services-page-container">
      
      {/* 1. PAGE HEADER */}
      <header className="relative overflow-hidden bg-gradient-to-b from-[#0F172A] via-[#1a1f3a] to-[#0F172A] py-8 sm:py-12 md:py-16 px-4 text-center border-b border-slate-800/40">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:20px_20px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-amber-500/6 rounded-full filter blur-[120px] pointer-events-none"></div>
        <div className="relative max-w-4xl mx-auto space-y-4 sm:space-y-5">
          <span className="text-amber-500 text-[10px] sm:text-xs font-bold tracking-widest uppercase">Verified Graduate Quality</span>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-white">Our Services</h1>
          <div className="h-1 w-20 bg-gradient-to-r from-amber-500 to-amber-600 mx-auto rounded-full"></div>
          <p className="text-xs sm:text-lg text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            Expert academic and technical support across every academic discipline. Fully customized solutions built to meet your specific university criteria.
          </p>
        </div>
      </header>
 
      {/* 2. SERVICES GRID */}
      <main className="max-w-7xl xl:max-w-[90%] 2xl:max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8 stagger-children">
          {categories.map((cat) => (
            <div 
              key={cat.id}
              className="group relative bg-slate-900/30 border border-slate-800/60 hover:border-amber-500/30 p-4 sm:p-8 rounded-2xl sm:rounded-3xl flex flex-col justify-between transition-all duration-500 card-hover overflow-hidden"
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl sm:rounded-3xl"></div>
              
              <div className="relative space-y-4 sm:space-y-6">
                
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="bg-gradient-to-br from-amber-500/15 to-amber-600/5 p-2 sm:p-3.5 rounded-xl sm:rounded-2xl w-fit group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 border border-amber-500/10">
                    <div className="h-5 w-5 sm:h-8 sm:w-8 [&_svg]:h-full [&_svg]:w-full flex items-center justify-center">
                      {cat.icon}
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end text-left sm:text-right">
                    <span className="flex items-center space-x-1 bg-slate-800/80 border border-slate-700/60 text-slate-300 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[8px] sm:text-[11px] font-semibold uppercase tracking-wider w-fit backdrop-blur-sm">
                      <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-500 shrink-0" />
                      <span>{cat.turnaround}</span>
                    </span>
                  </div>
                </div>
 
                <div className="space-y-1.5 sm:space-y-2.5">
                  <h3 className="text-sm sm:text-xl font-bold text-white group-hover:text-amber-400 transition-colors duration-300 line-clamp-1 sm:line-clamp-none">
                    {cat.name}
                  </h3>
                  <div className="text-amber-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center">
                    <DollarSign className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                    <span>Starting {cat.price}</span>
                  </div>
                </div>
 
                {/* Bullets */}
                <ul className="space-y-2 sm:space-y-3 pt-3 border-t border-slate-800/60">
                  {cat.bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start text-[11px] sm:text-sm text-slate-300">
                      <span className="text-amber-500 mr-2 font-bold select-none shrink-0">•</span>
                      <span className="line-clamp-2 sm:line-clamp-none">{bullet}</span>
                    </li>
                  ))}
                </ul>
 
              </div>
 
              {/* Order Button */}
              <div className="relative pt-5 sm:pt-8">
                <button
                   onClick={() => handleOrderRedirect(cat.serviceTypeSelect)}
                   className="w-full bg-slate-800/80 hover:bg-amber-500 text-slate-100 hover:text-[#0F172A] font-bold py-2.5 sm:py-3.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl transition-all duration-300 flex items-center justify-center space-x-2 border border-slate-700/40 hover:border-amber-500 shadow-lg shadow-transparent hover:shadow-amber-500/10 cursor-pointer text-[10px] sm:text-sm truncate"
                >
                  <span className="truncate">Order {cat.name}</span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                </button>
              </div>
 
            </div>
          ))}
        </div>
      </main>
 
      {/* 3. BOTTOM CTA */}
      <section className="bg-gradient-to-b from-slate-950/60 via-[#0F172A] to-slate-950/60 border-t border-slate-800/40 py-12 sm:py-18 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-5 sm:space-y-7">
          <div className="inline-flex items-center space-x-2 glass rounded-full px-4 py-2 sm:px-5 sm:py-2.5 text-[10px] sm:text-xs font-semibold text-slate-300">
            <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
            <span>Need a complex combination of multiple disciplines?</span>
          </div>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white">Not sure what you need?</h2>
          <p className="text-xs sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Contact our dedicated support specialists. We are online 24/7 and will guide you to set up the correct project requirements.
          </p>
          <div className="flex flex-row justify-center items-center gap-3 sm:gap-5 pt-2 sm:pt-4 max-w-md mx-auto sm:max-w-none px-2">
            <button
              onClick={() => handleRedirect('contact')}
              className="glow-btn relative flex-1 sm:w-auto bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-bold px-4 py-3 sm:px-8 sm:py-4 rounded-xl transition-all duration-300 text-xs sm:text-sm cursor-pointer shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40"
            >
              Contact Us
            </button>
            <button
              onClick={() => handleRedirect('pricing')}
              className="flex-1 sm:w-auto border border-slate-600/50 hover:bg-white/5 bg-white/[0.02] text-white font-semibold px-4 py-3 sm:px-8 sm:py-4 rounded-xl transition-all duration-300 text-xs sm:text-sm cursor-pointer backdrop-blur-sm"
            >
              Get Free Quote
            </button>
          </div>
        </div>
      </section>
 
    </div>
  );
}
