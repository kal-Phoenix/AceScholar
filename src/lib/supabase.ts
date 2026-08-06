import { Profile, Order, Message, ContactMessage, Payment, Withdrawal, Rating, Notification } from '../types';
import { createClient, Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

let currentSession: Session | null = null;

export const setSession = (session: Session | null) => { currentSession = session; };

export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    if (currentSession?.access_token) {
      headers['Authorization'] = `Bearer ${currentSession.access_token}`;
      return headers;
    }
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
        return headers;
      }
    }
  } catch (e) {
    console.error('Error reading auth headers:', e);
  }
  return headers;
};

/**
 * Supabase-backed data API.
 *
 * Most reads and writes go through the Express backend (/api/*).
 * The backend owns the Supabase service-role client and enforces
 * business logic / RLS bypass where needed.
 *
 * Some read paths use the Supabase JS client directly (with RLS).
 * Write paths (create/update orders) go through the server API for
 * reliable JWT-based auth via the Authorization header.
 */
export const fallbackDb = {
  // ─────────────────────────────────────────────────────────────────────────
  // PROFILES
  // ─────────────────────────────────────────────────────────────────────────

  getProfiles: async (page = 1, limit = 50): Promise<{ data: Profile[]; total: number; page: number; limit: number }> => {
    try {
      const res = await fetch(`/api/profiles?page=${page}&limit=${limit}`, { headers: await getAuthHeaders() });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      console.error('getProfiles failed:', e);
      return { data: [], total: 0, page, limit };
    }
  },

  setProfiles: async (profiles: Profile[]): Promise<void> => {
    try {
      await fetch('/api/profiles/sync', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(profiles),
      });
    } catch (e) {
      console.error('setProfiles sync failed:', e);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ORDERS
  // ─────────────────────────────────────────────────────────────────────────

  getOrders: async (page = 1, limit = 50): Promise<{ data: Order[]; total: number; page: number; limit: number }> => {
    if (!supabase) {
      console.error('getOrders failed: Supabase client not configured');
      return { data: [], total: 0, page, limit };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: [], total: 0, page, limit };

      const role = (user.user_metadata?.role as string) || 'client';
      const offset = (page - 1) * limit;

      // Client: RLS enforces auth.uid() = client_id
      if (role === 'client') {
        const { count } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('client_email', user.email?.toLowerCase() || '');

        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('client_email', user.email?.toLowerCase() || '')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;
        return { data: (data as Order[]) || [], total: count || 0, page, limit };
      }

      // Admin: RLS allows full access via profile role check
      if (role === 'admin') {
        const { count } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });

        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;
        return { data: (data as Order[]) || [], total: count || 0, page, limit };
      }

      // Expert: needs RLS policy (see supabase-expert-rls.sql)
      // Query unallocated + assigned orders, filter in JS
      const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || '';

      const { data: unallocated } = await supabase
        .from('orders')
        .select('*')
        .or('assigned_to.is.null,assigned_to.eq.,assigned_to.eq.Unallocated')
        .order('created_at', { ascending: false });

      const { data: assigned } = await supabase
        .from('orders')
        .select('*')
        .eq('assigned_to', fullName)
        .order('created_at', { ascending: false });

      // Deduplicate
      const allMap = new Map<string, Order>();
      for (const o of [...(unallocated || []), ...(assigned || [])]) {
        allMap.set(o.id, o as Order);
      }
      const all = Array.from(allMap.values());

      // Filter: expert can see unallocated or assigned to them
      const filtered = all.filter((o: Order) => {
        if (!o.assigned_to || o.assigned_to.trim() === '' || o.assigned_to === 'Unallocated') return true;
        if (o.assigned_to.toLowerCase() === user.email?.toLowerCase()) return true;
        if (o.assigned_to.toLowerCase().trim() === fullName.toLowerCase().trim()) return true;
        return false;
      });

      const total = filtered.length;
      const paginated = filtered.slice(offset, offset + limit);
      return { data: paginated, total, page, limit };
    } catch (e) {
      console.error('getOrders failed:', e);
      return { data: [], total: 0, page, limit };
    }
  },

  /**
   * Persist a full order list to Supabase via backend upsert.
   * Used by components that manage order state locally then flush to backend.
   */
  setOrders: async (orders: Order[]): Promise<void> => {
    try {
      await fetch('/api/orders/sync', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(orders),
      });
    } catch (e) {
      console.error('setOrders sync failed:', e);
    }
  },

  /**
   * Create a new order directly via Supabase client.
   * Uses getSession() (local storage) instead of getUser() (network call)
   * for reliable auth — avoids Fly proxy HTTP/2 body forwarding issues.
   */
  createOrder: async (order: Omit<Order, 'created_at'>): Promise<Order | null> => {
    if (!supabase) {
      console.error('createOrder failed: Supabase client not configured');
      return null;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Authentication required');

      const user = session.user;
      const sanitize = (s: string, max: number) => (s || '').trim().replace(/<[^>]*>/g, '').replace(/\0/g, '').substring(0, max);

      const record: Record<string, any> = {
        id: (order.id || '').replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 80) || 'ord-' + crypto.randomUUID().replace(/-/g, '').substring(0, 12),
        client_id: user.id,
        client_name: sanitize(order.client_name, 100) || 'Anonymous',
        client_email: user.email?.toLowerCase().trim() || '',
        service_type: sanitize(order.service_type, 120) || 'General / Unspecified',
        subject: sanitize(order.subject, 200) || 'General / Unspecified',
        academic_level: sanitize(order.academic_level, 500) || 'Undergraduate',
        deadline: order.deadline || new Date(Date.now() + 3 * 86400 * 1000).toISOString(),
        description: sanitize(order.description, 8000),
        special_instructions: order.special_instructions ? sanitize(order.special_instructions, 3000) : null,
        budget_range: sanitize(order.budget_range, 60) || '$50-$100',
        status: order.status || 'pending',
        created_at: new Date().toISOString(),
        payment_status: ['pending', 'approved', 'rejected'].includes(order.payment_status || '') ? order.payment_status : 'pending',
        payment_method: order.payment_method ? sanitize(String(order.payment_method), 120) : null,
        payment_screenshot: order.payment_screenshot || null,
        payment_ref_number: order.payment_ref_number ? sanitize(String(order.payment_ref_number), 100) : null,
        payment_id: order.payment_id ? sanitize(String(order.payment_id), 80) : null,
        total_amount: typeof order.total_amount === 'number' && order.total_amount >= 0 ? order.total_amount : 100,
        currency: (order.currency || 'USD').toUpperCase().substring(0, 10),
        applicants: Array.isArray(order.applicants) ? order.applicants.slice(0, 100) : [],
        internal_notes: order.internal_notes ? sanitize(order.internal_notes, 10000) : null,
        agreed_price: typeof order.agreed_price === 'number' ? order.agreed_price : null,
        preview_url: order.preview_url || null,
        preview_name: order.preview_name ? sanitize(order.preview_name, 200) : null,
        payment_awaiting: Boolean(order.payment_awaiting) || false,
        payment_method_type: ['bank_transfer', 'crypto', 'card'].includes(order.payment_method_type || '') ? order.payment_method_type : null,
        crypto_discount_applied: Boolean(order.crypto_discount_applied) || false,
        delivery_released: Boolean(order.delivery_released) || false,
        expert_submission_url: order.expert_submission_url || null,
        expert_submission_name: order.expert_submission_name ? sanitize(order.expert_submission_name, 200) : null,
        admin_screenshots: Array.isArray(order.admin_screenshots) ? order.admin_screenshots : null,
        file_url: order.file_url || null,
        file_name: order.file_name ? sanitize(order.file_name, 200) : null,
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([record])
        .select()
        .single();

      if (error) {
        console.error('createOrder Supabase error:', error.message);
        throw new Error(error.message || 'Failed to create order');
      }

      return data as Order;
    } catch (e) {
      console.error('createOrder failed:', e);
      throw e;
    }
  },

  /**
   * Update a single order directly via Supabase client.
   */
  updateOrder: async (orderId: string, updates: Partial<Order>): Promise<Order | null> => {
    if (!supabase) {
      console.error('updateOrder failed: Supabase client not configured');
      return null;
    }
    try {
      const WRITABLE = new Set([
        'status', 'assigned_to', 'expert_accepted', 'delivery_url', 'delivery_name',
        'expert_submission_url', 'expert_submission_name', 'description',
        'payment_status', 'payment_method', 'payment_screenshot', 'payment_ref_number',
        'internal_notes', 'file_url', 'file_name', 'applicants',
        'agreed_price', 'preview_url', 'preview_name', 'payment_awaiting',
        'payment_method_type', 'crypto_discount_applied', 'delivery_released',
        'admin_screenshots', 'total_amount', 'currency',
      ]);
      const safe: Record<string, any> = {};
      for (const [k, v] of Object.entries(updates)) {
        if (WRITABLE.has(k) && v !== undefined) safe[k] = v;
      }
      if (Object.keys(safe).length === 0) return null;

      const { data, error } = await supabase
        .from('orders')
        .update(safe)
        .eq('id', orderId)
        .select()
        .single();
      if (error) {
        console.error('updateOrder Supabase error:', error.message);
        return null;
      }
      return data as Order;
    } catch (e) {
      console.error('updateOrder failed:', e);
      return null;
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MESSAGES
  // ─────────────────────────────────────────────────────────────────────────

  getMessages: async (page = 1, limit = 100): Promise<{ data: Message[]; total: number; page: number; limit: number }> => {
    try {
      const res = await fetch(`/api/messages?page=${page}&limit=${limit}`, { headers: await getAuthHeaders() });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      console.error('getMessages failed:', e);
      return { data: [], total: 0, page, limit };
    }
  },

  getMessagesByOrder: async (orderId: string): Promise<Message[]> => {
    try {
      const res = await fetch(`/api/messages/${orderId}`, { headers: await getAuthHeaders() });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      console.error('getMessagesByOrder failed:', e);
      return [];
    }
  },

  /**
   * Post a single new message via backend POST.
   */
  postMessage: async (message: Omit<Message, 'id' | 'created_at'>): Promise<Message | null> => {
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(message),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      console.error('postMessage failed:', e);
      return null;
    }
  },

  setMessages: async (messages: Message[]): Promise<void> => {
    try {
      await fetch('/api/messages/sync', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(messages),
      });
    } catch (e) {
      console.error('setMessages sync failed:', e);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CONTACT MESSAGES
  // ─────────────────────────────────────────────────────────────────────────

  getContactMessages: async (page = 1, limit = 50): Promise<{ data: ContactMessage[]; total: number; page: number; limit: number }> => {
    try {
      const res = await fetch(`/api/contacts?page=${page}&limit=${limit}`, { headers: await getAuthHeaders() });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      console.error('getContactMessages failed:', e);
      return { data: [], total: 0, page, limit };
    }
  },

  /**
   * Submit a new public contact message via backend POST.
   */
  postContactMessage: async (message: Omit<ContactMessage, 'id' | 'is_read' | 'created_at'>): Promise<ContactMessage | null> => {
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(message),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      console.error('postContactMessage failed:', e);
      return null;
    }
  },

  setContactMessages: async (messages: ContactMessage[]): Promise<void> => {
    try {
      await fetch('/api/contacts/sync', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(messages),
      });
    } catch (e) {
      console.error('setContactMessages sync failed:', e);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // AUTH — Password Reset
  // ─────────────────────────────────────────────────────────────────────────

  forgotPassword: async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Failed to send reset email' };
      return { success: true };
    } catch (e) {
      console.error('forgotPassword failed:', e);
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  resetPassword: async (accessToken: string, refreshToken: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Failed to reset password' };
      return { success: true };
    } catch (e) {
      console.error('resetPassword failed:', e);
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FILE UPLOAD
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Upload a file (base64 data URL) to the server, which saves it to Supabase Storage.
   * Returns the public URL of the uploaded file.
   */
  uploadFile: async (fileData: string, fileName?: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          file: fileData,
          fileName: fileName || `upload-${Date.now()}.png`,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      return data.url || null;
    } catch (e) {
      console.error('uploadFile failed:', e);
      return null;
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PAYMENTS
  // ─────────────────────────────────────────────────────────────────────────

  getPayments: async (): Promise<Payment[]> => {
    try {
      const res = await fetch('/api/payments', { headers: await getAuthHeaders() });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      console.error('getPayments failed:', e);
      return [];
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // WITHDRAWALS
  // ─────────────────────────────────────────────────────────────────────────

  requestWithdrawal: async (data: { amount: number; method: string; account_details: string; currency?: string }): Promise<Withdrawal | null> => {
    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      console.error('requestWithdrawal failed:', e);
      return null;
    }
  },

  getWithdrawals: async (): Promise<Withdrawal[]> => {
    try {
      const res = await fetch('/api/withdrawals', { headers: await getAuthHeaders() });
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.error('getWithdrawals failed:', e);
      return [];
    }
  },

  getBalance: async (): Promise<{ total_earnings: number; total_withdrawn: number; available_balance: number }> => {
    try {
      const res = await fetch('/api/withdrawals/balance', { headers: await getAuthHeaders() });
      if (!res.ok) return { total_earnings: 0, total_withdrawn: 0, available_balance: 0 };
      return await res.json();
    } catch (e) {
      console.error('getBalance failed:', e);
      return { total_earnings: 0, total_withdrawn: 0, available_balance: 0 };
    }
  },

  updateWithdrawal: async (id: string, status: 'approved' | 'rejected', admin_note?: string, admin_screenshot?: string): Promise<Withdrawal | null> => {
    try {
      const res = await fetch(`/api/withdrawals/${id}`, {
        method: 'PUT',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ status, admin_note, admin_screenshot }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error('updateWithdrawal failed:', e);
      return null;
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // RATINGS
  // ─────────────────────────────────────────────────────────────────────────

  submitRating: async (data: { order_id: string; score: number; comment?: string }): Promise<Rating | null> => {
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      console.error('submitRating failed:', e);
      return null;
    }
  },

  getExpertRatings: async (email: string): Promise<Rating[]> => {
    try {
      const res = await fetch(`/api/ratings/expert/${encodeURIComponent(email)}`, { headers: await getAuthHeaders() });
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.error('getExpertRatings failed:', e);
      return [];
    }
  },

  getRatings: async (): Promise<Rating[]> => {
    try {
      const res = await fetch('/api/ratings', { headers: await getAuthHeaders() });
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.error('getRatings failed:', e);
      return [];
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────────────────

  getNotifications: async (): Promise<Notification[]> => {
    try {
      const res = await fetch('/api/notifications', { headers: await getAuthHeaders() });
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.error('getNotifications failed:', e);
      return [];
    }
  },

  getUnreadCount: async (): Promise<number> => {
    try {
      const res = await fetch('/api/notifications/unread-count', { headers: await getAuthHeaders() });
      if (!res.ok) return 0;
      const data = await res.json();
      return data.count || 0;
    } catch (e) {
      console.error('getUnreadCount failed:', e);
      return 0;
    }
  },

  markNotificationRead: async (id: string): Promise<void> => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: await getAuthHeaders(),
      });
    } catch (e) {
      console.error('markNotificationRead failed:', e);
    }
  },

  markAllNotificationsRead: async (): Promise<void> => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: await getAuthHeaders(),
      });
    } catch (e) {
      console.error('markAllNotificationsRead failed:', e);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ANALYTICS
  // ─────────────────────────────────────────────────────────────────────────

  getAnalytics: async (): Promise<any> => {
    try {
      const res = await fetch('/api/analytics', { headers: await getAuthHeaders() });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error('getAnalytics failed:', e);
      return null;
    }
  },
};
