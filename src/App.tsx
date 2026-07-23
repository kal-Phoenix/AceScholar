import { useState, useEffect } from 'react';
import { PageType, Profile } from './types';
import { supabase } from './lib/supabase';
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
import { ShieldCheck, X } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [selectedServiceType, setSelectedServiceType] = useState<string | null>(null);
  const [redirectPage, setRedirectPage] = useState<PageType | null>(null);
  
  // Persistence of active session
  const [user, setUser] = useState<Profile | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('ace_scholar_current_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      localStorage.removeItem('ace_scholar_current_user');
      return null;
    }
  });

  // Restore Supabase client session from localStorage on page load for token refresh
  useEffect(() => {
    if (supabase && user?.access_token && user?.refresh_token) {
      supabase.auth.setSession({
        access_token: user.access_token,
        refresh_token: user.refresh_token,
      }).catch(() => {});
    }
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
    country: 'Ethiopia',
    currency: 'ETB',
    symbol: 'Br',
    exchangeRate: 120,
    ip: '197.156.112.44',
    city: 'Addis Ababa',
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;
    const detectGeoIP = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) throw new Error('Failed to fetch from ipapi');
        const data = await res.json();
        if (isMounted && data && data.country_name) {
          const countryName = data.country_name;
          const currCode = data.currency || (countryName === 'Ethiopia' ? 'ETB' : 'USD');
          
          let symbol = '$';
          let rate = 1.0;
          if (currCode === 'ETB' || countryName.toLowerCase() === 'ethiopia') {
            symbol = 'Br';
            rate = 120;
          } else if (currCode === 'GBP') {
            symbol = '£';
            rate = 0.79;
          } else if (currCode === 'EUR') {
            symbol = '€';
            rate = 0.92;
          } else if (currCode === 'CAD') {
            symbol = 'C$';
            rate = 1.36;
          } else if (currCode === 'AUD') {
            symbol = 'A$';
            rate = 1.51;
          } else if (currCode === 'AED') {
            symbol = 'AED ';
            rate = 3.67;
          } else if (currCode === 'SAR') {
            symbol = 'SR ';
            rate = 3.75;
          }

          setDetectedLocation({
            country: countryName,
            currency: currCode,
            symbol,
            exchangeRate: rate,
            ip: data.ip || '197.156.112.44',
            city: data.city || 'Addis Ababa',
            loading: false,
          });
          return;
        }
      } catch (error) {
        console.warn('ipapi.co lookup failed, trying freeipapi.com secondary provider...', error);
      }

      // Try freeipapi.com as secondary provider
      try {
        const res = await fetch('https://freeipapi.com/api/json');
        if (!res.ok) throw new Error('Failed to fetch from freeipapi');
        const data = await res.json();
        if (isMounted && data && data.countryName) {
          const countryName = data.countryName;
          let currCode = 'USD';
          let symbol = '$';
          let rate = 1.0;

          if (countryName.toLowerCase() === 'ethiopia') {
            currCode = 'ETB';
            symbol = 'Br';
            rate = 120;
          } else if (countryName.toLowerCase() === 'united kingdom') {
            currCode = 'GBP';
            symbol = '£';
            rate = 0.79;
          } else if (countryName.toLowerCase() === 'germany' || countryName.toLowerCase() === 'france' || countryName.toLowerCase() === 'italy') {
            currCode = 'EUR';
            symbol = '€';
            rate = 0.92;
          } else if (countryName.toLowerCase() === 'canada') {
            currCode = 'CAD';
            symbol = 'C$';
            rate = 1.36;
          } else if (countryName.toLowerCase() === 'saudi arabia') {
            currCode = 'SAR';
            symbol = 'SR ';
            rate = 3.75;
          }

          setDetectedLocation({
            country: countryName,
            currency: currCode,
            symbol,
            exchangeRate: rate,
            ip: data.ipAddress || '197.156.112.44',
            city: data.cityName || 'Addis Ababa',
            loading: false,
          });
          return;
        }
      } catch (err) {
        console.warn('Secondary freeipapi lookup failed, applying timezone fallback:', err);
      }

      if (isMounted) {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
          let countryName = 'Ethiopia';
          let currCode = 'ETB';
          let symbol = 'Br';
          let rate = 120;
          let ip = '197.156.112.44';
          let city = 'Addis Ababa';

          if (tz.includes('Europe/London') || tz.includes('Europe/Belfast')) {
            countryName = 'United Kingdom';
            currCode = 'GBP';
            symbol = '£';
            rate = 0.79;
            ip = '82.165.197.12';
            city = 'London';
          } else if (tz.includes('America/New_York') || tz.includes('America/Chicago') || tz.includes('America/Los_Angeles') || tz.includes('US/')) {
            countryName = 'United States';
            currCode = 'USD';
            symbol = '$';
            rate = 1.0;
            ip = '104.244.42.1';
            city = 'New York';
          } else if (tz.includes('Europe/')) {
            countryName = 'Germany';
            currCode = 'EUR';
            symbol = '€';
            rate = 0.92;
            ip = '46.112.35.91';
            city = 'Berlin';
          } else if (tz.includes('America/Toronto') || tz.includes('America/Vancouver')) {
            countryName = 'Canada';
            currCode = 'CAD';
            symbol = 'C$';
            rate = 1.36;
            ip = '198.50.150.111';
            city = 'Toronto';
          } else if (tz.includes('Asia/Riyadh')) {
            countryName = 'Saudi Arabia';
            currCode = 'SAR';
            symbol = 'SR ';
            rate = 3.75;
            ip = '37.120.35.41';
            city = 'Riyadh';
          } else if (tz.includes('Africa/Nairobi') || tz.includes('Africa/Addis_Ababa') || tz.includes('EAT')) {
            countryName = 'Ethiopia';
            currCode = 'ETB';
            symbol = 'Br';
            rate = 120;
            ip = '197.156.112.44';
            city = 'Addis Ababa';
          }

          setDetectedLocation({
            country: countryName,
            currency: currCode,
            symbol,
            exchangeRate: rate,
            ip,
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
    if (newUser) {
      localStorage.setItem('ace_scholar_current_user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('ace_scholar_current_user');
    }
  };

  const handleLogout = () => {
    handleSetUser(null);
    showToast('Signed out successfully.', 'success');
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Safe wrapper for setting page type
  const handleSetPage = (page: PageType) => {
    if (page === 'order' && user && (user.role === 'admin' || user.role === 'expert')) {
      showToast('Experts and Admins cannot place orders.', 'error');
      setCurrentPage(user.role === 'admin' ? 'admin' : 'expert');
      return;
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderActivePage = () => {
    switch (currentPage) {
      case 'home':
        return <Home setCurrentPage={handleSetPage} user={user} />;
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
          />
        );
      case 'order':
        return (
          <Order
            user={user}
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
    <div className="min-h-screen bg-[#0F172A] flex flex-col font-sans" id="app-root">
      
      {/* 1. STICKY BRANDED HEADER/NAVBAR */}
      {!isFullscreenPage && (
        <Navbar
          currentPage={currentPage}
          setCurrentPage={handleSetPage}
          user={user}
          onLogout={handleLogout}
          detectedLocation={detectedLocation}
        />
      )}

      {/* 2. MAIN SCROLLABLE CONTENT BODY */}
      <main className={`${isFullscreenPage ? '' : 'flex-grow'} animate-fade-in`} key={currentPage}>
        {renderActivePage()}
      </main>

      {/* 3. SHARED FOOTER AREA */}
      {!isFullscreenPage && (
        <Footer setCurrentPage={handleSetPage} />
      )}

      {/* 4. GLOBAL FLOATING SUPPORT CHANNEL */}
      {!isFullscreenPage && <WhatsAppButton />}

      {/* 5. GORGEOUS CUSTOM SLATE FLOATING TOASTS */}
      {toast && (
        <div
          className={`fixed bottom-6 left-6 z-50 p-4 rounded-xl border shadow-2xl flex items-center gap-3 animate-slide-in-left max-w-sm ${
            toast.type === 'success'
              ? 'bg-slate-900 border-emerald-500/30 text-emerald-400'
              : 'bg-slate-900 border-rose-500/30 text-rose-400'
          }`}
          id="global-toast-notification"
        >
          <div className="p-1.5 rounded-lg bg-slate-950">
            <ShieldCheck className={`h-5 w-5 ${toast.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`} />
          </div>
          <p className="text-xs font-semibold text-slate-100">{toast.message}</p>
          <button
            onClick={() => setToast(null)}
            className="p-1 hover:bg-slate-800 rounded transition-colors ml-auto shrink-0 cursor-pointer"
          >
            <X className="h-4 w-4 text-slate-400 hover:text-white" />
          </button>
        </div>
      )}

    </div>
    </ErrorBoundary>
  );
}
