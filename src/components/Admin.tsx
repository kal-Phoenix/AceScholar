import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, Check, Trash2, Mail, Users, RefreshCw, Clock, Upload, Download, X, Sparkles, Paperclip, Coins, DollarSign, TrendingUp, Copy, MessageSquare, Send, BarChart3, Star, ArrowDownToLine, CheckCircle } from 'lucide-react';
import { PageType, Profile, Order as AcademicOrder, Message, ContactMessage, Payment, Withdrawal, Rating } from '../types';
import { fallbackDb, getAuthHeaders } from '../lib/supabase';
import { POLLING_INTERVAL_MS, REVISION_DEADLINE_MS, HOURS_DIVISOR, DEFAULT_EXCHANGE_RATES } from '../lib/constants';
import NotificationBell from './NotificationBell';

interface AdminProps {
  user: Profile | null;
  setCurrentPage: (page: PageType) => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
}

export default function Admin({ user, setCurrentPage, showToast }: AdminProps) {
  const ETB_RATE = DEFAULT_EXCHANGE_RATES.ETB?.rate || 120;
  const [orders, setOrders] = useState<AcademicOrder[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'messages' | 'applications' | 'payments' | 'withdrawals' | 'analytics' | 'ratings'>('orders');
  const [applications, setApplications] = useState<any[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsSearch, setPaymentsSearch] = useState('');
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [, setSelectedWithdrawal] = useState<Withdrawal | null>(null);

  // Withdrawal approval screenshot state
  const [withdrawalApprovingId, setWithdrawalApprovingId] = useState<string | null>(null);
  const [withdrawalScreenshotFile, setWithdrawalScreenshotFile] = useState<File | null>(null);
  const [isApprovingWithdrawal, setIsApprovingWithdrawal] = useState(false);
  
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
  const [typedMessage, setTypedMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [orderDetailTab, setOrderDetailTab] = useState<'overview' | 'chat' | 'chat-expert'>('overview');
  const [selectedApplicantProfile, setSelectedApplicantProfile] = useState<any>(null);
  const [showApplicantModal, setShowApplicantModal] = useState(false);

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
        documents: p.expert_documents || [],
        institution: p.institution || '',
        graduation_year: p.graduation_year || '',
        field_of_study: p.field_of_study || '',
        software: p.software || '',
        languages: p.languages || '',
        portfolio_url: p.portfolio_url || '',
        availability: p.availability || '',
        referral: p.referral || '',
      }));
    apps.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setApplications(apps);
  };

  const handleApproveApplication = async (app: any) => {
    try {
      const res = await fetch('/api/profiles/approve-expert', {
        method: 'POST',
        headers: {
          ...(await getAuthHeaders()),
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
          ...(await getAuthHeaders()),
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
      const [ordersResult, contactsResult, profilesResult, allPayments, withdrawalsData, ratingsData, analyticsData] = await Promise.all([
        fallbackDb.getOrders(1, 500),
        fallbackDb.getContactMessages(1, 500),
        fallbackDb.getProfiles(1, 500),
        fallbackDb.getPayments(),
        fallbackDb.getWithdrawals(),
        fallbackDb.getRatings(),
        fallbackDb.getAnalytics(),
      ]);
      const allOrders = ordersResult.data;
      setOrders(allOrders);
      setContactMessages(contactsResult.data);
      // profiles updated from allProfiles
      setPayments(allPayments || []);
      setWithdrawals(withdrawalsData);
      setRatings(ratingsData);
      setAnalytics(analyticsData);
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
      const thread = await fallbackDb.getMessagesByOrder(orderId);
      thread.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setMessages(prev => {
        const serverIds = new Set(thread.map(m => m.id));
        const optimistic = prev.filter(m => !serverIds.has(m.id) && m.id.startsWith('msg-'));
        return [...thread, ...optimistic];
      });
    } catch (e) {
      console.error('Error fetching thread messages:', e);
    }
  };

  const handleWithdrawalAction = async (id: string, status: 'approved' | 'rejected', note?: string, screenshot?: string) => {
    try {
      const result = await fallbackDb.updateWithdrawal(id, status, note, screenshot);
      if (result) {
        if (showToast) showToast(`Withdrawal ${status}`, 'success');
        setSelectedWithdrawal(null);
        setWithdrawalApprovingId(null);
        setWithdrawalScreenshotFile(null);
        await fetchAdminData();
      } else {
        if (showToast) showToast('Failed to update withdrawal.', 'error');
      }
    } catch (e) {
      if (showToast) showToast('Failed to update withdrawal.', 'error');
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

  const handleAcceptExpertApplicant = async (applicantEmail: string, applicantName: string) => {
    if (!selectedOrder) return;
    try {
      const updatedOrder = await fallbackDb.updateOrder(selectedOrder.id, {
        assigned_to: applicantEmail,
        expert_accepted: true,
        status: 'in_progress',
      });

      if (updatedOrder) {
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updatedOrder : o));
        setSelectedOrder(updatedOrder);
      }

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
      // Upload the delivery file to storage; fall back to base64 for small files
      let deliveryFileUrl: string | undefined;
      if (deliveryFileContent) {
        const uploadedUrl = await fallbackDb.uploadFile(deliveryFileContent, deliveryFileName);
        if (uploadedUrl) {
          deliveryFileUrl = uploadedUrl;
        } else if (deliveryFileContent.length < 5 * 1024 * 1024) {
          // Fallback: store small files as base64 inline
          deliveryFileUrl = deliveryFileContent;
        } else {
          throw new Error('File too large to store inline and upload failed');
        }
      }

      const isAlreadyApproved = selectedOrder.payment_status === 'approved';
      const revisionDeadline = new Date(Date.now() + REVISION_DEADLINE_MS).toISOString();

      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({
          status: 'delivered',
          delivery_name: deliveryFileName,
          delivery_url: deliveryFileUrl,
          delivery_released: isAlreadyApproved,
          revision_deadline: revisionDeadline,
          revision_count: selectedOrder.revision_count || 0,
          max_revisions: selectedOrder.max_revisions || 2,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const updatedOrder = await res.json();

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
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
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
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({ payment_awaiting: true }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updatedOrder = await res.json();

      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, ...updatedOrder } : o));
      setSelectedOrder(prev => prev ? { ...prev, ...updatedOrder } : null);
      if (showToast) showToast('Student notified and payment requested!', 'success');
      await fetchAdminData();
    } catch (e) {
      console.error(e);
      if (showToast) showToast('Failed to notify student and request payment.', 'error');
    }
  };

  const handlePostMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !selectedOrder || !user) return;

    setIsSendingMessage(true);
    try {
      const recipient = orderDetailTab === 'chat-expert' ? 'expert' : 'student';
      const sent = await fallbackDb.postMessage({
        order_id: selectedOrder.id,
        sender_id: user.id,
        sender_name: user.full_name,
        content: typedMessage.trim(),
        is_admin: true,
        recipient,
      });

      if (sent) {
        setMessages(prev => [...prev, sent]);
        setTypedMessage('');
      } else {
        if (showToast) showToast('Message failed to send. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      if (showToast) showToast('Failed to deliver message.', 'error');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Live poll: refresh messages every 5 seconds when chat tab is open
  useEffect(() => {
    if (!selectedOrder || (orderDetailTab !== 'chat' && orderDetailTab !== 'chat-expert')) return;
    const interval = setInterval(() => {
      fetchMessagesForOrder(selectedOrder.id);
    }, POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [selectedOrder?.id, orderDetailTab]);

  const handleToggleMessageRead = async (messageId: string) => {
    try {
      const msg = contactMessages.find(m => m.id === messageId);
      if (!msg) return;
      const res = await fetch(`/api/contacts/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({ is_read: !msg.is_read }),
      });
      if (!res.ok) throw new Error('Failed to update');
      const updated = contactMessages.map(m => m.id === messageId ? { ...m, is_read: !m.is_read } : m);
      setContactMessages(updated);
      if (showToast) showToast('Message status updated', 'success');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteContactMessage = async (messageId: string) => {
    if (!window.confirm('Delete this contact message permanently?')) return;
    try {
      const res = await fetch(`/api/contacts/${messageId}`, {
        method: 'DELETE',
        headers: await getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete');
      setContactMessages(prev => prev.filter(m => m.id !== messageId));
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
            In Progress
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            Under Review
          </span>
        );
      case 'revision_requested':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
            Revision Requested
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">
            Pending
          </span>
        );
    }
  };

  // If user is not an admin, restrict view
  const isUserAdmin = user && user.role === 'admin';
  if (!isUserAdmin) {
    return (
      <div className="bg-[#0F172A] text-slate-100 min-h-[50vh] flex items-center justify-center font-sans px-4">
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
    <div className="bg-[#0F172A] text-slate-100 font-sans" id="admin-root">
      
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

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0 gap-1 items-center">
            {user && <NotificationBell userEmail={user.email} />}
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
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'withdrawals' ? 'bg-amber-500 text-[#0F172A]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownToLine className="h-3.5 w-3.5" />
              <span>Withdrawals ({withdrawals.filter(w => w.status === 'pending').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('ratings')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'ratings' ? 'bg-amber-500 text-[#0F172A]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Star className="h-3.5 w-3.5" />
              <span>Ratings ({ratings.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'analytics' ? 'bg-amber-500 text-[#0F172A]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Analytics</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. STATS OVERVIEW SECTION */}
      <section className="max-w-7xl xl:max-w-[90%] 2xl:max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="group relative bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 p-4 sm:p-5 rounded-xl overflow-hidden hover:border-amber-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center space-x-3">
              <div className="p-2.5 bg-gradient-to-br from-slate-800 to-slate-900 text-slate-300 rounded-lg border border-slate-700/50 group-hover:border-amber-500/20 transition-colors">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Pending Allocation</span>
                <span className="text-xl sm:text-2xl font-black text-white">{unassignedCount}</span>
              </div>
            </div>
          </div>

          <div className="group relative bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 p-4 sm:p-5 rounded-xl overflow-hidden hover:border-amber-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center space-x-3">
              <div className="p-2.5 bg-gradient-to-br from-amber-500/10 to-amber-500/5 text-amber-400 rounded-lg border border-amber-500/20">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Active Writing</span>
                <span className="text-xl sm:text-2xl font-black text-white">{activeAssignments}</span>
              </div>
            </div>
          </div>

          <div className="group relative bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 p-4 sm:p-5 rounded-xl overflow-hidden hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center space-x-3">
              <div className="p-2.5 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 text-emerald-400 rounded-lg border border-emerald-500/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Submissions</span>
                <span className="text-xl sm:text-2xl font-black text-white">{totalSubmissions}</span>
              </div>
            </div>
          </div>

          <div className="group relative bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 p-4 sm:p-5 rounded-xl overflow-hidden hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center space-x-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500/10 to-blue-500/5 text-blue-400 rounded-lg border border-blue-500/20">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">General Inquiries</span>
                <span className="text-xl sm:text-2xl font-black text-blue-400">{contactMessages.length}</span>
              </div>
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
                <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  {orders.map((o) => {
                    const isSelected = selectedOrder?.id === o.id;
                    const hoursLeft = o.deadline ? (new Date(o.deadline).getTime() - Date.now()) / HOURS_DIVISOR : null;
                    const isOverdue = hoursLeft !== null && hoursLeft < 0 && o.status !== 'delivered';
                    return (
                      <div
                        key={o.id}
                        onClick={() => setSelectedOrder(o)}
                        className={`group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none overflow-hidden ${
                          isSelected
                            ? 'bg-slate-800/80 border-amber-500/50 shadow-lg shadow-amber-500/5'
                            : 'bg-slate-900/60 border-slate-800/60 hover:bg-slate-800/50 hover:border-slate-700/80'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent pointer-events-none" />
                        )}
                        <div className="relative space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[11px] font-bold font-mono text-amber-400 truncate">{o.id}</span>
                              <span className="text-slate-600 text-[8px]">|</span>
                              {getStatusBadge(o.status)}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {o.payment_status === 'approved' && (
                                <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">PAID</span>
                              )}
                              {o.payment_status === 'pending' && o.payment_screenshot && (
                                <span className="text-[8px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full animate-pulse">VERIFY</span>
                              )}
                              {o.special_instructions?.includes('Pay Upon Delivery') && !o.payment_screenshot && (
                                <span className="text-[8px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded-full">LATER</span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <h4 className="text-xs sm:text-[13px] font-bold text-white line-clamp-1">{o.subject}</h4>
                            <p className="text-[10px] text-slate-400 font-light truncate">{o.client_name}</p>
                          </div>

                          {o.deadline && (
                            <div className={`text-[9px] font-mono ${isOverdue ? 'text-red-400 font-bold' : hoursLeft !== null && hoursLeft < 24 ? 'text-amber-400' : 'text-slate-500'}`}>
                              Due: {new Date(o.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              {isOverdue && ' (OVERDUE)'}
                              {!isOverdue && hoursLeft !== null && hoursLeft < 24 && ` (${Math.round(hoursLeft)}h left)`}
                            </div>
                          )}

                          <div className="flex justify-between items-center text-[10px] border-t border-slate-800/40 pt-2">
                            <span className={`font-light ${o.assigned_to ? 'text-emerald-400/80' : 'text-slate-500'}`}>
                              {o.assigned_to ? `✍ ${o.assigned_to}` : '⊘ Unallocated'}
                            </span>
                            <span className="font-mono font-bold text-slate-300 bg-slate-800/60 px-2 py-0.5 rounded text-[9px]">{o.budget_range}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT SIDE: Allocate Writer / Update Status / Upload Deliverables / Chat */}
            <div className="lg:col-span-3">
              {selectedOrder ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[75vh]" id="coordinator-control-panel">
                  
                  {/* Panel Header */}
                  <header className="bg-slate-950/80 backdrop-blur-sm p-4 border-b border-slate-800/80 shrink-0">
                    <div className="flex justify-between items-start gap-3">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-mono font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">{selectedOrder.id}</span>
                          {getStatusBadge(selectedOrder.status)}
                          {selectedOrder.payment_status && selectedOrder.payment_status !== 'approved' && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                              selectedOrder.payment_status === 'pending'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {selectedOrder.payment_status === 'pending' ? 'Payment Pending' : 'Payment Rejected'}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-white line-clamp-1">{selectedOrder.subject}</h3>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <span className="text-slate-500">Client:</span>
                            <span className="text-slate-300 font-medium">{selectedOrder.client_name}</span>
                          </span>
                          <span className="text-slate-600">|</span>
                          <span className="text-slate-400 font-mono">{selectedOrder.client_email}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Budget</div>
                        <div className="text-sm font-bold text-amber-400 font-mono">{selectedOrder.budget_range}</div>
                      </div>
                    </div>
                  </header>

                  {/* Sub-tab bar for Overview / Chat */}
                  <div className="flex border-b border-slate-800 bg-slate-950/30 px-4 shrink-0">
                    <button
                      onClick={() => setOrderDetailTab('overview')}
                      className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                        orderDetailTab === 'overview'
                          ? 'border-amber-500 text-amber-500'
                          : 'border-transparent text-slate-400 hover:text-white'
                      }`}
                    >
                      Overview & Actions
                    </button>
                    <button
                      onClick={() => {
                        setOrderDetailTab('chat');
                        if (selectedOrder) fetchMessagesForOrder(selectedOrder.id);
                      }}
                      className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                        orderDetailTab === 'chat'
                          ? 'border-amber-500 text-amber-500'
                          : 'border-transparent text-slate-400 hover:text-white'
                      }`}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Chat with Student</span>
                      {messages.filter(m => m.recipient === 'student').length > 0 && (
                        <span className="bg-amber-500 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                          {messages.filter(m => m.recipient === 'student').length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setOrderDetailTab('chat-expert');
                        if (selectedOrder) fetchMessagesForOrder(selectedOrder.id);
                      }}
                      className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                        orderDetailTab === 'chat-expert'
                          ? 'border-amber-500 text-amber-500'
                          : 'border-transparent text-slate-400 hover:text-white'
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Chat with Expert</span>
                      {messages.filter(m => m.recipient === 'expert').length > 0 && (
                        <span className="bg-amber-500 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                          {messages.filter(m => m.recipient === 'expert').length}
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    {orderDetailTab === 'overview' ? (
                    <>
                     {/* Payment Verification Block — only shows when student has submitted proof */}
                     {selectedOrder.payment_screenshot && (
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
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
                          {selectedOrder.payment_account && (
                            <div>
                              <span className="block text-[10px] text-slate-500 uppercase font-mono">Bank / Account</span>
                              <strong className="text-white uppercase">
                                {selectedOrder.payment_account}
                              </strong>
                            </div>
                          )}
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
                              className="flex-1 bg-transparent border border-slate-700/50 text-slate-400 hover:bg-slate-800/50 hover:text-rose-400 font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
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
                        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
                          <Sparkles className="h-4 w-4 text-amber-500" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Expert Applications ({selectedOrder.applicants.length})</h4>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {selectedOrder.applicants.map((applicant, idx) => {
                            const isAccepted = selectedOrder.expert_accepted && selectedOrder.assigned_to === applicant.expert_email;
                            return (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg text-xs space-y-2 transition-all duration-300 ${
                                isAccepted
                                  ? 'bg-emerald-950/40 border border-emerald-500/40 shadow-md shadow-emerald-500/[0.06]'
                                  : 'bg-slate-900 border border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <strong className={`block ${isAccepted ? 'text-emerald-300' : 'text-white'}`}>{applicant.expert_name}</strong>
                                    {isAccepted && (
                                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                                        <CheckCircle className="h-2.5 w-2.5" />
                                        Accepted
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono block">{applicant.expert_email}</span>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-[9px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                                      Applied: {new Date(applicant.applied_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedApplicantProfile(applicant);
                                      setShowApplicantModal(true);
                                    }}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold px-2.5 py-1.5 rounded text-[10px] transition-colors cursor-pointer border border-slate-700"
                                  >
                                    View Profile
                                  </button>
                                  {isAccepted ? (
                                    <span className="bg-emerald-500/20 text-emerald-400 font-extrabold px-2.5 py-1.5 rounded text-[10px] border border-emerald-500/30 cursor-default">
                                      Assigned
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleAcceptExpertApplicant(applicant.expert_email, applicant.expert_name)}
                                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-2.5 py-1.5 rounded text-[10px] transition-colors cursor-pointer"
                                    >
                                      Accept & Assign
                                    </button>
                                  )}
                                </div>
                              </div>
                              {applicant.proposal && (
                                <p className="text-[11px] text-slate-300 bg-slate-950/60 border border-slate-800/60 p-2 rounded leading-relaxed whitespace-pre-wrap font-light italic">
                                  {applicant.proposal}
                                </p>
                              )}
                              {applicant.documents && applicant.documents.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Paperclip className="h-3 w-3 text-slate-500" />
                                  {applicant.documents.map((doc: any, docIdx: number) => (
                                    <button
                                      key={docIdx}
                                      type="button"
                                      onClick={() => {
                                        if (doc.url) window.open(doc.url, '_blank');
                                        else if (doc.data) downloadBase64File(doc.data, doc.name || `document_${docIdx}`);
                                      }}
                                      className="text-[9px] text-amber-400 hover:text-amber-300 font-mono underline cursor-pointer bg-transparent border-0 p-0"
                                    >
                                      {doc.name || `Document ${docIdx + 1}`}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* EXPERT SUBMISSION REVIEW & SCREENSHOT SETUP (shows when expert submits files) */}
                    {selectedOrder.expert_submission_name && (
                      <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                            <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">Expert Solution Submission</h4>
                          </div>
                          <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold uppercase">{selectedOrder.status}</span>
                        </div>

                        <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5">
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
                            <label className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-purple-500 rounded-lg py-1.5 px-3 text-slate-400 hover:text-white text-xs cursor-pointer transition-colors">
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
                    <div className={`rounded-xl p-4 transition-all ${
                      selectedOrder.delivery_released
                        ? 'bg-emerald-500/5 border border-emerald-500/15'
                        : 'bg-slate-950/60 border border-slate-800/80'
                    }`}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`h-2 w-2 rounded-full ${selectedOrder.delivery_released ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                        <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Release Solution</h4>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          selectedOrder.delivery_released
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {selectedOrder.delivery_released ? 'Released' : 'Not Released'}
                        </span>
                      </div>
                      <form onSubmit={handleReleaseDelivery} className="flex items-center gap-2">
                        <input
                          type="file"
                          onChange={handleDeliveryFileUpload}
                          className="hidden"
                          id="delivery-file-upload-input"
                        />
                        <label
                          htmlFor="delivery-file-upload-input"
                          className="flex-1 min-w-0 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg py-2 px-3 text-slate-400 hover:text-white text-xs transition-colors cursor-pointer flex items-center justify-between gap-2"
                        >
                          <span className="truncate">{deliveryFileName || (deliveryFileContent ? 'File loaded' : 'Choose delivery file...')}</span>
                          <Upload className="h-3.5 w-3.5 shrink-0" />
                        </label>
                        <button
                          type="submit"
                          disabled={isSubmittingDelivery || !deliveryFileContent}
                          className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/30 disabled:text-emerald-500/50 disabled:cursor-not-allowed text-[#0F172A] font-bold py-2 px-4 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-sm shadow-emerald-500/10"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>{isSubmittingDelivery ? 'Uploading...' : 'Release'}</span>
                        </button>
                      </form>
                      {selectedOrder.delivery_name && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span className="text-slate-500">Uploaded:</span>
                          <span className="text-emerald-400/80 font-mono">{selectedOrder.delivery_name}</span>
                        </div>
                      )}
                    </div>

                    {/* DISPUTE RESOLUTION */}
                    {selectedOrder.dispute_status && (
                      <div className={`rounded-xl p-4 space-y-3 ${
                        selectedOrder.dispute_status === 'resolved'
                          ? 'bg-emerald-500/5 border border-emerald-500/20'
                          : selectedOrder.dispute_status === 'open'
                          ? 'bg-red-500/5 border border-red-500/20'
                          : 'bg-amber-500/5 border border-amber-500/20'
                      }`}>
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <h4 className={`text-xs font-bold uppercase tracking-wider ${
                            selectedOrder.dispute_status === 'resolved' ? 'text-emerald-400' :
                            selectedOrder.dispute_status === 'open' ? 'text-red-400' : 'text-amber-400'
                          }`}>
                            Dispute Resolution
                          </h4>
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            selectedOrder.dispute_status === 'resolved'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : selectedOrder.dispute_status === 'open'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {selectedOrder.dispute_status}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <span className="block text-[10px] text-slate-500 uppercase font-mono">Student Complaint</span>
                            <p className="text-xs text-slate-200 bg-slate-950 border border-slate-800 p-2 rounded mt-1">{selectedOrder.dispute_reason}</p>
                          </div>
                          {selectedOrder.dispute_created_at && (
                            <span className="text-[10px] text-slate-500">
                              Filed: {new Date(selectedOrder.dispute_created_at).toLocaleString()}
                            </span>
                          )}
                        </div>

                        {selectedOrder.dispute_status !== 'resolved' && (
                          <div className="space-y-2">
                            <textarea
                              id="dispute-resolution-text"
                              rows={2}
                              placeholder="Enter resolution notes for the student..."
                              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2 px-3 text-white text-xs outline-none transition-colors resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  const resolution = (document.getElementById('dispute-resolution-text') as HTMLTextAreaElement)?.value;
                                  if (!resolution?.trim()) { if (showToast) showToast('Please enter resolution notes', 'error'); return; }
                                  try {
                                    const res = await fetch(`/api/orders/${selectedOrder.id}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
                                      body: JSON.stringify({
                                        dispute_status: 'resolved',
                                        dispute_resolution: resolution.trim(),
                                        dispute_resolved_at: new Date().toISOString(),
                                      }),
                                    });
                                    if (res.ok) {
                                      const updated = await res.json();
                                      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, ...updated } : o));
                                      setSelectedOrder(prev => prev ? { ...prev, ...updated } : null);
                                      if (showToast) showToast('Dispute resolved successfully', 'success');
                                    }
                                  } catch (e) {
                                    if (showToast) showToast('Failed to resolve dispute', 'error');
                                  }
                                }}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-[#0F172A] font-bold py-2 px-3 rounded-lg text-xs transition-colors cursor-pointer"
                              >
                                Mark Resolved
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  const resolution = (document.getElementById('dispute-resolution-text') as HTMLTextAreaElement)?.value;
                                  try {
                                    const res = await fetch(`/api/orders/${selectedOrder.id}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
                                      body: JSON.stringify({
                                        dispute_status: 'under_review',
                                        dispute_resolution: resolution?.trim() || 'Under review by admin team',
                                      }),
                                    });
                                    if (res.ok) {
                                      const updated = await res.json();
                                      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, ...updated } : o));
                                      setSelectedOrder(prev => prev ? { ...prev, ...updated } : null);
                                      if (showToast) showToast('Dispute marked as under review', 'success');
                                    }
                                  } catch (e) {
                                    if (showToast) showToast('Failed to update dispute', 'error');
                                  }
                                }}
                                className="bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-bold py-2 px-3 rounded-lg text-xs transition-colors cursor-pointer"
                              >
                                Under Review
                              </button>
                            </div>
                          </div>
                        )}

                        {selectedOrder.dispute_resolution && (
                          <div>
                            <span className="block text-[10px] text-slate-500 uppercase font-mono">Resolution Notes</span>
                            <p className="text-xs text-slate-200 bg-slate-950 border border-slate-800 p-2 rounded mt-1">{selectedOrder.dispute_resolution}</p>
                          </div>
                        )}
                      </div>
                    )}
                    </>
                    ) : (
                    /* Chat View — shows when 'chat' or 'chat-expert' sub-tab is active */
                    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                      <div className="flex-grow overflow-y-auto p-4 space-y-3">
                        {orderDetailTab === 'chat' ? (
                          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2 flex items-center gap-2 shrink-0">
                            <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                            <p className="text-[9px] text-slate-400 font-medium">Messages from <span className="text-amber-400 font-bold">Student</span> appear here. You can reply directly.</p>
                          </div>
                        ) : (
                          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2 flex items-center gap-2 shrink-0">
                            <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                            <p className="text-[9px] text-slate-400 font-medium">Direct chat with <span className="text-amber-400 font-bold">Expert</span> {selectedOrder?.assigned_to && `(${selectedOrder.assigned_to})`}. Coordinate task details here.</p>
                          </div>
                        )}
                        {(() => {
                          const filteredMessages = orderDetailTab === 'chat'
                            ? messages.filter(m => m.recipient === 'student')
                            : messages.filter(m => m.recipient === 'expert');
                          return filteredMessages.length === 0 ? (
                            <div className="text-center py-8 space-y-2">
                              <MessageSquare className="h-8 w-8 text-slate-600 mx-auto" />
                              <p className="text-xs text-slate-500">
                                {orderDetailTab === 'chat' ? 'No student messages yet for this order.' : 'No expert messages yet for this order.'}
                              </p>
                              <p className="text-[10px] text-slate-600 leading-normal max-w-xs mx-auto font-light">
                                {orderDetailTab === 'chat'
                                  ? 'Messages from students assigned to this project will appear here.'
                                  : 'Chat with the assigned expert to coordinate task details.'}
                              </p>
                            </div>
                          ) : (
                            filteredMessages.map((msg) => {
                              const isMe = msg.sender_id === user?.id || msg.is_admin;
                              return (
                                <div
                                  key={msg.id}
                                  className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                                >
                                  <span className="text-[9px] text-slate-500 mb-0.5 px-1 font-semibold">
                                    {msg.sender_name} &bull; {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <div
                                    className={`p-3 rounded-xl text-xs leading-normal ${
                                      isMe
                                        ? 'bg-amber-500 text-[#0F172A] font-semibold rounded-tr-none shadow shadow-amber-500/10'
                                        : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none'
                                    }`}
                                  >
                                    <p className="whitespace-pre-wrap font-light">{msg.content}</p>
                                  </div>
                                </div>
                              );
                            })
                          );
                        })()}
                      </div>

                      <form onSubmit={handlePostMessage} className="p-2 border-t border-slate-800 bg-slate-950 flex items-center space-x-2 shrink-0">
                        <input
                          type="text"
                          value={typedMessage}
                          onChange={(e) => setTypedMessage(e.target.value)}
                          placeholder={orderDetailTab === 'chat' ? 'Message to student...' : 'Message to expert...'}
                          className="flex-grow bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg py-2 px-3 text-xs text-slate-100 outline-none transition-colors"
                        />
                        <button
                          type="submit"
                          disabled={isSendingMessage || !typedMessage.trim()}
                          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-[#0F172A] p-2 rounded-lg transition-all shrink-0 cursor-pointer"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="h-[55vh] flex flex-col items-center justify-center border border-dashed border-slate-800/80 rounded-2xl bg-gradient-to-b from-slate-900/20 to-transparent text-center p-8 space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-amber-500/5 rounded-full blur-xl" />
                    <div className="relative p-4 bg-slate-950 text-slate-600 rounded-full border border-slate-800/80">
                      <FileText className="h-8 w-8" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-white font-bold text-sm">Select an Assignment</h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                      Choose an assignment from the list to manage writer allocation, track status, upload deliverables, or respond to client messages.
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === 'messages' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-8 space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide uppercase font-mono">Contact Desk Inquiries</h2>
              <span className="bg-slate-800 text-slate-300 text-xs font-mono py-0.5 px-2 rounded-md">{contactMessages.length} Messages total</span>
            </div>

            {contactMessages.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">No general public contact inquiries logged in database.</div>
            ) : (
              <div className="space-y-4">
                {contactMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start justify-between gap-4 transition-all ${
                      msg.is_read ? 'bg-slate-950/20 border-slate-800 opacity-70' : 'bg-slate-950/60 border-amber-500/30 shadow-md'
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
                            ? 'border-slate-800 bg-slate-800 text-slate-400 hover:text-white'
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-8 space-y-6">
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
              <div className="text-center py-8 text-slate-500 text-xs">No candidate applications currently logged in system.</div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className={`p-5 rounded-xl border flex flex-col md:flex-row items-start justify-between gap-4 transition-all overflow-hidden min-w-0 ${
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

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950/40 p-3 rounded-lg border border-slate-800 min-w-0">
                        <div>
                          <strong className="text-slate-400 uppercase text-[9px] tracking-wider block mb-0.5">Institution</strong>
                          <span className="text-slate-100 font-semibold">{app.institution || 'N/A'}</span>
                        </div>
                        <div>
                          <strong className="text-slate-400 uppercase text-[9px] tracking-wider block mb-0.5">Graduation Year</strong>
                          <span className="text-slate-100 font-semibold">{app.graduation_year || 'N/A'}</span>
                        </div>
                        <div>
                          <strong className="text-slate-400 uppercase text-[9px] tracking-wider block mb-0.5">Field of Study</strong>
                          <span className="text-slate-100 font-semibold">{app.field_of_study || 'N/A'}</span>
                        </div>
                        <div>
                          <strong className="text-slate-400 uppercase text-[9px] tracking-wider block mb-0.5">GPA</strong>
                          <span className="text-emerald-400 font-bold font-mono">{app.gpa || 'N/A'}</span>
                        </div>
                        <div>
                          <strong className="text-slate-400 uppercase text-[9px] tracking-wider block mb-0.5">Qualification</strong>
                          <span className="text-slate-100 font-semibold">{app.degree || 'N/A'}</span>
                        </div>
                        <div>
                          <strong className="text-slate-400 uppercase text-[9px] tracking-wider block mb-0.5">Software / Tools</strong>
                          <span className="text-slate-100 font-semibold">{app.software || 'N/A'}</span>
                        </div>
                        <div>
                          <strong className="text-slate-400 uppercase text-[9px] tracking-wider block mb-0.5">Languages</strong>
                          <span className="text-slate-100 font-semibold">{app.languages || 'N/A'}</span>
                        </div>
                        <div>
                          <strong className="text-slate-400 uppercase text-[9px] tracking-wider block mb-0.5">Availability</strong>
                          <span className="text-slate-100 font-semibold">{app.availability || 'N/A'}</span>
                        </div>
                      </div>

                      {app.portfolio_url && (
                        <div className="text-xs bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                          <strong className="text-slate-400 uppercase text-[9px] tracking-wider block mb-0.5">Portfolio URL</strong>
                          <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 underline font-mono text-[11px] break-all">{app.portfolio_url}</a>
                        </div>
                      )}

                      <div className="space-y-1.5 min-w-0">
                        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Candidate Experience & Biography</h4>
                        <p className="text-xs text-slate-200 leading-relaxed font-light bg-slate-950 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap break-words overflow-hidden">{app.experience}</p>
                      </div>

                      {app.referral && (
                        <div className="text-xs bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                          <strong className="text-slate-400 uppercase text-[9px] tracking-wider block mb-0.5">How They Found Us</strong>
                          <span className="text-slate-100 font-semibold">{app.referral}</span>
                        </div>
                      )}

                      {app.documents && app.documents.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Uploaded Academic Verification Documents ({app.documents.length})</h4>
                          <div className="flex flex-wrap gap-2">
                            {app.documents.map((doc: any, docIdx: number) => (
                              <button
                                key={docIdx}
                                onClick={() => downloadBase64File(doc.content, doc.name, doc.type)}
                                className="flex items-center space-x-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 px-3 py-1.5 rounded-xl text-xs text-left cursor-pointer transition-all outline-none"
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
                          className="px-4 py-2 bg-transparent border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-8 space-y-6">
            
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
                  className="bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-1.5 px-3 text-white text-xs outline-none transition-colors w-full sm:w-48"
                />
                <button
                  onClick={fetchAdminData}
                  className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Financial Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1 shadow-md">
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

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1 shadow-md">
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

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1 shadow-md">
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

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1 shadow-md">
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
                <div className="text-center py-8 bg-slate-950/20 border border-slate-800 rounded-xl text-slate-500 text-xs font-light">
                  No payment transactions match search filters or exist.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono font-bold uppercase tracking-wider">
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
                    <tbody className="divide-y divide-slate-800/60 bg-slate-950/20">
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

        {/* WITHDRAWALS TAB */}
        {activeTab === 'withdrawals' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4 gap-4">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide uppercase font-mono flex items-center gap-2">
                  <ArrowDownToLine className="h-5 w-5 text-sky-500" />
                  <span>Expert Withdrawals</span>
                </h2>
                <p className="text-xs text-slate-400 font-light">Review and process expert payout requests.</p>
              </div>
              <button onClick={fetchAdminData} className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {withdrawals.length === 0 ? (
              <div className="text-center py-16 bg-slate-950/20 border border-slate-800 rounded-xl text-slate-500 text-xs font-light space-y-3">
                <ArrowDownToLine className="h-10 w-10 mx-auto text-slate-700" />
                <p>No withdrawal requests yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono font-bold uppercase tracking-wider">
                      <th className="p-3">Expert</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Method</th>
                      <th className="p-3">Account</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/20">
                    {withdrawals.map(w => (
                      <tr key={w.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3">
                          <p className="font-bold text-white">{w.expert_name}</p>
                          <p className="text-[10px] text-slate-500">{w.expert_email}</p>
                        </td>
                        <td className="p-3 font-bold text-white">
                          {w.currency === 'ETB'
                            ? `${(w.amount * ETB_RATE).toLocaleString(undefined, { maximumFractionDigits: 0 })} ETB`
                            : `$${w.amount.toFixed(2)} USD`}
                        </td>
                        <td className="p-3 uppercase font-mono text-slate-400">{w.method}</td>
                        <td className="p-3 text-slate-400 text-[10px] max-w-[150px] truncate">{w.account_details}</td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            w.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : w.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {w.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 font-mono text-[10px]">{new Date(w.created_at).toLocaleDateString()}</td>
                        <td className="p-3">
                          {w.status === 'pending' && withdrawalApprovingId !== w.id && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setWithdrawalApprovingId(w.id);
                                  setWithdrawalScreenshotFile(null);
                                }}
                                className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded transition-colors cursor-pointer"
                                title="Approve"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleWithdrawalAction(w.id, 'rejected')}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded transition-colors cursor-pointer"
                                title="Reject"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                          {w.status === 'pending' && withdrawalApprovingId === w.id && (
                            <div className="space-y-2 min-w-[200px]">
                              <label className="block text-[9px] font-bold text-slate-400 uppercase">Payment Proof Screenshot</label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setWithdrawalScreenshotFile(e.target.files?.[0] || null)}
                                className="block w-full text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 file:cursor-pointer"
                              />
                              <div className="flex gap-1">
                                <button
                                  disabled={isApprovingWithdrawal}
                                  onClick={async () => {
                                    setIsApprovingWithdrawal(true);
                                    try {
                                      let screenshotUrl: string | undefined;
                                      if (withdrawalScreenshotFile) {
                                        const base64 = await new Promise<string>((resolve) => {
                                          const reader = new FileReader();
                                          reader.onloadend = () => resolve(reader.result as string);
                                          reader.readAsDataURL(withdrawalScreenshotFile);
                                        });
                                        const url = await fallbackDb.uploadFile(base64, withdrawalScreenshotFile.name);
                                        if (url) screenshotUrl = url;
                                      }
                                      await handleWithdrawalAction(w.id, 'approved', undefined, screenshotUrl);
                                    } catch (e) {
                                      if (showToast) showToast('Failed to upload screenshot.', 'error');
                                    } finally {
                                      setIsApprovingWithdrawal(false);
                                    }
                                  }}
                                  className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded transition-colors cursor-pointer disabled:opacity-50"
                                  title="Approve with screenshot"
                                >
                                  {isApprovingWithdrawal ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                </button>
                                <button
                                  onClick={() => {
                                    setWithdrawalApprovingId(null);
                                    setWithdrawalScreenshotFile(null);
                                  }}
                                  className="p-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-400 rounded transition-colors cursor-pointer"
                                  title="Cancel"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                          {w.status !== 'pending' && w.admin_screenshot && (
                            <button
                              onClick={() => window.open(w.admin_screenshot, '_blank')}
                              className="text-[10px] text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Download className="h-3 w-3" />
                              View Proof
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* RATINGS TAB */}
        {activeTab === 'ratings' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4 gap-4">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide uppercase font-mono flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  <span>Expert Ratings</span>
                </h2>
                <p className="text-xs text-slate-400 font-light">Client reviews and expert performance ratings.</p>
              </div>
            </div>

            {ratings.length === 0 ? (
              <div className="text-center py-16 bg-slate-950/20 border border-slate-800 rounded-xl text-slate-500 text-xs font-light space-y-3">
                <Star className="h-10 w-10 mx-auto text-slate-700" />
                <p>No ratings submitted yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono font-bold uppercase tracking-wider">
                      <th className="p-3">Client</th>
                      <th className="p-3">Expert</th>
                      <th className="p-3">Order</th>
                      <th className="p-3">Score</th>
                      <th className="p-3">Comment</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/20">
                    {ratings.map(r => (
                      <tr key={r.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3 font-bold text-white">{r.client_name}</td>
                        <td className="p-3 text-slate-400">{r.expert_email}</td>
                        <td className="p-3 font-mono text-amber-500">{r.order_id}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} className={`h-3 w-3 ${s <= r.score ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-slate-400 text-[10px] max-w-[200px] truncate">{r.comment || '—'}</td>
                        <td className="p-3 text-slate-400 font-mono text-[10px]">{new Date(r.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-8 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide uppercase font-mono flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-sky-500" />
                <span>Revenue Analytics</span>
              </h2>
            </div>

            {analytics ? (
              <>
                {/* Revenue Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Revenue</p>
                    <p className="text-lg font-black text-white">${analytics.revenue.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Admin Cut (10%)</p>
                    <p className="text-lg font-black text-amber-400">${analytics.revenue.totalAdminCut.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Expert Payouts</p>
                    <p className="text-lg font-black text-emerald-400">${analytics.revenue.totalExpertPayout.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Withdrawn</p>
                    <p className="text-lg font-black text-sky-400">${analytics.revenue.totalWithdrawn.toLocaleString()}</p>
                  </div>
                </div>

                {/* Order Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: 'Total Orders', value: analytics.orders.totalOrders, color: 'text-white' },
                    { label: 'Completed', value: analytics.orders.completedOrders, color: 'text-emerald-400' },
                    { label: 'In Progress', value: analytics.orders.inProgressOrders, color: 'text-sky-400' },
                    { label: 'Pending', value: analytics.orders.pendingOrders, color: 'text-amber-400' },
                    { label: 'Under Review', value: analytics.orders.underReviewOrders, color: 'text-purple-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center">
                      <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                      <p className="text-[9px] text-slate-500 uppercase font-bold">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* User & Rating Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">User Base</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs"><span className="text-slate-400">Clients</span><span className="font-bold text-white">{analytics.users.totalClients}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-slate-400">Experts</span><span className="font-bold text-white">{analytics.users.totalExperts}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-slate-400">Pending Approval</span><span className="font-bold text-amber-400">{analytics.users.pendingExperts}</span></div>
                    </div>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">Ratings</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl font-black text-amber-400">{analytics.ratings.avgRating}</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`h-4 w-4 ${s <= Math.round(Number(analytics.ratings.avgRating)) ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500">{analytics.ratings.totalRatings} total reviews</p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">Expert Performance</p>
                    <div className="space-y-2">
                      {analytics.topExperts.length === 0 ? (
                        <p className="text-[10px] text-slate-500">No data yet</p>
                      ) : analytics.topExperts.map((e: any, i: number) => (
                        <div key={i} className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-white font-bold truncate">{e.name}</span>
                            <span className="text-[10px] font-bold text-emerald-400">${e.earnings.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[9px] text-slate-500">
                            <span>{e.completedOrders}/{e.totalOrders} completed</span>
                            {e.avgRating !== 'N/A' && (
                              <span className="flex items-center gap-0.5">
                                <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />
                                {e.avgRating}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Revenue by Month */}
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-4">Revenue Trend (6 months)</p>
                  <div className="flex items-end gap-2 h-32">
                    {analytics.revenueByMonth.map((m: any, i: number) => {
                      const maxRevenue = Math.max(...analytics.revenueByMonth.map((x: any) => x.revenue), 1);
                      const height = (m.revenue / maxRevenue) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[8px] text-slate-500 font-mono">${m.revenue.toLocaleString()}</span>
                          <div className="w-full flex gap-0.5 items-end" style={{ height: '80px' }}>
                            <div className="flex-1 bg-amber-500/80 rounded-t" style={{ height: `${Math.max(height, 2)}%` }} />
                            <div className="flex-1 bg-emerald-500/60 rounded-t" style={{ height: `${Math.max((m.admin_cut / maxRevenue) * 100, 2)}%` }} />
                          </div>
                          <span className="text-[9px] text-slate-500 font-mono">{m.month}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-4 mt-2 justify-center">
                    <span className="flex items-center gap-1 text-[9px] text-slate-400"><span className="h-2 w-2 bg-amber-500/80 rounded" /> Revenue</span>
                    <span className="flex items-center gap-1 text-[9px] text-slate-400"><span className="h-2 w-2 bg-emerald-500/60 rounded" /> Admin Cut</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-slate-500 text-xs">Loading analytics...</div>
            )}
          </div>
        )}

      </main>

      {/* Applicant Profile Modal */}
      {showApplicantModal && selectedApplicantProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowApplicantModal(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {selectedOrder?.expert_accepted && selectedOrder?.assigned_to === selectedApplicantProfile.expert_email ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-emerald-300">Accepted Expert</h3>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-white">Applicant Profile</h3>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowApplicantModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer bg-transparent border-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</h4>
                <p className="text-sm text-white font-semibold">{selectedApplicantProfile.expert_name}</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</h4>
                <p className="text-xs text-slate-300 font-mono">{selectedApplicantProfile.expert_email}</p>
              </div>
              {selectedApplicantProfile.qualification && (
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Qualification</h4>
                  <p className="text-xs text-slate-300">{selectedApplicantProfile.qualification}</p>
                </div>
              )}
              {selectedApplicantProfile.experience && (
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Experience / Background</h4>
                  <p className="text-xs text-slate-300 bg-slate-950 border border-slate-800 p-2 rounded leading-relaxed whitespace-pre-wrap">{selectedApplicantProfile.experience}</p>
                </div>
              )}
              {selectedApplicantProfile.subjects && selectedApplicantProfile.subjects.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subjects</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedApplicantProfile.subjects.map((s: string, i: number) => (
                      <span key={i} className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] px-2 py-0.5 rounded-full font-bold">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proposal</h4>
                <p className="text-xs text-slate-300 bg-slate-950 border border-slate-800 p-2 rounded leading-relaxed whitespace-pre-wrap font-light italic">{selectedApplicantProfile.proposal}</p>
              </div>
              {selectedApplicantProfile.documents && selectedApplicantProfile.documents.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Documents</h4>
                  <div className="space-y-1">
                    {selectedApplicantProfile.documents.map((doc: any, docIdx: number) => (
                      <div key={docIdx} className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-2 rounded">
                        <Paperclip className="h-3 w-3 text-amber-400 shrink-0" />
                        <button
                          type="button"
                          onClick={() => {
                            if (doc.url) window.open(doc.url, '_blank');
                            else if (doc.data) downloadBase64File(doc.data, doc.name || `document_${docIdx}`);
                          }}
                          className="text-[10px] text-amber-400 hover:text-amber-300 font-mono underline cursor-pointer bg-transparent border-0 p-0 flex-1 text-left"
                        >
                          {doc.name || `Document ${docIdx + 1}`}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-2 border-t border-slate-800">
                {selectedOrder?.expert_accepted && selectedOrder?.assigned_to === selectedApplicantProfile.expert_email ? (
                  <span className="flex-1 bg-emerald-500/20 text-emerald-400 font-extrabold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 border border-emerald-500/30 cursor-default">
                    <CheckCircle className="h-4 w-4" />
                    <span>Already Assigned</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      handleAcceptExpertApplicant(selectedApplicantProfile.expert_email, selectedApplicantProfile.expert_name);
                      setShowApplicantModal(false);
                    }}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Check className="h-4 w-4" />
                    <span>Accept & Assign</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowApplicantModal(false)}
                  className="bg-transparent border border-slate-700/50 text-slate-400 hover:bg-slate-800/50 font-bold py-2 px-3 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
