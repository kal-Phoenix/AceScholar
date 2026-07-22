import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, FileText, Check, Trash2, Mail, Users, RefreshCw, Clock, Upload, Download, X, Sparkles, Paperclip, Coins, DollarSign, TrendingUp, Copy } from 'lucide-react';
import { PageType, Profile, Order as AcademicOrder, Message, ContactMessage, Payment } from '../types';
import { fallbackDb, getAuthHeaders } from '../lib/supabase';

interface AdminProps {
  user: Profile | null;
  setCurrentPage: (page: PageType) => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
}

export default function Admin({ user, setCurrentPage, showToast }: AdminProps) {
  const [orders, setOrders] = useState<AcademicOrder[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'messages' | 'applications' | 'payments'>('orders');
  const [applications, setApplications] = useState<any[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsSearch, setPaymentsSearch] = useState('');
  
  // Selected focus states
  const [selectedOrder, setSelectedOrder] = useState<AcademicOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Status/Specialist Edit States

  // Delivery simulation states
  const [deliveryFileName, setDeliveryFileName] = useState('');
  const [deliveryFileContent, setDeliveryFileContent] = useState('');
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);

  // New payment lifecycle states

  // Admin review screenshots state
  const [isUploadingScreenshots, setIsUploadingScreenshots] = useState(false);

  // Chat/Messaging Thread states
  const [messages, setMessages] = useState<Message[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchApplications = (allProfiles: Profile[]) => {
    const apps = allProfiles
      .filter(p => p.expert_status || p.expert_signup_at)
      .map(p => ({
        id: p.id,
        user_id: p.id,
        full_name: p.full_name,
        email: p.email,
        whatsapp: p.whatsapp || '',
        country: p.country || '',
        qualification: p.qualification || '',
        degree: p.qualification || '',
        gpa: p.gpa || '',
        subjects: p.subjects || [],
        subject: Array.isArray(p.subjects) ? p.subjects.join(', ') : (p.subjects || ''),
        proposal: p.expert_proposal || '',
        experience: p.expert_proposal || '',
        created_at: p.expert_signup_at || p.created_at,
        status: p.expert_status || 'pending',
        documents: p.expert_documents || []
      }));
    apps.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setApplications(apps);
  };

  const handleApproveApplication = async (app: any) => {
    try {
      const res = await fetch('/api/profiles/approve-expert', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: app.user_id, email: app.email })
      });
      if (!res.ok) {
        throw new Error('Failed to approve application on the backend');
      }

      if (showToast) showToast(`Successfully approved ${app.full_name} as an Academic Expert!`, 'success');
      await fetchAdminData();
    } catch (e) {
      console.error(e);
      if (showToast) showToast('Failed to approve expert application.', 'error');
    }
  };

  const handleRejectApplication = async (app: any) => {
    try {
      const res = await fetch('/api/profiles/reject-expert', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: app.user_id, email: app.email })
      });
      if (!res.ok) {
        throw new Error('Failed to reject application on the backend');
      }

      if (showToast) showToast(`Rejected application from ${app.full_name}.`, 'error');
      await fetchAdminData();
    } catch (e) {
      console.error(e);
      if (showToast) showToast('Failed to reject expert application.', 'error');
    }
  };

  const downloadBase64File = (base64Data: string, fileName: string, fileType?: string) => {
    try {
      if (!base64Data) {
        if (showToast) showToast('No file content found for download', 'error');
        return;
      }
      const parts = base64Data.split(';base64,');
      const actualBase64 = parts.length > 1 ? parts[1] : parts[0];
      const mime = fileType || (parts.length > 1 ? parts[0].split(':')[1].split(';')[0] : 'application/octet-stream');
      
      const binary = atob(actualBase64);
      const array = [];
      for (let i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
      }
      const blob = new Blob([new Uint8Array(array)], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (showToast) showToast(`Downloading: ${fileName}`, 'success');
    } catch (error) {
      console.error('Failed to download base64 file:', error);
      if (showToast) showToast(`Failed to parse file for ${fileName}`, 'error');
    }
  };

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [ordersResult, contactsResult, profilesResult, allPayments] = await Promise.all([
        fallbackDb.getOrders(1, 500),
        fallbackDb.getContactMessages(1, 500),
        fallbackDb.getProfiles(1, 500),
        fallbackDb.getPayments()
      ]);
      const allOrders = ordersResult.data;
      setOrders(allOrders);
      setContactMessages(contactsResult.data);
      // profiles updated from allProfiles
      setPayments(allPayments || []);
      fetchApplications(profilesResult.data);

      // Refresh currently selected order references
      if (selectedOrder) {
        const refreshedSelected = allOrders.find(o => o.id === selectedOrder.id);
        if (refreshedSelected) {
          setSelectedOrder(refreshedSelected);
          // refreshed order metadata synced
        }
      }
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessagesForOrder = async (orderId: string) => {
    try {
      const result = await fallbackDb.getMessages(1, 500);
      const allMessages = result.data;
      const thread = allMessages.filter(m => m.order_id === orderId);
      thread.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setMessages(thread);
    } catch (e) {
      console.error('Error fetching thread messages:', e);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (selectedOrder) {
      fetchMessagesForOrder(selectedOrder.id);
      // order metadata synced
    }
  }, [selectedOrder]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAcceptExpertApplicant = async (applicantEmail: string, applicantName: string) => {
    if (!selectedOrder) return;
    try {
      // Use targeted PUT endpoint instead of bulk sync
      const updatedOrder = await fallbackDb.updateOrder(selectedOrder.id, {
        assigned_to: applicantName,
        expert_accepted: true,
        status: 'in_progress',
      });

      if (updatedOrder) {
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updatedOrder : o));
        setSelectedOrder(updatedOrder);
      }

      // Post system notification to chat
      await fallbackDb.postMessage({
        order_id: selectedOrder.id,
        sender_name: 'Ace Scholar System',
        content: `🎉 Specialist allocated! ${applicantName} (${applicantEmail}) has been assigned. They are now starting your task!`,
        is_admin: true,
      });
      setMessages(prev => [...prev, {
        id: 'msg-' + Math.random().toString(36).substring(2, 9),
        order_id: selectedOrder.id,
        sender_name: 'Ace Scholar System',
        content: `🎉 Specialist allocated! ${applicantName} (${applicantEmail}) has been assigned.`,
        is_admin: true,
        created_at: new Date().toISOString()
      }]);

      if (showToast) showToast(`Specialist ${applicantName} accepted and allocated successfully!`, 'success');
    } catch (e) {
      console.error('Error accepting expert applicant:', e);
      if (showToast) showToast('Failed to allocate expert.', 'error');
    }
  };



  const handleDeliveryFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setDeliveryFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setDeliveryFileContent(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleReleaseDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !deliveryFileName.trim()) return;

    setIsSubmittingDelivery(true);
    try {
      const isAlreadyApproved = selectedOrder.payment_status === 'approved';
      // Update order status and delivery details via backend
      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          status: 'delivered',
          delivery_name: deliveryFileName,
          delivery_url: deliveryFileContent || undefined,
          delivery_released: isAlreadyApproved
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const updatedOrder = await res.json();

      // Notify client via message thread
      await fallbackDb.postMessage({
        order_id: selectedOrder.id,
        sender_name: 'Academic Coordinator Desk',
        sender_id: 'system',
        content: `🎉 [Academic Deliverable Uploaded] Final work file has been uploaded: "${deliveryFileName}". ` + 
                 (isAlreadyApproved ? "It is unlocked and ready for download!" : "It will be released immediately after payment verification."),
        is_admin: true,
      });

      // Local state sync
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, ...updatedOrder } : o));
      setSelectedOrder(prev => prev ? { ...prev, ...updatedOrder } : null);
      setDeliveryFileName('');
      setDeliveryFileContent('');
      
      if (showToast) showToast(isAlreadyApproved ? 'Academic solution delivered and released!' : 'Academic solution uploaded (staged hidden until payment)!', 'success');
      await fetchAdminData();
    } catch (err: any) {
      console.error(err);
      if (showToast) showToast(`Delivery submission failed: ${err.message}`, 'error');
    } finally {
      setIsSubmittingDelivery(false);
    }
  };


  /**
   * Approve or reject an Ethiopian bank transfer payment.
   * On approval, calls PUT /api/orders/:id with payment_status: 'approved'
   * which triggers the backend processPaymentRecord — enforcing the 10% admin cut.
   */
  const handleVerifyEthiopiaPayment = async (verdict: 'approved' | 'rejected') => {
    if (!selectedOrder) return;
    try {
      const updates: Record<string, any> = { payment_status: verdict };
      if (verdict === 'approved') {
        if (selectedOrder.expert_submission_url) {
          updates.status = 'delivered';
          updates.delivery_released = true;
          updates.delivery_url = selectedOrder.expert_submission_url;
          updates.delivery_name = selectedOrder.expert_submission_name || 'Solution_Deliverables';
        }
      }
      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const updatedOrder = await res.json();

      // Reflect locally without a full reload
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, ...updatedOrder } : o));
      setSelectedOrder(prev => prev ? { ...prev, ...updatedOrder } : null);

      // Notify client
      const noticeContent = verdict === 'approved'
        ? `✅ [Payment Confirmed] Your bank transfer has been verified and approved by our coordinator. Your order is now active and a specialist will begin work shortly.`
        : `❌ [Payment Rejected] Your bank transfer receipt could not be verified. Please re-submit your payment screenshot or contact support for assistance.`;

      await fallbackDb.postMessage({
        order_id: selectedOrder.id,
        sender_name: 'Academic Coordinator Desk',
        sender_id: 'system',
        content: noticeContent,
        is_admin: true,
      });

      if (showToast) showToast(
        verdict === 'approved' ? 'Payment approved — 10% admin cut recorded.' : 'Payment rejected and client notified.',
        verdict === 'approved' ? 'success' : 'error'
      );

      await fetchAdminData();
    } catch (e: any) {
      console.error('handleVerifyEthiopiaPayment error:', e);
      if (showToast) showToast(`Failed to ${verdict} payment: ${e.message}`, 'error');
    }
  };



  const handleUploadAdminScreenshots = async (files: FileList) => {
    if (!selectedOrder) return;
    setIsUploadingScreenshots(true);
    try {
      const newScreenshots: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Read file as base64 data URL for upload
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        // Upload to Supabase Storage and get public URL
        const url = await fallbackDb.uploadFile(base64, file.name);
        if (url) {
          newScreenshots.push(url);
        }
      }
      const combined = [...(selectedOrder.admin_screenshots || []), ...newScreenshots];

      // Use targeted PUT instead of syncing all orders
      const updatedOrder = await fallbackDb.updateOrder(selectedOrder.id, { admin_screenshots: combined });
      if (updatedOrder) {
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updatedOrder : o));
        setSelectedOrder(updatedOrder);
      }
      if (showToast) showToast(`${newScreenshots.length} screenshot(s) uploaded for student preview!`, 'success');
    } catch (e) {
      console.error(e);
      if (showToast) showToast('Failed to upload screenshots.', 'error');
    } finally {
      setIsUploadingScreenshots(false);
    }
  };

  const handleNotifyStudentComplete = async () => {
    if (!selectedOrder) return;
    try {
      // 1. Set payment_awaiting to true (requests payment)
      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ payment_awaiting: true }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updatedOrder = await res.json();

      // 2. Post completion & payment request message to chat
      await fallbackDb.postMessage({
        order_id: selectedOrder.id,
        sender_name: 'Academic Coordinator Desk',
        sender_id: 'system',
        content: `✅ [Assignment Completed] Your assignment has been reviewed by our coordinators and is ready. Please check the preview screenshots in your dashboard and proceed to payment to download your final files.`,
        is_admin: true,
      });

      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, ...updatedOrder } : o));
      setSelectedOrder(prev => prev ? { ...prev, ...updatedOrder } : null);
      if (showToast) showToast('Student notified and payment requested!', 'success');
      await fetchAdminData();
    } catch (e) {
      console.error(e);
      if (showToast) showToast('Failed to notify student and request payment.', 'error');
    }
  };

  const handleToggleMessageRead = async (messageId: string) => {
    try {
      const updatedMessages = contactMessages.map(m => {
        if (m.id === messageId) {
          return { ...m, is_read: !m.is_read };
        }
        return m;
      });
      await fallbackDb.setContactMessages(updatedMessages);
      setContactMessages(updatedMessages);
      if (showToast) showToast('Message status updated', 'success');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteContactMessage = async (messageId: string) => {
    if (!window.confirm('Delete this contact message permanently?')) return;
    try {
      const filtered = contactMessages.filter(m => m.id !== messageId);
      await fallbackDb.setContactMessages(filtered);
      setContactMessages(filtered);
      if (showToast) showToast('Contact message deleted', 'success');
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (status: AcademicOrder['status']) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Delivered
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            Writing
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            In QA Review
          </span>
        );
      case 'revision_requested':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
            Revision Needed
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">
            Unallocated
          </span>
        );
    }
  };

  // If user is not an admin, restrict view
  const isUserAdmin = user && user.role === 'admin';
  if (!isUserAdmin) {
    return (
      <div className="bg-[#0F172A] text-slate-100 min-h-[85vh] flex items-center justify-center font-sans px-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-xl">
          <ShieldCheck className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Access Restricted</h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Unauthorized. This panel is strictly reserved for the Ace Scholar coordinators desk. Please sign in with admin credentials.
          </p>
          <button
            onClick={() => setCurrentPage('login')}
            className="w-full bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-bold py-2.5 rounded-lg text-xs sm:text-sm transition-all shadow-md cursor-pointer"
          >
            Go to Admin Sign In
          </button>
        </div>
      </div>
    );
  }

  // Count active stats
  const unassignedCount = orders.filter(o => o.status === 'pending' || !o.assigned_to).length;
  const activeAssignments = orders.filter(o => o.status === 'in_progress' || o.status === 'under_review').length;
  const totalSubmissions = orders.length;
  const unreadContactMessages = contactMessages.filter(m => !m.is_read).length;

  return (
    <div className="bg-[#0F172A] text-slate-100 min-h-screen font-sans" id="admin-root">
      
      {/* 1. ADMIN PANEL HEADER */}
      <header className="bg-gradient-to-b from-[#0F172A] to-[#1E293B] border-b border-slate-800 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl xl:max-w-[90%] 2xl:max-w-[95%] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-amber-500" />
              <span className="text-xs font-bold text-amber-500 tracking-wider uppercase font-mono">Control Panel</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Academic Coordinator Workspace
            </h1>
            <p className="text-xs text-slate-400">
              Manage graduate writers allocations, process assignments, release final downloads, and answer customer queries.
            </p>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 shrink-0 gap-1">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'orders' ? 'bg-amber-500 text-[#0F172A]' : 'text-slate-400 hover:text-white'
              }`}
            >
              Academic Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'messages' ? 'bg-amber-500 text-[#0F172A]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Contact Inquiries</span>
              {unreadContactMessages > 0 && (
                <span className="bg-red-500 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-full animate-pulse">{unreadContactMessages}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'applications' ? 'bg-amber-500 text-[#0F172A]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Expert Apps</span>
              {applications.filter(a => a.status === 'pending').length > 0 && (
                <span className="bg-emerald-500 text-[#0F172A] font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                  {applications.filter(a => a.status === 'pending').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'payments' ? 'bg-amber-500 text-[#0F172A]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Coins className="h-3.5 w-3.5" />
              <span>Payments Ledger ({payments.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. STATS OVERVIEW SECTION */}
      <section className="max-w-7xl xl:max-w-[90%] 2xl:max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          <div className="bg-slate-900 border border-slate-800/80 p-4 sm:p-6 rounded-xl flex items-center space-x-4">
            <div className="p-3 bg-slate-950 text-slate-400 rounded-lg border border-slate-800">
              <Users className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <span className="block text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider font-semibold">Pending Allocation</span>
              <span className="text-lg sm:text-2xl font-black text-white">{unassignedCount}</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800/80 p-4 sm:p-6 rounded-xl flex items-center space-x-4">
            <div className="p-3 bg-slate-950 text-amber-500 rounded-lg border border-slate-850">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <span className="block text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider font-semibold">Active Writing</span>
              <span className="text-lg sm:text-2xl font-black text-white">{activeAssignments}</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800/80 p-4 sm:p-6 rounded-xl flex items-center space-x-4">
            <div className="p-3 bg-slate-950 text-emerald-500 rounded-lg border border-slate-850">
              <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <span className="block text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Submissions</span>
              <span className="text-lg sm:text-2xl font-black text-white">{totalSubmissions}</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800/80 p-4 sm:p-6 rounded-xl flex items-center space-x-4">
            <div className="p-3 bg-slate-950 text-blue-500 rounded-lg border border-slate-850">
              <Mail className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <span className="block text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider font-semibold">General Inquiries</span>
              <span className="text-lg sm:text-2xl font-black text-[#60A5FA]">{contactMessages.length}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CONDITIONAL BODY VIEWS */}
      <main className="max-w-7xl xl:max-w-[90%] 2xl:max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        
        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* LEFT SIDE: Admin orders list */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase font-mono">Academic Assignments</h2>
                <button
                  onClick={fetchAdminData}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {isLoading ? (
                <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-xl space-y-2">
                  <span className="animate-spin inline-block h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full"></span>
                  <p className="text-xs text-slate-400 font-medium">Synchronizing coordination ledger...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
                  No academic projects submitted yet.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
                  {orders.map((o) => (
                    <div
                      key={o.id}
                      onClick={() => setSelectedOrder(o)}
                      className={`bg-slate-900 hover:bg-slate-850 p-4 rounded-xl border transition-all cursor-pointer select-none space-y-2.5 ${
                        selectedOrder?.id === o.id ? 'border-amber-500' : 'border-slate-850'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-amber-400">{o.id}</span>
                        {getStatusBadge(o.status)}
                      </div>

                      <div className="space-y-0.5">
                        <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">{o.subject}</h4>
                        <p className="text-[10px] text-slate-400 font-light">Client: {o.client_name} ({o.client_email})</p>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-800/60 pt-2 bg-transparent">
                        <span className="font-light">Writer: {o.assigned_to || 'Unallocated'}</span>
                        <span className="font-mono font-bold text-slate-200">{o.budget_range}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT SIDE: Allocate Writer / Update Status / Upload Deliverables / Chat */}
            <div className="lg:col-span-3">
              {selectedOrder ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[75vh]" id="coordinator-control-panel">
                  
                  {/* Panel Header */}
                  <header className="bg-slate-950 p-4 border-b border-slate-800/80 flex justify-between items-center gap-4 shrink-0">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-amber-500">{selectedOrder.id}</span>
                        <span className="text-slate-500 text-[10px]">|</span>
                        <span className="text-xs text-slate-300 font-light truncate max-w-[200px]">{selectedOrder.client_email}</span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1">{selectedOrder.subject}</h3>
                    </div>
                    {getStatusBadge(selectedOrder.status)}
                  </header>

                  <div className="flex-1 overflow-y-auto p-4 space-y-5">
                     {/* Payment Verification Block — only shows when student has submitted proof */}
                     {selectedOrder.payment_screenshot && (
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                          <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Payment Proof Verification</h4>
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            selectedOrder.payment_status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : selectedOrder.payment_status === 'rejected'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                          }`}>
                            Status: {selectedOrder.payment_status || 'pending'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="block text-[10px] text-slate-500 uppercase font-mono">Payment Type</span>
                            <strong className="text-white uppercase">
                              {selectedOrder.payment_method_type || selectedOrder.payment_method || 'MANUAL'}
                            </strong>
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-500 uppercase font-mono">Agreed Price</span>
                            <strong className="text-amber-400 font-mono">
                              {selectedOrder.agreed_price ? `${selectedOrder.agreed_price} USD` : (selectedOrder.budget_range || 'Not Set')}
                            </strong>
                          </div>
                        </div>

                        {selectedOrder.payment_screenshot && (
                          <div className="space-y-1">
                            <span className="block text-[10px] text-slate-500 uppercase font-mono">Uploaded Receipt / Screenshot / Tx Hash</span>
                            {selectedOrder.payment_screenshot.startsWith('data:') || selectedOrder.payment_screenshot.startsWith('http') || selectedOrder.payment_screenshot.length > 100 ? (
                              <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/60 p-1 max-w-[280px]">
                                {selectedOrder.payment_screenshot.startsWith('data:') || selectedOrder.payment_screenshot.startsWith('http') ? (
                                  <img
                                    src={selectedOrder.payment_screenshot}
                                    alt="Payment proof screenshot"
                                    className="w-full h-auto max-h-48 object-contain rounded"
                                  />
                                ) : (
                                  <p className="text-xs text-slate-300 font-mono break-all p-2 select-all">{selectedOrder.payment_screenshot}</p>
                                )}
                              </div>
                            ) : (
                              <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                                <span className="font-mono text-slate-200 select-all break-all text-xs">{selectedOrder.payment_screenshot}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {selectedOrder.payment_status === 'pending' && (
                          <div className="flex items-center gap-3 pt-1">
                            <button
                              type="button"
                              onClick={() => handleVerifyEthiopiaPayment('approved')}
                              className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-[#0F172A] font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                            >
                              <Check className="h-4 w-4" />
                              <span>Approve Payment</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleVerifyEthiopiaPayment('rejected')}
                              className="flex-1 bg-slate-800 hover:bg-red-500 hover:text-white text-slate-300 font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                            >
                              <X className="h-4 w-4" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* EXPERT APPLICATIONS RECEIVED */}
                    {selectedOrder.applicants && selectedOrder.applicants.length > 0 && (
                      <div className="bg-slate-950 border border-amber-500/20 rounded-xl p-4 space-y-3 shadow-lg shadow-amber-500/[0.02]">
                        <div className="flex items-center space-x-2 border-b border-slate-850 pb-2">
                          <Sparkles className="h-4 w-4 text-amber-500" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Expert Applications ({selectedOrder.applicants.length})</h4>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {selectedOrder.applicants.map((applicant, idx) => (
                            <div key={idx} className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-xs space-y-1.5">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <strong className="text-white block">{applicant.expert_name}</strong>
                                  <span className="text-[10px] text-slate-400 font-mono">{applicant.expert_email}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAcceptExpertApplicant(applicant.expert_email, applicant.expert_name)}
                                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-2.5 py-1.5 rounded text-[10px] transition-colors cursor-pointer shrink-0"
                                >
                                  Accept & Assign
                                </button>
                              </div>
                              <p className="text-[11px] text-slate-300 bg-slate-950 border border-slate-850 p-2 rounded leading-relaxed whitespace-pre-wrap font-light">
                                "{applicant.proposal}"
                              </p>
                              <span className="text-[9px] text-slate-500 block font-light">Applied: {new Date(applicant.applied_at).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* EXPERT SUBMISSION REVIEW & SCREENSHOT SETUP (shows when expert submits files) */}
                    {selectedOrder.expert_submission_name && (
                      <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                            <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">Expert Solution Submission</h4>
                          </div>
                          <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold uppercase">{selectedOrder.status}</span>
                        </div>

                        <div className="flex items-center justify-between bg-slate-950 border border-slate-850 rounded-lg px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4 text-purple-400 shrink-0" />
                            <span className="text-xs text-white font-mono">{selectedOrder.expert_submission_name}</span>
                          </div>
                          {selectedOrder.expert_submission_url && selectedOrder.expert_submission_url !== '#' && (
                            <a href={selectedOrder.expert_submission_url} target="_blank" rel="noopener noreferrer"
                              className="text-[10px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 underline">
                              <Download className="h-3.5 w-3.5" /> Download Expert File
                            </a>
                          )}
                        </div>

                        {/* Screenshot upload for student preview */}
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Review Previews (Screenshots for Student)</label>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-purple-500 rounded-lg py-1.5 px-3 text-slate-400 hover:text-white text-xs cursor-pointer transition-colors">
                              <Upload className="h-3.5 w-3.5" />
                              <span>{isUploadingScreenshots ? 'Uploading...' : 'Upload Screenshots'}</span>
                              <input type="file" accept="image/*" multiple className="hidden"
                                onChange={async (e) => { if (e.target.files?.length) await handleUploadAdminScreenshots(e.target.files); }} />
                            </label>
                            {(selectedOrder.admin_screenshots?.length || 0) > 0 && (
                              <span className="text-xs text-emerald-400 font-bold">{selectedOrder.admin_screenshots!.length} screenshot(s) uploaded</span>
                            )}
                          </div>
                          {(selectedOrder.admin_screenshots?.length || 0) > 0 && (
                            <div className="flex gap-2 flex-wrap">
                              {selectedOrder.admin_screenshots!.map((src, i) => (
                                <img key={i} src={src} alt={`Review screenshot ${i + 1}`}
                                  className="h-16 w-16 object-cover rounded-lg border border-slate-800" />
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button type="button" onClick={handleNotifyStudentComplete}
                            className={`w-full font-bold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                              selectedOrder.payment_awaiting
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                            }`}>
                            <Check className="h-4 w-4" />
                            <span>{selectedOrder.payment_awaiting ? 'Notify Student Again' : 'Notify Student — Work Complete'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* RELEASE DELIVERABLE FILE */}
                    <form onSubmit={handleReleaseDelivery} className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider shrink-0">Release Solution</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedOrder.delivery_released ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                            {selectedOrder.delivery_released ? '✓ Released' : 'Not Released'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <input
                            type="file"
                            onChange={handleDeliveryFileUpload}
                            className="hidden"
                            id="delivery-file-upload-input"
                          />
                          <label
                            htmlFor="delivery-file-upload-input"
                            className="flex-1 min-w-0 bg-slate-950 border border-slate-850 hover:border-emerald-500 rounded-lg py-1.5 px-3 text-slate-400 hover:text-white text-xs transition-colors cursor-pointer flex items-center justify-between gap-2"
                          >
                            <span className="truncate">{deliveryFileName || (deliveryFileContent ? 'File loaded' : 'Choose delivery file...')}</span>
                            <Upload className="h-3.5 w-3.5 shrink-0" />
                          </label>
                          <button
                            type="submit"
                            disabled={isSubmittingDelivery || !deliveryFileContent}
                            className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/30 disabled:cursor-not-allowed text-[#0F172A] font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            <span>Release</span>
                          </button>
                        </div>
                      </div>
                    </form>


                  </div>

                </div>
              ) : (
                <div className="h-[55vh] flex flex-col items-center justify-center border border-dashed border-slate-850 rounded-2xl bg-slate-900/10 text-center p-6 space-y-3">
                  <div className="p-4 bg-slate-950 text-slate-500 rounded-full border border-slate-850">
                    <FileText className="h-10 w-10" />
                  </div>
                  <h3 className="text-white font-bold text-base">Select assignment ledger</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Choose any assignment ledger on the left grid to allocate expert writers, update statuses, upload final model answers, or answer client messages.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === 'messages' && (
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 sm:p-8 space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide uppercase font-mono">Contact Desk Inquiries</h2>
              <span className="bg-slate-850 text-slate-300 text-xs font-mono py-0.5 px-2 rounded-md">{contactMessages.length} Messages total</span>
            </div>

            {contactMessages.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">No general public contact inquiries logged in database.</div>
            ) : (
              <div className="space-y-4">
                {contactMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start justify-between gap-4 transition-all ${
                      msg.is_read ? 'bg-slate-950/20 border-slate-850 opacity-70' : 'bg-slate-950/60 border-amber-500/30 shadow-md'
                    }`}
                  >
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-1.5">
                        <span className="font-bold text-white text-xs sm:text-sm">{msg.name}</span>
                        <span className="text-slate-500 text-[10px]">|</span>
                        <span className="text-xs text-slate-400 font-mono underline truncate">{msg.email}</span>
                        {!msg.is_read && (
                          <span className="bg-amber-500 text-[#0F172A] font-extrabold text-[8px] font-mono tracking-wider px-1.5 py-0.5 rounded uppercase shrink-0">NEW</span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-extrabold text-amber-500 font-mono tracking-wide">Subject: {msg.subject}</h4>
                        <p className="text-xs text-slate-200 leading-relaxed font-light whitespace-pre-wrap">{msg.message}</p>
                      </div>

                      <div className="text-[10px] text-slate-500 font-mono">
                        Logged on: {new Date(msg.created_at).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex sm:flex-col gap-2 shrink-0 self-stretch sm:justify-start justify-end mt-2 sm:mt-0">
                      <button
                        onClick={() => handleToggleMessageRead(msg.id)}
                        className={`p-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          msg.is_read
                            ? 'border-slate-800 bg-slate-850 text-slate-400 hover:text-white'
                            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                        title={msg.is_read ? 'Mark as Unread' : 'Mark as Read'}
                      >
                        <Check className="h-4 w-4" />
                        <span className="sm:hidden">Mark {msg.is_read ? 'Unread' : 'Read'}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteContactMessage(msg.id)}
                        className="p-2 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Delete inquiry"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sm:hidden">Delete Inquiry</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 sm:p-8 space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide uppercase font-mono flex items-center gap-2">
                <span>Expert Candidate Applications</span>
                <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-md font-mono">{applications.length} total</span>
              </h2>
              <button
                onClick={fetchAdminData}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {applications.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">No candidate applications currently logged in system.</div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className={`p-5 rounded-xl border flex flex-col md:flex-row items-start justify-between gap-4 transition-all ${
                      app.status === 'approved' 
                        ? 'bg-emerald-500/5 border-emerald-500/20 opacity-80' 
                        : app.status === 'rejected' 
                        ? 'bg-rose-500/5 border-rose-500/10 opacity-75' 
                        : 'bg-slate-950/50 border-amber-500/30 shadow-lg'
                    }`}
                  >
                    <div className="space-y-3 min-w-0 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-1.5">
                        <span className="font-bold text-white text-xs sm:text-sm">{app.full_name}</span>
                        <span className="text-slate-500 text-[10px]">|</span>
                        <span className="text-xs text-slate-400 font-mono underline truncate">{app.email}</span>
                        {app.status === 'pending' && (
                          <span className="bg-amber-500 text-[#0F172A] font-extrabold text-[8px] font-mono tracking-wider px-1.5 py-0.5 rounded uppercase shrink-0">PENDING REVIEW</span>
                        )}
                        {app.status === 'approved' && (
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[8px] font-mono tracking-wider px-1.5 py-0.5 rounded uppercase shrink-0">APPROVED EXPERT</span>
                        )}
                        {app.status === 'rejected' && (
                          <span className="bg-rose-500/25 text-rose-400 border border-rose-500/20 font-bold text-[8px] font-mono tracking-wider px-1.5 py-0.5 rounded uppercase shrink-0">DECLINED</span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                        <div>
                          <strong className="text-slate-400 uppercase text-[9px] tracking-wider block mb-0.5">Highest Qualification</strong>
                          <span className="text-slate-100 font-semibold">{app.degree}</span>
                        </div>
                        <div>
                          <strong className="text-slate-400 uppercase text-[9px] tracking-wider block mb-0.5">Current / graduation GPA</strong>
                          <span className="text-emerald-400 font-bold font-mono">{app.gpa || 'N/A'}</span>
                        </div>
                        <div>
                          <strong className="text-slate-400 uppercase text-[9px] tracking-wider block mb-0.5">Academic Field of Expertise</strong>
                          <span className="text-slate-100 font-semibold">{app.subject}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Candidate Experience & Biography</h4>
                        <p className="text-xs text-slate-200 leading-relaxed font-light bg-slate-950 p-3 rounded-lg border border-slate-850 whitespace-pre-wrap">{app.experience}</p>
                      </div>

                      {app.documents && app.documents.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Uploaded Academic Verification Documents ({app.documents.length})</h4>
                          <div className="flex flex-wrap gap-2">
                            {app.documents.map((doc: any, docIdx: number) => (
                              <button
                                key={docIdx}
                                onClick={() => downloadBase64File(doc.content, doc.name, doc.type)}
                                className="flex items-center space-x-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-700/80 px-3 py-1.5 rounded-xl text-xs text-left cursor-pointer transition-all outline-none"
                                title="Click to download verification document"
                              >
                                <Paperclip className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                <span className="text-slate-200 truncate max-w-[180px] font-mono text-[11px]">{doc.name}</span>
                                {doc.size && (
                                  <span className="text-slate-500 text-[9px] font-mono shrink-0">({(doc.size / 1024).toFixed(1)} KB)</span>
                                )}
                                <Download className="h-3 w-3 text-slate-400/80 shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-[10px] text-slate-500 font-mono">
                        Application submitted on: {new Date(app.created_at).toLocaleString()}
                      </div>
                    </div>

                    {app.status === 'pending' && (
                      <div className="flex md:flex-col sm:flex-row gap-2 shrink-0 w-full md:w-auto justify-end mt-2 md:mt-0 pt-1">
                        <button
                          onClick={() => handleApproveApplication(app)}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10"
                        >
                          <Check className="h-4 w-4" />
                          <span>Approve Candidate</span>
                        </button>
                        <button
                          onClick={() => handleRejectApplication(app)}
                          className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <X className="h-4 w-4" />
                          <span>Decline Application</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 sm:p-8 space-y-6">
            
            {/* Table Header / Title */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4 gap-4">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide uppercase font-mono flex items-center gap-2">
                  <Coins className="h-5 w-5 text-amber-500" />
                  <span>Financial Payments Ledger</span>
                </h2>
                <p className="text-xs text-slate-400 font-light">Direct record of all user-settled invoices, payments, and coordinator approved transactions.</p>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto shrink-0">
                <input
                  type="text"
                  placeholder="Search Ref, ID, Order ID..."
                  value={paymentsSearch}
                  onChange={(e) => setPaymentsSearch(e.target.value)}
                  className="bg-slate-950 border border-slate-850 focus:border-amber-500 rounded-lg py-1.5 px-3 text-white text-xs outline-none transition-colors w-full sm:w-48"
                />
                <button
                  onClick={fetchAdminData}
                  className="p-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Financial Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-1 shadow-md">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Gross Volume (ETB / USD)</span>
                  <DollarSign className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-lg font-extrabold text-white">
                    {payments.filter(p => p.currency === 'USD').reduce((sum, p) => sum + p.amount, 0).toLocaleString()} USD
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    {payments.filter(p => p.currency !== 'USD').reduce((sum, p) => sum + p.amount, 0).toLocaleString()} ETB
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-1 shadow-md">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Admin Cut (10%)</span>
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-lg font-extrabold text-emerald-400">
                    {payments.filter(p => p.currency === 'USD').reduce((sum, p) => sum + p.admin_cut, 0).toLocaleString()} USD
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    {payments.filter(p => p.currency !== 'USD').reduce((sum, p) => sum + p.admin_cut, 0).toLocaleString()} ETB
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-1 shadow-md">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Expert Allocation (90%)</span>
                  <Users className="h-3.5 w-3.5 text-sky-500" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-lg font-extrabold text-sky-400">
                    {payments.filter(p => p.currency === 'USD').reduce((sum, p) => sum + p.expert_amount, 0).toLocaleString()} USD
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    {payments.filter(p => p.currency !== 'USD').reduce((sum, p) => sum + p.expert_amount, 0).toLocaleString()} ETB
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-1 shadow-md">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Settled Transactions</span>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-lg font-extrabold text-white">
                    {payments.length} Payments
                  </p>
                  <p className="text-xs text-slate-400 font-light">100% verified cuts</p>
                </div>
              </div>

            </div>

            {/* Payments Table */}
            {(() => {
              const filtered = payments.filter(p => 
                p.id.toLowerCase().includes(paymentsSearch.toLowerCase()) ||
                p.order_id.toLowerCase().includes(paymentsSearch.toLowerCase()) ||
                p.reference_id.toLowerCase().includes(paymentsSearch.toLowerCase()) ||
                p.provider_id.toLowerCase().includes(paymentsSearch.toLowerCase())
              );

              return filtered.length === 0 ? (
                <div className="text-center py-16 bg-slate-950/20 border border-slate-850 rounded-xl text-slate-500 text-xs font-light">
                  No payment transactions match search filters or exist.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-850 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 border-b border-slate-850 font-mono font-bold uppercase tracking-wider">
                        <th className="p-3">Payment ID</th>
                        <th className="p-3">Order ID</th>
                        <th className="p-3">Method</th>
                        <th className="p-3">Total Amount</th>
                        <th className="p-3">Admin Cut (10%)</th>
                        <th className="p-3">Expert (90%)</th>
                        <th className="p-3">Reference ID</th>
                        <th className="p-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60 bg-slate-950/20">
                      {filtered.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="p-3 font-mono text-slate-300">
                            <span className="flex items-center gap-1">
                              <span>{p.id}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(p.id);
                                  if (showToast) showToast('Payment ID copied!', 'success');
                                }}
                                className="text-slate-500 hover:text-white p-0.5 cursor-pointer bg-transparent border-0"
                                title="Copy ID"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </span>
                          </td>
                          <td className="p-3 font-mono text-amber-500 font-bold hover:underline cursor-pointer" onClick={() => {
                            const foundOrder = orders.find(o => o.id === p.order_id);
                            if (foundOrder) {
                              setSelectedOrder(foundOrder);
                              setActiveTab('orders');
                            } else if (showToast) {
                              showToast(`Order ${p.order_id} details are offline/syncing`, 'error');
                            }
                          }}>
                            {p.order_id}
                          </td>
                          <td className="p-3 uppercase font-mono text-slate-400">{p.provider_id}</td>
                          <td className="p-3 font-bold text-white">{p.amount.toLocaleString()} {p.currency}</td>
                          <td className="p-3 text-emerald-400 font-bold font-mono">+{p.admin_cut.toLocaleString()} {p.currency}</td>
                          <td className="p-3 text-sky-400 font-mono">{p.expert_amount.toLocaleString()} {p.currency}</td>
                          <td className="p-3 font-mono text-slate-300 select-all truncate max-w-[120px]" title={p.reference_id}>
                            {p.reference_id}
                          </td>
                          <td className="p-3 text-slate-400 font-light font-mono">
                            {new Date(p.created_at).toLocaleDateString()} {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}

          </div>
        )}

      </main>

    </div>
  );
}
