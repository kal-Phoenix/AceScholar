import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, FileText, Clock, AlertCircle, RefreshCw, Send, CheckCircle2, MessageSquare, Download, HelpCircle, GraduationCap, Check, X, Upload, Trash2, Paperclip } from 'lucide-react';
import { PageType, Profile, Order as AcademicOrder, Message } from '../types';
import { fallbackDb, getAuthHeaders } from '../lib/supabase';

interface DashboardProps {
  user: Profile | null;
  setCurrentPage: (page: PageType) => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
  setUser?: (user: Profile | null) => void;
}

export default function Dashboard({ user, setCurrentPage, showToast, setUser }: DashboardProps) {
  const [orders, setOrders] = useState<AcademicOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<AcademicOrder | null>(null);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  // Revision Request state
  const [revisionGuidelines, setRevisionGuidelines] = useState('');
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'chat' | 'specs' | 'payment'>('status');

  // Payment proof states
  const [paymentMethodType, setPaymentMethodType] = useState<'ethiopia' | 'crypto' | 'card'>('ethiopia');
  const [ethiopianBank, setEthiopianBank] = useState<'cbe' | 'telebirr' | 'boa'>('cbe');
  const [paymentScreenshot, setPaymentScreenshot] = useState('');
  const [paymentScreenshotName, setPaymentScreenshotName] = useState('');
  const [isSubmittingPaymentProof, setIsSubmittingPaymentProof] = useState(false);

  // Payment config from server (bank details, crypto addresses, etc.)
  const [paymentConfig, setPaymentConfig] = useState<any>(null);

  // Become an Expert Modal State
  const [showBecomeExpertModal, setShowBecomeExpertModal] = useState(false);
  const [isSubmittingExpert, setIsSubmittingExpert] = useState(false);
  const [expertQualification, setExpertQualification] = useState("Master's Degree");
  const [expertSubjects, setExpertSubjects] = useState<string[]>([]);
  const [expertWhatsapp, setExpertWhatsapp] = useState('');
  const [expertCountry, setExpertCountry] = useState('');
  const [expertProposal, setExpertProposal] = useState('');
  const [expertGpa, setExpertGpa] = useState('');
  const [expertDocuments, setExpertDocuments] = useState<Array<{ name: string; size?: number; type?: string; content?: string }>>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      filesArray.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setExpertDocuments(prev => [
            ...prev,
            {
              name: file.name,
              size: file.size,
              type: file.type,
              content: reader.result as string
            }
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeDocument = (index: number) => {
    setExpertDocuments(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files);
      filesArray.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setExpertDocuments(prev => [
            ...prev,
            {
              name: file.name,
              size: file.size,
              type: file.type,
              content: reader.result as string
            }
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const downloadBase64File = (base64OrUrl: string, fileName: string) => {
    try {
      const link = document.createElement('a');
      if (base64OrUrl.startsWith('data:') || base64OrUrl.startsWith('http')) {
        link.href = base64OrUrl;
      } else {
        // Assume raw base64, guess mime from filename extension
        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        const mimeMap: Record<string, string> = {
          pdf: 'application/pdf', doc: 'application/msword',
          docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          zip: 'application/zip', txt: 'text/plain',
          png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
        };
        const mime = mimeMap[ext] || 'application/octet-stream';
        link.href = `data:${mime};base64,${base64OrUrl}`;
      }
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const SUBJECT_OPTIONS = [
    'Computer Science & AI',
    'Engineering & CAD',
    'Advanced Mathematics',
    'Academic Writing & Literature',
    'STEM Problem Sets',
    'Business & Economics'
  ];

  useEffect(() => {
    if (user) {
      if (!expertWhatsapp) setExpertWhatsapp(user.whatsapp || '');
      if (!expertCountry) setExpertCountry(user.country || '');
    }
  }, [user]);

  // Fetch payment config from server
  useEffect(() => {
    fetch('/api/payments/config')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setPaymentConfig(data); })
      .catch(() => {});
  }, []);

  const handleBecomeExpertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!expertGpa.trim()) {
      if (showToast) showToast('Please enter your current or graduation GPA.', 'error');
      return;
    }
    if (!expertWhatsapp.trim()) {
      if (showToast) showToast('Please enter your WhatsApp number.', 'error');
      return;
    }
    if (!expertCountry.trim()) {
      if (showToast) showToast('Please enter your country of residence.', 'error');
      return;
    }
    if (expertDocuments.length === 0) {
      if (showToast) showToast('Please upload at least one academic document (degree transcript or certificates).', 'error');
      return;
    }
    if (!expertProposal.trim() || expertProposal.trim().length < 20) {
      if (showToast) showToast('Please write a statement of academic expertise (minimum 20 characters).', 'error');
      return;
    }

    setIsSubmittingExpert(true);
    try {
      const res = await fetch('/api/profiles/become-expert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          whatsapp: expertWhatsapp,
          country: expertCountry,
          qualification: expertQualification,
          subjects: expertSubjects,
          proposal: expertProposal,
          gpa: expertGpa,
          documents: expertDocuments
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to upgrade to academic expert.');
      }

      const data = await res.json();
      if (data.success && data.profile) {
        if (showToast) showToast('Congratulations! Your application has been submitted and is pending admin approval.', 'success');
        
        // Merge to preserve access_token (not returned by become-expert endpoint)
        const updatedProfile = { ...user, ...data.profile };
        if (setUser) {
          setUser(updatedProfile);
        } else {
          localStorage.setItem('ace_scholar_current_user', JSON.stringify(updatedProfile));
        }

        setShowBecomeExpertModal(false);
      } else {
        throw new Error('Invalid server response.');
      }
    } catch (err: any) {
      console.error('Error in become expert action:', err);
      if (showToast) showToast(err.message || 'Error occurred while registering as expert.', 'error');
    } finally {
      setIsSubmittingExpert(false);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchClientData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const ordersResult = await fallbackDb.getOrders(1, 500);
      const allOrders = ordersResult.data;
      
      // Filter orders by current user email (case insensitive) — null-safe
      const clientOrders = allOrders.filter(
        o => o.client_email && o.client_email.toLowerCase() === user.email.toLowerCase()
      );
      setOrders(clientOrders);
      
      // Keep selected order updated with latest fields if currently open
      if (selectedOrder) {
        const updatedSelected = clientOrders.find(o => o.id === selectedOrder.id);
        if (updatedSelected) setSelectedOrder(updatedSelected);
      }
    } catch (e) {
      console.error('[Dashboard] Error fetching client orders:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessagesForOrder = async (orderId: string) => {
    try {
      // Use order-specific endpoint to fetch only this order's messages (avoids fetching all)
      const thread = await fallbackDb.getMessagesByOrder(orderId);
      // Sort older to newer
      thread.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setMessages(thread);
    } catch (e) {
      console.error('Error fetching thread messages:', e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchClientData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedOrder) {
      fetchMessagesForOrder(selectedOrder.id);
      setActiveTab('status');
    }
  }, [selectedOrder]);

  // Live poll: refresh messages every 5 seconds so student sees expert replies
  useEffect(() => {
    if (!selectedOrder) return;
    const interval = setInterval(() => {
      fetchMessagesForOrder(selectedOrder.id);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedOrder?.id]);

  // Scroll to bottom of chat whenever messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const downloadDeliveryFile = (url: string, fileName: string) => {
    try {
      if (!url || url === '#') {
        if (showToast) showToast('Solution file is not yet available for download.', 'error');
        return;
      }

      // If it's a real URL (Supabase Storage or HTTPS), open/download directly
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'solution';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (showToast) showToast(`Downloading: ${fileName}`, 'success');
        return;
      }

      // Fallback: legacy base64 data URL support
      const parts = url.split(';base64,');
      const actualBase64 = parts.length > 1 ? parts[1] : parts[0];
      const mime = parts.length > 1 ? parts[0].replace('data:', '') : 'application/octet-stream';
      const binary = atob(actualBase64);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([array], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName || 'solution';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      if (showToast) showToast(`Downloading: ${fileName}`, 'success');
    } catch (err) {
      console.error('Download failed:', err);
      if (showToast) showToast('Failed to download file. Please try again.', 'error');
    }
  };

  const handlePostMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !selectedOrder || !user) return;

    setIsSendingMessage(true);
    try {
      const sent = await fallbackDb.postMessage({
        order_id: selectedOrder.id,
        sender_id: user.id,
        sender_name: user.full_name,
        content: typedMessage.trim(),
        is_admin: false,
      });

      if (sent) setMessages(prev => [...prev, sent]);
      setTypedMessage('');

    } catch (err) {
      console.error('Failed to send message:', err);
      if (showToast) showToast('Failed to deliver message.', 'error');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionGuidelines.trim() || !selectedOrder || !user) return;

    try {
      // Use targeted PUT endpoint for revision status update
      const updated = await fallbackDb.updateOrder(selectedOrder.id, {
        status: 'revision_requested',
        internal_notes: `Revision Requested on ${new Date().toLocaleDateString()}: ${revisionGuidelines.slice(0, 80)}...`
      });

      // 2. Post revision message to chat
      const sent = await fallbackDb.postMessage({
        order_id: selectedOrder.id,
        sender_id: user.id,
        sender_name: user.full_name,
        content: `⚠️ [REVISION REQUEST SUBMITTED] Guidelines: "${revisionGuidelines}"`,
        is_admin: false,
      });

      // Refresh frontend views
      if (updated) {
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updated : o));
        setSelectedOrder(updated);
      }
      if (sent) setMessages(prev => [...prev, sent]);

      setRevisionGuidelines('');
      setShowRevisionForm(false);
      if (showToast) showToast('Revision guidelines submitted to your specialist!', 'success');

    } catch (e) {
      console.error('Failed to submit revision:', e);
      if (showToast) showToast('Failed to submit revision guidelines.', 'error');
    }
  };

  const handlePaymentScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setPaymentScreenshotName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitPaymentProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !paymentScreenshot) {
      if (showToast) showToast('Please upload a payment proof screenshot/receipt.', 'error');
      return;
    }

    setIsSubmittingPaymentProof(true);
    try {
      // Upload screenshot to Supabase Storage first
      if (showToast) showToast('Uploading payment proof to secure storage...', 'success');
      const screenshotUrl = await fallbackDb.uploadFile(paymentScreenshot, paymentScreenshotName || 'payment-proof.png');
      if (!screenshotUrl) {
        throw new Error('Failed to upload payment screenshot to storage.');
      }

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { ...(await getAuthHeaders()), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: selectedOrder.id,
          payment_screenshot: screenshotUrl,
          payment_method_type: paymentMethodType
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to submit payment proof to backend.');
      }

      if (showToast) showToast('Payment proof submitted successfully! Awaiting coordinator approval.', 'success');

      // Post notification to chat
      const bankLabel = paymentMethodType === 'crypto'
        ? 'USDT/Bitcoin (Crypto)'
        : ethiopianBank === 'cbe' ? 'CBE (Commercial Bank of Ethiopia)'
        : ethiopianBank === 'telebirr' ? 'Telebirr Mobile Wallet'
        : 'BOA (Bank of Abyssinia)';
      await fallbackDb.postMessage({
        order_id: selectedOrder.id,
        sender_name: 'System Log',
        content: `📤 Client submitted payment screenshot proof via ${bankLabel}. Waiting for admin verification.`,
        is_admin: false,
      });

      // Clear states & Refresh
      setPaymentScreenshot('');
      setPaymentScreenshotName('');
      await fetchClientData();
    } catch (err: any) {
      console.error(err);
      if (showToast) showToast(err.message || 'Error occurred while submitting payment proof.', 'error');
    } finally {
      setIsSubmittingPaymentProof(false);
    }
  };

  const getStatusBadge = (status: AcademicOrder['status']) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Complete & Delivered
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Clock className="w-3 h-3 mr-1 animate-pulse" />
            Specialist Writing
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Under Internal QA review
          </span>
        );
      case 'revision_requested':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
            <Clock className="w-3 h-3 mr-1" />
            Revision Pending
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">
            <HelpCircle className="w-3 h-3 mr-1" />
            Reviewing Prompt Spec
          </span>
        );
    }
  };

  if (!user) {
    return (
      <div className="bg-[#0F172A] text-slate-100 min-h-[85vh] flex items-center justify-center font-sans px-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-xl">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Access Restricted</h2>
          <p className="text-xs sm:text-sm text-slate-300">
            You must be signed in to view your assignment progress dashboard, download complete deliveries, or chat with experts.
          </p>
          <button
            onClick={() => setCurrentPage('login')}
            className="w-full bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-bold py-2.5 rounded-lg text-xs sm:text-sm transition-all shadow-md cursor-pointer"
          >
            Sign In with Credentials
          </button>
        </div>
      </div>
    );
  }

  // Count metrics
  const totalCount = orders.length;
  const activeCount = orders.filter(o => o.status === 'in_progress' || o.status === 'under_review').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const revisionCount = orders.filter(o => o.status === 'revision_requested').length;

  return (
    <div className="bg-[#0F172A] text-slate-100 font-sans" id="dashboard-root">
      
      {/* 1. HEADER HERO BANNER */}
      <header className="bg-gradient-to-b from-[#0F172A] to-[#1E293B] border-b border-slate-800 py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl xl:max-w-[90%] 2xl:max-w-[95%] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <LayoutDashboard className="h-5 w-5 text-amber-500" />
              <span className="text-xs font-bold text-amber-500 tracking-wider uppercase font-mono">My Account Area</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user.full_name}!
            </h1>
            <p className="text-xs text-slate-400 max-w-xl">
              Track active projects, request structural revisions, or converse directly with coordinating desks and specialists.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
            {user.role === 'expert' ? (
              <button
                onClick={() => setCurrentPage('expert')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-lg text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <GraduationCap className="h-4 w-4" />
                <span>Go to Expert Workspace</span>
              </button>
            ) : user.expert_status === 'pending' ? (
              <button
                disabled
                className="bg-slate-800 text-slate-400 font-semibold py-2.5 px-5 rounded-lg text-xs sm:text-sm border border-slate-700/50 flex items-center justify-center space-x-1.5 cursor-not-allowed"
              >
                <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
                <span>Expert App Pending Approval</span>
              </button>
            ) : user.expert_status === 'rejected' ? (
              <button
                onClick={() => setShowBecomeExpertModal(true)}
                className="bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 font-semibold py-2.5 px-5 rounded-lg text-xs sm:text-sm border border-rose-800/40 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <GraduationCap className="h-4 w-4" />
                <span>Re-apply as Expert (Rejected)</span>
              </button>
            ) : (
              <button
                onClick={() => setShowBecomeExpertModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-lg text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <GraduationCap className="h-4 w-4" />
                <span>Become an Expert</span>
              </button>
            )}
            <button
              onClick={() => setCurrentPage('order')}
              className="bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-bold py-2.5 px-5 rounded-lg text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <FileText className="h-4 w-4" />
              <span>Submit New Project Specs</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. STATS OVERVIEW GRIDS */}
      <section className="max-w-7xl xl:max-w-[90%] 2xl:max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          <div className="bg-slate-900 border border-slate-800/80 p-4 sm:p-6 rounded-xl flex items-center space-x-4">
            <div className="p-2 sm:p-3 rounded-lg bg-amber-500/10 text-amber-400">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <span className="block text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Orders</span>
              <span className="text-lg sm:text-2xl font-black text-white">{totalCount}</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800/80 p-4 sm:p-6 rounded-xl flex items-center space-x-4">
            <div className="p-2 sm:p-3 rounded-lg bg-blue-500/10 text-blue-400">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 animate-pulse" />
            </div>
            <div>
              <span className="block text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider font-semibold">Active Writing</span>
              <span className="text-lg sm:text-2xl font-black text-white">{activeCount}</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800/80 p-4 sm:p-6 rounded-xl flex items-center space-x-4">
            <div className="p-2 sm:p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <span className="block text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider font-semibold">Solutions Delivered</span>
              <span className="text-lg sm:text-2xl font-black text-white">{deliveredCount}</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800/80 p-4 sm:p-6 rounded-xl flex items-center space-x-4">
            <div className="p-2 sm:p-3 rounded-lg bg-amber-500/10 text-amber-400 animate-pulse">
              <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <span className="block text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider font-semibold">In Revision</span>
              <span className="text-lg sm:text-2xl font-black text-white">{revisionCount}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MAIN DASHBOARD CONTENT AREA */}
      <main className="max-w-7xl xl:max-w-[90%] 2xl:max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="space-y-6">
          
          {/* Header row for list */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center space-x-2">
              <span>My Project Assignments</span>
              <span className="bg-slate-800 text-amber-400 font-mono text-xs px-2.5 py-0.5 rounded-md border border-slate-700/60">{orders.length}</span>
            </h2>
            <button 
              onClick={fetchClientData}
              title="Refresh order history"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-800 hover:border-slate-750 transition-all cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-20 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-3">
              <span className="animate-spin inline-block h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full"></span>
              <p className="text-xs text-slate-400 font-semibold tracking-wide">Synchronizing your academic portfolio...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-5 shadow-lg">
              <div className="p-4 bg-slate-950/60 text-slate-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto border border-slate-800/80">
                <FileText className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-white text-base sm:text-lg">No Assignments Placed</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-light">
                  You haven't submitted any academic prompts, computational models, or draft specs yet. Submit your first order to connect with top-tier specialists.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={() => setCurrentPage('order')}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-[#0F172A] text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center space-x-1.5"
                >
                  <FileText className="h-4 w-4" />
                  <span>Place Project Order Now</span>
                </button>
                {user.role === 'expert' ? (
                  <button
                    onClick={() => setCurrentPage('expert')}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center space-x-1.5"
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span>Go to Expert Workspace</span>
                  </button>
                ) : user.expert_status === 'pending' ? (
                  <button
                    disabled
                    className="px-5 py-2.5 bg-slate-800 text-slate-400 text-xs font-semibold rounded-lg border border-slate-700/50 inline-flex items-center justify-center space-x-1.5 cursor-not-allowed"
                  >
                    <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
                    <span>Application Pending</span>
                  </button>
                ) : user.expert_status === 'rejected' ? (
                  <button
                    onClick={() => setShowBecomeExpertModal(true)}
                    className="px-5 py-2.5 bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 text-xs font-semibold rounded-lg border border-rose-800/40 inline-flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span>Re-apply as Expert</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowBecomeExpertModal(true)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center space-x-1.5"
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span>Become an Expert</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {orders.map((o) => {
                const hoursLeft = (new Date(o.deadline).getTime() - Date.now()) / 3600000;
                const isUrgent = hoursLeft < 24 && o.status !== 'delivered';
                const hasScreenshots = (o.admin_screenshots?.length || 0) > 0;

                return (
                  <div
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    className={`bg-slate-900/80 hover:bg-slate-900 border hover:border-amber-500/40 p-5 rounded-2xl transition-all shadow-md flex flex-col justify-between space-y-4 cursor-pointer select-none group relative overflow-hidden ${
                      o.status === 'delivered' ? 'border-emerald-500/30' :
                      o.status === 'under_review' ? 'border-purple-500/30' :
                      o.status === 'in_progress' ? 'border-blue-500/20' :
                      isUrgent ? 'border-rose-500/30 animate-pulse' :
                      'border-slate-800/90'
                    }`}
                  >
                    {/* Status color accent bar */}
                    <div className={`absolute top-0 left-0 w-1 h-full rounded-l-2xl ${
                      o.status === 'delivered' ? 'bg-emerald-500' :
                      o.status === 'under_review' ? 'bg-purple-500' :
                      o.status === 'in_progress' ? 'bg-blue-500' :
                      isUrgent ? 'bg-rose-500' : 'bg-amber-500/30'
                    }`} />

                    <div className="space-y-3 pl-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold font-mono text-amber-500">{o.id}</span>
                        {getStatusBadge(o.status)}
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-snug line-clamp-2 group-hover:text-amber-400 transition-colors">
                          {o.subject}
                        </h4>
                        <p className="text-xs text-slate-400 font-light">{o.service_type}</p>
                      </div>

                      {hasScreenshots && (
                        <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg px-2 py-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                          <span className="text-[10px] font-bold text-purple-300">Admin preview ready — tap to view</span>
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                        <div>
                          <span className="block text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Level</span>
                          <span className="font-medium text-slate-300">{o.academic_level}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Deadline</span>
                          <span className={`font-mono font-medium ${isUrgent ? 'text-rose-400' : 'text-slate-300'}`}>
                            {new Date(o.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3.5 border-t border-slate-800/60 flex items-center justify-between gap-2 pl-2">
                      <span className="text-xs font-bold text-amber-400 font-mono bg-amber-400/5 px-2 py-1 rounded border border-amber-400/10 truncate">
                        {o.budget_range?.split('(')[0]?.trim() || o.budget_range}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedOrder(o); }}
                        className="bg-slate-800 hover:bg-slate-750 text-white font-bold py-1.5 px-3.5 rounded-lg text-xs transition-all active:scale-95 cursor-pointer flex items-center space-x-1 shrink-0"
                      >
                        <span>Open</span>
                        <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ACTIVE WORKSPACE OVERLAY MODAL */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onKeyDown={(e) => { if (e.key === 'Escape') setSelectedOrder(null); }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-6xl w-full h-[90vh] overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 flex flex-col">
            
            {/* Modal Header */}
            <header className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 shrink-0">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">{selectedOrder.id}</span>
                <div className="h-1.5 w-1.5 rounded-full bg-slate-700"></div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide truncate max-w-sm sm:max-w-md lg:max-w-lg">
                  {selectedOrder.subject}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer border border-transparent hover:border-slate-700"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </header>

            {/* Tab Navigation Menu */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/30 px-6 py-2 shrink-0">
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('status')}
                  className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
                    activeTab === 'status'
                      ? 'bg-amber-500 text-[#0F172A] shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  <span>1. Track Progress</span>
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 relative ${
                    activeTab === 'chat'
                      ? 'bg-amber-500 text-[#0F172A] shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>2. Chat with Admin</span>
                </button>
                <button
                  onClick={() => setActiveTab('specs')}
                  className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
                    activeTab === 'specs'
                      ? 'bg-amber-500 text-[#0F172A] shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>3. Project Specs</span>
                </button>
              </div>

            </div>

            {/* Modal Content - Dynamic Tab Rendering */}
            <div className="flex-1 overflow-hidden flex flex-col">
              
              {/* TAB 1: STATUS & ACTIONABLE TIMELINE */}
              {activeTab === 'status' && (
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 bg-slate-950/10">
                  
                  {/* Step-by-Step Interactive Progress Stepper */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono">Live Timeline Status</h4>
                      <span className="text-xs font-semibold text-slate-400">
                        Current Status: <span className="text-amber-400 font-bold">{
                          selectedOrder.status === 'delivered' ? 'Complete & Delivered' :
                          selectedOrder.status === 'under_review' ? 'In Quality Review' :
                          selectedOrder.status === 'revision_requested' ? 'Revision in Progress' :
                          selectedOrder.status === 'in_progress' ? 'In Expert Writing' :
                          'Reviewing Project Specs'
                        }</span>
                      </span>
                    </div>

                    {/* Highly polished Visual Timeline */}
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8">
                      {/* Desktop Horizontal Stepper */}
                      <div className="hidden md:flex items-center justify-between relative w-full">
                        {/* Connecting track line */}
                        <div className="absolute top-[18px] left-[5%] right-[5%] h-1 bg-slate-800 -z-0">
                          <div 
                            className="h-full bg-amber-500 transition-all duration-500"
                            style={{
                              width: 
                                selectedOrder.status === 'delivered' ? '100%' :
                                selectedOrder.status === 'under_review' ? '75%' :
                                selectedOrder.status === 'revision_requested' ? '55%' :
                                selectedOrder.status === 'in_progress' ? '50%' :
                                selectedOrder.payment_status === 'approved' ? '25%' : '0%'
                            }}
                          />
                        </div>

                        {/* Step 1: Placed */}
                        <div className="flex flex-col items-center text-center w-1/5 z-10">
                          <div className="h-10 w-10 rounded-full flex items-center justify-center bg-amber-500 text-[#0F172A] font-bold border-4 border-slate-900 transition-all">
                            <Check className="h-5 w-5 stroke-[3]" />
                          </div>
                          <span className="text-[11px] font-bold text-white mt-2.5">1. Order Placed</span>
                          <span className="text-[9px] text-slate-400 font-light mt-0.5">Specs accepted</span>
                        </div>

                        {/* Step 2: Payment */}
                        <div className="flex flex-col items-center text-center w-1/5 z-10">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold border-4 transition-all ${
                            selectedOrder.payment_status === 'approved'
                              ? 'bg-amber-500 text-[#0F172A] border-slate-900'
                              : 'bg-slate-900 text-slate-400 border-slate-800 animate-pulse'
                          }`}>
                            {selectedOrder.payment_status === 'approved' ? (
                              <Check className="h-5 w-5 stroke-[3]" />
                            ) : (
                              <span>2</span>
                            )}
                          </div>
                          <span className={`text-[11px] font-bold mt-2.5 ${selectedOrder.payment_status === 'approved' ? 'text-white' : 'text-slate-400'}`}>
                            2. Downpayment
                          </span>
                          <span className="text-[9px] text-slate-400 font-light mt-0.5">
                            {selectedOrder.payment_status === 'approved' ? 'Secured & verified' : 'Action required'}
                          </span>
                        </div>

                        {/* Step 3: Drafting */}
                        <div className="flex flex-col items-center text-center w-1/5 z-10">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold border-4 transition-all ${
                            selectedOrder.status === 'delivered'
                              ? 'bg-amber-500 text-[#0F172A] border-slate-900'
                              : selectedOrder.payment_status === 'approved'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/50 animate-pulse'
                              : 'bg-slate-900 text-slate-500 border-slate-800'
                          }`}>
                            {selectedOrder.status === 'delivered' ? (
                              <Check className="h-5 w-5 stroke-[3]" />
                            ) : (
                              <span>3</span>
                            )}
                          </div>
                          <span className={`text-[11px] font-bold mt-2.5 ${
                            selectedOrder.status === 'delivered' || selectedOrder.payment_status === 'approved'
                              ? 'text-white' : 'text-slate-500'
                          }`}>
                            3. Expert Writing
                          </span>
                          <span className="text-[9px] text-slate-400 font-light mt-0.5">
                            {selectedOrder.status === 'delivered' ? 'Drafting finished' : selectedOrder.payment_status === 'approved' ? 'In progress' : 'Awaiting payment'}
                          </span>
                        </div>

                        {/* Step 4: Quality Check */}
                        <div className="flex flex-col items-center text-center w-1/5 z-10">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold border-4 transition-all ${
                            selectedOrder.status === 'delivered'
                              ? 'bg-amber-500 text-[#0F172A] border-slate-900'
                              : selectedOrder.status === 'under_review'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/50 animate-pulse'
                              : 'bg-slate-900 text-slate-500 border-slate-800'
                          }`}>
                            {selectedOrder.status === 'delivered' ? (
                              <Check className="h-5 w-5 stroke-[3]" />
                            ) : (
                              <span>4</span>
                            )}
                          </div>
                          <span className={`text-[11px] font-bold mt-2.5 ${
                            selectedOrder.status === 'delivered' || selectedOrder.status === 'under_review'
                              ? 'text-white' : 'text-slate-500'
                          }`}>
                            4. Internal QA
                          </span>
                          <span className="text-[9px] text-slate-400 font-light mt-0.5">
                            {selectedOrder.status === 'delivered' ? 'Review complete' : selectedOrder.status === 'under_review' ? 'Under QA check' : 'Pending draft'}
                          </span>
                        </div>

                        {/* Step 5: Ready */}
                        <div className="flex flex-col items-center text-center w-1/5 z-10">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold border-4 transition-all ${
                            selectedOrder.status === 'delivered'
                              ? 'bg-emerald-500 text-[#0F172A] border-slate-900 shadow-lg shadow-emerald-500/20'
                              : 'bg-slate-900 text-slate-500 border-slate-800'
                          }`}>
                            {selectedOrder.status === 'delivered' ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <span>5</span>
                            )}
                          </div>
                          <span className={`text-[11px] font-bold mt-2.5 ${selectedOrder.status === 'delivered' ? 'text-emerald-400' : 'text-slate-500'}`}>
                            5. Delivered
                          </span>
                          <span className="text-[9px] text-slate-400 font-light mt-0.5">
                            {selectedOrder.status === 'delivered' ? 'Ready to download' : 'Awaiting review'}
                          </span>
                        </div>
                      </div>

                      {/* Mobile Vertical Stepper (extremely clear & readable) */}
                      <div className="md:hidden space-y-5">
                        <div className="flex items-start space-x-3">
                          <div className="mt-0.5 h-6 w-6 rounded-full flex items-center justify-center bg-amber-500 text-[#0F172A] font-bold text-xs shrink-0">
                            ✓
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-white">1. Order Placed & Specifications Accepted</span>
                            <span className="block text-[10px] text-slate-400">Your specifications are successfully cataloged in our portal.</span>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            selectedOrder.payment_status === 'approved'
                              ? 'bg-amber-500 text-[#0F172A]'
                              : 'bg-slate-800 text-slate-400 animate-pulse border border-slate-700'
                          }`}>
                            {selectedOrder.payment_status === 'approved' ? '✓' : '2'}
                          </div>
                          <div>
                            <span className={`block text-xs font-bold ${selectedOrder.payment_status === 'approved' ? 'text-white' : 'text-slate-400'}`}>
                              2. Upfront Downpayment Verification
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              {selectedOrder.payment_status === 'approved' ? 'Verified. Payment reconciled securely.' : 'Awaiting payment confirmation to trigger active drafting.'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            selectedOrder.status === 'delivered'
                              ? 'bg-amber-500 text-[#0F172A]'
                              : selectedOrder.payment_status === 'approved'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                              : 'bg-slate-800 text-slate-500'
                          }`}>
                            {selectedOrder.status === 'delivered' ? '✓' : '3'}
                          </div>
                          <div>
                            <span className={`block text-xs font-bold ${
                              selectedOrder.status === 'delivered' || selectedOrder.payment_status === 'approved' ? 'text-white' : 'text-slate-500'
                            }`}>
                              3. Expert Academic Writing
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              {selectedOrder.status === 'delivered' ? 'Drafting concluded.' : selectedOrder.payment_status === 'approved' ? 'Assigned and drafting in progress.' : 'Pending downpayment verification.'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            selectedOrder.status === 'delivered'
                              ? 'bg-amber-500 text-[#0F172A]'
                              : selectedOrder.status === 'under_review'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                              : 'bg-slate-800 text-slate-500'
                          }`}>
                            {selectedOrder.status === 'delivered' ? '✓' : '4'}
                          </div>
                          <div>
                            <span className={`block text-xs font-bold ${
                              selectedOrder.status === 'delivered' || selectedOrder.status === 'under_review' ? 'text-white' : 'text-slate-500'
                            }`}>
                              4. Internal Quality Assurance & Review
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              {selectedOrder.status === 'delivered' ? 'Verified by quality panel.' : selectedOrder.status === 'under_review' ? 'Checking for plagiarism, grammar and correctness specs.' : 'Scheduled after draft completion.'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            selectedOrder.status === 'delivered'
                              ? 'bg-emerald-500 text-[#0F172A]'
                              : 'bg-slate-800 text-slate-500'
                          }`}>
                            {selectedOrder.status === 'delivered' ? '✓' : '5'}
                          </div>
                          <div>
                            <span className={`block text-xs font-bold ${selectedOrder.status === 'delivered' ? 'text-emerald-400' : 'text-slate-500'}`}>
                              5. Solutions Released & Delivered
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              {selectedOrder.status === 'delivered' ? 'Clean file ready for instant secure download.' : 'Unreleased.'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACTION CARD FOR CURRENT PHASE */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono">Current Task Priority</h4>
                    
                    {/* Watermarked Preview Section */}
                    {selectedOrder.preview_url && selectedOrder.payment_status !== 'approved' && (
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                        <h5 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>Preview Model Draft Document</span>
                          <span className="bg-amber-500/10 text-amber-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-amber-500/20">Locked Preview</span>
                        </h5>
                        <p className="text-xs text-slate-400 font-light">
                          Your expert has uploaded a watermarked preview sample of the work. The full model answer will unlock for download immediately upon payment approval.
                        </p>

                        <div className="relative border border-slate-800 rounded-xl overflow-hidden bg-slate-950 p-6 flex flex-col items-center justify-center min-h-[180px]">
                          {/* Blur/Lock Overlay */}
                          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[6px] z-10 flex flex-col items-center justify-center text-center p-4">
                            <span className="bg-amber-500 text-slate-950 p-2 rounded-full mb-3 shadow-lg shadow-amber-500/20">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            </span>
                            <h6 className="text-sm font-black text-white">🔒 Preview Only — Locked</h6>
                            <p className="text-[11px] text-slate-400 max-w-xs mt-1 leading-normal">
                              Full document unlocked after payment verification.
                            </p>
                          </div>

                          {/* Watermarked sample visualization */}
                          <div className="w-full text-[10px] text-slate-600 font-mono select-none opacity-40 space-y-2 pointer-events-none">
                            <div className="text-center font-bold text-[14px] text-slate-500 tracking-widest uppercase">*** WATERMARKED PREVIEW ***</div>
                            <p>class AssignmentSolution &#123;</p>
                            <p className="pl-4">// Simulated proof preview matrices calculation</p>
                            <p className="pl-4">const matrixA = [[1.0, 0.5], [0.5, 2.2]];</p>
                            <p className="pl-4">const matrixB = [[0.8, 1.1], [2.1, 0.9]];</p>
                            <p className="pl-4">const result = MatrixMath.multiply(matrixA, matrixB);</p>
                            <p>&#125;</p>
                            <div className="text-center font-bold text-[14px] text-slate-500 tracking-widest uppercase">*** WATERMARKED PREVIEW ***</div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <span className="text-xs text-slate-400 font-mono">File: {selectedOrder.preview_name || "preview_sample.pdf"}</span>
                          <button
                            type="button"
                            onClick={() => downloadBase64File(selectedOrder.preview_url!, selectedOrder.preview_name || "preview")}
                            className="bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold py-1.5 px-4 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download Watermarked Sample</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Admin Review Screenshots — visible once admin uploads them */}
                    {(selectedOrder.admin_screenshots?.length || 0) > 0 && (
                      <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-5 sm:p-6 space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                          <h5 className="text-sm font-bold text-purple-200">Admin Review Previews</h5>
                          <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold uppercase">Ready</span>
                        </div>
                        <p className="text-xs text-slate-400 font-light leading-relaxed">
                          Our coordinator has reviewed the completed work and shared these preview screenshots for your approval. Please review them and proceed to payment to unlock the full final files.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {selectedOrder.admin_screenshots!.map((src, i) => (
                            <a key={i} href={src} target="_blank" rel="noopener noreferrer"
                              className="block rounded-xl overflow-hidden border border-slate-800 hover:border-purple-500 transition-colors">
                              <img src={src} alt={`Preview ${i + 1}`}
                                className="w-full h-28 object-cover" />
                            </a>
                          ))}
                        </div>
                        {selectedOrder.payment_awaiting && selectedOrder.payment_status !== 'approved' && (
                          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                            <p className="text-xs text-amber-300">Satisfied with the preview? Proceed to payment below to download the complete files.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pay Now Section — shown when admin screenshots exist OR invoice is active */}
                    {((selectedOrder.admin_screenshots?.length || 0) > 0 || selectedOrder.payment_awaiting) && selectedOrder.payment_status !== 'approved' && (
                      <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-6 sm:p-8 space-y-6">
                        <div className="flex items-start space-x-4 border-b border-slate-800/80 pb-4">
                          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl shrink-0">
                            <AlertCircle className="h-6 w-6" />
                          </div>
                          <div className="space-y-1">
                            <h5 className="text-base font-bold text-white">Action Required: Settle Final Invoice</h5>
                            <p className="text-xs text-slate-300 leading-relaxed font-light">
                              An invoice has been requested for your academic deliverable. Complete your payment using Bank Transfer or Crypto to unlock the full document download.
                            </p>
                          </div>
                        </div>

                        {/* Real-time Invoice Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                          <div>
                            <span className="block text-[10px] text-slate-500 uppercase font-mono">Invoice Amount</span>
                            <span className="text-lg font-black text-white font-mono">
                              ${selectedOrder.agreed_price || selectedOrder.total_amount || 100} USD
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-500 uppercase font-mono">Payment Status</span>
                            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                              {selectedOrder.payment_status || 'Pending Payment'}
                            </span>
                          </div>
                        </div>

                        {selectedOrder.payment_status === 'pending' && selectedOrder.payment_screenshot ? (
                          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-2">
                            <span className="animate-spin inline-block h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full font-bold"></span>
                            <h6 className="text-xs font-bold text-slate-300">Payment Verification in Progress</h6>
                            <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-normal">
                              Your submitted payment proof screenshot is being validated by the coordinator desk. The model answer files will unlock instantly upon approval.
                            </p>
                          </div>
                        ) : (
                          <form onSubmit={handleSubmitPaymentProof} className="space-y-5">
                            {/* Payment Method Selector */}
                            <div className="space-y-2">
                              <label className="block text-xs font-bold text-slate-400 uppercase">Select Payment Method</label>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPaymentMethodType('ethiopia');
                                    setEthiopianBank('cbe');
                                  }}
                                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                                    paymentMethodType === 'ethiopia' && ethiopianBank === 'cbe'
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500'
                                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  CBE
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPaymentMethodType('ethiopia');
                                    setEthiopianBank('telebirr');
                                  }}
                                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                                    paymentMethodType === 'ethiopia' && ethiopianBank === 'telebirr'
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500'
                                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  Telebirr
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPaymentMethodType('ethiopia');
                                    setEthiopianBank('boa');
                                  }}
                                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                                    paymentMethodType === 'ethiopia' && ethiopianBank === 'boa'
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500'
                                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  BOA
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPaymentMethodType('crypto');
                                  }}
                                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                    paymentMethodType === 'crypto'
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500'
                                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  Crypto
                                  <span className="bg-emerald-500 text-slate-950 font-mono text-[9px] px-1 py-0.5 rounded font-extrabold">-5%</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPaymentMethodType('card');
                                  }}
                                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                                    paymentMethodType === 'card'
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500'
                                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  Card
                                </button>
                              </div>
                            </div>

                            {/* Instructions panel — values from server config */}
                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4 text-xs">
                              {paymentMethodType === 'ethiopia' && ethiopianBank === 'cbe' && paymentConfig?.ethiopia?.cbe && (
                                <div className="space-y-3">
                                  <h6 className="font-bold text-white uppercase tracking-wider text-[10px]">Commercial Bank of Ethiopia (CBE)</h6>
                                  <div className="bg-slate-900 p-3 rounded-xl border border-amber-500/30 space-y-1 font-mono">
                                    <span className="block text-slate-400 text-[9px] uppercase font-bold">CBE Account Number</span>
                                    <div className="flex items-center justify-between gap-2">
                                      <strong className="text-white text-sm select-all tracking-widest font-bold">{paymentConfig.ethiopia.cbe.accountNumber}</strong>
                                      <span className="text-[9px] text-slate-500">Account No.</span>
                                    </div>
                                    <span className="block text-slate-400 text-[9px] mt-1">Account Name: <span className="text-white font-semibold">{paymentConfig.ethiopia.cbe.accountName}</span></span>
                                  </div>
                                </div>
                              )}

                              {paymentMethodType === 'ethiopia' && ethiopianBank === 'telebirr' && paymentConfig?.ethiopia?.telebirr && (
                                <div className="space-y-3">
                                  <h6 className="font-bold text-white uppercase tracking-wider text-[10px]">Telebirr Mobile Wallet</h6>
                                  <div className="bg-slate-900 p-3 rounded-xl border border-amber-500/30 space-y-1 font-mono">
                                    <span className="block text-slate-400 text-[9px] uppercase font-bold">Telebirr Wallet Number</span>
                                    <div className="flex items-center justify-between gap-2">
                                      <strong className="text-white text-sm select-all tracking-widest font-bold">{paymentConfig.ethiopia.telebirr.number}</strong>
                                      <span className="text-[9px] text-slate-500">Phone No.</span>
                                    </div>
                                    <span className="block text-slate-400 text-[9px] mt-1">Registered Name: <span className="text-white font-semibold">{paymentConfig.ethiopia.telebirr.name}</span></span>
                                  </div>
                                </div>
                              )}

                              {paymentMethodType === 'ethiopia' && ethiopianBank === 'boa' && paymentConfig?.ethiopia?.boa && (
                                <div className="space-y-3">
                                  <h6 className="font-bold text-white uppercase tracking-wider text-[10px]">Bank of Abyssinia (BOA)</h6>
                                  <div className="bg-slate-900 p-3 rounded-xl border border-amber-500/30 space-y-1 font-mono">
                                    <span className="block text-slate-400 text-[9px] uppercase font-bold">BOA Account Number</span>
                                    <div className="flex items-center justify-between gap-2">
                                      <strong className="text-white text-sm select-all tracking-widest font-bold">{paymentConfig.ethiopia.boa.accountNumber}</strong>
                                      <span className="text-[9px] text-slate-500">Account No.</span>
                                    </div>
                                    <span className="block text-slate-400 text-[9px] mt-1">Account Name: <span className="text-white font-semibold">{paymentConfig.ethiopia.boa.accountName}</span></span>
                                  </div>
                                </div>
                              )}

                              {paymentMethodType === 'crypto' && paymentConfig?.crypto && (
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <h6 className="font-bold text-white uppercase tracking-wider text-[10px]">Crypto Payment Instructions</h6>
                                    <span className="bg-emerald-500 text-slate-950 font-bold font-mono text-[9px] px-2 py-0.5 rounded uppercase">{paymentConfig.crypto.discountPercent}% Discount Applied</span>
                                  </div>
                                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 flex justify-between items-center">
                                    <div>
                                      <span className="block text-slate-500 text-[9px]">Calculated Price ({paymentConfig.crypto.discountPercent}% Off)</span>
                                      <strong className="text-emerald-400 font-mono text-base">
                                        ${((selectedOrder.agreed_price || selectedOrder.total_amount || 100) * (1 - paymentConfig.crypto.discountPercent / 100)).toFixed(2)} USD
                                      </strong>
                                    </div>
                                    <div className="text-right">
                                      <span className="block text-slate-500 text-[9px]">Save Amount</span>
                                      <strong className="text-slate-300 font-mono">
                                        ${((selectedOrder.agreed_price || selectedOrder.total_amount || 100) * (paymentConfig.crypto.discountPercent / 100)).toFixed(2)} USD
                                      </strong>
                                    </div>
                                  </div>
                                  <p className="text-slate-300 leading-relaxed font-light mt-1">
                                    Send the discounted amount to one of our verified crypto addresses below:
                                  </p>
                                  <div className="space-y-2 font-mono">
                                    {paymentConfig.crypto.assets?.map((asset: any) =>
                                      asset.networks.map((network: any) => (
                                        <div key={`${asset.id}-${network.name}`} className="bg-slate-900 p-2.5 rounded border border-slate-800/80 flex items-center justify-between gap-2">
                                          <div className="min-w-0 flex-1">
                                            <span className="block text-slate-500 text-[9px]">{asset.icon || ''} {asset.name} ({asset.symbol}) — {network.name}</span>
                                            <strong className="text-white text-[11px] truncate block select-all">{network.address}</strong>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              )}

                              {paymentMethodType === 'card' && paymentConfig?.card && (
                                <div className="space-y-3">
                                  <h6 className="font-bold text-white uppercase tracking-wider text-[10px]">Credit / Debit Card Transfer</h6>
                                  <p className="text-slate-300 leading-relaxed font-light">
                                    Copy the card details below and complete the transfer from your banking app:
                                  </p>
                                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800/80 space-y-2 font-mono">
                                    <div>
                                      <span className="block text-slate-500 text-[9px]">Card Number</span>
                                      <strong className="text-white text-sm select-all tracking-wider">{paymentConfig.card.cardNumber}</strong>
                                    </div>
                                    <div>
                                      <span className="block text-slate-500 text-[9px]">Card Holder</span>
                                      <strong className="text-white text-xs">{paymentConfig.card.holderName}</strong>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/15 rounded-lg p-2.5">
                                <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-amber-300 leading-relaxed">
                                  After completing your transfer, take a clear screenshot of the confirmation and upload it below. Your files unlock instantly after admin verification.
                                </p>
                              </div>
                            </div>

                            {/* Screenshot Upload field */}
                            <div className="space-y-2">
                              <label className="block text-xs font-bold text-slate-400 uppercase">Upload Payment Screenshot Receipt / Transaction Hash</label>
                              <div className="flex gap-3 items-end">
                                <input
                                  type="file"
                                  accept="image/*"
                                  required
                                  onChange={handlePaymentScreenshotChange}
                                  className="hidden"
                                  id="payment-proof-upload"
                                />
                                <label
                                  htmlFor="payment-proof-upload"
                                  className="flex-1 bg-slate-950 border border-slate-800 hover:border-amber-500 rounded-xl py-3 px-4 text-slate-400 hover:text-white text-xs transition-all cursor-pointer flex items-center justify-between"
                                >
                                  <span>{paymentScreenshotName || 'Choose file...'}</span>
                                  <Upload className="h-4 w-4" />
                                </label>

                                <button
                                  type="submit"
                                  disabled={isSubmittingPaymentProof || !paymentScreenshot}
                                  className="bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-[#0F172A] font-extrabold px-5 py-3 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                                >
                                  {isSubmittingPaymentProof ? 'Submitting...' : 'Submit Proof'}
                                </button>
                              </div>
                            </div>
                          </form>
                        )}
                      </div>
                    )}

                    {/* Paid but Drafting Stage Action Banner */}
                    {selectedOrder.payment_status === 'approved' && selectedOrder.status !== 'delivered' && (
                      <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/5 border border-blue-500/20 rounded-2xl p-6 sm:p-8 space-y-4">
                        <div className="flex items-start space-x-4">
                          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl shrink-0">
                            <Clock className="h-6 w-6 animate-pulse" />
                          </div>
                          <div className="space-y-1.5">
                            <h5 className="text-base font-bold text-white">Project Under Active Production</h5>
                            <p className="text-xs text-slate-300 leading-relaxed font-light">
                              Your payment is fully authorized and settled. Your expert specialist is actively preparing the mathematical proofs, software specifications, or draft models in absolute compliance with instructions.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-xs">
                          <div>
                            <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">Estimated Delivery Schedule</span>
                            <span className="text-white font-mono font-medium block mt-0.5">
                              {new Date(selectedOrder.deadline).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                          <div>
                            <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">Assigned Coordinator Desk</span>
                            <span className="text-amber-400 font-medium block mt-0.5">Academic Specialist Panel (Direct-Sync)</span>
                          </div>
                        </div>

                        <div className="pt-2">
                          <button 
                            onClick={() => setActiveTab('chat')}
                            className="bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-extrabold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center space-x-2"
                          >
                            <MessageSquare className="h-4 w-4" />
                            <span>Discuss Draft Details with Writer</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Delivered Stage Action Banner */}
                    {selectedOrder.status === 'delivered' && (
                      <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-6 sm:p-8 space-y-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start space-x-4">
                            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0">
                              <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div className="space-y-1.5">
                              <h5 className="text-base font-bold text-white">✓ Your Academic Deliverables are Ready!</h5>
                              <p className="text-xs text-slate-300 leading-relaxed font-light">
                                High-fidelity calculations, source reference drafts, and specification sheets have been reviewed by our quality control board and released securely.
                              </p>
                            </div>
                          </div>
                          <span className="hidden sm:inline-block bg-emerald-500 text-[#0F172A] text-[9px] font-extrabold px-2.5 py-1 rounded-md uppercase font-mono tracking-wider shrink-0">
                            Passed QA Review
                          </span>
                        </div>

                        {/* Payment Gate: block download until delivery_released === true */}
                        {!selectedOrder.delivery_released ? (
                          <div className="bg-rose-500/8 border border-rose-500/25 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-8a4 4 0 100-8 4 4 0 000 8zm0 0v1" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2h2" />
                              </svg>
                            </div>
                            <div className="space-y-1 flex-1">
                              <h5 className="text-sm font-bold text-rose-300">Solutions File Locked</h5>
                              <p className="text-xs text-slate-400 leading-relaxed">
                                Your model solution is ready, but the file download is locked until payment verification is approved by our coordinators.
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono mt-1">
                                Verification Status: <span className="text-amber-400 font-bold uppercase">{selectedOrder.payment_status || 'awaiting proof'}</span>
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-950/75 border border-slate-800 p-4 rounded-xl shadow-inner">
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="p-2.5 bg-emerald-500/15 text-emerald-400 rounded-lg">
                                <Download className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <span className="block text-slate-500 text-[9px] uppercase font-mono tracking-wider">Final Solution Asset</span>
                                <span className="text-white text-xs sm:text-sm font-bold font-mono truncate block">{selectedOrder.delivery_name || 'academic_solutions_package.zip'}</span>
                              </div>
                            </div>

                            <button
                              onClick={() => downloadDeliveryFile(
                                selectedOrder.delivery_url || '',
                                selectedOrder.delivery_name || 'solution'
                              )}
                              className="bg-emerald-500 hover:bg-emerald-400 text-[#0F172A] font-extrabold py-2.5 px-6 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition-colors cursor-pointer shrink-0"
                            >
                              <Download className="h-4 w-4" />
                              <span>Download Solution</span>
                            </button>
                          </div>
                        )}

                        {/* Inline revision tools */}
                        <div className="pt-2 border-t border-slate-800/60">
                          {!showRevisionForm ? (
                            <div className="flex justify-between items-center text-xs text-slate-400">
                              <span>Are further calculations or adjustments needed?</span>
                              <button
                                onClick={() => setShowRevisionForm(true)}
                                className="text-amber-400 hover:text-amber-300 font-bold underline transition-all cursor-pointer"
                              >
                                Request Free Project Revision
                              </button>
                            </div>
                          ) : (
                            <form onSubmit={handleRequestRevision} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-4 animate-in slide-in-from-top-2 duration-150">
                              <div className="space-y-1">
                                <h6 className="text-xs font-bold text-white">Revision Instructions Guidelines</h6>
                                <p className="text-[11px] text-slate-400">Specify exactly which mathematical formulas, software classes, or paragraphs require tuning.</p>
                              </div>
                              <textarea
                                required
                                rows={3}
                                value={revisionGuidelines}
                                onChange={(e) => setRevisionGuidelines(e.target.value)}
                                placeholder="Example: In Section 3, please expand the regression variables description to utilize the LaTeX matrices style specified in guidelines..."
                                className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg py-2.5 px-3.5 text-white text-xs outline-none transition-colors resize-none font-light leading-relaxed"
                              ></textarea>
                              <div className="flex justify-end gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => setShowRevisionForm(false)}
                                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-400 rounded-lg text-xs transition-colors cursor-pointer"
                                >
                                  Close
                                </button>
                                <button
                                  type="submit"
                                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-bold rounded-lg text-xs transition-colors cursor-pointer"
                                >
                                  Submit Guidelines
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 2: SPECIALIST DIRECT CHAT */}
              {activeTab === 'chat' && (
                <div className="flex-1 overflow-hidden flex flex-col bg-slate-950/10">
                  {/* Chat Sub-Header */}
                  <div className="px-6 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/30 shrink-0">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Specialist Messaging Portal</span>
                    </div>
                    <span className="text-[10px] text-slate-400 flex items-center space-x-1 font-mono">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Connected with Graduate Writer Desk</span>
                    </span>
                  </div>

                  {/* Chat message threads */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col bg-slate-950/30">
                    {messages.length === 0 ? (
                      <div className="my-auto text-center space-y-3">
                        <MessageSquare className="h-10 w-10 text-slate-700 mx-auto" />
                        <p className="text-xs text-slate-500 leading-relaxed max-w-[280px] mx-auto">
                          No messages in this assignment workspace yet. Submit a message or query below to align specs directly with your writer.
                        </p>
                      </div>
                    ) : (
                      messages.map((m) => (
                        <div
                          key={m.id}
                          className={`flex flex-col max-w-[80%] rounded-2xl p-4 text-xs shadow-sm border ${
                            m.is_admin
                              ? 'bg-slate-800 text-slate-100 self-start border-slate-800'
                              : 'bg-amber-500/10 text-amber-100 border-amber-500/10 self-end'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4 text-[9px] font-bold text-slate-400 mb-1.5 font-mono">
                            <span className={m.is_admin ? 'text-amber-500' : 'text-slate-300'}>
                              {m.sender_name}
                            </span>
                            <span className="font-normal text-slate-500">
                              {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap font-light text-slate-200">{m.content}</p>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Chat Input form footer */}
                  <footer className="p-4 border-t border-slate-800 bg-slate-950/60 shrink-0">
                    <form onSubmit={handlePostMessage} className="flex gap-2.5 max-w-5xl mx-auto">
                      <input
                        type="text"
                        value={typedMessage}
                        onChange={(e) => setTypedMessage(e.target.value)}
                        placeholder="Ask your coordinator panel for status updates or upload instruction details..."
                        className="flex-1 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl py-3 px-4 text-white text-xs outline-none transition-colors placeholder:text-slate-500"
                      />
                      <button
                        type="submit"
                        disabled={isSendingMessage || !typedMessage.trim()}
                        className="bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/40 text-[#0F172A] px-5 rounded-xl transition-all cursor-pointer shrink-0 font-bold text-xs flex items-center justify-center space-x-1.5 hover:shadow-lg hover:shadow-amber-500/5 active:scale-95"
                      >
                        <span>Send</span>
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </footer>
                </div>
              )}

              {/* TAB 3: SPECIFICATIONS & REFERENCES */}
              {activeTab === 'specs' && (
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                  
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono">Assignment Blueprint Spec</h4>
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">Client Copy</span>
                  </div>

                  {/* Blueprint parameters list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl space-y-1">
                      <span className="block text-[9px] text-slate-500 uppercase font-bold tracking-wider">Service Project Category</span>
                      <span className="text-white text-sm font-semibold">{selectedOrder.service_type}</span>
                    </div>

                    <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl space-y-1">
                      <span className="block text-[9px] text-slate-500 uppercase font-bold tracking-wider">Academic Grade Level</span>
                      <span className="text-white text-sm font-semibold">{selectedOrder.academic_level}</span>
                    </div>

                    <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl space-y-1">
                      <span className="block text-[9px] text-slate-500 uppercase font-bold tracking-wider">Allocated Financial Budget</span>
                      <span className="text-amber-400 text-sm font-bold font-mono">{selectedOrder.budget_range}</span>
                    </div>

                    <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl space-y-1">
                      <span className="block text-[9px] text-slate-500 uppercase font-bold tracking-wider">Deadline Schedule</span>
                      <span className="text-white text-sm font-semibold font-mono">
                        {new Date(selectedOrder.deadline).toLocaleDateString([], {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Description Box */}
                  <div className="bg-slate-950/50 border border-slate-800 p-5 rounded-2xl space-y-2.5">
                    <span className="block text-[9px] text-slate-500 uppercase font-bold tracking-wider">Original Project Prompt SPEC</span>
                    <p className="text-slate-200 text-xs leading-relaxed font-light whitespace-pre-wrap max-h-60 overflow-y-auto pr-2">
                      {selectedOrder.description}
                    </p>
                  </div>

                  {/* Special Instructions & guidelines attachment */}
                  {(selectedOrder.special_instructions || selectedOrder.file_name) && (
                    <div className="border-t border-slate-800/60 pt-5 space-y-4">
                      {selectedOrder.special_instructions && (
                        <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl space-y-1.5">
                          <span className="block text-amber-400 text-[9px] uppercase font-bold tracking-wider">Special References & Software Specifications</span>
                          <p className="text-amber-300 font-light font-mono text-xs whitespace-pre-wrap leading-relaxed">{selectedOrder.special_instructions}</p>
                        </div>
                      )}

                      {selectedOrder.file_name && (
                        <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/30 border border-slate-800 p-3 rounded-xl w-full">
                          <div className="flex items-center space-x-2 truncate">
                            <span className="font-semibold text-slate-500 shrink-0">Guidelines Attachment:</span>
                            <span className="text-slate-300 font-mono truncate max-w-[200px]">{selectedOrder.file_name}</span>
                          </div>
                          <button
                            onClick={() => downloadDeliveryFile(
                              selectedOrder.file_url || '',
                              selectedOrder.file_name || 'guidelines'
                            )}
                            className="text-[10px] text-amber-500 hover:text-amber-400 font-bold flex items-center space-x-1 hover:underline cursor-pointer bg-transparent border-none shrink-0"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download Input File</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* 4. BECOME AN EXPERT MODAL OVERLAY */}
      {showBecomeExpertModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col relative shadow-2xl animate-scale-in overflow-hidden">
            
            {/* Close button */}
            <button
              onClick={() => setShowBecomeExpertModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors z-10 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <form onSubmit={handleBecomeExpertSubmit} className="flex flex-col max-h-[90vh] overflow-hidden">
              
              {/* Sticky Header */}
              <div className="p-5 sm:p-6 pb-4 border-b border-slate-800 shrink-0 text-center bg-slate-900">
                <div className="bg-emerald-500/10 text-emerald-400 p-2.5 rounded-xl inline-flex items-center justify-center mb-2">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Become an Academic Expert</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed mt-1">
                  Join our elite specialist panel. Complete your registration to start receiving expert tasks, STEM prompts, and professional research contracts.
                </p>
              </div>

              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                
                {/* Qualification & GPA Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Highest Qualification
                    </label>
                    <select
                      value={expertQualification}
                      onChange={(e) => setExpertQualification(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-white text-xs outline-none transition-colors cursor-pointer"
                    >
                      <option value="Bachelor's Degree">Bachelor's Degree</option>
                      <option value="Master's Degree">Master's Degree</option>
                      <option value="PhD Candidate">PhD Candidate</option>
                      <option value="PhD / Doctorate">PhD / Doctorate</option>
                      <option value="Other Professional Certificate">Other Professional Certificate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Current / Graduation GPA
                    </label>
                    <input
                      type="text"
                      required
                      value={expertGpa}
                      onChange={(e) => setExpertGpa(e.target.value)}
                      placeholder="e.g. 3.85 / 4.0 or First Class"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-white text-xs outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Subjects Checklist */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Specialist Subject Areas (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {SUBJECT_OPTIONS.map((sub) => {
                      const isSelected = expertSubjects.includes(sub);
                      return (
                        <button
                          type="button"
                          key={sub}
                          onClick={() => {
                            if (isSelected) {
                              setExpertSubjects(expertSubjects.filter(s => s !== sub));
                            } else {
                              setExpertSubjects([...expertSubjects, sub]);
                            }
                          }}
                          className={`flex items-center space-x-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-semibold shadow-sm'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                            isSelected ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3.5]" />}
                          </div>
                          <span className="text-[11px] font-medium leading-tight truncate">{sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Contact and Country */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      WhatsApp Number
                    </label>
                    <input
                      type="text"
                      value={expertWhatsapp}
                      onChange={(e) => setExpertWhatsapp(e.target.value)}
                      placeholder="+1 555 123 4567"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-white text-xs outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Country of Residence
                    </label>
                    <input
                      type="text"
                      value={expertCountry}
                      onChange={(e) => setExpertCountry(e.target.value)}
                      placeholder="e.g. United Kingdom"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-white text-xs outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Supporting Academic Documents Uploader */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Supporting Academic Documents (Degrees, Transcripts, Certifications)
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border border-dashed rounded-xl p-3 text-center transition-colors ${
                      isDragging
                        ? 'border-emerald-500 bg-emerald-500/5'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-750'
                    }`}
                  >
                    <input
                      type="file"
                      id="expert-doc-upload"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="expert-doc-upload"
                      className="cursor-pointer flex flex-col items-center space-y-1.5"
                    >
                      <Upload className="h-5 w-5 text-slate-400" />
                      <div className="text-xs text-slate-300 font-medium">
                        Drag & drop academic certificates, or <span className="text-emerald-400 underline">browse files</span>
                      </div>
                      <span className="text-[9px] text-slate-500 block">PDF, Word, PNG, JPG, TXT</span>
                    </label>
                  </div>

                  {/* Attached Documents List */}
                  {expertDocuments.length > 0 && (
                    <div className="mt-2.5 space-y-1.5">
                      <span className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                        Attached Files ({expertDocuments.length})
                      </span>
                      <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                        {expertDocuments.map((doc, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-slate-950/60 border border-slate-800 p-2 rounded-xl text-xs"
                          >
                            <div className="flex items-center space-x-2 text-slate-300 min-w-0">
                              <Paperclip className="h-3 w-3 text-emerald-400 shrink-0" />
                              <span className="truncate font-mono text-[11px]">{doc.name}</span>
                              {doc.size && (
                                <span className="text-[9px] text-slate-500 shrink-0 font-mono">
                                  ({(doc.size / 1024).toFixed(1)} KB)
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeDocument(idx)}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Statement of Expertise / Proposal */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Statement of Academic Expertise (Min 20 chars)
                  </label>
                  <textarea
                    value={expertProposal}
                    onChange={(e) => setExpertProposal(e.target.value)}
                    placeholder="Describe your research experience, academic fields, software proficiencies (e.g., MATLAB, CAD, SPSS, LaTeX) or notable publications..."
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-white text-xs outline-none transition-colors resize-none"
                  />
                </div>

              </div>

              {/* Sticky Footer */}
              <div className="p-5 sm:p-6 border-t border-slate-800 bg-slate-900/60 shrink-0 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowBecomeExpertModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingExpert}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/40 text-white py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-md shadow-emerald-950/20 cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  {isSubmittingExpert ? (
                    <>
                      <span className="animate-spin inline-block h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full mr-1.5"></span>
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Submit Application</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
