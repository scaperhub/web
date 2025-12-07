# Supabase Storage Setup

This guide will help you set up Supabase Storage for file uploads in ScaperHub.

## Why Supabase Storage?

- ✅ Files persist across deployments
- ✅ No file size limits (configurable)
- ✅ CDN delivery for fast loading
- ✅ Automatic backups
- ✅ Works perfectly with Vercel serverless functions
- ✅ Built-in security policies

## Step 1: Create Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the sidebar
3. Click **"New bucket"**
4. Configure:
   - **Name**: `uploads`
   - **Public bucket**: ✅ **Enable this** (so images are publicly accessible)
   - **File size limit**: 10 MB (or your preferred limit)
   - **Allowed MIME types**: `image/jpeg, image/png, image/gif, image/webp`
5. Click **"Create bucket"**

## Step 2: Set Up Storage Policies (Optional but Recommended)

For better security, you can set up Row Level Security policies:

1. Go to **Storage** → **Policies** → **uploads**
2. Click **"New Policy"**

### Policy 1: Allow Authenticated Users to Upload

```sql
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 2: Allow Public Read Access

```sql
CREATE POLICY "Public can read uploads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'uploads');
```

### Policy 3: Allow Users to Delete Their Own Files

```sql
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Note**: The current implementation uses the service role key, so these policies are optional. For better security in production, consider using Supabase Auth and these policies.

## Step 3: Verify Setup

1. Check that the `uploads` bucket exists
2. Verify it's marked as **Public**
3. Test by uploading a file through your app

## Step 4: Environment Variables

Make sure these are set in your `.env.local` and Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
USE_SUPABASE=true
```

## How It Works

1. User uploads an image through the app
2. File is sent to `/api/upload`
3. API uploads to Supabase Storage bucket `uploads`
4. File is stored with path: `{userId}/{timestamp}-{random}.{ext}`
5. Public URL is returned and saved in database
6. Images are served via Supabase CDN

## File Organization

Files are organized by user ID:
```
uploads/
  ├── user-id-1/
  │   ├── 1234567890-abc123.jpg
  │   └── 1234567891-def456.png
  └── user-id-2/
      └── 1234567892-ghi789.jpg
```

## Benefits

- **Scalable**: No storage limits (within your Supabase plan)
- **Fast**: CDN delivery worldwide
- **Reliable**: Automatic backups
- **Secure**: Built-in access control
- **Cost-effective**: Free tier includes 1GB storage

## Troubleshooting

### "Bucket not found" error
- Make sure bucket name is exactly `uploads`
- Check bucket exists in Supabase dashboard

### "Access denied" error
- Verify bucket is set to **Public**
- Check service role key is correct
- Verify environment variables are set

### Files not displaying
- Check bucket is public
- Verify file URLs are correct
- Check CORS settings (should be automatic)

## Migration from Local Files

If you have existing files in `/public/uploads`:

1. You can manually upload them to Supabase Storage via dashboard
2. Or create a migration script to upload all existing files
3. Update database records with new Supabase URLs

## Next Steps

- Set up image optimization (Supabase supports this)
- Configure automatic image resizing
- Set up file cleanup for deleted items
- Monitor storage usage in Supabase dashboard

Your file uploads are now production-ready! 🎉



