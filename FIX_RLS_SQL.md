# Fix RLS with Correct SQL

## Method 1: Create Policy (Correct Syntax)

Go to Supabase → **SQL Editor** → Run this:

```sql
-- First, drop existing policy if it exists (ignore error if it doesn't)
DROP POLICY IF EXISTS "Allow all operations on uploads" ON storage.objects;

-- Create the policy
CREATE POLICY "Allow all operations on uploads"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'uploads')
WITH CHECK (bucket_id = 'uploads');
```

## Method 2: Disable RLS Entirely (Simplest)

If you want to completely disable RLS for the uploads bucket:

```sql
-- This disables RLS for storage.objects table
-- But you might want to use Method 1 instead for better security
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

**Note**: This disables RLS for ALL storage buckets, not just uploads.

## Method 3: Use Dashboard (Recommended)

The easiest way is through the dashboard:

1. **Storage** → **Policies** → **`uploads`** bucket
2. Click **"New Policy"**
3. Use the **Policy Template**:
   - **Policy name**: `Allow all operations`
   - **Allowed operation**: Select **ALL**
   - **Target roles**: `public`
   - **USING expression**: `bucket_id = 'uploads'`
   - **WITH CHECK expression**: `bucket_id = 'uploads'`
4. Click **Review** then **Save policy**

## Recommended: Use Dashboard Method 3

The dashboard method is easiest and will create the policy correctly.


