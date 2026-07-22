import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, Clock, AlertCircle, RefreshCw, Send, CheckCircle2, 
  MessageSquare, Download, FileText, Save, Check, Paperclip, 
  ClipboardList, Sparkles, UserCheck, Calendar, X,
  Coins, DollarSign, TrendingUp
} from 'lucide-react';
import { PageType, Profile, Order as AcademicOrder, Message, Payment } from '../types';
import { fallbackDb } from '../lib/supabase';

interface ExpertProps {
  user: Profile | null;
  setCurrentPage: (page: PageType) => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
}

export default function Expert({ user, setCurrentPage, showToast }: ExpertProps) {
  const [assignedOrders, setAssignedOrders] = useState<AcademicOrder[]>([]);
  const [availableOrders, setAvailableOrders] = useState<AcademicOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'assigned' | 'available' | 'earnings'>('assigned');
  const [selectedOrder, setSelectedOrder] = useState<AcademicOrder | null>(null);
  
  // New simplified workbench sub-tabs
  const [workbenchTab, setWorkbenchTab] = useState<'details' | 'chat'>('details');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Expert earnings state
  const [myPayments, setMyPayments] = useState<Payment[]>([]);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Status & Deliverables state
  const [orderStatus, setOrderStatus] = useState<AcademicOrder['status']>('pending');
  const [deliveryFileName, setDeliveryFileName] = useState('');
  const [selectedDeliveryFile, setSelectedDeliveryFile] = useState<File | null>(null);
  const [internalNotes, setInternalNotes] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDeliverableFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 40 * 1024 * 1024) {
        if (showToast) showToast('File is too large. Max size is 40MB.', 'error');
        return;
      }
      setDeliveryFileName(file.name);
      setSelectedDeliveryFile(file);
      if (showToast) showToast(`File selected: ${file.name}`, 'success');
    }
  };

  // Upload delivery file via backend API (uses service role, not anon key)
  const uploadDeliveryFile = async (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const url = await fallbackDb.uploadFile(base64, file.name);
        resolve(url);
      };
      reader.onerror = () => {
        console.error('Failed to read file');
        resolve(null);
      };
      reader.readAsDataURL(file);
    });
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchExpertOrders();
  }, [user]);

  useEffect(() => {
    if (selectedOrder) {
      fetchMessagesForOrder(selectedOrder.id);
      setOrderStatus(selectedOrder.status);
      setDeliveryFileName(selectedOrder.delivery_name || '');
      setInternalNotes(selectedOrder.internal_notes || '');
    }
  }, [selectedOrder?.id]);

  // Live poll: refresh messages every 5 seconds so expert sees student messages
  useEffect(() => {
    if (!selectedOrder) return;
    const interval = setInterval(() => {
      fetchMessagesForOrder(selectedOrder.id);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedOrder?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchExpertOrders = async () => {
    if (!user) return;
    try {
      const [ordersResult, allPayments] = await Promise.all([
        fallbackDb.getOrders(1, 500),
        fallbackDb.getPayments()
      ]);
      const allOrders = ordersResult.data;
      
      const clean = (str: string) => {
        return str
          .toLowerCase()
          .replace(/dr\.?/g, '')
          .replace(/msc\.?/g, '')
          .replace(/phd\.?/g, '')
          .replace(/bsc\.?/g, '')
          .replace(/\(.*\)/g, '')
          .replace(/[^a-z0-9]/g, '')
          .trim();
      };

      const cleanExpertName = clean(user.full_name);

      // Expert filter: matches user's full name, email, or name parts robustly
      const myAssigned = allOrders.filter(o => {
        if (!o.assigned_to) return false;
        
        const cleanAssigned = clean(o.assigned_to);
        if (cleanAssigned === cleanExpertName) return true;
        
        // Match by email if assigned directly to email
        if (o.assigned_to.toLowerCase() === user.email.toLowerCase()) return true;

        // Substring checks after cleaning
        if (cleanAssigned && cleanExpertName && (cleanAssigned.includes(cleanExpertName) || cleanExpertName.includes(cleanAssigned))) {
          return true;
        }

        return false;
      });

      // Explore/Available orders: unassigned/pending orders (assigned_to is empty/unallocated)
      const openOrders = allOrders.filter(o => !o.assigned_to || o.assigned_to.trim() === '' || o.assigned_to === 'Unallocated');

      setAssignedOrders(myAssigned);
      setAvailableOrders(openOrders);

      // Filter payments that belong to my assigned orders
      const myOrderIds = new Set(myAssigned.map(o => o.id));
      setMyPayments(allPayments.filter(p => myOrderIds.has(p.order_id)));
      
      const currentList = activeTab === 'assigned' ? myAssigned : openOrders;
      
      if (selectedOrder) {
        const refreshedSelected = allOrders.find(o => o.id === selectedOrder.id);
        if (refreshedSelected) {
          setSelectedOrder(refreshedSelected);
        } else {
          setSelectedOrder(currentList.length > 0 ? currentList[0] : null);
        }
      } else if (currentList.length > 0) {
        setSelectedOrder(currentList[0]);
      } else {
        setSelectedOrder(null);
      }
    } catch (e) {
      console.error('Error fetching expert orders:', e);
      if (showToast) showToast('Failed to load assignments.', 'error');
    } finally {
    }
  };



  const handleApplyOrder = async (orderId: string) => {
    if (!user) return;
    setIsApplying(true);
    try {
      // Add expert as applicant — admin must approve before assignment
      const res = await fetch(`/api/orders/${orderId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('ace_scholar_current_user') || '{}').access_token}` },
        body: JSON.stringify({ expert_email: user.email, expert_name: user.full_name }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      await fallbackDb.postMessage({
        order_id: orderId,
        sender_id: user.id,
        sender_name: user.full_name,
        content: `📝 Application submitted: Expert ${user.full_name} has applied for this project. Awaiting admin coordinator approval.`,
        is_admin: true,
      });

      if (showToast) showToast('Application submitted! Awaiting admin approval.', 'success');
      await fetchExpertOrders();
    } catch (e) {
      console.error('Error applying to order:', e);
      if (showToast) showToast('Failed to submit application.', 'error');
    } finally {
      setIsApplying(false);
    }
  };

  // Simple URL-based download — file_url is now a real Supabase Storage public URL
  const downloadFile = (url: string, fileName: string) => {
    if (!url || url === '#') {
      if (showToast) showToast('Input file not available for this order.', 'error');
      return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'input_file';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (showToast) showToast(`Downloading: ${fileName}`, 'success');
  };

  const fetchMessagesForOrder = async (orderId: string) => {
    try {
      const result = await fallbackDb.getMessages(1, 500);
      const allMessages = result.data;
      const thread = allMessages.filter(m => m.order_id === orderId);
      thread.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setMessages(thread);
    } catch (e) {
      console.error('Error fetching messages:', e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !selectedOrder || !user) return;

    setIsSendingMessage(true);
    try {
      const sent = await fallbackDb.postMessage({
        order_id: selectedOrder.id,
        sender_id: user.id,
        sender_name: `${user.full_name} (Expert)`,
        content: typedMessage.trim(),
        is_admin: true,
      });

      if (sent) setMessages(prev => [...prev, sent]);
      setTypedMessage('');

      if (showToast) showToast('Message sent.', 'success');
    } catch (e) {
      console.error(e);
      if (showToast) showToast('Could not send message.', 'error');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleAcceptOffer = async (orderId: string) => {
    try {
      await fallbackDb.updateOrder(orderId, { expert_accepted: true, status: 'in_progress' });
      if (showToast) showToast('Assignment accepted! Active drafting started.', 'success');
      await fetchExpertOrders();
    } catch (e) {
      console.error(e);
      if (showToast) showToast('Failed to accept offer.', 'error');
    }
  };

  const handleDeclineOffer = async (orderId: string) => {
    try {
      const currentOrder = assignedOrders.find(o => o.id === orderId);
      await fallbackDb.updateOrder(orderId, {
        expert_accepted: false,
        status: 'pending',
        assigned_to: '',
        internal_notes: `${currentOrder?.internal_notes || ''}\nOffer declined on ${new Date().toLocaleDateString()}`.trim()
      });
      if (showToast) showToast('Assignment offer declined and released back to coordinators.', 'success');
      setSelectedOrder(null);
      await fetchExpertOrders();
    } catch (e) {
      console.error(e);
      if (showToast) showToast('Failed to decline offer.', 'error');
    }
  };

  const handleSaveOrderSettings = async () => {
    if (!selectedOrder || !user) return;
    setIsSaving(true);

    try {
      const updated = await fallbackDb.updateOrder(selectedOrder.id, {
        status: orderStatus,
        delivery_name: deliveryFileName || undefined,
        internal_notes: internalNotes,
      });
      if (updated) setSelectedOrder(updated);

      // Auto append notification to message board if status changed to delivered
      if (orderStatus === 'delivered' && selectedOrder.status !== 'delivered') {
        await fallbackDb.postMessage({
          order_id: selectedOrder.id,
          sender_name: 'Coordinator Desk',
          sender_id: user.id,
          content: `🎉 [Academic Solution Uploaded] The final deliverables have been attached. Download is now enabled.`,
          is_admin: true,
        });
      }

      if (showToast) showToast('Assignment settings saved.', 'success');
      await fetchExpertOrders();
    } catch (e) {
      console.error(e);
      if (showToast) showToast('Failed to save assignment changes.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: AcademicOrder['status']) => {
    switch (status) {
      case 'pending':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Allocation Pending</span>;
      case 'in_progress':
        return <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Active Drafting</span>;
      case 'under_review':
        return <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Review Phase</span>;
      case 'delivered':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Completed Solution</span>;
      case 'revision_requested':
        return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Revision Requested</span>;
      default:
        return <span className="bg-slate-700 text-slate-300 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  // Restrict access to experts only
  const isUserExpert = user && user.role === 'expert';
  if (!isUserExpert) {
    return (
      <div className="bg-[#0F172A] text-slate-100 min-h-[85vh] flex items-center justify-center font-sans px-4">
        <div className="max-w-md w-full text-center space-y-4 bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
          <GraduationCap className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Access Restricted</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Unauthorized. This portal is strictly reserved for verified Ace Scholar graduate experts. Please sign in with expert credentials.
          </p>
          <button
            onClick={() => setCurrentPage('login')}
            className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-bold text-xs py-2.5 px-6 rounded-lg transition-colors cursor-pointer"
          >
            <span>Back to Sign In</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0F172A] text-slate-100 min-h-[85vh] font-sans" id="expert-dashboard">
      
      {/* Top Banner Status */}
      <div className="bg-slate-950 border-b border-slate-900/80 py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
              <UserCheck className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">Verified Specialist Workspace</span>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">{user.full_name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Academic Desk Link:</span>
            <span className="text-xs font-mono bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-850 text-slate-300">
              {user.email}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        
        {/* Core Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800/60 p-4 rounded-xl flex items-center justify-between shadow-md">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">My Active Assignments</span>
              <p className="text-lg sm:text-2xl font-black text-white">{assignedOrders.length}</p>
            </div>
            <ClipboardList className="h-5 w-5 text-amber-400" />
          </div>
          <div className="bg-slate-900 border border-slate-800/60 p-4 rounded-xl flex items-center justify-between shadow-md">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">In Progress</span>
              <p className="text-lg sm:text-2xl font-black text-white">
                {assignedOrders.filter(o => o.status === 'in_progress' || o.status === 'revision_requested').length}
              </p>
            </div>
            <Clock className="h-5 w-5 text-sky-400" />
          </div>
          <div className="bg-slate-900 border border-slate-800/60 p-4 rounded-xl flex items-center justify-between shadow-md">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Completed</span>
              <p className="text-lg sm:text-2xl font-black text-white">
                {assignedOrders.filter(o => o.status === 'delivered').length}
              </p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="bg-slate-900 border border-slate-800/60 p-4 rounded-xl flex items-center justify-between shadow-md">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Available student orders</span>
              <p className="text-lg sm:text-2xl font-black text-amber-400">
                {availableOrders.length}
              </p>
            </div>
            <Sparkles className="h-5 w-5 text-amber-400" />
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-850 mb-6 gap-2">
          <button
            onClick={() => {
              setActiveTab('assigned');
              setSelectedOrder(assignedOrders[0] || null);
            }}
            className={`py-3 px-4 sm:px-6 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'assigned'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            <span>My Assigned Projects ({assignedOrders.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('available');
              setSelectedOrder(availableOrders[0] || null);
            }}
            className={`py-3 px-4 sm:px-6 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'available'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Explore Available Student Orders ({availableOrders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className={`py-3 px-4 sm:px-6 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'earnings'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Coins className="h-4 w-4" />
            <span>My Earnings ({myPayments.length})</span>
          </button>
        </div>

        {((activeTab === 'assigned' ? assignedOrders : availableOrders).length === 0) ? (
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-12 text-center max-w-2xl mx-auto space-y-4">
            <GraduationCap className="h-10 w-10 text-slate-500 mx-auto" />
            <h2 className="text-lg font-bold text-white">
              {activeTab === 'assigned' ? 'No active assignments allocated yet' : 'No available student orders'}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {activeTab === 'assigned' 
                ? 'Check the "Explore Available Student Orders" tab to bid and apply on active unassigned requests placed by students.' 
                : 'All student projects have currently been claimed. When new custom tasks, mathematics solutions, or essays are submitted by students, they will instantly display here.'}
            </p>
            <button 
              onClick={fetchExpertOrders}
              className="inline-flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs py-2 px-4 rounded-lg cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Force Synchronize</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Ledger Stack */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {activeTab === 'assigned' ? 'Assigned work ledgers' : 'Available student orders'} ({(activeTab === 'assigned' ? assignedOrders : availableOrders).length})
                </span>
                <button 
                  onClick={fetchExpertOrders} 
                  className="p-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-750 text-slate-400 hover:text-white rounded transition-colors cursor-pointer shrink-0"
                  title="Synchronize Database"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                {(activeTab === 'assigned' ? assignedOrders : availableOrders).map(order => {
                  const isSelected = selectedOrder?.id === order.id;
                  const expertHasApplied = order.applicants?.some(a => a.expert_email.toLowerCase() === user.email.toLowerCase());
                  // Parse budget for net earnings display
                  const usdMatch = order.budget_range?.match(/\$(\d+)\s*USD/);
                  const grossUSD = usdMatch ? Number(usdMatch[1]) : null;
                  const netUSD = grossUSD ? (grossUSD * 0.9).toFixed(0) : null;
                  // Deadline urgency
                  const hoursUntilDeadline = (new Date(order.deadline).getTime() - Date.now()) / 3600000;
                  const isUrgent = hoursUntilDeadline < 24;
                  const isSoon = hoursUntilDeadline < 72;
                  
                  return (
                    <div
                      key={order.id}
                      onClick={() => {
                        setSelectedOrder(order);
                        if (activeTab === 'assigned') {
                          setOrderStatus(order.status);
                          setDeliveryFileName(order.delivery_name || '');
                          setInternalNotes(order.internal_notes || '');
                        }
                      }}
                      className={`rounded-xl border text-left cursor-pointer transition-all overflow-hidden ${
                        isSelected 
                          ? 'bg-slate-850 border-amber-500/80 shadow-lg shadow-amber-500/[0.03]' 
                          : 'bg-slate-900/80 border-slate-850 hover:border-slate-800'
                      }`}
                    >
                      {/* Urgency strip */}
                      {activeTab === 'available' && isUrgent && (
                        <div className="bg-rose-500/20 border-b border-rose-500/30 px-3 py-1 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                          <span className="text-[9px] font-extrabold text-rose-400 uppercase tracking-wider">URGENT — Deadline in {Math.ceil(hoursUntilDeadline)}h</span>
                        </div>
                      )}
                      {activeTab === 'available' && isSoon && !isUrgent && (
                        <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 py-1 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                          <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">Due soon — {Math.ceil(hoursUntilDeadline)}h</span>
                        </div>
                      )}
                      <div className="p-4">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-bold font-mono text-slate-500">{order.id.toUpperCase()}</span>
                          <span className="bg-slate-800 text-slate-400 text-[9px] px-1.5 py-0.5 rounded font-medium">{order.academic_level}</span>
                        </div>
                        {activeTab === 'assigned' ? (
                          getStatusBadge(order.status)
                        ) : expertHasApplied ? (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Applied</span>
                        ) : (
                          <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Apply Now</span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-white line-clamp-1">{order.subject}</h3>
                      <span className="text-[10px] text-slate-500 font-medium">{order.service_type}</span>
                      <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 leading-normal font-light">
                        {order.description || 'No description provided.'}
                      </p>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/50 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Due: {new Date(order.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        </span>
                        <div className="text-right">
                          <span className="text-amber-400 font-bold">{order.budget_range?.split('(')[0]?.trim()}</span>
                          {netUSD && (
                            <span className="block text-[9px] text-emerald-400 font-bold">Your cut: ${netUSD} USD</span>
                          )}
                        </div>
                      </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Detailed Workbench */}
            {selectedOrder && (
              <div className="lg:col-span-7 space-y-6">
                
                {/* Core Specification Tab */}
                <div className="bg-slate-900 border border-slate-850 p-5 sm:p-6 rounded-2xl space-y-5 shadow-xl">
                  
                  {/* Detailed Title */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 border-b border-slate-850 pb-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                        {activeTab === 'assigned' ? 'Active Workspace' : 'Student Request Details'}
                      </span>
                      <h2 className="text-lg font-bold text-white tracking-tight">{selectedOrder.subject}</h2>
                      <span className="text-xs text-slate-400">{selectedOrder.service_type} &bull; {selectedOrder.academic_level}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase">Assignment Deadline</span>
                      <span className="text-xs font-semibold text-rose-400 font-mono flex items-center gap-1.5 mt-0.5 justify-end">
                        <Clock className="h-3.5 w-3.5" />
                        {selectedOrder.deadline.replace('T', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Inner Workbench Tab Menu (For Assigned Projects only) */}
                  {activeTab === 'assigned' && selectedOrder.expert_accepted !== false && (
                    <div className="flex bg-slate-950 p-1 rounded-lg gap-1 border border-slate-850 shrink-0">
                      <button
                        onClick={() => setWorkbenchTab('details')}
                        className={`flex-1 text-center py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          workbenchTab === 'details'
                            ? 'bg-slate-850 text-white shadow'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                        }`}
                      >
                        Details & Materials
                      </button>
                      <button
                        onClick={() => setWorkbenchTab('chat')}
                        className={`flex-1 text-center py-2 rounded-md text-xs font-bold transition-all cursor-pointer flex justify-center items-center gap-1.5 ${
                          workbenchTab === 'chat'
                            ? 'bg-slate-850 text-white shadow'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                        }`}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Chat with Admin</span>
                        {messages.length > 0 && (
                          <span className="bg-amber-500 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                            {messages.length}
                          </span>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Body description & instructions */}
                  {activeTab === 'available' || workbenchTab === 'details' ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Project Specification Requirements</h4>
                        <p className="text-xs text-slate-200 bg-slate-950 border border-slate-850 p-3.5 rounded-lg leading-relaxed mt-1.5 whitespace-pre-wrap font-light">
                          {selectedOrder.description}
                        </p>
                      </div>

                      {selectedOrder.special_instructions && (
                        <div>
                          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Methodology & Formatting Guidelines</h4>
                          <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-lg text-xs text-amber-400 leading-normal mt-1 font-light">
                            {selectedOrder.special_instructions}
                          </div>
                        </div>
                      )}

                      {/* Associated client uploaded files */}
                      {selectedOrder.file_name && (
                        <div className="bg-slate-950 border border-slate-850 rounded-lg p-3 flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-amber-500 shrink-0" />
                            <span className="text-slate-300 truncate max-w-xs">{selectedOrder.file_name}</span>
                          </div>
                          <button
                            onClick={() => downloadFile(
                              selectedOrder.file_url || '',
                              selectedOrder.file_name || 'input_file'
                            )}
                            className="text-[10px] text-amber-500 hover:text-amber-400 font-bold flex items-center space-x-1.5 hover:underline cursor-pointer bg-transparent border-0"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Fetch Input File</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Embedded Chat view inside Workbench Tab */
                    <div className="flex flex-col h-[340px] bg-slate-950 border border-slate-850 rounded-xl overflow-hidden">
                      
                      {/* Message ledger */}
                      <div className="flex-grow overflow-y-auto p-4 space-y-3">
                        {/* Admin-only notice */}
                        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2 flex items-center gap-2 shrink-0">
                          <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                          <p className="text-[9px] text-slate-400 font-medium">Messages go to <span className="text-amber-400 font-bold">Admin Coordinator</span> only. Admin relays info to the student.</p>
                        </div>
                        {messages.length === 0 ? (
                          <div className="text-center py-8 space-y-2">
                            <MessageSquare className="h-8 w-8 text-slate-600 mx-auto" />
                            <p className="text-xs text-slate-500">No admin chat history yet.</p>
                            <p className="text-[10px] text-slate-600 leading-normal max-w-xs mx-auto font-light">
                              Type a message below to coordinate with the Admin coordinator.
                            </p>
                          </div>
                        ) : (
                          messages.map((msg) => {
                            const isMe = msg.sender_id === user.id || msg.sender_name.includes(user.full_name);
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
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Send Form */}
                      <form onSubmit={handleSendMessage} className="p-2 border-t border-slate-850 bg-slate-950 flex items-center space-x-2 shrink-0">
                        <input
                          type="text"
                          value={typedMessage}
                          onChange={(e) => setTypedMessage(e.target.value)}
                          placeholder="Message to Admin coordinator..."
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

                  {/* TAB 1 Logic: Expert Workbench Status Update Panel */}
                  {activeTab === 'assigned' && (
                    selectedOrder.expert_accepted === false ? (
                      <div className="border-t border-slate-850 pt-5 space-y-4">
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-center space-y-3">
                          <AlertCircle className="h-6 w-6 text-amber-500 mx-auto" />
                          <div className="space-y-1">
                            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Assigned Project Offer Pending</h3>
                            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                              You have been nominated for this academic assignment by the central Coordinator. Review the guidelines above and confirm acceptance.
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1.5">
                            <button
                              onClick={() => handleAcceptOffer(selectedOrder.id)}
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-2 px-5 rounded-lg transition-colors flex items-center justify-center space-x-1.5 shadow-md hover:shadow-emerald-500/10 cursor-pointer"
                            >
                              <Check className="h-4 w-4" />
                              <span>Accept Offer & Start Work</span>
                            </button>
                            <button
                              onClick={() => handleDeclineOffer(selectedOrder.id)}
                              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs py-2 px-5 rounded-lg transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                            >
                              <X className="h-4 w-4" />
                              <span>Decline Offer</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ACTIVE WORKBENCH SIMPLIFIED QUICK ACTION FOOTER */
                      <div className="border-t border-slate-850 pt-5 space-y-4">
                        
                        {/* Status timeline progress */}
                        <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex items-center justify-between text-[11px] text-slate-400">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-semibold text-slate-500">Milestone Stage:</span>
                            {selectedOrder.status === 'delivered' ? (
                              <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                                <Check className="h-3 w-3" /> Completed & Solutions Synced
                              </span>
                            ) : selectedOrder.status === 'under_review' ? (
                              <span className="text-purple-400 font-semibold flex items-center gap-1 animate-pulse">
                                Under Coordinator Review
                              </span>
                            ) : selectedOrder.status === 'revision_requested' ? (
                              <span className="text-rose-400 font-bold flex items-center gap-1">
                                Revision Active
                              </span>
                            ) : (
                              <span className="text-sky-400 font-semibold flex items-center gap-1">
                                Active Drafting in Progress
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="text-[10px] text-amber-500 hover:text-amber-400 font-bold hover:underline cursor-pointer bg-transparent border-none p-0"
                          >
                            {showAdvanced ? 'Hide Advanced Options' : 'Show Manual Overrides'}
                          </button>
                        </div>

                        {/* Collapsible Advanced Form */}
                        {showAdvanced && (
                          <div className="bg-slate-950/50 border border-slate-850 rounded-xl p-4 space-y-3.5 animate-none">
                            <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-1.5">Manual Override Panel</h4>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="block text-[9px] font-bold text-slate-400 uppercase">Status Lifecycle</label>
                                <select
                                  value={orderStatus}
                                  onChange={(e) => setOrderStatus(e.target.value as AcademicOrder['status'])}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-slate-100 text-xs outline-none focus:border-emerald-500 transition-colors"
                                >
                                  <option value="in_progress">Active Drafting</option>
                                  <option value="under_review">Review Phase</option>
                                  <option value="delivered">Completed & Delivered</option>
                                  <option value="revision_requested">Revision Cycle</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[9px] font-bold text-slate-400 uppercase">Attached Deliverable Link / Name</label>
                                <input
                                  type="text"
                                  placeholder="File name or url..."
                                  value={deliveryFileName}
                                  onChange={(e) => setDeliveryFileName(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-slate-100 text-xs outline-none focus:border-emerald-500 transition-colors font-mono"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[9px] font-bold text-slate-400 uppercase">Work Journal Notes (Private to Coordinators)</label>
                              <textarea
                                rows={2}
                                value={internalNotes}
                                onChange={(e) => setInternalNotes(e.target.value)}
                                placeholder="Log stress calculations, formulas utilized, or comments for the coordinator desk..."
                                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-lg p-2.5 text-slate-100 text-xs outline-none transition-colors"
                              />
                            </div>

                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={handleSaveOrderSettings}
                              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs py-2 px-5 rounded-lg transition-all flex items-center justify-center space-x-1.5 shadow cursor-pointer"
                            >
                              <Save className="h-3.5 w-3.5" />
                              <span>Save Overrides</span>
                            </button>
                          </div>
                        )}

                        {/* HIGH-IMPACT SIMPLIFIED QUICK ACTIONS (THE CORE OF REDUCED COMPLEXITY) */}
                        <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="space-y-1 text-center sm:text-left">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                              {selectedOrder.status === 'delivered' ? 'Project Completed' : 'Task Dispatch Desk'}
                            </h4>
                            <p className="text-[10px] text-slate-400 max-w-sm leading-normal">
                              {selectedOrder.status === 'delivered' 
                                ? 'The final solution is submitted. Students can securely download files upon coordinator dispatch confirmation.'
                                : 'Select a local document or code asset from your device to dispatch as the final solution deliverable.'}
                            </p>
                          </div>

                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleDeliverableFileChange}
                            className="hidden"
                          />

                          {selectedOrder.status === 'under_review' ? (
                            <div className="bg-purple-500/10 border border-purple-500/20 px-4 py-2.5 rounded-xl text-purple-300 text-xs font-bold flex items-center gap-2">
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              <span>Submitted for Admin Review — Awaiting coordinator approval.</span>
                            </div>
                          ) : selectedOrder.status === 'delivered' ? (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-lg text-emerald-400 text-xs font-bold flex items-center gap-1.5 shrink-0">
                              <Check className="h-4 w-4" />
                              <span>Completed — Admin approved & released to student.</span>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                              {!deliveryFileName ? (
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="w-full sm:w-auto bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold px-5 py-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 cursor-pointer border border-slate-750"
                                >
                                  <Paperclip className="h-4 w-4 text-amber-500" />
                                  <span>Select Completed Solution File</span>
                                </button>
                              ) : (
                                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                                  <span className="text-xs text-slate-300 font-mono flex items-center gap-1.5">
                                    <Paperclip className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                    <span className="truncate max-w-[180px]">{deliveryFileName}</span>
                                  </span>
                                  <button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={async () => {
                                      if (!deliveryFileName.trim()) {
                                        if (showToast) showToast('Please select a file or enter a filename before submitting.', 'error');
                                        return;
                                      }
                                      setIsSaving(true);
                                      try {
                                        if (showToast) showToast('Submitting to Admin for review...', 'success');

                                        // Try Supabase Storage first; fall back to base64 inline for files ≤ 5 MB
                                        let deliveryUrl = '#';
                                        if (selectedDeliveryFile) {
                                          const url = await uploadDeliveryFile(selectedDeliveryFile);
                                          if (url) deliveryUrl = url;
                                          // If API upload failed and file is small enough, store as base64
                                          if (deliveryUrl === '#' && selectedDeliveryFile.size <= 5 * 1024 * 1024) {
                                            await new Promise<void>((resolve) => {
                                              const reader = new FileReader();
                                              reader.onloadend = () => {
                                                deliveryUrl = reader.result as string;
                                                resolve();
                                              };
                                              reader.readAsDataURL(selectedDeliveryFile);
                                            });
                                          }
                                        }

                                        // Use PUT /api/orders/:id — atomic targeted update
                                        const submissionName = deliveryFileName || selectedDeliveryFile?.name || 'solution';
                                        const updated = await fallbackDb.updateOrder(selectedOrder.id, {
                                          status: 'under_review',
                                          expert_submission_name: submissionName,
                                          expert_submission_url: deliveryUrl,
                                          internal_notes: `Expert submitted for admin review on ${new Date().toLocaleDateString()}`,
                                        });
                                        if (updated) setSelectedOrder(updated);

                                        // Notify admin via chat
                                        await fallbackDb.postMessage({
                                          order_id: selectedOrder.id,
                                          sender_name: `${user.full_name} (Expert)`,
                                          sender_id: user.id,
                                          content: `📤 [Submission for Review] I have uploaded the completed solution file "${submissionName}". Please review and notify the student when ready.`,
                                          is_admin: true,
                                        });

                                        setOrderStatus('under_review');

                                        if (showToast) showToast('Assignment submitted for Admin review!', 'success');
                                        await fetchExpertOrders();
                                      } catch (err) {
                                        console.error(err);
                                        if (showToast) showToast('Failed to submit for review.', 'error');
                                      } finally {
                                        setIsSaving(false);
                                      }
                                    }}
                                    className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs py-3 px-6 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg hover:shadow-amber-500/10 cursor-pointer"
                                  >
                                    {isSaving ? (
                                      <>
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        <span>Uploading...</span>
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="h-4 w-4 text-slate-950" />
                                        <span>Submit for Admin Review</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                      </div>
                    )
                  )}

                  {/* TAB 2 Logic: Instant Claim Form */}
                  {activeTab === 'available' && (
                    <div className="border-t border-slate-850 pt-5 space-y-4">
                      <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="space-y-1 text-center sm:text-left">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 justify-center sm:justify-start">
                            <Sparkles className="h-4 w-4 text-amber-400" />
                            <span>Instant Project Claim</span>
                          </h4>
                          <p className="text-[10px] text-slate-400 max-w-sm leading-normal font-light">
                            You can bypass the coordination bidding queue and claim this project immediately. The task will be assigned to your active drafts instantly.
                          </p>
                        </div>

                        <button
                          onClick={() => handleApplyOrder(selectedOrder.id)}
                          disabled={isApplying}
                          className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs py-3 px-6 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg hover:shadow-amber-500/10 cursor-pointer"
                        >
                          {isApplying ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              <span>Submitting Application...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-slate-950" />
                              <span>Apply for This Project</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            )}

          </div>
        )}

        {/* EARNINGS TAB */}
        {activeTab === 'earnings' && (
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 sm:p-8 space-y-6">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4 gap-4">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide uppercase font-mono flex items-center gap-2">
                  <Coins className="h-5 w-5 text-amber-500" />
                  <span>My Earnings Ledger</span>
                </h2>
                <p className="text-xs text-slate-400 font-light">Your 90% share from all settled and paid academic assignments.</p>
              </div>
              <button
                onClick={fetchExpertOrders}
                className="p-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Total Earnings (USD)</span>
                  <DollarSign className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <p className="text-lg font-extrabold text-white">
                  {myPayments.filter(p => p.currency === 'USD').reduce((s, p) => s + p.expert_amount, 0).toLocaleString()} USD
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  {myPayments.filter(p => p.currency !== 'USD').reduce((s, p) => s + p.expert_amount, 0).toLocaleString()} ETB
                </p>
              </div>
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Settled Payments</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <p className="text-lg font-extrabold text-emerald-400">{myPayments.length}</p>
                <p className="text-xs text-slate-500 font-light">Transactions recorded</p>
              </div>
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Completed Projects</span>
                  <TrendingUp className="h-3.5 w-3.5 text-sky-400" />
                </div>
                <p className="text-lg font-extrabold text-sky-400">
                  {assignedOrders.filter(o => o.status === 'delivered').length}
                </p>
                <p className="text-xs text-slate-500 font-light">Delivered to students</p>
              </div>
            </div>

            {/* Earnings Table */}
            {myPayments.length === 0 ? (
              <div className="text-center py-16 bg-slate-950/20 border border-slate-850 rounded-xl text-slate-500 text-xs font-light space-y-3">
                <Coins className="h-10 w-10 mx-auto text-slate-700" />
                <p>No settled payments yet. Complete and deliver assignments to see earnings here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-850 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-850 font-mono font-bold uppercase tracking-wider">
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Payment ID</th>
                      <th className="p-3">Gross Amount</th>
                      <th className="p-3">Your Share (90%)</th>
                      <th className="p-3">Method</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60 bg-slate-950/20">
                    {myPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3 font-mono text-amber-500 font-bold">{p.order_id}</td>
                        <td className="p-3 font-mono text-slate-400 text-[10px]">{p.id}</td>
                        <td className="p-3 font-bold text-white">{p.amount.toLocaleString()} {p.currency}</td>
                        <td className="p-3 text-emerald-400 font-extrabold font-mono text-sm">+{p.expert_amount.toLocaleString()} {p.currency}</td>
                        <td className="p-3 uppercase font-mono text-slate-400">{p.provider_id}</td>
                        <td className="p-3 text-slate-400 font-mono text-[10px]">
                          {new Date(p.created_at).toLocaleDateString()} {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
