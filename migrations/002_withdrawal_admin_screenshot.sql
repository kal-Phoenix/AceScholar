-- Migration 002: Add admin_screenshot column to withdrawals table
-- When admin approves a withdrawal, they can upload a proof-of-payment screenshot for the expert

ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS admin_screenshot TEXT;
