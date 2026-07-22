/**
 * Validates that all required environment variables are set.
 * Called once at server startup — fails fast if critical config is missing.
 */
export function validateEnv(): void {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ADMIN_EMAIL',
  ];

  const missing = required.filter((k) => !process.env[k] || process.env[k].trim() === '');

  if (missing.length > 0) {
    console.error('╔══════════════════════════════════════════════════════════════╗');
    console.error('║  FATAL: Missing required environment variables              ║');
    console.error('╠══════════════════════════════════════════════════════════════╣');
    for (const k of missing) {
      console.error(`║  - ${k.padEnd(54)}║`);
    }
    console.error('╚══════════════════════════════════════════════════════════════╝');
    process.exit(1);
  }

  if (!process.env.ALLOWED_ORIGIN) {
    console.warn('WARNING: ALLOWED_ORIGIN is not set. CORS will deny all cross-origin requests in production.');
  }
}
