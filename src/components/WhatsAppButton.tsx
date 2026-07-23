import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { Profile } from '../types';

export default function WhatsAppButton() {
  const [user, setUser] = useState<Profile | null>(null);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('ace_scholar_current_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
  }, []);

  if (user?.role === 'admin' || user?.role === 'expert') return null;

  const WHATSAPP_NUMBER = '251911223344';
  const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=Hello%20AceScholar,%20I%20would%20like%20to%20get%20a%20quote%20for%20my%20academic%20project.`;

  return (
    <div
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40"
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
        className="flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-full shadow-2xl hover:shadow-emerald-500/30 hover:scale-110 active:scale-95 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
        aria-label="Chat with AceScholar support on WhatsApp"
        id="whatsapp-floating-button"
      >
        <MessageCircle className="h-6 w-6 stroke-[2.5]" aria-hidden="true" />
      </a>
    </div>
  );
}
