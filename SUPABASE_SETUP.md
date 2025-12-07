# Supabase Setup Guide

## Step 1: Create a Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: Your project name (e.g., "scaperhub")
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you
5. Click "Create new project"
6. Wait 2-3 minutes for the project to be created

## Step 2: Get Your Supabase Credentials

Once your project is ready:

1. Go to **Settings** → **API** (in the left sidebar)
2. You'll see two important values:

### Project URL
- This is your `NEXT_PUBLIC_SUPABASE_URL`
- Looks like: `https://xxxxxxxxxxxxx.supabase.co`
- Copy this entire URL

### anon/public key
- This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (very long string)
- Copy this entire key

### service_role key (Optional, for admin operations)
- Scroll down to find "service_role" key
- This is your `SUPABASE_SERVICE_ROLE_KEY`
- ⚠️ **Keep this secret!** Never expose it in client-side code
- Only use it for server-side admin operations

## Step 3: Set Up the Database Schema

1. In Supabase, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Open the file `supabase-schema.sql` from your project
4. Copy ALL the SQL code
5. Paste it into the SQL Editor
6. Click "Run" (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"

## Step 4: Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add these three variables:

### Variable 1:
- **Name**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: Your Project URL from Step 2 (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
- **Environment**: Select all (Production, Preview, Development)

### Variable 2:
- **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: Your anon/public key from Step 2
- **Environment**: Select all (Production, Preview, Development)

### Variable 3:
- **Name**: `USE_SUPABASE`
- **Value**: `true`
- **Environment**: Select all (Production, Preview, Development)

### Variable 4 (Optional):
- **Name**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: Your service_role key from Step 2
- **Environment**: Production only (for security)

5. Click "Save" for each variable

## Step 5: Redeploy Your Project

After adding the environment variables:

1. Go to **Deployments** tab in Vercel
2. Click the three dots (⋯) on the latest deployment
3. Click "Redeploy"
4. Or push a new commit to trigger a new deployment

## Step 6: Migrate Your Local Data (Optional)

If you have existing data in your local `data/` folder:

1. Make sure you have a `.env.local` file with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. Run the migration script:
   ```bash
   node scripts/migrate-to-supabase.js
   ```

3. Check your Supabase dashboard → **Table Editor** to verify data was migrated

## Troubleshooting

### "supabaseUrl is required" error
- Make sure `NEXT_PUBLIC_SUPABASE_URL` is set correctly in Vercel
- Redeploy after adding environment variables

### Data not showing
- Check that the SQL schema was run successfully
- Verify data exists in Supabase Table Editor
- Check browser console for errors

### Can't write to database
- Make sure `USE_SUPABASE=true` is set
- Check that you're using the correct keys
- Verify Row Level Security (RLS) policies if you set them up

## Summary

**What you need:**
1. ✅ Supabase project created
2. ✅ Database schema run (from `supabase-schema.sql`)
3. ✅ Environment variables set in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `USE_SUPABASE=true`
4. ✅ Project redeployed

**Where to find your credentials:**
- Supabase Dashboard → Settings → API

**That's it!** Your app will now use Supabase instead of JSON files.
