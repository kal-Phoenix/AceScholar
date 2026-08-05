import { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, ShieldCheck, LogOut, FileText, GraduationCap } from 'lucide-react';
import { PageType, Profile } from '../types';
import logoImg from '/No BG Logo.png';

interface NavbarProps {
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
  user: Profile | null;
  onLogout: () => void;
}

export default function Navbar({ currentPage, setCurrentPage, user, onLogout }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen]);

  const navLinks = [
    { label: 'Services', value: 'services' as PageType },
    { label: 'Pricing', value: 'pricing' as PageType },
    { label: 'Portfolio', value: 'portfolio' as PageType },
    { label: 'About', value: 'about' as PageType },
    { label: 'Contact', value: 'contact' as PageType },
  ];

  const handleNavClick = (page: PageType) => {
    setCurrentPage(page);
    setIsOpen(false);
  };

  return (
    <nav className={`sticky top-0 z-50 text-white transition-all duration-300 ${
      scrolled 
        ? 'bg-[#0F172A]/95 border-b border-slate-800/60 backdrop-blur-2xl shadow-xl shadow-black/30' 
        : 'bg-[#0F172A]/80 border-b border-slate-800/30 backdrop-blur-xl'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Logo */}
          <button 
            onClick={() => handleNavClick('home')} 
            className="flex items-center space-x-2 cursor-pointer group focus-visible:outline-2 focus-visible:outline-amber-500 focus-visible:outline-offset-2 rounded-lg"
            aria-label="AceScholar home"
          >
            <img 
              src={logoImg} 
              alt="AceScholar logo" 
              className="h-14 w-14 md:h-16 md:w-16 group-hover:scale-105 transition-transform duration-300 brightness-[2] drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]" 
            />
            <span className="font-sans font-bold text-xl md:text-2xl tracking-tight">
              ACE<span className="text-amber-500">SCHOLAR</span>
            </span>
          </button>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => handleNavClick('home')}
              className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentPage === 'home' 
                  ? 'text-amber-500' 
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Home
              {currentPage === 'home' && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-500 rounded-full"></span>
              )}
            </button>
            {navLinks.map((link) => (
              <button
                key={link.value}
                onClick={() => handleNavClick(link.value)}
                className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentPage === link.value 
                    ? 'text-amber-500' 
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
                {currentPage === link.value && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-500 rounded-full"></span>
                )}
              </button>
            ))}
          </div>

          {/* Desktop CTA / Auth buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                {user.role === 'admin' ? (
                  <button
                    onClick={() => handleNavClick('admin')}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                      currentPage === 'admin' 
                        ? 'border-red-500/40 bg-red-500/15 text-red-400' 
                        : 'border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/15'
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Admin Panel</span>
                  </button>
                ) : user.role === 'expert' ? (
                  <button
                    onClick={() => handleNavClick('expert')}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                      currentPage === 'expert' 
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400' 
                        : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/15'
                    }`}
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span>Expert Workspace</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleNavClick('dashboard')}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      currentPage === 'dashboard' 
                        ? 'text-amber-500 bg-amber-500/10' 
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>My Dashboard</span>
                  </button>
                )}
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNavClick('login')}
                className={`px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
                  currentPage === 'login' ? 'text-amber-500 bg-amber-500/10' : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                Sign In
              </button>
            )}

            {(!user || user.role === 'client') && (
              <button
                onClick={() => handleNavClick('order')}
                className="bg-amber-500 text-[#0F172A] hover:bg-amber-400 font-sans font-semibold px-5 py-2.5 rounded-lg shadow-lg hover:shadow-amber-500/20 active:scale-95 transition-all duration-200 text-sm flex items-center space-x-1.5"
              >
                <FileText className="h-4 w-4" />
                <span>Place Order</span>
              </button>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 focus:outline-none transition-all duration-200 min-h-[44px] min-w-[44px]"
              aria-expanded={isOpen}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              <span className="sr-only">{isOpen ? 'Close main menu' : 'Open main menu'}</span>
              <div className="relative w-5 h-5">
                <span className={`absolute inset-0 transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-0' : '-translate-y-1.5'}`}>
                  <span className={`block h-0.5 w-5 bg-current rounded-full transition-all duration-300 ${isOpen ? 'rotate-0' : ''}`}></span>
                </span>
                <span className={`absolute inset-0 transition-all duration-300 ${isOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`}>
                  <span className="block h-0.5 w-5 bg-current rounded-full"></span>
                </span>
                <span className={`absolute inset-0 transition-all duration-300 ${isOpen ? 'rotate-[-45deg] translate-y-0' : 'translate-y-1.5'}`}>
                  <span className={`block h-0.5 w-5 bg-current rounded-full transition-all duration-300 ${isOpen ? 'rotate-0' : ''}`}></span>
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        ref={menuRef}
        className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
          isOpen ? 'max-h-[85vh] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-[#0F172A] border-t border-slate-800/40 px-4 py-4 space-y-3 shadow-inner">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleNavClick('home')}
              className={`block text-center py-3 px-3 rounded-xl text-xs font-semibold transition-all duration-200 min-h-[44px] ${
                currentPage === 'home' ? 'bg-amber-500/15 text-amber-500 border border-amber-500/25 shadow-sm shadow-amber-500/10' : 'bg-slate-900/60 border border-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Home
            </button>
            {navLinks.map((link) => (
              <button
                key={link.value}
                onClick={() => handleNavClick(link.value)}
                className={`block text-center py-3 px-3 rounded-xl text-xs font-semibold transition-all duration-200 min-h-[44px] ${
                  currentPage === link.value ? 'bg-amber-500/15 text-amber-500 border border-amber-500/25 shadow-sm shadow-amber-500/10' : 'bg-slate-900/60 border border-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
          
          <div className="border-t border-slate-800/40 my-1"></div>
          
          <div className="flex flex-col gap-2">
            {user ? (
              <>
                {user.role === 'admin' ? (
                  <button
                    onClick={() => handleNavClick('admin')}
                    className={`flex items-center justify-center space-x-1.5 py-3 px-3 rounded-xl text-xs font-semibold transition-all duration-200 text-red-400 bg-red-500/5 border border-red-500/15 min-h-[44px] ${
                      currentPage === 'admin' ? 'bg-red-500/15 border-red-500/25' : 'hover:bg-red-500/10'
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Admin Panel</span>
                  </button>
                ) : user.role === 'expert' ? (
                  <button
                    onClick={() => handleNavClick('expert')}
                    className={`flex items-center justify-center space-x-1.5 py-3 px-3 rounded-xl text-xs font-semibold transition-all duration-200 text-emerald-400 bg-emerald-500/5 border border-emerald-500/15 min-h-[44px] ${
                      currentPage === 'expert' ? 'bg-emerald-500/15 border-emerald-500/25' : 'hover:bg-emerald-500/10'
                    }`}
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span>Expert Workspace</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleNavClick('dashboard')}
                    className={`flex items-center justify-center space-x-1.5 py-3 px-3 rounded-xl text-xs font-semibold transition-all duration-200 text-slate-300 bg-slate-900/60 border border-slate-800/60 hover:text-white hover:bg-slate-800/60 min-h-[44px] ${
                      currentPage === 'dashboard' ? 'text-amber-500 font-semibold border-amber-500/25' : ''
                    }`}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>My Dashboard</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    onLogout();
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-center space-x-1.5 py-3 px-3 rounded-xl text-xs font-semibold text-slate-400 bg-slate-900/60 border border-slate-800/60 hover:text-white hover:bg-slate-800/60 transition-all duration-200 min-h-[44px]"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out ({user.full_name.split(' ')[0]})</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => handleNavClick('login')}
                className={`block text-center py-3 px-3 rounded-xl text-xs font-semibold transition-all duration-200 min-h-[44px] ${
                  currentPage === 'login' ? 'bg-amber-500/15 text-amber-500 border border-amber-500/25' : 'bg-slate-900/60 border border-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Sign In
              </button>
            )}

            {(!user || user.role === 'client') && (
              <button
                onClick={() => handleNavClick('order')}
                className="w-full bg-amber-500 text-[#0F172A] hover:bg-amber-400 text-center font-bold py-3 rounded-xl shadow-lg shadow-amber-500/10 text-xs transition-all duration-200 mt-0.5 min-h-[44px] flex items-center justify-center space-x-1.5"
              >
                <FileText className="h-4 w-4" />
                <span>Place Order Now</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
