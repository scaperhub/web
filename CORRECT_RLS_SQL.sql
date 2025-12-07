-- Correct SQL to fix RLS for uploads bucket
-- Run this in Supabase SQL Editor

-- Option 1: Create a policy that allows all operations
CREATE POLICY "Allow all operations on uploads"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'uploads')
WITH CHECK (bucket_id = 'uploads');

-- If you get "policy already exists" error, run this first:
-- DROP POLICY IF EXISTS "Allow all operations on uploads" ON storage.objects;
