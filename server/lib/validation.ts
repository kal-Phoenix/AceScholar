// ─────────────────────────────────────────────────────────────────────────────
// INPUT VALIDATION & SANITIZATION LAYER
// ─────────────────────────────────────────────────────────────────────────────

/** Structured 400-level error thrown by validators and caught per-route. */
export class InputError extends Error {
  status = 400;
  constructor(message: string) {
    super(message);
    this.name = 'InputError';
  }
}

/** Maximum allowed character lengths for every user-supplied field. */
export const MAX_LENGTHS = {
  email:         254,
  password:      128,
  name:          100,
  subject:       200,
  description:   8_000,
  message:       10_000,
  instructions:  3_000,
  budget:        60,
  service_type:  120,
  currency:      10,
  phone:         30,
  country:       80,
  gpa:           20,
  qualification: 200,
  proposal:      5_000,
  filename:      255,
  url:           2_048,
  id:            80,
  notes:         10_000,
  general:       500,
} as const;

export const ALLOWED_ORDER_STATUSES   = ['pending','in_progress','under_review','delivered','revision_requested'] as const;
export const ALLOWED_PAYMENT_STATUSES = ['pending','approved','rejected'] as const;
export const ALLOWED_PAYMENT_METHODS  = ['bank_transfer','crypto'] as const;

/**
 * Strip all HTML tags, null bytes, and non-printable control characters (keeping \t \n \r),
 * then trim and truncate to maxLen. Never throws; returns '' for null/undefined.
 */
export function sanitizeText(val: any, maxLen: number): string {
  if (val === null || val === undefined) return '';
  const cleaned = String(val)
    .replace(/<[^>]*>/g, '')                             // strip HTML tags
    .replace(/&[a-zA-Z]+;/g, ' ')                        // strip HTML entities
    .replace(/&#\d+;/g, ' ')                             // strip numeric entities
    .replace(/\x00/g, '')                                // null bytes
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')  // non-printable control chars
    .trim()
    .slice(0, maxLen);
  return cleaned;
}

/**
 * Sanitize + validate a required text field.
 * Throws InputError if the raw value exceeds maxLen or is empty after sanitization.
 */
export function requireText(val: any, maxLen: number, fieldName: string): string {
  if (val !== null && val !== undefined && String(val).trim().length > maxLen) {
    throw new InputError(`${fieldName} must not exceed ${maxLen} characters`);
  }
  const cleaned = sanitizeText(val, maxLen);
  if (!cleaned) throw new InputError(`${fieldName} is required`);
  return cleaned;
}

/** Sanitize an optional text field. Returns defaultVal if blank/absent. Never throws. */
export function optionalText(val: any, maxLen: number, defaultVal = ''): string {
  return sanitizeText(val, maxLen) || defaultVal;
}

/** Validate and normalise an email address. Throws InputError if invalid or oversized. */
export function requireEmail(val: any): string {
  const raw = sanitizeText(val, MAX_LENGTHS.email + 1);
  if (!raw) throw new InputError('Email is required');
  if (raw.length > MAX_LENGTHS.email) throw new InputError(`Email must not exceed ${MAX_LENGTHS.email} characters`);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) throw new InputError('A valid email address is required');
  return raw.toLowerCase();
}

/** Validate a route parameter that should be a short alphanumeric/dash ID. */
export function requireIdParam(val: any, fieldName: string): string {
  const s = sanitizeText(val, MAX_LENGTHS.id + 1);
  if (!s) throw new InputError(`${fieldName} is required`);
  if (s.length > MAX_LENGTHS.id) throw new InputError(`${fieldName} exceeds maximum length`);
  if (!/^[a-zA-Z0-9_\-]+$/.test(s)) throw new InputError(`${fieldName} contains invalid characters`);
  return s;
}

/** Legacy helper kept for internal serialization use only. */
export function safeString(val: any, defaultVal = ''): string {
  if (val === undefined || val === null) return defaultVal;
  return String(val).trim();
}

export function isValidEmail(email: any): boolean {
  if (typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Express middleware factory — rejects requests whose Content-Length header
 * exceeds maxBytes with HTTP 413 before the body reaches any handler.
 */
export function enforceBodyLimit(maxBytes: number) {
  return (req: any, res: any, next: any) => {
    const len = parseInt(req.headers['content-length'] || '0', 10);
    if (len > maxBytes) {
      return res.status(413).json({
        error: `Request body too large (max ${Math.round(maxBytes / 1024)} KB allowed)`
      });
    }
    next();
  };
}
