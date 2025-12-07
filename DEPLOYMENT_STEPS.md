# Production Deployment Steps

## ✅ Step 1: Code Pushed to GitHub
- All changes have been committed and pushed to: https://github.com/scaperhub/web.git

## 📋 Step 2: Prerequisites Checklist

Before deploying, make sure you have:

- [ ] **Supabase Project** created at https://supabase.com
- [ ] **Supabase Database Schema** run (use `supabase-schema.sql`)
- [ ] **Supabase Storage Bucket** created (for file uploads)
- [ ] **Environment Variables** ready:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `USE_SUPABASE=true`
  - `JWT_SECRET` (generate a random string)

## 🚀 Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended for first time)

1. Go to https://vercel.com/new
2. Import your GitHub repository: `scaperhub/web`
3. Vercel will auto-detect Next.js
4. Click **Deploy** (you can add environment variables later)

### Option B: Deploy via CLI

```bash
# Login to Vercel (will open browser)
npx vercel login

# Deploy to preview
npx vercel

# After adding environment variables, deploy to production
npx vercel --prod
```

## 🔐 Step 4: Add Environment Variables

After first deployment, add environment variables in Vercel Dashboard:

1. Go to your project on Vercel
2. Settings → Environment Variables
3. Add each variable:
   - `NEXT_PUBLIC_SUPABASE_URL` = your-supabase-url
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your-anon-key
   - `SUPABASE_SERVICE_ROLE_KEY` = your-service-role-key
   - `USE_SUPABASE` = true
   - `JWT_SECRET` = generate-random-string

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🔄 Step 5: Redeploy

After adding environment variables:
- Go to Deployments tab
- Click "..." on latest deployment
- Click "Redeploy"

Or push a new commit to trigger automatic deployment.

## ✅ Step 6: Verify Deployment

1. Visit your Vercel URL (e.g., `your-project.vercel.app`)
2. Test:
   - Homepage loads
   - User registration
   - Login
   - Create item listing
   - Browse items

## 📝 Notes

- File uploads currently save to `/public/uploads` which has limitations on Vercel
- Consider migrating to Supabase Storage for production (see `SUPABASE_STORAGE_SETUP.md`)
- Vercel has a 10MB limit for serverless functions
- Files in `/public/uploads` are lost on redeploy (use Supabase Storage for persistence)

## 🆘 Troubleshooting

- **Build fails**: Check build logs in Vercel dashboard
- **Database errors**: Verify Supabase credentials and schema
- **File upload errors**: Check file size limits, consider Supabase Storage
- **Environment variables not working**: Redeploy after adding variables


