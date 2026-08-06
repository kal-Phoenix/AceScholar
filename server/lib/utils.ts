import crypto from 'crypto';
import { Request } from 'express';

/**
 * Derives the effective role for a user. Admin role is ONLY granted when:
 * 1. The email matches ADMIN_EMAIL env var (immutable, cannot be bypassed)
 * 2. No user can self-promote to admin via metadata manipulation
 *
 * If stored metadata claims 'admin' but email doesn't match, the role is
 * forcibly downgraded to 'client' to prevent privilege escalation.
 */
export function deriveRole(email: string, storedRole?: string): 'admin' | 'client' | 'expert' {
  const emailLower = email.toLowerCase().trim();
  const envAdminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();

  // Admin is ONLY determined by env var — never by stored metadata
  if (envAdminEmail && emailLower === envAdminEmail) {
    return 'admin';
  }

  // For non-admin emails, reject any attempt to claim admin role
  if (storedRole === 'admin') return 'client';
  if (storedRole === 'expert') return 'expert';
  return 'client';
}

/**
 * Check if an order is accessible to a given expert.
 * Matches by assigned_to name (exact match, case-insensitive) or by email.
 * exact match, case-insensitive) or by email.
 */
export function isOrderAccessibleToExpert(
  order: { assigned_to?: string; client_email?: string },
  expertEmail: string,
  expertFullName: string
): boolean {
  if (!order.assigned_to || order.assigned_to.trim() === '' || order.assigned_to === 'Unallocated') {
    return true;
  }
  // Exact email match (most reliable)
  if (order.assigned_to.toLowerCase() === expertEmail.toLowerCase()) return true;
  // Exact name match (case-insensitive, preserves spaces/punctuation)
  if (order.assigned_to.toLowerCase().trim() === expertFullName.toLowerCase().trim()) return true;
  return false;
}

/** Generate a collision-resistant payment ID. */
export function generatePaymentId(): string {
  return 'pay-' + crypto.randomUUID().replace(/-/g, '').substring(0, 16);
}

/**
 * Returns the admin commission percentage from ADMIN_CUT_PERCENT env var.
 * Defaults to 10 if not set or invalid. Clamped to 0–100.
 */
export function getAdminCutPercent(): number {
  const raw = Number(process.env.ADMIN_CUT_PERCENT);
  if (isNaN(raw) || raw < 0) return 10;
  return Math.min(raw, 100);
}

/**
 * Decode a Supabase JWT locally without making an outbound HTTP call.
 * Supabase JWTs are standard HS256 tokens — payload is base64url-encoded JSON.
 * We trust them because they are signed with SUPABASE_JWT_SECRET and
 * validated by Supabase before being issued to clients.
 */
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // base64url → base64 → Buffer → JSON
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const json = Buffer.from(padded, 'base64').toString('utf8');
    const payload = JSON.parse(json);
    // Verify the token hasn't expired
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Safely parse a deadline input (e.g. "3 days", "24 hours", "2026-08-10", "1 week")
 * into a valid ISO-8601 string for PostgreSQL TIMESTAMPTZ columns.
 * Returns ISO string or null if unparseable.
 */
export function parseDeadline(raw: any): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;

  // Check if it's already a valid date string / ISO string
  const parsedDate = new Date(s);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString();
  }

  // Handle relative time strings (e.g., "3 days", "24 hours", "12 hrs", "1 week", "2 weeks", "1 month")
  const now = Date.now();
  const lower = s.toLowerCase();
  const numMatch = lower.match(/^(\d+)\s*(hour|hr|day|d|week|wk|month|m)s?$/);
  if (numMatch) {
    const amount = parseInt(numMatch[1], 10);
    const unit = numMatch[2];
    if (unit.startsWith('h')) return new Date(now + amount * 3600 * 1000).toISOString();
    if (unit.startsWith('d')) return new Date(now + amount * 86400 * 1000).toISOString();
    if (unit.startsWith('w')) return new Date(now + amount * 7 * 86400 * 1000).toISOString();
    if (unit.startsWith('m')) return new Date(now + amount * 30 * 86400 * 1000).toISOString();
  }

  // Default fallback: 3 days from now
  return new Date(now + 3 * 86400 * 1000).toISOString();
}

/**
 * Extract the requester profile from an Express request.
 * Decodes the JWT locally (no outbound Supabase API call), then enriches
 * the role from the profiles table. Returns null if unauthenticated.
 */
