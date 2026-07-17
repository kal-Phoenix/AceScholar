-- =====================================================================
--  STEP 1: Add all missing columns to orders table (idempotent)
--  Run this FIRST, then run 001_extract_metadata.sql
-- =====================================================================

-- Payment-after-delivery flow columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS agreed_price NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS preview_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS preview_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_awaiting BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method_type TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS crypto_discount_applied BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_released BOOLEAN DEFAULT false;

-- Expert submission columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS expert_submission_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS expert_submission_name TEXT;

-- Admin review screenshots
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS admin_screenshots TEXT[];
