# Quick Fix: Create Supabase Storage Bucket

## The Problem
Error: "Bucket not found" - The `uploads` bucket doesn't exist in your Supabase project.

## The Solution (2 Minutes)

### Step 1: Create the Bucket

1. Go to your **Supabase Dashboard**
2. Click **Storage** in the left sidebar
3. Click **"New bucket"** button (top right)
4. Fill in:
   - **Name**: `uploads` (must be exactly this)
   - **Public bucket**: ✅ **Check this box** (very important!)
   - **File size limit**: 10 MB (or leave default)
   - **Allowed MIME types**: Leave empty (or add: `image/jpeg, image/png, image/gif, image/webp`)
5. Click **"Create bucket"**

### Step 2: Verify It's Created

1. You should see `uploads` in your bucket list
2. Make sure it shows **"Public"** badge
3. That's it! Try uploading an image now

## Quick Checklist

- [ ] Bucket name is exactly `uploads` (lowercase)
- [ ] Bucket is marked as **Public** ✅
- [ ] Bucket appears in Storage dashboard

## Test It

1. Go to your deployed site
2. Try uploading an image (profile picture or item image)
3. It should work now! ✅

## Why This Happened

The code expects a bucket called `uploads` in Supabase Storage. Since you just set up Supabase, this bucket wasn't created yet. Now it is!

## That's It!

Once the bucket is created, image uploads will work immediately. No redeploy needed! 🎉

