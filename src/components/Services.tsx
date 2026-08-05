import { BookOpen, Code, Layers, BarChart3, Binary, Presentation, Clock, DollarSign, ArrowRight, HelpCircle, FileText, Sparkles } from 'lucide-react';
import { PageType } from '../types';
import ScrollReveal from './ScrollReveal';
import TiltCard from './TiltCard';
import RippleButton from './RippleButton';

interface ServicesProps {
  setCurrentPage: (page: PageType) => void;
  setSelectedServiceType?: (service: string) => void;
}

export default function Services({ setCurrentPage, setSelectedServiceType }: ServicesProps) {
  const categories = [
    {
      id: 'writing',
      icon: <BookOpen className="h-7 w-7 text-amber-500" />,
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
      icon: <Code className="h-7 w-7 text-amber-500" />,
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
      icon: <Layers className="h-7 w-7 text-amber-500" />,
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
      icon: <BarChart3 className="h-7 w-7 text-amber-500" />,
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
      icon: <Binary className="h-7 w-7 text-amber-500" />,
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
      icon: <Presentation className="h-7 w-7 text-amber-500" />,
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
      icon: <FileText className="h-7 w-7 text-amber-500" />,
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
      icon: <Sparkles className="h-7 w-7 text-amber-500" />,
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
  };

  const handleRedirect = (page: PageType) => {
    setCurrentPage(page);
  };

  return (
    <div className="bg-[#0F172A] font-sans text-slate-100" id="services-page-container">
      
      {/* PAGE HEADER */}
      <header className="relative overflow-hidden bg-gradient-to-b from-[#0F172A] via-[#1a1f3a] to-[#0F172A] py-10 sm:py-14 md:py-20 px-4 text-center border-b border-slate-800/40">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:20px_20px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-amber-500/6 rounded-full filter blur-[120px] pointer-events-none animate-ambient"></div>
        <div className="relative max-w-4xl mx-auto space-y-4 sm:space-y-5">
          <ScrollReveal>
            <span className="text-amber-500 text-xs sm:text-sm font-bold tracking-widest uppercase">Verified Graduate Quality</span>
          </ScrollReveal>
          <ScrollReveal delay={1}>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-white">Our Services</h1>
          </ScrollReveal>
          <ScrollReveal delay={2}>
            <div className="h-1 w-20 bg-gradient-to-r from-amber-500 to-amber-600 mx-auto rounded-full"></div>
          </ScrollReveal>
          <ScrollReveal delay={3}>
            <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
              Expert academic and technical support across every academic discipline. Fully customized solutions built to meet your specific university criteria.
            </p>
          </ScrollReveal>
        </div>
      </header>

      {/* SERVICES GRID */}
      <main className="max-w-7xl xl:max-w-[90%] 2xl:max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 stagger-children">
          {categories.map((cat) => (
            <TiltCard key={cat.id} maxTilt={5}>
              <div 
                className="group relative bg-slate-900/30 border border-slate-800/60 hover:border-amber-500/30 p-5 sm:p-7 rounded-2xl sm:rounded-3xl flex flex-col justify-between transition-all duration-500 card-hover overflow-hidden spotlight-card h-full"
              >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl sm:rounded-3xl"></div>
              
              <div className="relative space-y-4 sm:space-y-5">
                
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="bg-gradient-to-br from-amber-500/15 to-amber-600/5 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl w-fit group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 border border-amber-500/10">
                    <div className="h-6 w-6 sm:h-7 sm:w-7 [&_svg]:h-full [&_svg]:w-full flex items-center justify-center">
                      {cat.icon}
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end text-left sm:text-right">
                    <span className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700/60 text-slate-300 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider w-fit backdrop-blur-sm">
                      <Clock className="h-3 w-3 text-amber-500 shrink-0" />
                      <span>{cat.turnaround}</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-sm sm:text-lg font-bold text-white group-hover:text-amber-400 transition-colors duration-300 line-clamp-1 sm:line-clamp-none">
                    {cat.name}
                  </h3>
                  <div className="text-amber-500 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>Starting {cat.price}</span>
                  </div>
                </div>

                {/* Bullets */}
                <ul className="space-y-2.5 sm:space-y-3 pt-3 border-t border-slate-800/60">
                  {cat.bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start text-xs sm:text-sm text-slate-300">
                      <span className="text-amber-500 mr-2 font-bold select-none shrink-0">•</span>
                      <span className="line-clamp-2 sm:line-clamp-none">{bullet}</span>
                    </li>
                  ))}
                </ul>

              </div>

              {/* Order Button */}
              <div className="relative pt-4 sm:pt-6">
                <button
                   onClick={() => handleOrderRedirect(cat.serviceTypeSelect)}
                   className="w-full bg-slate-800/80 hover:bg-amber-500 text-slate-100 hover:text-[#0F172A] font-bold py-2.5 sm:py-3 px-4 rounded-xl sm:rounded-2xl transition-all duration-300 flex items-center justify-center space-x-2 border border-slate-700/40 hover:border-amber-500 shadow-lg shadow-transparent hover:shadow-amber-500/10 cursor-pointer text-xs sm:text-sm truncate active:scale-[0.98]"
                >
                  <span className="truncate">Order {cat.name}</span>
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                </button>
              </div>
            </div>
            </TiltCard>
          ))}
        </div>
      </main>

      {/* BOTTOM CTA */}
      <section className="bg-gradient-to-b from-slate-950/60 via-[#0F172A] to-slate-950/60 border-t border-slate-800/40 py-10 sm:py-14 px-4">
        <ScrollReveal>
          <div className="max-w-4xl mx-auto text-center space-y-5 sm:space-y-7">
            <div className="inline-flex items-center space-x-2.5 glass rounded-full px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-300">
              <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
              <span>Need a complex combination of multiple disciplines?</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">Not sure what you need?</h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
              Contact our dedicated support specialists. We are online 24/7 and will guide you to set up the correct project requirements.
            </p>
            <div className="flex flex-row justify-center items-center gap-4 sm:gap-8 pt-2 sm:pt-4 max-w-md mx-auto sm:max-w-none px-2">
              <RippleButton
                onClick={() => handleRedirect('contact')}
                className="glow-btn relative flex-1 sm:w-auto bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-bold px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl transition-all duration-300 text-sm sm:text-base cursor-pointer shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 active:scale-[0.98]"
              >
                Contact Us
              </RippleButton>
              <RippleButton
                onClick={() => handleRedirect('pricing')}
                className="flex-1 sm:w-auto border border-slate-600/50 hover:bg-white/5 bg-white/[0.02] text-white font-semibold px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl transition-all duration-300 text-sm sm:text-base cursor-pointer backdrop-blur-sm hover:border-slate-500"
              >
                Get Free Quote
              </RippleButton>
            </div>
          </div>
        </ScrollReveal>
      </section>

    </div>
  );
}
