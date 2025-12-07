# Step-by-Step: Disable RLS on Supabase Storage Bucket

## Method 1: Disable RLS via Dashboard (Easiest)

### Step 1: Go to Storage Buckets
1. Open your **Supabase Dashboard**
2. Click **Storage** in the left sidebar
3. You should see a list of buckets
4. Find the **`uploads`** bucket

### Step 2: Open Bucket Settings
1. Click on the **`uploads`** bucket name (or the three dots menu)
2. This opens the bucket details/settings page

### Step 3: Disable RLS
1. Look for **"RLS enabled"** or **"Row Level Security"** toggle/switch
2. **Turn it OFF** (toggle should be gray/unchecked)
3. Click **Save** or **Update**

### Step 4: Verify
- The bucket should now show RLS as disabled
- Make sure **"Public bucket"** is still enabled ✅

## Method 2: Disable RLS via SQL (Alternative)

If you can't find the toggle in the dashboard:

1. Go to **SQL Editor** in Supabase
2. Run this SQL:

```sql
-- Disable RLS on the uploads bucket
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

**Note**: This disables RLS for ALL buckets. If you only want to disable for `uploads`, use Method 1.

## Method 3: Create Policies Instead (If You Want to Keep RLS)

If you prefer to keep RLS enabled but allow uploads:

1. Go to **Storage** → **Policies** → **`uploads`** bucket
2. Click **"New Policy"**
3. Create these policies:

### Policy 1: Allow Uploads
- **Policy name**: `Allow public uploads`
- **Allowed operation**: `INSERT`
- **Target roles**: `public`
- **Policy definition**:
```sql
bucket_id = 'uploads'
```

### Policy 2: Allow Reads
- **Policy name**: `Allow public reads`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **Policy definition**:
```sql
bucket_id = 'uploads'
```

## Quick Visual Guide

```
Supabase Dashboard
  └── Storage (left sidebar)
      └── Buckets
          └── uploads (click on it)
              └── Settings/Configuration
                  └── RLS enabled: [Toggle OFF] ✅
                  └── Public bucket: [Toggle ON] ✅
```

## Verify It's Fixed

After disabling RLS:
1. Go back to your site
2. Try uploading an image
3. Should work now! ✅

## Still Not Working?

1. **Check SUPABASE_SERVICE_ROLE_KEY**:
   - Go to Vercel → Settings → Environment Variables
   - Make sure `SUPABASE_SERVICE_ROLE_KEY` is set
   - This is different from `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Check Bucket Name**:
   - Must be exactly `uploads` (lowercase, no spaces)

3. **Check Bucket is Public**:
   - In bucket settings, "Public bucket" should be ON

## That's It!

Once RLS is disabled, uploads will work immediately. No redeploy needed! 🎉


