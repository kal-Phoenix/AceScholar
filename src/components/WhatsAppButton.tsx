import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { Profile } from '../types';
import { LOCAL_STORAGE_USER_KEY } from '../lib/constants';

export default function WhatsAppButton() {
  const [user, setUser] = useState<Profile | null>(null);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    // Delay appearance for polish
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (user?.role === 'admin' || user?.role === 'expert') return null;

  const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '';
  const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

  return (
    <div
      className={`fixed bottom-6 right-4 sm:right-6 z-40 transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      onMouseEnter={() => setIsTooltipVisible(true)}
      onMouseLeave={() => setIsTooltipVisible(false)}
      onFocus={() => setIsTooltipVisible(true)}
      onBlur={() => setIsTooltipVisible(false)}
    >
      {/* Tooltip */}
      <div
        className={`absolute right-14 bottom-1 bg-slate-900 border border-slate-800 text-white text-xs font-semibold py-2 px-3 rounded-lg shadow-lg whitespace-nowrap transition-all duration-200 pointer-events-none ${
          isTooltipVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
        }`}
        role="tooltip"
      >
        Chat with Support 24/7
      </div>

      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-white p-3.5 rounded-full shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-110 active:scale-95 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 animate-pulse-glow"
        style={{ animationDuration: '3s' }}
        aria-label="Chat with AceScholar support on WhatsApp"
        id="whatsapp-floating-button"
      >
        <MessageCircle className="h-5 w-5 stroke-[2.5]" aria-hidden="true" />
      </a>
    </div>
  );
}
