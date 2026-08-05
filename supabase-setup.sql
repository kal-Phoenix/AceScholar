-- =====================================================================
--                   ACE SCHOLAR DATABASE SCHEMA
--        Complete setup — paste this into Supabase SQL Editor and run.
--        Uses IF NOT EXISTS / OR REPLACE so it is safe to re-run.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. EXTENSIONS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PROFILES TABLE
--    Linked 1-to-1 with auth.users via the handle_new_user trigger.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    whatsapp TEXT,
    country TEXT,
    role TEXT DEFAULT 'client' NOT NULL CHECK (role IN ('client', 'expert', 'admin')),
    expert_status TEXT,
    gpa TEXT,
    qualification TEXT,
    subjects TEXT[],
    expert_proposal TEXT,
    expert_signup_at TEXT,
    expert_documents JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies (drop-and-recreate for idempotency)
-- Users can only view their own profile (no public SELECT)
DROP POLICY IF EXISTS "Public profiles are viewable by anyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
CREATE POLICY "Users can view their own profile."
    ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile."
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Prevent role escalation: users cannot set role to 'admin' via UPDATE
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile."
    ON public.profiles FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND (role IS NULL OR role = 'client' OR role = 'expert')
    );

-- NOTE: The service-role client bypasses RLS entirely.
-- No permissive ALL policy is needed — the previous "Service role can upsert"
-- policy was applying to ALL authenticated users via the anon key, which was
-- a privilege-escalation bug. Removed intentionally.


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. handle_new_user TRIGGER
--    Automatically creates a profile row when a new auth user signs up.
--    All users default strictly to 'client' for production security.
--    No emails are hardcoded here to keep git commits clean.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'client',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email     = EXCLUDED.email;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger before re-creating (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ORDERS TABLE
--    Includes all columns used by server.ts:
--    expert_accepted, applicants (JSONB), payment_id
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY DEFAULT ('ord-' || LOWER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8))),
    client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    service_type TEXT NOT NULL,
    subject TEXT NOT NULL,
    academic_level TEXT NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT NOT NULL,
    special_instructions TEXT,
    budget_range TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    assigned_to TEXT,
    expert_accepted BOOLEAN DEFAULT false,
    applicants JSONB DEFAULT '[]'::jsonb,
    file_url TEXT,
    file_name TEXT,
    delivery_url TEXT,
    delivery_name TEXT,
    internal_notes TEXT,
    payment_method TEXT,
    payment_screenshot TEXT,
    payment_status TEXT DEFAULT 'pending',
    payment_ref_number TEXT,
    payment_id TEXT,
    total_amount NUMERIC DEFAULT 100,
    currency TEXT DEFAULT 'USD',
    -- Payment-after-delivery flow
    agreed_price NUMERIC,
    preview_url TEXT,
    preview_name TEXT,
    payment_awaiting BOOLEAN DEFAULT false,
    payment_method_type TEXT,
    crypto_discount_applied BOOLEAN DEFAULT false,
    delivery_released BOOLEAN DEFAULT false,
    -- Expert submission for admin review
    expert_submission_url TEXT,
    expert_submission_name TEXT,
    -- Admin review screenshots shared with student
    admin_screenshots TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

    CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'under_review', 'delivered', 'revision_requested')),
    CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'approved', 'rejected'))
);

-- Add any missing columns for projects where orders table already exists
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS expert_accepted BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS applicants JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_screenshot TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_ref_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 100;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS agreed_price NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS preview_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS preview_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_awaiting BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method_type TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS crypto_discount_applied BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_released BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS expert_submission_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS expert_submission_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS admin_screenshots TEXT[];

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Clients can view their own orders only" ON public.orders;
CREATE POLICY "Clients can view their own orders only"
    ON public.orders FOR SELECT
    USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Clients can create their own orders" ON public.orders;
CREATE POLICY "Clients can create their own orders"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Admins have full read access to all orders" ON public.orders;
CREATE POLICY "Admins have full read access to all orders"
    ON public.orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins have full update access to all orders" ON public.orders;
CREATE POLICY "Admins have full update access to all orders"
    ON public.orders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- NOTE: service-role key bypasses RLS. No permissive ALL policy needed.


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. MESSAGES TABLE
--    Order progress / communication threads.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    sender_name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT false NOT NULL,
    recipient TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can read thread messages for their own orders" ON public.messages;
CREATE POLICY "Users can read thread messages for their own orders"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = messages.order_id
            AND (
                orders.client_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = 'admin'
                )
            )
        )
    );

DROP POLICY IF EXISTS "Users can post messages in order thread" ON public.messages;
CREATE POLICY "Users can post messages in order thread"
    ON public.messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = messages.order_id
            AND (
                orders.client_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = 'admin'
                )
            )
        )
    );

