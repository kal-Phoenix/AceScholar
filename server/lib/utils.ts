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
 * Extract the requester profile from an Express request.
 * Validates the JWT, derives role, and returns a normalized profile object.
 * Returns null if unauthenticated.
 */
export async function getRequesterProfile(req: Request): Promise<{
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'client' | 'expert';
  created_at: string;
} | null> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (token) {
      const { supabase, db } = await import('./supabase.js');
      const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
      if (error || !authUser) return null;
      const email = authUser.email?.toLowerCase().trim();
      if (!email) return null;

      // Check profiles table for the authoritative role — the JWT user_metadata
      // may be stale if the user was recently approved as expert but hasn't refreshed
      // their session yet.
      let effectiveRole = authUser.user_metadata?.role;
      try {
        const { data: profile } = await db
          .from('profiles').select('role, expert_status').eq('id', authUser.id).maybeSingle();
        if (profile?.role) effectiveRole = profile.role;
        // If profile was approved as expert but role column was never updated, treat as expert
        if (profile?.expert_status === 'approved' && effectiveRole !== 'expert') {
          effectiveRole = 'expert';
        }
      } catch { /* profiles table may not exist yet */ }

      const role = deriveRole(email, effectiveRole);
      return {
        id: authUser.id,
        email,
        full_name: authUser.user_metadata?.full_name || email.split('@')[0],
        role,
        created_at: authUser.created_at
      };
    }
  }
  return null;
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
