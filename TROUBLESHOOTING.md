# Troubleshooting Registration Errors

## "An error occurred. Please try again" Error

This error usually means something failed on the server. Here's how to debug:

### Step 1: Check Vercel Logs

1. Go to your Vercel Dashboard
2. Click on your project
3. Go to **Deployments** tab
4. Click on the latest deployment
5. Click **Functions** tab
6. Look for errors related to `/api/auth/register`

### Step 2: Common Issues

#### Issue 1: Supabase Not Connected
**Symptoms:**
- Error mentions "supabase" or "database connection"
- Tables don't exist

**Fix:**
1. Verify environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `USE_SUPABASE=true`
2. Make sure you ran the SQL schema in Supabase
3. Redeploy after adding variables

#### Issue 2: Missing Database Tables
**Symptoms:**
- Error: "relation 'users' does not exist" or similar

**Fix:**
1. Go to Supabase → SQL Editor
2. Run the SQL from `supabase-schema.sql`
3. Verify tables exist in Table Editor

#### Issue 3: Row Level Security (RLS) Blocking
**Symptoms:**
- Error: "new row violates row-level security policy"

**Fix:**
1. Go to Supabase → Authentication → Policies
2. Check if RLS is enabled on tables
3. Either disable RLS or create appropriate policies

#### Issue 4: Missing Required Fields
**Symptoms:**
- Error: "null value in column" or "missing required field"

**Fix:**
1. Check that all required fields are being sent:
   - email
   - password
   - name
   - username
   - userType
   - country
   - city

### Step 3: Test the API Directly

Open browser console on your site and run:

```javascript
fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'test123',
    name: 'Test User',
    username: 'testuser',
    userType: 'hobbyist',
    country: 'US',
    city: 'Test'
  })
})
.then(r => r.json())
.then(d => console.log('Response:', d))
.catch(e => console.error('Error:', e));
```

This will show you the exact error message.

### Step 4: Check Browser Network Tab

1. Open Developer Tools (F12)
2. Go to **Network** tab
3. Try to register
4. Click on the `/api/auth/register` request
5. Check the **Response** tab for error details

### Step 5: Verify Supabase Connection

Run this in browser console:

```javascript
fetch('/api/items')
  .then(r => r.json())
  .then(d => {
    if (d.error) {
      console.error('Database error:', d.error);
    } else {
      console.log('✅ Database connection works!');
    }
  });
```

## Quick Fixes

### If using Supabase:
1. ✅ Check environment variables are set in Vercel
2. ✅ Verify SQL schema was run
3. ✅ Check Supabase dashboard for errors
4. ✅ Redeploy after making changes

### If using JSON files:
1. ✅ Make sure `data/` directory is committed to git
2. ✅ Verify `USE_SUPABASE` is not set to `true`
3. ✅ Check that files are readable (not write-protected)

## Still Not Working?

1. Check Vercel function logs for detailed error messages
2. Verify all environment variables are set correctly
3. Make sure Supabase tables match the schema
4. Try creating a user directly in Supabase Table Editor to test

