import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { Profile } from '../types';

export default function WhatsAppButton() {
  const [user, setUser] = useState<Profile | null>(null);

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
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all group"
      title="Chat on WhatsApp"
      id="whatsapp-floating-button"
    >
      <MessageCircle className="h-6 w-6 stroke-[2.5]" />
      <span className="absolute right-14 bg-slate-900 border border-slate-800 text-white text-xs font-semibold py-1.5 px-3 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-300 whitespace-nowrap mr-2">
        Chat with Support 24/7
      </span>
    </a>
  );
}
