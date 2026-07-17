import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Send, CheckCircle2, ShieldAlert, Globe, Compass, Navigation, Users, Radar, Sparkles, Star, Zap, MapPin } from 'lucide-react';
import { fallbackDb } from '../lib/supabase';

interface ContactProps {
  detectedLocation?: {
    country: string;
    currency: string;
    symbol: string;
    exchangeRate: number;
    ip: string;
    city?: string;
  };
}

// Nearby experts seed data for map simulation
const MAP_EXPERTS = [
  {
    id: 'exp-map-biruk',
    name: 'Eng. Biruk T.',
    specialty: 'SolidWorks CAD & Drafting',
    rating: 4.9,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    initialX: 30, // % from left
    initialY: 25, // % from top
    distance: '0.6 km',
    status: 'Ready to Draft',
    activeProject: 'Cylinder Valve Assembly',
  },
  {
    id: 'exp-map-almaz',
    name: 'Almaz D.',
    specialty: 'Python & MATLAB Coding',
    rating: 5.0,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    initialX: 75,
    initialY: 40,
    distance: '1.2 km',
    status: 'Express Solver Online',
    activeProject: 'Thermodynamics Script',
  },
  {
    id: 'exp-map-sarah',
    name: 'Dr. Sarah Jenkins',
    specialty: 'Academic Writing & Thesis',
    rating: 4.8,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    initialX: 62,
    initialY: 70,
    distance: '2.4 km',
    status: 'Counseling Thesis Clients',
    activeProject: 'Oncology Literature Review',
  },
  {
    id: 'exp-map-ahmed',
    name: 'Dr. Ahmed Al-Mansoor',
    specialty: 'Statistical SPSS Modeling',
    rating: 4.9,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
    initialX: 20,
    initialY: 75,
    distance: '1.8 km',
    status: 'Data Sandbox Open',
    activeProject: 'ANOVA Clinical Trial',
  }
];

