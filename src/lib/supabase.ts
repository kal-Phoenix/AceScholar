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
 * All reads and writes go through the Express backend (/api/*).
 * The backend owns the Supabase service-role client and enforces
 * business logic / RLS bypass where needed.
 *
 * NO data is stored in localStorage. NO direct Supabase queries
 * are made from the frontend for database tables.
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
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/orders?page=${page}&limit=${limit}`, { headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return await res.json();
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
   * Create a single new order via backend POST.
   */
  createOrder: async (order: Omit<Order, 'created_at'>): Promise<Order | null> => {
    const maxRetries = 2;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        const headers = await getAuthHeaders();
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers,
          body: JSON.stringify(order),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        return await res.json();
      } catch (e: any) {
        const isNetwork = e?.name === 'AbortError' || e?.message?.includes('NetworkError') || e?.message?.includes('Failed to fetch') || e?.message?.includes('network');
        if (isNetwork && attempt < maxRetries) {
          console.warn(`createOrder attempt ${attempt} failed (${e.message}), retrying...`);
          await new Promise(r => setTimeout(r, 1000 * attempt));
          continue;
        }
        console.error('createOrder failed:', e);
        throw e;
      }
    }
    return null;
  },

  /**
   * Update a single order field set via backend PUT.
   */
  updateOrder: async (orderId: string, updates: Partial<Order>): Promise<Order | null> => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: await getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return await res.json();
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
