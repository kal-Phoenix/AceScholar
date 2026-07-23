import { Mail, ShieldAlert, CheckCircle, ArrowUp } from 'lucide-react';
import { PageType } from '../types';
import logoImg from '/No BG Logo.png';

interface FooterProps {
  setCurrentPage: (page: PageType) => void;
}

export default function Footer({ setCurrentPage }: FooterProps) {
  const handleNavClick = (page: PageType) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0A0F1E] border-t border-slate-800/40 text-slate-400 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-14">
          
          {/* Logo & Tagline */}
          <div className="lg:col-span-1 space-y-5">
            <div 
              onClick={() => handleNavClick('home')} 
              className="flex items-center space-x-2.5 cursor-pointer group w-fit"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNavClick('home'); }}
            >
              <img 
                src={logoImg} 
                alt="AceScholar logo" 
                className="h-9 w-9 group-hover:scale-105 transition-transform duration-300 brightness-[2] drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" 
              />
              <span className="font-bold text-xl tracking-tight text-white">
                ACE<span className="text-amber-500">SCHOLAR</span>
              </span>
            </div>
            <p className="text-sm max-w-xs text-slate-400 leading-relaxed">
              Elite global academic consultancy providing top-tier support for research writing, coding projects, CAD drafting, and mathematical solutions.
            </p>
            <div className="flex items-center space-x-2.5 glass rounded-xl p-3.5 max-w-xs">
              <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-xs text-slate-300">100% Confidential. Your identity and work are never shared.</span>
            </div>
          </div>

          {/* Services Links */}
          <div className="space-y-5">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Services</h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'Academic Writing', page: 'services' as PageType },
                { label: 'Coding Projects', page: 'services' as PageType },
                { label: 'Engineering Drawings', page: 'services' as PageType },
                { label: 'Data Analysis', page: 'services' as PageType },
                { label: 'STEM Problem Sets', page: 'services' as PageType },
                { label: 'Presentations', page: 'services' as PageType },
              ].map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => handleNavClick(item.page)}
                    className="hover:text-amber-500 hover:translate-x-1 transition-all duration-200 cursor-pointer text-left focus:outline-none text-xs"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-5">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Company</h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'About Us', page: 'about' as PageType },
                { label: 'Portfolio', page: 'portfolio' as PageType },
                { label: 'Pricing', page: 'pricing' as PageType },
                { label: 'Contact', page: 'contact' as PageType },
              ].map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => handleNavClick(item.page)}
                    className="hover:text-amber-500 hover:translate-x-1 transition-all duration-200 cursor-pointer text-left focus:outline-none text-xs"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Guarantees & Contact */}
          <div className="space-y-5">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Guarantees</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-2.5 text-xs">
                <CheckCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>On-time Delivery</span>
              </li>
              <li className="flex items-center space-x-2.5 text-xs">
                <CheckCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>Free Unlimited Revisions</span>
              </li>
              <li className="flex items-center space-x-2.5 text-xs">
                <CheckCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>Plagiarism-free Originality</span>
              </li>
              <li className="flex items-center space-x-2.5 text-xs">
                <CheckCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>24/7 Support Available</span>
              </li>
            </ul>
            <div className="pt-3 space-y-2.5">
              <a href="mailto:contact@acescholar.com" className="flex items-center space-x-2 text-xs text-slate-300 hover:text-amber-500 transition-colors duration-200">
                <Mail className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>contact@acescholar.com</span>
              </a>
            </div>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="border-t border-slate-800/40 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 space-y-4 md:space-y-0">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <span>&copy; {currentYear} AceScholar. All rights reserved.</span>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span>Ethiopia Office serving clients worldwide 24/7</span>
          </div>
          <div className="flex items-center gap-5">
            <button
              onClick={() => handleNavClick('contact')}
              className="hover:text-amber-500 transition-colors duration-200 cursor-pointer"
            >
              Privacy Policy
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={() => handleNavClick('contact')}
              className="hover:text-amber-500 transition-colors duration-200 cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              onClick={scrollToTop}
              className="ml-2 p-2 rounded-full bg-slate-800/60 hover:bg-amber-500/20 text-slate-400 hover:text-amber-500 transition-all duration-300 cursor-pointer"
              aria-label="Scroll to top"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