-- NOTE: service-role key bypasses RLS. No permissive ALL policy needed.


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. CONTACT MESSAGES TABLE
--    Public general inquiries (no auth required to submit).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public can post contact requests anonymously" ON public.contact_messages;
CREATE POLICY "Public can post contact requests anonymously"
    ON public.contact_messages FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Only admins can view contact requests" ON public.contact_messages;
CREATE POLICY "Only admins can view contact requests"
    ON public.contact_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- NOTE: service-role key bypasses RLS. No permissive ALL policy needed.


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. STORAGE BUCKET: order-files
--    Private bucket for order attachments and delivery files.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-files', 'order-files', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage policies — private bucket, only authenticated users can read their own files
DROP POLICY IF EXISTS "Public read access to order-files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read order-files" ON storage.objects;
CREATE POLICY "Authenticated users can read order-files"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'order-files'
        AND auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "Authenticated users can upload to order-files" ON storage.objects;
CREATE POLICY "Authenticated users can upload to order-files"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'order-files'
        AND auth.role() = 'authenticated'
    );

-- NOTE: service-role key bypasses RLS. No permissive ALL policy needed.


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. PAYMENTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    provider_id TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    admin_cut NUMERIC NOT NULL,
    expert_amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD' NOT NULL,
    status TEXT NOT NULL,
    reference_id TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Clients can view their own payments" ON public.payments;
CREATE POLICY "Clients can view their own payments"
    ON public.payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = payments.order_id
            AND orders.client_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments"
    ON public.payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- NOTE: service-role key bypasses RLS. No permissive ALL policy needed.



-- ─────────────────────────────────────────────────────────────────────────────
-- 6b. PERFORMANCE INDEXES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_client_email ON public.orders (client_email);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_to ON public.orders (assigned_to);
CREATE INDEX IF NOT EXISTS idx_messages_order_created ON public.messages (order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_email ON public.notifications (user_email);
CREATE INDEX IF NOT EXISTS idx_ratings_expert_email ON public.ratings (expert_email);
CREATE INDEX IF NOT EXISTS idx_withdrawals_expert_email ON public.withdrawals (expert_email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_payments_reference_id ON public.payments (reference_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ratings_order_client ON public.ratings (order_id, client_email);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. VERIFICATION QUERIES
--    Run these after applying the schema to confirm everything is set up.
-- ─────────────────────────────────────────────────────────────────────────────
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders' ORDER BY ordinal_position;
-- SELECT tgname FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. MIGRATION: Add recipient column to messages table
--    Run this if the messages table already exists without the recipient column.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
    ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS recipient TEXT DEFAULT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 9. WITHDRAWALS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id TEXT PRIMARY KEY,
    expert_email TEXT NOT NULL,
    expert_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD' NOT NULL,
    method TEXT NOT NULL,
    account_details TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    admin_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Withdrawals: experts see their own, admins see all
DROP POLICY IF EXISTS "Experts can view their own withdrawals" ON public.withdrawals;
CREATE POLICY "Experts can view their own withdrawals"
    ON public.withdrawals FOR SELECT
    USING (
        expert_email = (
            SELECT email FROM public.profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Experts can insert their own withdrawals" ON public.withdrawals;
CREATE POLICY "Experts can insert their own withdrawals"
    ON public.withdrawals FOR INSERT
    WITH CHECK (
        expert_email = (
            SELECT email FROM public.profiles WHERE id = auth.uid()
        )
    );


-- ─────────────────────────────────────────────────────────────────────────────
-- 10. RATINGS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ratings (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    expert_email TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_name TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Ratings: clients see their own, anyone can read ratings for display
DROP POLICY IF EXISTS "Clients can view their own ratings" ON public.ratings;
CREATE POLICY "Clients can view their own ratings"
    ON public.ratings FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Clients can insert ratings" ON public.ratings;
CREATE POLICY "Clients can insert ratings"
    ON public.ratings FOR INSERT
    WITH CHECK (
        client_email = (
            SELECT email FROM public.profiles WHERE id = auth.uid()
        )
    );


-- ─────────────────────────────────────────────────────────────────────────────
-- 11. NOTIFICATIONS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false NOT NULL,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications: users see their own by email
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (
        user_email = (
            SELECT email FROM public.profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (
        user_email = (
            SELECT email FROM public.profiles WHERE id = auth.uid()
        )
    );


-- ─────────────────────────────────────────────────────────────────────────────
-- 12. MIGRATION: Add new feature columns
--     Run this block to add availability, revision, dispute, and portfolio fields.
-- ─────────────────────────────────────────────────────────────────────────────

-- Expert availability
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE;

-- Revision window
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS revision_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS max_revisions INTEGER DEFAULT 2;

-- Dispute resolution
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dispute_status TEXT DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dispute_reason TEXT DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dispute_created_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dispute_resolved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dispute_resolution TEXT DEFAULT NULL;
