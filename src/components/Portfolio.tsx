import { PageType } from '../types';
import { BookOpen, Code, Layers, BarChart3, Binary, Presentation, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

interface PortfolioProps {
  setCurrentPage: (page: PageType) => void;
}

const categories = [
  {
    icon: <BookOpen className="h-5 w-5 text-amber-500" />,
    title: 'Academic Writing',
    desc: 'Research papers, literature reviews, thesis chapters, and critical essays across all disciplines.',
    stats: '500+ papers delivered',
  },
  {
    icon: <Code className="h-5 w-5 text-amber-500" />,
    title: 'Coding Projects',
    desc: 'Python, C++, React, MATLAB — full application setups, bug fixes, and clean documented code.',
    stats: '300+ projects shipped',
  },
  {
    icon: <Layers className="h-5 w-5 text-amber-500" />,
    title: 'Engineering Drawings',
    desc: 'SolidWorks CAD models, structural analysis, 2D technical sheets, and ISO-compliant blueprints.',
    stats: '200+ blueprints drafted',
  },
  {
    icon: <BarChart3 className="h-5 w-5 text-amber-500" />,
    title: 'Data Analysis',
    desc: 'SPSS, Excel, Python-based statistics, visualizations, and predictive modeling.',
    stats: '150+ analyses completed',
  },
  {
    icon: <Binary className="h-5 w-5 text-amber-500" />,
    title: 'STEM Problem Sets',
    desc: 'Step-by-step solutions for advanced math, physics, chemistry, and biology assignments.',
    stats: '800+ problems solved',
  },
  {
    icon: <Presentation className="h-5 w-5 text-amber-500" />,
    title: 'Presentations',
    desc: 'Polished slide decks with custom charts, speaker notes, and professional typography.',
    stats: '250+ decks designed',
  },
];

const qualityIndicators = [
  'Plagiarism-free guarantee with Turnitin reports',
  'APA, Harvard, MLA, Chicago, IEEE citation styles',
  'Expert-matched to your specific discipline',
  'Free unlimited revisions for 14 days',
  'Secure file transfer with end-to-end encryption',
  '24/7 direct communication with your assigned specialist',
];

export default function Portfolio({ setCurrentPage }: PortfolioProps) {
  const handleOrderRedirect = () => {
    setCurrentPage('order');
  };

  return (
    <div className="bg-[#0F172A] font-sans text-slate-100" id="portfolio-page-container">

      {/* PAGE HEADER */}
      <header className="relative bg-gradient-to-b from-[#0F172A] via-[#1a1f3a] to-[#0F172A] py-10 sm:py-14 md:py-18 px-4 text-center border-b border-slate-800/40 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:20px_20px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-amber-500/6 rounded-full filter blur-[120px] pointer-events-none animate-ambient"></div>
        <div className="relative max-w-4xl mx-auto space-y-4 sm:space-y-5">
          <ScrollReveal>
            <span className="text-amber-500 text-xs sm:text-sm font-bold tracking-widest uppercase">Our Capabilities</span>
          </ScrollReveal>
          <ScrollReveal delay={1}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">What We Deliver</h1>
          </ScrollReveal>
          <ScrollReveal delay={2}>
            <div className="h-1 w-16 bg-gradient-to-r from-amber-500 to-amber-600 mx-auto rounded-full"></div>
          </ScrollReveal>
          <ScrollReveal delay={3}>
            <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
              We handle a wide range of academic and technical projects. Due to strict client confidentiality, specific past work samples cannot be displayed publicly.
            </p>
          </ScrollReveal>
        </div>
      </header>

      {/* CATEGORIES GRID */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 stagger-children">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-7 hover:border-amber-500/40 hover:bg-slate-900/80 transition-all duration-500 group card-hover overflow-hidden"
            >
              <div className="bg-amber-500/10 p-2.5 rounded-xl w-fit mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 border border-amber-500/10">
                {cat.icon}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">{cat.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">{cat.desc}</p>
              <div className="text-xs text-amber-500 font-bold uppercase tracking-wider">{cat.stats}</div>
            </div>
          ))}
        </div>
      </main>

      {/* QUALITY ASSURANCE */}
      <section className="bg-slate-950/40 border-y border-slate-900 py-10 sm:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-8 sm:mb-10">
            <Sparkles className="h-6 w-6 text-amber-500 mx-auto" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Quality Assurance</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">Every deliverable meets our rigorous quality standards.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto">
            {qualityIndicators.map((item, idx) => (
              <div key={idx} className="flex items-start space-x-3 bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl hover:border-amber-500/20 transition-colors duration-300">
                <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-10 sm:py-14 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Ready to place your order?</h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-md mx-auto">
            Get matched with a verified expert in your discipline. Fast turnaround, 100% confidential.
          </p>
          <div className="flex flex-row justify-center items-center gap-4 pt-2">
            <button
              onClick={handleOrderRedirect}
              className="bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-bold px-6 py-3 sm:px-8 sm:py-3.5 rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 active:scale-[0.98] transition-all duration-300 text-sm sm:text-base cursor-pointer inline-flex items-center space-x-2"
            >
              <span>Place Order</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setCurrentPage('contact'); }}
              className="border border-slate-700/60 hover:bg-slate-900/60 bg-transparent text-white font-semibold px-6 py-3 sm:px-8 sm:py-3.5 rounded-xl transition-all duration-300 text-sm sm:text-base cursor-pointer hover:border-slate-600"
            >
              Contact Us
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
