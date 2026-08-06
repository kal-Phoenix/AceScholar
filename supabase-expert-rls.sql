-- Run this in Supabase SQL Editor to allow experts to view accessible orders via direct client queries.
-- This policy lets experts see: unallocated orders + orders assigned to them by name.

-- Drop the old restrictive client-only SELECT policy if it blocks experts
-- (Keep it for non-expert clients; the new policy covers experts separately)

-- New policy: experts can view orders they can access
DROP POLICY IF EXISTS "Experts can view accessible orders" ON orders;
CREATE POLICY "Experts can view accessible orders"
ON orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'expert'
    AND (
      assigned_to IS NULL
      OR assigned_to = ''
      OR assigned_to = 'Unallocated'
      OR assigned_to = profiles.full_name
      OR assigned_to = profiles.email
    )
  )
);

-- New policy: experts can update orders they are assigned to (for status changes, submissions, etc.)
DROP POLICY IF EXISTS "Experts can update assigned orders" ON orders;
CREATE POLICY "Experts can update assigned orders"
ON orders FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'expert'
    AND (
      assigned_to = profiles.full_name
      OR assigned_to = profiles.email
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'expert'
    AND (
      assigned_to = profiles.full_name
      OR assigned_to = profiles.email
    )
  )
);
