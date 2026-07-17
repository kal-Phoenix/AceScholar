import crypto from 'crypto';

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
 * Clean a name for fuzzy matching — removes titles, parenthetical content,
 * and non-alphanumeric characters, then lowercases.
 */
export function cleanName(s: string): string {
  return s
    .toLowerCase()
    .replace(/dr\.?/g, '')
    .replace(/msc\.?/g, '')
    .replace(/phd\.?/g, '')
    .replace(/bsc\.?/g, '')
    .replace(/\(.*\)/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Check if an order is accessible to a given expert.
 * Matches by email, cleaned name, or if the order is unassigned.
 */
export function isOrderAccessibleToExpert(
  order: { assigned_to?: string; client_email?: string },
  expertEmail: string,
  expertFullName: string
): boolean {
  if (!order.assigned_to || order.assigned_to.trim() === '' || order.assigned_to === 'Unallocated') {
    return true;
  }
  const cleanAssigned = cleanName(order.assigned_to);
  const cleanExpert = cleanName(expertFullName);
  if (cleanAssigned === cleanExpert) return true;
  if (order.assigned_to.toLowerCase() === expertEmail.toLowerCase()) return true;
  if (cleanAssigned && cleanExpert && (cleanAssigned.includes(cleanExpert) || cleanExpert.includes(cleanAssigned))) return true;
  return false;
}

/** Generate a collision-resistant payment ID. */
export function generatePaymentId(): string {
  return 'pay-' + crypto.randomUUID().replace(/-/g, '').substring(0, 16);
}