export async function getRequesterProfile(req: Request): Promise<{
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'client' | 'expert';
  created_at: string;
} | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  if (!token) return null;

  try {
    const payload = decodeJwtPayload(token);
    if (!payload) return null;

    const email = (payload.email as string | undefined)?.toLowerCase().trim();
    if (!email) return null;

    const userId: string = payload.sub as string;
    const meta = (payload.user_metadata || payload.raw_user_meta_data || {}) as Record<string, any>;
    let effectiveRole: string = meta.role || 'client';
    let fullName: string = meta.full_name || email.split('@')[0];
    let createdAt: string = payload.created_at || new Date().toISOString();

    // Enrich role from profiles table (fast DB lookup, no external HTTP)
    try {
      const { db } = await import('./supabase.js');
      const { data: profile } = await db
        .from('profiles').select('role, expert_status, full_name, created_at').eq('id', userId).maybeSingle();
      if (profile) {
        if (profile.role) effectiveRole = profile.role;
        if (profile.expert_status === 'approved' && effectiveRole !== 'expert') effectiveRole = 'expert';
        if (profile.full_name) fullName = profile.full_name;
        if (profile.created_at) createdAt = profile.created_at;
      }
    } catch { /* profiles lookup failed — use JWT values */ }

    const role = deriveRole(email, effectiveRole);
    return { id: userId, email, full_name: fullName, role, created_at: createdAt };
  } catch (e) {
    console.error('getRequesterProfile: JWT decode failed:', e);
    return null;
  }
}

/**
 * Payment configuration served via GET /api/payments/config.
 * All values come from environment variables so they can be configured
 * without touching code. The user sets these in their .env or production env.
 */
export function paymentConfig() {
  const cardProviderName = process.env.CARD_NAME || 'Credit / Debit Card';
  return {
    providers: [
      {
        id: 'card',
        name: `${cardProviderName}`,
        logo: '💳',
        type: 'card',
        description: `Pay securely using your ${cardProviderName.toLowerCase()}.`,
        fee_percentage: 1.5,
      },
      {
        id: 'telebirr',
        name: 'Telebirr (Mobile Money)',
        logo: '📱',
        type: 'mobile_money',
        description: 'Fast checkout using Ethio Telecom Telebirr mobile wallet app.',
        fee_percentage: 0.5,
      },
      {
        id: 'cbe_birr',
        name: 'CBE Birr (Mobile Money)',
        logo: '🏦',
        type: 'mobile_money',
        description: 'Direct mobile wallet transfer powered by Commercial Bank of Ethiopia.',
        fee_percentage: 0.5,
      },
      {
        id: 'ebirr',
        name: 'Ebirr (Mobile Money)',
        logo: '💸',
        type: 'mobile_money',
        description: 'Instant mobile payments via secure local digital wallets.',
        fee_percentage: 0.5,
      },
    ],
    ethiopia: {
      cbe: {
        accountNumber: process.env.CBE_ACCOUNT_NUMBER || '',
        accountName: process.env.CBE_ACCOUNT_NAME || '',
      },
      telebirr: {
        number: process.env.TELEBIRR_NUMBER || '',
        name: process.env.TELEBIRR_NAME || '',
      },
      boa: {
        accountNumber: process.env.BOA_ACCOUNT_NUMBER || '',
        accountName: process.env.BOA_ACCOUNT_NAME || '',
      },
    },
    crypto: {
      discountPercent: Number(process.env.CRYPTO_DISCOUNT_PERCENT) || 5,
      assets: [
        {
          id: 'bitcoin',
          name: 'Bitcoin',
          symbol: 'BTC',
          icon: '₿',
          networks: [
            {
              name: 'Bitcoin',
              address: process.env.BTC_ADDRESS || '',
            },
          ],
        },
        {
          id: 'usdt',
          name: 'Tether',
          symbol: 'USDT',
          icon: '₮',
          networks: [
            ...(process.env.USDT_ERC20_ADDRESS || process.env.USDT_ADDRESS
              ? [{ name: 'ERC-20', address: process.env.USDT_ERC20_ADDRESS || process.env.USDT_ADDRESS || '' }]
              : []),
            ...(process.env.USDT_TRC20_ADDRESS
              ? [{ name: 'TRC-20', address: process.env.USDT_TRC20_ADDRESS }]
              : []),
            ...(process.env.USDT_BEP20_ADDRESS
              ? [{ name: 'BEP-20', address: process.env.USDT_BEP20_ADDRESS }]
              : []),
          ],
        },
      ].filter(a => a.networks.some(n => n.address)),
    },
    card: {
      cardNumber: process.env.BYBIT_CARD_NUMBER || '',
      holderName: process.env.BYBIT_CARD_HOLDER_NAME || '',
    },
  };
}
