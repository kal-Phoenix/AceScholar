import { useState, useEffect } from 'react';
import { PageType, Profile } from './types';
import { supabase, setSession, getAuthHeaders } from './lib/supabase';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Services from './components/Services';
import Pricing from './components/Pricing';
import Portfolio from './components/Portfolio';
import About from './components/About';
import Contact from './components/Contact';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import Admin from './components/Admin';
import Expert from './components/Expert';
import Order from './components/Order';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import ErrorBoundary from './components/ErrorBoundary';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { DEFAULT_EXCHANGE_RATES, DEFAULT_FALLBACK_CITY, DEFAULT_FALLBACK_COUNTRY, DEFAULT_FALLBACK_CURRENCY } from './lib/constants';

// Parse exchange rates from env var (JSON string → lookup map), falling back to defaults
const EXCHANGE_RATES: Record<string, { symbol: string; rate: number }> = (() => {
  try {
    const raw = import.meta.env.VITE_EXCHANGE_RATES;
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_EXCHANGE_RATES, ...parsed };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_EXCHANGE_RATES };
})();

function getCurrencyConfig(currencyCode: string): { symbol: string; rate: number } {
  if (EXCHANGE_RATES[currencyCode]) return EXCHANGE_RATES[currencyCode];
  return { symbol: '$', rate: 1.0 }; // USD fallback
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [selectedServiceType, setSelectedServiceType] = useState<string | null>(null);
  const [redirectPage, setRedirectPage] = useState<PageType | null>(null);
  
  // Persistence of active session
  const [user, setUser] = useState<Profile | null>(null);
  const [sessionRestored, setSessionRestored] = useState(false);

  // Restore session from Supabase on page load and subscribe to changes
  useEffect(() => {
    if (!supabase) { setSessionRestored(true); return; }

    // Fetch the authoritative role from the server (avoids trusting JWT user_metadata)
    const fetchServerRole = async (): Promise<Profile['role']> => {
      try {
        const res = await fetch('/api/profiles/me', { headers: await getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          return data.role || 'client';
        }
      } catch { /* fallback to JWT role */ }
      return 'client';
    };

    // Immediately restore existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setSession(session);
        const u = session.user;
        const serverRole = await fetchServerRole();
        setUser({
          id: u.id,
          email: u.email || '',
          full_name: u.user_metadata?.full_name || u.email?.split('@')[0] || '',
          role: serverRole,
          created_at: u.created_at,
        });
      }
      setSessionRestored(true);
    }).catch(() => { setSessionRestored(true); });

    // Keep session fresh via auth state changes (token refresh, signout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setSession(session);
        const u = session.user;
        const serverRole = await fetchServerRole();
        setUser({
          id: u.id,
          email: u.email || '',
          full_name: u.user_metadata?.full_name || u.email?.split('@')[0] || '',
          role: serverRole,
          created_at: u.created_at,
        });
      } else if (_event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Track user IP address and set country / currency automatically
  const [detectedLocation, setDetectedLocation] = useState<{
    country: string;
    currency: string;
    symbol: string;
    exchangeRate: number;
    ip: string;
    city?: string;
    loading: boolean;
  }>({
    country: DEFAULT_FALLBACK_COUNTRY,
    currency: DEFAULT_FALLBACK_CURRENCY,
    symbol: 'Br',
    exchangeRate: EXCHANGE_RATES[DEFAULT_FALLBACK_CURRENCY]?.rate || 120,
    ip: '',
    city: DEFAULT_FALLBACK_CITY,
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;
    const detectGeoIP = async () => {
      // 1. Try server-side /api/geoip endpoint (bypasses browser tracking protection & CORS)
      try {
        const res = await fetch('/api/geoip');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data && data.country) {
            setDetectedLocation({
              country: data.country,
              currency: data.currency,
              symbol: data.symbol,
              exchangeRate: data.exchangeRate,
              ip: data.ip || '',
              city: data.city || DEFAULT_FALLBACK_CITY,
              loading: false,
            });
            return;
          }
        }
      } catch (error) {
        // Silent catch — fallback below
      }

      // 2. Immediate timezone fallback if server endpoint is unavailable
      if (isMounted) {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
          let countryName = 'Ethiopia';
          let currCode = 'ETB';
          let city = 'Addis Ababa';

          const TZ_MAP: Array<{ tzPart: string; country: string; curr: string; city: string }> = [
            { tzPart: 'Europe/London', country: 'United Kingdom', curr: 'GBP', city: 'London' },
            { tzPart: 'Europe/Belfast', country: 'United Kingdom', curr: 'GBP', city: 'London' },
            { tzPart: 'America/New_York', country: 'United States', curr: 'USD', city: 'New York' },
            { tzPart: 'America/Chicago', country: 'United States', curr: 'USD', city: 'New York' },
            { tzPart: 'America/Los_Angeles', country: 'United States', curr: 'USD', city: 'New York' },
            { tzPart: 'US/', country: 'United States', curr: 'USD', city: 'New York' },
            { tzPart: 'Europe/', country: 'Germany', curr: 'EUR', city: 'Berlin' },
            { tzPart: 'America/Toronto', country: 'Canada', curr: 'CAD', city: 'Toronto' },
            { tzPart: 'America/Vancouver', country: 'Canada', curr: 'CAD', city: 'Toronto' },
            { tzPart: 'Asia/Riyadh', country: 'Saudi Arabia', curr: 'SAR', city: 'Riyadh' },
            { tzPart: 'Africa/Nairobi', country: 'Ethiopia', curr: 'ETB', city: 'Addis Ababa' },
            { tzPart: 'Africa/Addis_Ababa', country: 'Ethiopia', curr: 'ETB', city: 'Addis Ababa' },
            { tzPart: 'EAT', country: 'Ethiopia', curr: 'ETB', city: 'Addis Ababa' },
          ];
          for (const entry of TZ_MAP) {
            if (tz.includes(entry.tzPart)) {
              countryName = entry.country;
              currCode = entry.curr;
              city = entry.city;
              break;
            }
          }

          const { symbol, rate } = getCurrencyConfig(currCode);

          setDetectedLocation({
            country: countryName,
            currency: currCode,
            symbol,
            exchangeRate: rate,
            ip: '',
            city,
            loading: false,
          });
        }
    };

    detectGeoIP();
    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  // Close toast automatically
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSetUser = (newUser: Profile | null) => {
    setUser(newUser);
  };

  // Sync IP-detected country to user profile so components (e.g. withdrawal methods) can detect it
  useEffect(() => {
    if (detectedLocation.loading) return;
    const detected = detectedLocation.country;
    if (!detected) return;
    setUser(prev => {
      if (!prev || prev.country === detected) return prev;
      return { ...prev, country: detected };
    });
  }, [detectedLocation.loading, detectedLocation.country]);

  const handleLogout = () => {
    handleSetUser(null);
    showToast('Signed out successfully.', 'success');
    setCurrentPage('home');
    window.scrollTo(0, 0);
  };

  // Safe wrapper for setting page type
  const handleSetPage = (page: PageType) => {
    if (page === 'order' && user && (user.role === 'admin' || user.role === 'expert')) {
      showToast('Experts and Admins cannot place orders.', 'error');
      setCurrentPage(user.role === 'admin' ? 'admin' : 'expert');
      return;
    }
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const renderActivePage = () => {
    switch (currentPage) {
      case 'home':
        return <Home setCurrentPage={handleSetPage} setSelectedServiceType={setSelectedServiceType} user={user} />;
      case 'services':
        return (
          <Services
            setCurrentPage={handleSetPage}
            setSelectedServiceType={setSelectedServiceType}
          />
        );
      case 'pricing':
        return (
          <Pricing
            setCurrentPage={handleSetPage}
            setSelectedServiceType={setSelectedServiceType}
            showToast={showToast}
            detectedLocation={detectedLocation}
          />
        );
      case 'portfolio':
        return <Portfolio setCurrentPage={handleSetPage} />;
      case 'about':
        return <About setCurrentPage={handleSetPage} />;
      case 'contact':
        return <Contact />;
      case 'login':
        return (
          <Login
            setCurrentPage={handleSetPage}
            setUser={handleSetUser}
            showToast={showToast}
            redirectPage={redirectPage}
            setRedirectPage={setRedirectPage}
          />
        );
      case 'signup':
        return (
          <Signup
            setCurrentPage={handleSetPage}
            showToast={showToast}
          />
        );
      case 'dashboard':
        return (
          <Dashboard
            user={user}
            setCurrentPage={handleSetPage}
            showToast={showToast}
            setUser={handleSetUser}
          />
        );
      case 'admin':
        return (
          <Admin
            user={user}
            setCurrentPage={handleSetPage}
            showToast={showToast}
          />
        );
      case 'expert':
        return (
          <Expert
            user={user}
            setCurrentPage={handleSetPage}
            showToast={showToast}
            setUser={handleSetUser}
            detectedLocation={detectedLocation}
          />
        );
      case 'order':
        return (
          <Order
            user={user}
            sessionRestored={sessionRestored}
            selectedServiceType={selectedServiceType}
            setSelectedServiceType={setSelectedServiceType}
            setCurrentPage={handleSetPage}
            showToast={showToast}
            detectedLocation={detectedLocation}
            setRedirectPage={setRedirectPage}
          />
        );
      case 'forgot-password':
        return (
          <ForgotPassword
            setCurrentPage={handleSetPage}
            showToast={showToast}
          />
        );
      case 'reset-password':
        return (
          <ResetPassword
            setCurrentPage={handleSetPage}
            showToast={showToast}
          />
        );
      default:
        return <Home setCurrentPage={handleSetPage} user={user} />;
    }
  };

  const isFullscreenPage = currentPage === 'order';

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-[#0F172A] font-sans" id="app-root">
      
      {/* 1. STICKY BRANDED HEADER/NAVBAR */}
      {!isFullscreenPage && (
        <Navbar
          currentPage={currentPage}
          setCurrentPage={handleSetPage}
          user={user}
          onLogout={handleLogout}
        />
      )}

      {/* 2. MAIN SCROLLABLE CONTENT BODY */}
      <main className="animate-page-enter" key={currentPage}>
        {renderActivePage()}
      </main>

      {/* 3. SHARED FOOTER AREA */}
      {!isFullscreenPage && (
        <Footer setCurrentPage={handleSetPage} />
      )}

      {/* 4. GLOBAL FLOATING SUPPORT CHANNEL */}
      {!isFullscreenPage && <WhatsAppButton user={user} />}

      {/* 5. CUSTOM SLATE FLOATING TOASTS */}
      {toast && (
        <div
          className={`fixed bottom-6 left-6 z-50 p-4 rounded-xl border shadow-2xl flex items-center gap-3 animate-slide-in-left max-w-sm ${
            toast.type === 'success'
              ? 'bg-slate-900/95 border-emerald-500/30 text-emerald-400 backdrop-blur-xl'
              : 'bg-slate-900/95 border-rose-500/30 text-rose-400 backdrop-blur-xl'
          }`}
          id="global-toast-notification"
        >
          <div className="p-1.5 rounded-lg bg-slate-950">
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-400" />
            )}
          </div>
          <p className="text-sm font-semibold text-slate-100">{toast.message}</p>
          <button
            onClick={() => setToast(null)}
            className="p-1 hover:bg-slate-800 rounded-lg transition-colors ml-auto shrink-0 cursor-pointer"
          >
            <X className="h-4 w-4 text-slate-400 hover:text-white" />
          </button>
        </div>
      )}

    </div>
    </ErrorBoundary>
  );
}
