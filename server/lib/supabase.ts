import { createClient, SupabaseClient } from '@supabase/supabase-js';

// .env is loaded by server/lib/load-env.ts (imported first in server/index.ts).
// This module only reads process.env — no duplicate parsing needed.

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'FATAL: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env.\n' +
    'Make sure these variables are available in your environment before the server starts.\n' +
    'You can also run: set VITE_SUPABASE_URL=... && set VITE_SUPABASE_ANON_KEY=... && npm run dev'
  );
  process.exit(1);
}

// Custom fetch with 8-second timeout to prevent Supabase queries from hanging
const fetchWithTimeout = async (url: string | URL, options: RequestInit = {}): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Supabase request timed out after 8 seconds');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};

// Public client (for auth operations like signIn, signUp)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: fetchWithTimeout as typeof fetch },
});

// Admin client (uses service-role key for backend operations)
export const supabaseAdmin: SupabaseClient | null = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: fetchWithTimeout as typeof fetch },
    })
  : null;

if (!supabaseServiceKey) {
  console.warn(
    'WARNING: SUPABASE_SERVICE_ROLE_KEY is not set. Admin operations (sync, role updates, etc.) will fail.\n' +
    'Set SUPABASE_SERVICE_ROLE_KEY in your .env file.'
  );
}

// Use admin client when available, fall back to anon client for reads
export const db: SupabaseClient = supabaseAdmin || supabase;

export { supabaseUrl };
