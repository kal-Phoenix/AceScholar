-- =====================================================================
--  STEP 2: Backfill data from __METADATA__ in internal_notes
--  Run STEP 1 first!
--  Uses DO blocks so each section is safe to re-run.
-- =====================================================================

-- Backfill agreed_price
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'agreed_price') THEN
    UPDATE public.orders
    SET agreed_price = (
      (regexp_match(internal_notes, '__METADATA__:(.*)$'))[1]
        ::jsonb ->> 'agreed_price'
    )::numeric
    WHERE internal_notes LIKE '%__METADATA__:%'
      AND (regexp_match(internal_notes, '__METADATA__:(.*)$'))[1]::jsonb ? 'agreed_price'
      AND agreed_price IS NULL;
  END IF;
END $$;

-- Backfill preview_url
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'preview_url') THEN
    UPDATE public.orders
    SET preview_url = (regexp_match(internal_notes, '__METADATA__:(.*)$'))[1]::jsonb ->> 'preview_url'
    WHERE internal_notes LIKE '%__METADATA__:%'
      AND (regexp_match(internal_notes, '__METADATA__:(.*)$'))[1]::jsonb ? 'preview_url'
      AND preview_url IS NULL;
  END IF;
END $$;

-- Backfill preview_name
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'preview_name') THEN
    UPDATE public.orders
    SET preview_name = (regexp_match(internal_notes, '__METADATA__:(.*)$'))[1]::jsonb ->> 'preview_name'
    WHERE internal_notes LIKE '%__METADATA__:%'
      AND (regexp_match(internal_notes, '__METADATA__:(.*)$'))[1]::jsonb ? 'preview_name'
      AND preview_name IS NULL;
  END IF;
END $$;

-- Backfill payment_awaiting
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_awaiting') THEN
    UPDATE public.orders
    SET payment_awaiting = ((regexp_match(internal_notes, '__METADATA__:(.*)$'))[1]::jsonb ->> 'payment_awaiting')::boolean
    WHERE internal_notes LIKE '%__METADATA__:%'
      AND (regexp_match(internal_notes, '__METADATA__:(.*)$'))[1]::jsonb ? 'payment_awaiting'
      AND payment_awaiting = false;
  END IF;
END $$;

-- Backfill payment_method_type
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_method_type') THEN
    UPDATE public.orders
    SET payment_method_type = (regexp_match(internal_notes, '__METADATA__:(.*)$'))[1]::jsonb ->> 'payment_method_type'
    WHERE internal_notes LIKE '%__METADATA__:%'
      AND (regexp_match(internal_notes, '__METADATA__:(.*)$'))[1]::jsonb ? 'payment_method_type'
      AND payment_method_type IS NULL;
  END IF;
END $$;

-- Backfill crypto_discount_applied
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'crypto_discount_applied') THEN
    UPDATE public.orders
    SET crypto_discount_applied = ((regexp_match(internal_notes, '__METADATA__:(.*)$'))[1]::jsonb ->> 'crypto_discount_applied')::boolean
    WHERE internal_notes LIKE '%__METADATA__:%'
      AND (regexp_match(internal_notes, '__METADATA__:(.*)$'))[1]::jsonb ? 'crypto_discount_applied'
      AND crypto_discount_applied = false;
  END IF;
END $$;

-- Backfill delivery_released
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_released') THEN
    UPDATE public.orders
    SET delivery_released = ((regexp_match(internal_notes, '__METADATA__:(.*)$'))[1]::jsonb ->> 'delivery_released')::boolean
    WHERE internal_notes LIKE '%__METADATA__:%'
      AND (regexp_match(internal_notes, '__METADATA__:(.*)$'))[1]::jsonb ? 'delivery_released'
      AND delivery_released = false;
  END IF;
END $$;

-- Backfill expert_submission_url
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'expert_submission_url') THEN
    UPDATE public.orders
    SET expert_submission_url = (regexp_match(internal_notes, '__METADATA__:(.*)$'))[1]::jsonb ->> 'expert_submission_url'
    WHERE internal_notes LIKE '%__METADATA__:%'
      AND (regexp_match(internal_notes, '__METADATA__:(.*)$'))[1]::jsonb ? 'expert_submission_url'
      AND expert_submission_url IS NULL;
  END IF;
END $$;

-- Backfill expert_submission_name
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'expert_submission_name') THEN
    UPDATE public.orders
    SET expert_submission_name = (regexp_match(internal_notes, '__METADATA__:(.*)$'))[1]::jsonb ->> 'expert_submission_name'
    WHERE internal_notes LIKE '%__METADATA__:%'
      AND (regexp_match(internal_notes, '__METADATA__:(.*)$'))[1]::jsonb ? 'expert_submission_name'
      AND expert_submission_name IS NULL;
  END IF;
END $$;

-- Backfill admin_screenshots (text array from JSON array)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'admin_screenshots') THEN
    UPDATE public.orders
    SET admin_screenshots = ARRAY(
      SELECT jsonb_array_elements_text(
        (regexp_match(internal_notes, '__METADATA__:(.*)$'))[1]::jsonb -> 'admin_screenshots'
      )
    )
    WHERE internal_notes LIKE '%__METADATA__:%'
      AND (regexp_match(internal_notes, '__METADATA__:(.*)$'))[1]::jsonb ? 'admin_screenshots'
      AND admin_screenshots IS NULL;
  END IF;
END $$;

-- Clean up internal_notes: remove the __METADATA__: suffix from all rows
UPDATE public.orders
SET internal_notes = TRIM(
  LEFT(internal_notes, POSITION('__METADATA__:' IN internal_notes) - 1)
)
WHERE internal_notes LIKE '%__METADATA__:%';

-- Verify: should return 0 rows
-- SELECT COUNT(*) FROM public.orders WHERE internal_notes LIKE '%__METADATA__%';
