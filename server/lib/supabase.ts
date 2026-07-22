import path from 'path';
import fs from 'fs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Load .env directly here to guarantee it's available before reading process.env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split(/\r?\n/).forEach((line) => {
    if (!line || line.startsWith('#') || !line.includes('=')) return;
    const [key, ...valueParts] = line.split('=');
    const cleanKey = key.trim();
    let cleanVal = valueParts.join('=').trim();
    if ((cleanVal.startsWith('"') && cleanVal.endsWith('"')) ||
        (cleanVal.startsWith("'") && cleanVal.endsWith("'"))) {
      cleanVal = cleanVal.slice(1, -1);
    }
    if (!process.env[cleanKey]) {
      process.env[cleanKey] = cleanVal;
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  '';

console.log('[supabase] SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'MISSING');

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

// Use admin client when available, fall back to anon client for reads
export const db: SupabaseClient = supabaseAdmin || supabase;

export { supabaseUrl, supabaseAnonKey };
