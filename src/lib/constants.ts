// ── Shared Frontend Constants ──────────────────────────────────────────────────
// All magic numbers, thresholds, and duplicated constants live here.
// Components import from this file instead of hardcoding values.

export const LOCAL_STORAGE_USER_KEY = 'ace_scholar_current_user';

// Time constants (milliseconds)
export const POLLING_INTERVAL_MS = 5000;
export const REVISION_DEADLINE_HOURS = 48;
export const REVISION_DEADLINE_MS = REVISION_DEADLINE_HOURS * 60 * 60 * 1000;
export const HOURS_DIVISOR = 3600000;
export const TOAST_DURATION_MS = 4000;

// Order thresholds
export const DOWNPAYMENT_THRESHOLD_USD = 100;
export const MIN_ORDER_USD = 3;

// File upload limits
export const MAX_FILE_SIZE_MB = 40;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Image compression defaults
export const COMPRESS_MAX_WIDTH = 800;
export const COMPRESS_MAX_HEIGHT = 800;
export const COMPRESS_QUALITY = 0.7;

// Exchange rate fallback defaults (used when VITE_EXCHANGE_RATES env is missing)
export const DEFAULT_EXCHANGE_RATES: Record<string, { symbol: string; rate: number }> = {
  ETB: { symbol: 'Br', rate: 120 },
  GBP: { symbol: '£', rate: 0.79 },
  EUR: { symbol: '€', rate: 0.92 },
  CAD: { symbol: 'C$', rate: 1.36 },
  AUD: { symbol: 'A$', rate: 1.51 },
  AED: { symbol: 'AED ', rate: 3.67 },
  SAR: { symbol: 'SR ', rate: 3.75 },
};

// Fallback IP/city for geo-detection when API fails
export const DEFAULT_FALLBACK_IP = '';
export const DEFAULT_FALLBACK_CITY = 'Addis Ababa';
export const DEFAULT_FALLBACK_COUNTRY = 'Ethiopia';
export const DEFAULT_FALLBACK_CURRENCY = 'ETB';

// Contact emails (from env)
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'ace.support1@gmail.com';
export const DESK_EMAIL = import.meta.env.VITE_DESK_EMAIL || 'ace.support1@gmail.com';

// Expert net earnings percentage (expert gets 90%)
export const EXPERT_EARNINGS_PERCENT = 90;

// WhatsApp number (from env)
export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '';

// Home page marketing stats (configurable via env)
export const STAT_PROJECTS_COMPLETED = Number(import.meta.env.VITE_STAT_PROJECTS) || 2500;
export const STAT_ON_TIME_DELIVERY = Number(import.meta.env.VITE_STAT_DELIVERY) || 98;
export const STAT_AVERAGE_RATING = Number(import.meta.env.VITE_STAT_RATING) || 49; // stored as x/5 (49 = 4.9)
export const STAT_COUNTRIES_SERVED = Number(import.meta.env.VITE_STAT_COUNTRIES) || 50;
