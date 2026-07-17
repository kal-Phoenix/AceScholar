import { GraduationCap, Mail, ShieldAlert, CheckCircle } from 'lucide-react';
import { PageType } from '../types';

interface FooterProps {
  setCurrentPage: (page: PageType) => void;
}

export default function Footer({ setCurrentPage }: FooterProps) {
  const handleNavClick = (page: PageType) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0F172A] border-t border-slate-800 text-slate-400 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Logo & Tagline */}
          <div className="md:col-span-2 space-y-4">
            <div 
              onClick={() => handleNavClick('home')} 
              className="flex items-center space-x-2.5 cursor-pointer group w-fit"
            >
              <div className="bg-amber-500 text-[#0F172A] p-1.5 rounded-md">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">
                ACE<span className="text-amber-500">SCHOLAR</span>
              </span>
            </div>
            <p className="text-sm max-w-sm text-slate-400">
              AceScholar is an elite global consultancy. We provide top-tier support for research writing, complex coding projects, CAD drafting, and robust mathematical solutions.
            </p>
            <div className="flex items-center space-x-2.5 bg-slate-800/50 border border-slate-700/50 p-3 rounded-lg max-w-xs text-xs text-slate-300">
              <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
              <span>100% Confidential. Your identity and work are never shared with third parties.</span>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Quick Navigation</h4>
            <ul className="space-y-2 text-sm">
              {['Services', 'Pricing', 'Portfolio', 'About', 'Contact'].map((item) => {
                const val = item.toLowerCase() as PageType;
                return (
                  <li key={item}>
                    <button
                      onClick={() => handleNavClick(val)}
                      className="hover:text-amber-500 transition-colors cursor-pointer text-left focus:outline-none"
                    >
                      {item}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Security & Support */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Guarantees</h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center space-x-2 text-xs">
                <CheckCircle className="h-3.5 w-3.5 text-amber-500" />
                <span>On-time Delivery Guarantee</span>
              </li>
              <li className="flex items-center space-x-2 text-xs">
                <CheckCircle className="h-3.5 w-3.5 text-amber-500" />
                <span>Free Unlimited Revisions</span>
              </li>
              <li className="flex items-center space-x-2 text-xs">
                <CheckCircle className="h-3.5 w-3.5 text-amber-500" />
                <span>Plagiarism-free Originality</span>
              </li>
              <li className="flex items-center space-x-2 text-xs text-amber-500 font-semibold pt-1">
                <Mail className="h-3.5 w-3.5 text-amber-500" />
                <span>contact@acescholar.com</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 space-y-4 md:space-y-0">
          <div>
            &copy; {new Date().getFullYear()} AceScholar. All rights reserved.
          </div>
          <div className="flex space-x-4">
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span>&bull;</span>
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span>&bull;</span>
            <span>Ethiopia Office serving clients worldwide 24/7</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
