# Fix: Row Level Security Policy Error

## The Problem
Error: "new row violates row-level security policy" - RLS policies are blocking file uploads to Supabase Storage.

## Quick Fix: Disable RLS on the Bucket (Easiest)

### Step 1: Disable RLS

1. Go to **Supabase Dashboard**
2. Click **Storage** → **Policies**
3. Find the **`uploads`** bucket
4. Click on it
5. You'll see RLS policies listed
6. **Disable RLS** by toggling it off, OR
7. Delete any existing policies that are blocking

### Step 2: Alternative - Make Bucket Public Without RLS

1. Go to **Storage** → **Buckets**
2. Click on **`uploads`** bucket
3. Make sure **"Public bucket"** is enabled ✅
4. If RLS is enabled, you can either:
   - **Option A**: Disable RLS (simplest)
   - **Option B**: Create proper policies (see below)

## Better Fix: Create Proper RLS Policies (Recommended)

If you want to keep RLS enabled for security, create these policies:

### Step 1: Go to Storage Policies

1. Supabase Dashboard → **Storage** → **Policies**
2. Click on **`uploads`** bucket
3. Click **"New Policy"**

### Step 2: Create Upload Policy

**Policy Name**: `Allow authenticated uploads`

**Policy Definition**:
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');
```

Or for public uploads (if using service role):
```sql
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'uploads');
```

### Step 3: Create Read Policy

**Policy Name**: `Allow public reads`

**Policy Definition**:
```sql
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'uploads');
```

### Step 4: Create Delete Policy (Optional)

**Policy Name**: `Allow users to delete their files`

**Policy Definition**:
```sql
CREATE POLICY "Allow users to delete their files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'uploads');
```

## Quickest Solution (Recommended for Now)

**Disable RLS on the bucket**:

1. Supabase Dashboard → **Storage** → **Buckets**
2. Click **`uploads`** bucket
3. Find **"RLS enabled"** toggle
4. **Turn it OFF** ✅
5. Save

Since you're using `SUPABASE_SERVICE_ROLE_KEY` which should bypass RLS, but if RLS is enabled, it might still block. Disabling RLS is the quickest fix.

## Verify Service Role Key

Make sure `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel:
- This key bypasses RLS
- Check Vercel → Settings → Environment Variables
- Should be set to your service role key (not anon key)

## Test After Fix

1. Try uploading an image again
2. Should work now! ✅

## Why This Happened

Supabase Storage has Row Level Security (RLS) enabled by default. Even with the service role key, if RLS policies aren't set up correctly, uploads can be blocked.

## That's It!

Disable RLS on the `uploads` bucket and uploads will work immediately! 🎉


