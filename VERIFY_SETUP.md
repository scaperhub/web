# How to Verify Your Supabase Setup

## Quick Verification Checklist

### ✅ Step 1: Verify Environment Variables in Vercel

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Check that these are set:
   - ✅ `NEXT_PUBLIC_SUPABASE_URL` (should start with `https://`)
   - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` (long string starting with `eyJ...`)
   - ✅ `USE_SUPABASE` = `true`

### ✅ Step 2: Verify Database Schema in Supabase

1. Go to Supabase Dashboard → **Table Editor**
2. You should see these tables:
   - ✅ `users`
   - ✅ `categories`
   - ✅ `items`
   - ✅ `conversations`
   - ✅ `messages`
   - ✅ `otps`
   - ✅ `subcategories` (if you have subcategories)

If tables are missing, run the SQL from `supabase-schema.sql` in Supabase SQL Editor.

### ✅ Step 3: Test Locally (Optional)

1. Create a `.env.local` file with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   USE_SUPABASE=true
   ```

2. Run the verification script:
   ```bash
   node scripts/verify-supabase.js
   ```

3. You should see all ✅ checkmarks

### ✅ Step 4: Check Your Deployed Site

1. Go to your Vercel deployment URL
2. Open browser Developer Tools (F12) → Console tab
3. Look for any errors related to Supabase
4. Try to:
   - ✅ View the homepage (should show items if you migrated data)
   - ✅ Register a new account (should work now!)
   - ✅ Create a new listing (should work now!)

### ✅ Step 5: Verify in Supabase Dashboard

1. Go to Supabase → **Table Editor**
2. After registering a new account, check the `users` table
3. After creating a listing, check the `items` table
4. You should see new data appearing!

## Common Issues

### ❌ "supabaseUrl is required" error
- **Fix**: Make sure `NEXT_PUBLIC_SUPABASE_URL` is set in Vercel
- **Fix**: Redeploy after adding environment variables

### ❌ Tables don't exist
- **Fix**: Run the SQL from `supabase-schema.sql` in Supabase SQL Editor

### ❌ Can't create new users/items
- **Fix**: Make sure `USE_SUPABASE=true` is set
- **Fix**: Check that you're using the correct Supabase keys
- **Fix**: Verify Row Level Security (RLS) policies if you set them up

### ❌ Data not showing
- **Fix**: Migrate your local data using `node scripts/migrate-to-supabase.js`
- **Fix**: Check Supabase Table Editor to see if data exists

## Quick Test Commands

### Test if Supabase is being used:
```bash
# In your browser console on the deployed site:
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
# Should show your Supabase URL (not undefined)
```

### Test API endpoint:
```bash
# Should return items from Supabase, not JSON files
curl https://your-site.vercel.app/api/items
```

## Success Indicators

✅ Your site loads without errors  
✅ You can register new accounts  
✅ You can create new listings  
✅ Data persists after page refresh  
✅ New data appears in Supabase Table Editor  

If all of these work, your Supabase setup is complete! 🎉


