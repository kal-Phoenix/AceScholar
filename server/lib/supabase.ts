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

// Public client (for auth operations like signIn, signUp)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Admin client (uses service-role key for backend operations)
export const supabaseAdmin: SupabaseClient | null = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
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
