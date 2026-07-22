import { PageType } from '../types';
import { BookOpen, Code, Layers, BarChart3, Binary, Presentation } from 'lucide-react';

interface PortfolioProps {
  setCurrentPage: (page: PageType) => void;
}

const categories = [
  {
    icon: <BookOpen className="h-5 w-5 text-amber-500" />,
    title: 'Academic Writing',
    desc: 'Research papers, literature reviews, thesis chapters, and critical essays across all disciplines.',
  },
  {
    icon: <Code className="h-5 w-5 text-amber-500" />,
    title: 'Coding Projects',
    desc: 'Python, C++, React, MATLAB — full application setups, bug fixes, and clean documented code.',
  },
  {
    icon: <Layers className="h-5 w-5 text-amber-500" />,
    title: 'Engineering Drawings',
    desc: 'SolidWorks CAD models, structural analysis, 2D technical sheets, and ISO-compliant blueprints.',
  },
  {
    icon: <BarChart3 className="h-5 w-5 text-amber-500" />,
    title: 'Data Analysis',
    desc: 'SPSS, Excel, Python-based statistics, visualizations, and predictive modeling.',
  },
  {
    icon: <Binary className="h-5 w-5 text-amber-500" />,
    title: 'STEM Problem Sets',
    desc: 'Step-by-step solutions for advanced math, physics, chemistry, and biology assignments.',
  },
  {
    icon: <Presentation className="h-5 w-5 text-amber-500" />,
    title: 'Presentations',
    desc: 'Polished slide decks with custom charts, speaker notes, and professional typography.',
  },
];

export default function Portfolio({ setCurrentPage }: PortfolioProps) {
  const handleOrderRedirect = () => {
    setCurrentPage('order');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-[#0F172A] font-sans text-slate-100 min-h-screen" id="portfolio-page-container">

      {/* 1. PAGE HEADER */}
      <header className="relative bg-gradient-to-b from-[#0F172A] to-[#1E293B] py-10 sm:py-16 md:py-20 px-4 text-center border-b border-slate-800">
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
          <span className="text-amber-500 text-[10px] sm:text-xs font-bold tracking-widest uppercase">Our Capabilities</span>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">What We Deliver</h1>
          <div className="h-1 w-16 bg-amber-500 mx-auto rounded"></div>
          <p className="text-xs sm:text-lg text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            We handle a wide range of academic and technical projects. Due to strict client confidentiality, specific past work samples cannot be displayed publicly.
          </p>
        </div>
      </header>

      {/* 2. CATEGORIES GRID */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 sm:p-6 hover:border-amber-500/40 hover:bg-slate-900/80 transition-all duration-300"
            >
              <div className="bg-amber-500/10 p-2.5 rounded-lg w-fit mb-3 sm:mb-4">
                {cat.icon}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mb-1.5 sm:mb-2">{cat.title}</h3>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">{cat.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* 3. BOTTOM CTA */}
      <section className="bg-slate-950/40 border-t border-slate-900 py-10 sm:py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5">
          <h2 className="text-xl sm:text-3xl font-bold text-white">Ready to place your order?</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
            Get matched with a verified expert in your discipline. Fast turnaround, 100% confidential.
          </p>
          <div className="pt-1 sm:pt-2">
            <button
              onClick={handleOrderRedirect}
              className="bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-bold px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-xl shadow-lg hover:shadow-amber-500/15 transition-all text-xs sm:text-sm cursor-pointer"
            >
              Place Order
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
