import { Profile, Order, Message, ContactMessage, Payment } from '../types';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Supabase client — used only for Auth (signIn, signUp, getSession).
// All data reads/writes go through the backend API, NOT directly via this client.
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Returns auth headers for backend API requests.
 * Sends the Supabase JWT as Authorization: Bearer <token> header.
 * Falls back to X-User-Email for backward compatibility.
 */
export const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const stored = localStorage.getItem('ace_scholar_current_user');
    if (stored) {
      const user = JSON.parse(stored);
      if (user?.access_token) {
        headers['Authorization'] = `Bearer ${user.access_token}`;
      }
    }
  } catch (e) {
    console.error('Error reading auth headers from session:', e);
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

  getProfiles: async (): Promise<Profile[]> => {
    try {
      const res = await fetch('/api/profiles', { headers: getAuthHeaders() });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      console.error('getProfiles failed:', e);
      return [];
    }
  },

  setProfiles: async (profiles: Profile[]): Promise<void> => {
    try {
      await fetch('/api/profiles/sync', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(profiles),
      });
    } catch (e) {
      console.error('setProfiles sync failed:', e);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ORDERS
  // ─────────────────────────────────────────────────────────────────────────

  getOrders: async (): Promise<Order[]> => {
    try {
      const res = await fetch('/api/orders', { headers: getAuthHeaders() });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      console.error('getOrders failed:', e);
      return [];
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
        headers: getAuthHeaders(),
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
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(order),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      console.error('createOrder failed:', e);
      return null;
    }
  },

  /**
   * Update a single order field set via backend PUT.
   */
  updateOrder: async (orderId: string, updates: Partial<Order>): Promise<Order | null> => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
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

  getMessages: async (): Promise<Message[]> => {
    try {
      const res = await fetch('/api/messages', { headers: getAuthHeaders() });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      console.error('getMessages failed:', e);
      return [];
    }
  },

  getMessagesByOrder: async (orderId: string): Promise<Message[]> => {
    try {
      const res = await fetch(`/api/messages/${orderId}`, { headers: getAuthHeaders() });
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
        body: JSON.stringify(messages),
      });
    } catch (e) {
      console.error('setMessages sync failed:', e);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CONTACT MESSAGES
  // ─────────────────────────────────────────────────────────────────────────

  getContactMessages: async (): Promise<ContactMessage[]> => {
    try {
      const res = await fetch('/api/contacts', { headers: getAuthHeaders() });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      console.error('getContactMessages failed:', e);
      return [];
    }
  },

  /**
   * Submit a new public contact message via backend POST.
   */
  postContactMessage: async (message: Omit<ContactMessage, 'id' | 'is_read' | 'created_at'>): Promise<ContactMessage | null> => {
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
        body: JSON.stringify(messages),
      });
    } catch (e) {
      console.error('setContactMessages sync failed:', e);
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
        headers: getAuthHeaders(),
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
      const res = await fetch('/api/payments', { headers: getAuthHeaders() });
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
};
