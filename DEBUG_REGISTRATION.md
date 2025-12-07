# Debug Registration Error - Quick Steps

## Immediate Steps to Find the Error

### Step 1: Check Browser Console
1. Open your deployed site
2. Press F12 to open Developer Tools
3. Go to **Console** tab
4. Try to register
5. Look for any red error messages

### Step 2: Check Network Tab
1. In Developer Tools, go to **Network** tab
2. Try to register again
3. Find the request to `/api/auth/register`
4. Click on it
5. Check:
   - **Status** (should be 200, not 500)
   - **Response** tab - this shows the actual error message

### Step 3: Check Vercel Logs
1. Go to Vercel Dashboard
2. Your Project → **Deployments**
3. Latest deployment → **Functions** tab
4. Look for errors when you try to register
5. The logs will show the exact error

### Step 4: Test API Directly
Open browser console on your site and run:

```javascript
fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'test123456',
    name: 'Test User',
    username: 'testuser123',
    userType: 'hobbyist',
    country: 'US',
    city: 'Test City'
  })
})
.then(r => r.json())
.then(d => {
  if (d.error) {
    console.error('❌ Error:', d.error);
    console.error('Details:', d.details);
  } else {
    console.log('✅ Success:', d);
  }
})
.catch(e => console.error('❌ Network Error:', e));
```

This will show you the exact error message.

## Most Common Issues

### 1. Supabase Not Connected
**Error message will say:** "supabaseUrl is required" or database connection error

**Fix:**
- Check Vercel environment variables
- Make sure `USE_SUPABASE=true` is set
- Redeploy after adding variables

### 2. Database Tables Missing
**Error message will say:** "relation 'users' does not exist"

**Fix:**
- Go to Supabase → SQL Editor
- Run the SQL from `supabase-schema.sql`
- Verify tables exist in Table Editor

### 3. Row Level Security (RLS)
**Error message will say:** "new row violates row-level security policy"

**Fix:**
- Go to Supabase → Authentication → Policies
- Disable RLS temporarily to test, or create proper policies

### 4. Missing Environment Variables
**Error:** Generic 500 error

**Fix:**
- Verify all three variables are set in Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `USE_SUPABASE=true`

## Quick Test

Run this to test if Supabase is working:

```javascript
// Test database connection
fetch('/api/items')
  .then(r => r.json())
  .then(d => {
    if (d.error) {
      console.error('❌ Database error:', d.error);
    } else {
      console.log('✅ Database works! Items:', d.items?.length || 0);
    }
  });
```

If this fails, your Supabase isn't connected properly.


