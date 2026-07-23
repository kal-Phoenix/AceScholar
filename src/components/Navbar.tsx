import { useState } from 'react';
import { Menu, X, LayoutDashboard, ShieldCheck, LogOut, FileText, GraduationCap } from 'lucide-react';
import { PageType, Profile } from '../types';
import logoImg from '/No BG Logo.png';

interface NavbarProps {
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
  user: Profile | null;
  onLogout: () => void;
  detectedLocation?: {
    country: string;
    currency: string;
    symbol: string;
    exchangeRate: number;
    ip: string;
    city?: string;
  };
}

export default function Navbar({ currentPage, setCurrentPage, user, onLogout }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#0F172A]/80 border-b border-slate-800/40 text-white backdrop-blur-xl bg-opacity-95 shadow-lg shadow-black/20">
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
              className="h-16 w-16 md:h-20 md:w-20 group-hover:scale-105 transition-transform brightness-[2] drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]" 
            />
            <span className="font-sans font-bold text-2xl md:text-3xl tracking-tight">
              ACE<span className="text-amber-500">SCHOLAR</span>
            </span>
          </button>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-4">
            <button
              onClick={() => handleNavClick('home')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                currentPage === 'home' ? 'text-amber-500 font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Home
            </button>
            {navLinks.map((link) => (
              <button
                key={link.value}
                onClick={() => handleNavClick(link.value)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  currentPage === link.value ? 'text-amber-500 font-semibold' : 'text-slate-300 hover:text-white'
                }`}
              >
                {link.label}
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
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all ${
                      currentPage === 'admin' ? 'border-red-500 bg-red-500/20' : ''
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Admin Panel</span>
                  </button>
                ) : user.role === 'expert' ? (
                  <button
                    onClick={() => handleNavClick('expert')}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all ${
                      currentPage === 'expert' ? 'border-emerald-500 bg-emerald-500/20' : ''
                    }`}
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span>Expert Workspace</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleNavClick('dashboard')}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all ${
                      currentPage === 'dashboard' ? 'border-amber-500 bg-amber-500/20' : ''
                    }`}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>My Dashboard</span>
                  </button>
                )}
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNavClick('login')}
                className={`px-4 py-2 text-sm font-medium transition-all ${
                  currentPage === 'login' ? 'text-amber-500' : 'text-slate-300 hover:text-white'
                }`}
              >
                Sign In
              </button>
            )}

            {(!user || user.role === 'client') && (
              <button
                onClick={() => handleNavClick('order')}
                className="bg-amber-500 text-[#0F172A] hover:bg-amber-400 font-sans font-semibold px-5 py-2.5 rounded-lg shadow-lg hover:shadow-amber-500/20 active:scale-95 transition-all text-sm flex items-center space-x-1.5"
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
              className="inline-flex items-center justify-center p-2.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none transition-colors min-h-[44px] min-w-[44px]"
              aria-expanded={isOpen}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              <span className="sr-only">{isOpen ? 'Close main menu' : 'Open main menu'}</span>
              {isOpen ? <X className="block h-5 w-5" /> : <Menu className="block h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-[#0F172A] border-t border-slate-800 px-3 py-3 space-y-2.5 shadow-inner max-h-[85vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleNavClick('home')}
              className={`block text-center py-3 px-3 rounded-lg text-xs font-semibold transition-all min-h-[44px] ${
                currentPage === 'home' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-slate-900/40 border border-slate-800/60 text-slate-300 hover:text-white'
              }`}
            >
              Home
            </button>
            {navLinks.map((link) => (
              <button
                key={link.value}
                onClick={() => handleNavClick(link.value)}
                className={`block text-center py-3 px-3 rounded-lg text-xs font-semibold transition-all min-h-[44px] ${
                  currentPage === link.value ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-slate-900/40 border border-slate-800/60 text-slate-300 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
          
          <div className="border-t border-slate-800/60 my-1"></div>
          
          <div className="flex flex-col gap-1.5">
            {user ? (
              <>
                {user.role === 'admin' ? (
                  <button
                    onClick={() => handleNavClick('admin')}
                    className={`flex items-center justify-center space-x-1.5 py-3 px-3 rounded-lg text-xs font-semibold transition-all text-red-400 bg-red-500/5 border border-red-500/10 min-h-[44px] ${
                      currentPage === 'admin' ? 'bg-red-500/10 border-red-500/20' : ''
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Admin Panel</span>
                  </button>
                ) : user.role === 'expert' ? (
                  <button
                    onClick={() => handleNavClick('expert')}
                    className={`flex items-center justify-center space-x-1.5 py-3 px-3 rounded-lg text-xs font-semibold transition-all text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 min-h-[44px] ${
                      currentPage === 'expert' ? 'bg-emerald-500/10 border-emerald-500/20' : ''
                    }`}
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span>Expert Workspace</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleNavClick('dashboard')}
                    className={`flex items-center justify-center space-x-1.5 py-3 px-3 rounded-lg text-xs font-semibold transition-all text-amber-400 bg-amber-500/5 border border-amber-500/10 min-h-[44px] ${
                      currentPage === 'dashboard' ? 'bg-amber-500/10 border-amber-500/20' : ''
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
                  className="flex items-center justify-center space-x-1.5 py-3 px-3 rounded-lg text-xs font-semibold text-slate-400 bg-slate-900/40 border border-slate-800/60 hover:text-white hover:bg-slate-800 transition-all min-h-[44px]"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out ({user.full_name.split(' ')[0]})</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => handleNavClick('login')}
                className={`block text-center py-3 px-3 rounded-lg text-xs font-semibold transition-all min-h-[44px] ${
                  currentPage === 'login' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-slate-900/40 border border-slate-800/60 text-slate-300 hover:text-white'
                }`}
              >
                Sign In
              </button>
            )}

            {(!user || user.role === 'client') && (
              <button
                onClick={() => handleNavClick('order')}
                className="w-full bg-amber-500 text-[#0F172A] hover:bg-amber-400 text-center font-bold py-3 rounded-lg shadow-md text-xs transition-all mt-0.5 min-h-[44px]"
              >
                Place Order Now
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