export default function Contact({ detectedLocation }: ContactProps) {
  // Tab control: 'form' | 'radar'
  const [activeTab, setActiveTab] = useState<'radar' | 'form'>('radar');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Uber-style map states
  const [selectedMapExpert, setSelectedMapExpert] = useState<typeof MAP_EXPERTS[0] | null>(MAP_EXPERTS[0]);
  const [expertPositions, setExpertPositions] = useState(MAP_EXPERTS);
  const [radarLogs, setRadarLogs] = useState<string[]>([
    'Secure GPS tracking online.',
    `Matched coordinates to ${detectedLocation?.city || 'Addis Ababa'} base.`,
    'Found 4 verified subject-matter experts near you.'
  ]);

  // Map coordinate movement simulation to mimic cars on a map!
  useEffect(() => {
    const interval = setInterval(() => {
      setExpertPositions(prev =>
        prev.map(exp => {
          // Subtle drifting movement within bounds (+/- 1.2% offset)
          const deltaX = (Math.random() - 0.5) * 2;
          const deltaY = (Math.random() - 0.5) * 2;
          
          let newX = exp.initialX + deltaX;
          let newY = exp.initialY + deltaY;

          // Clip to sensible layout boundary
          if (newX < 10) newX = 10;
          if (newX > 90) newX = 90;
          if (newY < 10) newY = 10;
          if (newY > 90) newY = 90;

          return {
            ...exp,
            initialX: Number(newX.toFixed(2)),
            initialY: Number(newY.toFixed(2))
          };
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Update selected expert coordinates live so connection line updates seamlessly
  useEffect(() => {
    if (selectedMapExpert) {
      const liveData = expertPositions.find(e => e.id === selectedMapExpert.id);
      if (liveData) {
        setSelectedMapExpert(liveData);
      }
    }
  }, [expertPositions]);

  // Log events simulation
  useEffect(() => {
    const logsPool = [
      'Eng. Biruk updated CAD tolerance models.',
      'Almaz D. completed Python algorithm walkthrough.',
      'Dr. Sarah finished peer review draft delivery.',
      'New secure student request logged from local hub.',
      'Specialist ping frequency: 2.4GHz - Status: Healthy',
      'Telemetry audit completed: 100% data isolated and safe.'
    ];

    const logInterval = setInterval(() => {
      const randomLog = logsPool[Math.floor(Math.random() * logsPool.length)];
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setRadarLogs(prev => [`[${timestamp}] ${randomLog}`, ...prev.slice(0, 4)]);
    }, 7000);

    return () => clearInterval(logInterval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      await fallbackDb.postContactMessage({ name, email, subject, message });

      setSubmitStatus('success');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error('Contact submission failed:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#0F172A] text-slate-100 min-h-[90vh] font-sans px-4 sm:px-6 lg:px-8 py-8 sm:py-12" id="contact-container">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Block */}
        <div className="text-center space-y-3">
          <span className="text-amber-500 text-[10px] sm:text-xs font-bold tracking-widest uppercase">Coordinates Lock Active</span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">Connect with Coordinators & Experts</h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
            Submit a direct confidential inquiry or monitor matching specialists active in your vicinity in real-time.
          </p>
          
          {/* Custom Navigation Tabs */}
          <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl mt-4">
            <button
              onClick={() => setActiveTab('radar')}
              className={`px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'radar'
                  ? 'bg-amber-500 text-[#0F172A] shadow-lg shadow-amber-500/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="h-4 w-4" />
              <span>Live Specialist Radar (Uber-Style)</span>
            </button>
            <button
              onClick={() => setActiveTab('form')}
              className={`px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'form'
                  ? 'bg-amber-500 text-[#0F172A] shadow-lg shadow-amber-500/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="h-4 w-4" />
              <span>Send Secure Inquiry Message</span>
            </button>
          </div>
        </div>

        {/* Content Area according to Active Tab */}
        {activeTab === 'radar' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200" id="live-radar-section">
            
            {/* 1. MAP CANVAS FRAME (Left column, 7 spans) */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col min-h-[420px] sm:min-h-[500px]">
              
              {/* Map Header details */}
              <div className="bg-slate-950 p-4 border-b border-slate-850 flex flex-wrap justify-between items-center gap-3 relative z-10">
                <div className="flex items-center space-x-2.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <div>
                    <span className="block text-xs font-extrabold text-white font-mono uppercase tracking-wider">ACE DISPATCH SYSTEM</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Center GPS: {detectedLocation?.city || 'Addis Ababa'}, {detectedLocation?.country || 'Ethiopia'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 font-mono text-[9px] sm:text-xs">
                  <span className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-1 rounded">
                    Active Specialists Online: <strong>4</strong>
                  </span>
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded">
                    GPS Locked
                  </span>
                </div>
              </div>

              {/* DYNAMIC VISUAL GRID (THE MAP) */}
              <div className="flex-grow bg-[#0c101c] relative overflow-hidden select-none" style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1.2px)', backgroundSize: '24px_24px' }}>
                
                {/* Radar Sweeper Wave */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-[300px] h-[300px] border border-amber-500/5 rounded-full animate-ping opacity-25"></div>
                  <div className="w-[450px] h-[450px] border border-amber-500/10 rounded-full animate-pulse opacity-20"></div>
                  <div className="w-[150px] h-[150px] border border-slate-800 rounded-full opacity-30"></div>
                </div>

                {/* Grid Coordinates Labels */}
                <span className="absolute top-2 left-3 font-mono text-[8px] text-slate-600">N 9° 1' 48"</span>
                <span className="absolute bottom-2 right-3 font-mono text-[8px] text-slate-600">E 38° 44' 24"</span>

                {/* SVG connection path (Uber matched connection line) */}
                {selectedMapExpert && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    <line
                      x1="50%"
                      y1="50%"
                      x2={`${selectedMapExpert.initialX}%`}
                      y2={`${selectedMapExpert.initialY}%`}
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeDasharray="6,4"
                      className="animate-dash"
                      style={{ opacity: 0.6 }}
                    />
                  </svg>
                )}

                {/* USER LOCATION (CENTERED ANCHOR PIN) */}
                <div 
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center group cursor-pointer"
                  title="Your location (GPS-estimated from IP)"
                >
                  <div className="bg-amber-500 text-slate-950 p-2 rounded-full shadow-lg border-2 border-white animate-pulse relative">
                    <MapPin className="h-5 w-5 font-bold" />
                    <span className="absolute -inset-2 rounded-full border border-amber-500 animate-ping opacity-75"></span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 text-[10px] text-white py-0.5 px-2 rounded mt-1.5 font-bold whitespace-nowrap shadow-md">
                    You ({detectedLocation?.city || 'Addis Ababa'})
                  </div>
                  <span className="text-[8px] text-slate-500 font-mono">{detectedLocation?.ip || 'Local Gateway'}</span>
                </div>

                {/* ACTIVE SPECIALISTS PIN NODES */}
                {expertPositions.map((exp) => {
                  const isSelected = selectedMapExpert?.id === exp.id;
                  return (
                    <div
                      key={exp.id}
                      onClick={() => setSelectedMapExpert(exp)}
                      className="absolute z-10 cursor-pointer flex flex-col items-center group transition-all duration-300"
                      style={{
                        left: `${exp.initialX}%`,
                        top: `${exp.initialY}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      {/* Avatar with pulsing halo */}
                      <div className={`relative p-0.5 rounded-full border transition-all duration-300 ${
                        isSelected 
                          ? 'border-amber-500 scale-110 bg-amber-500/10 shadow-lg shadow-amber-500/20' 
                          : 'border-slate-700 hover:border-amber-400 bg-slate-900'
                      }`}>
                        <img
                          src={exp.avatar}
                          alt={exp.name}
                          referrerPolicy="no-referrer"
                          className="h-9 w-9 rounded-full object-cover"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 h-2.5 w-2.5 rounded-full border border-slate-950"></div>
                      </div>

                      {/* Floating Name Label */}
                      <div className={`py-0.5 px-2 rounded text-[9px] font-semibold mt-1 transition-all ${
                        isSelected 
                          ? 'bg-amber-500 text-slate-950 font-extrabold shadow' 
                          : 'bg-slate-950/85 text-slate-300 border border-slate-800'
                      }`}>
                        {exp.name} &bull; {exp.distance}
                      </div>
                    </div>
                  );
                })}

              </div>

              {/* LIVE EVENTS CONSOLE LOGGER (Simulates Dispatch center) */}
              <div className="bg-slate-950 p-3 sm:p-4 border-t border-slate-850">
                <div className="flex items-center space-x-2 mb-2">
                  <Radar className="h-3.5 w-3.5 text-amber-500 animate-spin" />
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">Telemetry & Event Log</span>
                </div>
                <div className="space-y-1 font-mono text-[9px] sm:text-xs text-slate-400 max-h-[70px] overflow-y-auto">
                  {radarLogs.map((log, lIdx) => (
                    <div key={lIdx} className="truncate flex items-center space-x-1.5">
                      <span className="text-emerald-500 shrink-0">&raquo;</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* 2. MATCH DETAILS SIDEBAR (Right column, 4 spans) */}
            <div className="lg:col-span-4 space-y-6">
              
              {selectedMapExpert ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-150">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full filter blur-xl"></div>
                  
                  {/* Expert Profile Details */}
                  <div className="flex items-start space-x-3 relative z-10">
                    <img
                      src={selectedMapExpert.avatar}
                      alt={selectedMapExpert.name}
                      referrerPolicy="no-referrer"
                      className="h-14 w-14 rounded-full object-cover border-2 border-amber-500"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <h3 className="text-base font-extrabold text-white">{selectedMapExpert.name}</h3>
                        <div className="bg-amber-500/10 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded">
                          ★ {selectedMapExpert.rating}
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 font-medium">{selectedMapExpert.specialty}</p>
                      <div className="flex items-center text-[10px] text-slate-400 space-x-1 pt-1">
                        <Navigation className="h-3 w-3 text-amber-500 shrink-0" />
                        <span>Distance: <strong>{selectedMapExpert.distance}</strong> near your gateway</span>
                      </div>
                    </div>
                  </div>

                  {/* Active solution metrics */}
                  <div className="space-y-3 pt-4 border-t border-slate-800/80">
                    <div>
                      <span className="block text-[10px] text-slate-500 font-mono uppercase">Current Assignment Task</span>
                      <p className="text-xs font-semibold text-slate-200">{selectedMapExpert.activeProject}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                        <span className="block text-[8px] text-slate-500 font-mono uppercase">Status</span>
                        <span className="text-[10px] text-emerald-400 font-bold">{selectedMapExpert.status}</span>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                        <span className="block text-[8px] text-slate-500 font-mono uppercase">Assign-Speed</span>
                        <span className="text-[10px] text-amber-400 font-bold">Under 15 Mins</span>
                      </div>
                    </div>
                  </div>

                  {/* Safety guarantees */}
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-850 space-y-2 text-xs font-light text-slate-400">
                    <div className="flex items-center space-x-2 text-white font-bold">
                      <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                      <span>Direct Gateway Matching</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      This expert is currently synchronized to your local coordinate hub timezone. Placing an order now locks this expert's schedule for immediate draft composition.
                    </p>
                  </div>

                  {/* Direct instant order booking button */}
                  <a
                    href="#order"
                    onClick={(e) => {
                      e.preventDefault();
                      // We can just trigger redirect to the order page!
                      // The order page handles the selection.
                      // Let's scroll or click the Navbar order CTA
                      const btn = document.getElementById('submit-order-btn') || document.querySelector('[href="#order"]') || document.querySelector('.bg-amber-500');
                      if (btn) {
                        (btn as HTMLElement).click();
                      } else {
                        window.location.reload();
                      }
                    }}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-xs sm:text-sm tracking-wide shadow-lg hover:shadow-amber-500/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Request Match with {selectedMapExpert.name.split(' ')[0]}</span>
                  </a>

                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3 shadow-2xl">
                  <Compass className="h-10 w-10 text-slate-500 mx-auto animate-pulse" />
                  <p className="text-sm text-slate-300 font-semibold">Select a Specialist on the Map</p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Click any glowing green expert node to view their active thesis files, ratings, and request instant coordinate matching.
                  </p>
                </div>
              )}

              {/* Info panel */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-300 font-mono flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-amber-500" />
                  <span>How Map Matching Works</span>
                </h4>
                <ul className="space-y-3.5 text-xs text-slate-400 font-light leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="bg-amber-500 text-slate-950 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                    <span><strong>IP Geo-Locate</strong> tracks coordinate networks automatically to find your timezone gateway.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-amber-500 text-slate-950 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                    <span><strong>Telemetry Systems</strong> query the nearest active experts in SolidWorks, R-Studio, coding, or writing.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-amber-500 text-slate-950 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                    <span><strong>Seamless Routing</strong> maps you directly, guaranteeing 15-minute handoffs and perfect ISO alignment.</span>
                  </li>
                </ul>
              </div>

            </div>

          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-5">
              
              {/* Information / Sidebar Panel */}
              <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 p-6 sm:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
                <div className="space-y-4 sm:space-y-6">
                  <span className="text-amber-500 text-[10px] sm:text-xs font-bold tracking-widest uppercase font-mono">Direct Desk Line</span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white">Get in Touch</h2>
                  <div className="h-1 w-12 bg-amber-500 rounded"></div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Have questions about pricing, special systems simulations, academic criteria guidelines, or custom bulk orders? Reach our coordinating desk directly.
                  </p>
                </div>

                <div className="mt-8 sm:mt-12 space-y-4 sm:space-y-6">
                  <div className="flex items-start space-x-3 text-xs sm:text-sm">
                    <Mail className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="block font-semibold text-white">Desk Email</span>
                      <span className="text-slate-300">desk@acescholar.com</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 text-xs sm:text-sm">
                    <MessageSquare className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="block font-semibold text-white">Coordinating Hub</span>
                      <span className="text-slate-300">Addis Ababa, Ethiopia</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 sm:mt-12 pt-6 border-t border-slate-800/60 text-[10px] sm:text-xs text-slate-400 font-mono flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span>Coordinators Active 24/7</span>
                </div>
              </div>

              {/* Contact Inquiry Form */}
              <div className="md:col-span-3 p-6 sm:p-10">
                {submitStatus === 'success' ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-8" id="contact-success-state">
                    <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="h-12 w-12" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">Inquiry Received Successfully</h3>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-sm">
                      Your message has been logged at our coordinating desk. A graduate counselor will reach you via email within 2 hours.
                    </p>
                    <button
                      onClick={() => setSubmitStatus('idle')}
                      className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" id="contact-form">
                    <div className="space-y-1">
                      <h3 className="text-base sm:text-lg font-bold text-white">Send an Inquiry</h3>
                      <p className="text-xs text-slate-400">All submissions are completely confidential.</p>
                    </div>

                    {submitStatus === 'error' && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center space-x-3 text-red-400 text-xs sm:text-sm">
                        <ShieldAlert className="h-5 w-5 shrink-0" />
                        <span>Failed to submit message. Please try again.</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-300">Your Full Name</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Jean-Pierre Laurent"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2 px-3 text-slate-100 text-xs sm:text-sm outline-none transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-300">Your Email Address</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. jp.laurent@sorbonne.fr"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2 px-3 text-slate-100 text-xs sm:text-sm outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300">Subject</label>
                      <input
                        type="text"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. Master's Thesis mechanical modeling quote"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2 px-3 text-slate-100 text-xs sm:text-sm outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300">Your Message / Requirements</label>
                      <textarea
                        required
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Detail your requirements, project guidelines, software tools (SolidWorks, MATLAB, etc.) or academic citation styles..."
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2 px-3 text-slate-100 text-xs sm:text-sm outline-none transition-colors resize-none"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-[#0F172A] font-bold py-2.5 sm:py-3 rounded-lg shadow-lg hover:shadow-amber-500/15 active:scale-95 transition-all text-xs sm:text-sm flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="animate-spin inline-block h-4 w-4 border-2 border-[#0F172A] border-t-transparent rounded-full mr-1"></span>
                          <span>Submitting Inquiry...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Submit Confidential Inquiry</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
