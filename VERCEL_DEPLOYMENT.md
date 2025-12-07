# Vercel Deployment Guide

This guide will help you deploy ScaperHub to Vercel.

## Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free)
3. **Supabase Project** - Set up Supabase (see `SUPABASE_SETUP.md`)

## Step 1: Push Code to GitHub

If you haven't already:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/scaperhub.git
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js
5. Configure the project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# Deploy to production
vercel --prod
```

## Step 3: Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

### Required Variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Enable Supabase
USE_SUPABASE=true

# JWT Secret (generate a strong random string)
JWT_SECRET=your-strong-random-secret-key-here

# Node Environment
NODE_ENV=production
```

### How to Get Supabase Credentials:

1. Go to your Supabase project dashboard
2. Settings → API
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### Generate JWT Secret:

```bash
# Generate a random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 4: Set Up Supabase Database

1. Go to your Supabase project
2. Open **SQL Editor**
3. Copy and paste the contents of `supabase-schema.sql`
4. Click **Run**
5. Verify tables are created in **Table Editor**

## Step 5: Migrate Data (Optional)

If you have existing data:

1. Run migration script locally:
   ```bash
   npx ts-node scripts/migrate-to-supabase.ts
   ```

Or use Supabase dashboard to import data manually.

## Step 6: Configure File Uploads

Vercel has a **10MB limit** for serverless functions. For production, consider:

### Option A: Use Supabase Storage (Recommended)

1. In Supabase dashboard, go to **Storage**
2. Create a bucket called `uploads`
3. Make it public or configure RLS policies
4. Update your upload API to use Supabase Storage instead of local files

### Option B: Use External Storage

- AWS S3
- Cloudinary
- Uploadcare

### Current Setup (Temporary)

The current setup saves files to `/public/uploads`, which works but has limitations:
- Files are lost on redeploy
- 10MB limit per upload
- Not scalable

**For now, it will work but consider migrating to Supabase Storage for production.**

## Step 7: Redeploy

After adding environment variables:

1. Go to Vercel Dashboard → Your Project
2. Click **Deployments** tab
3. Click the **"..."** menu on the latest deployment
4. Click **"Redeploy"**

Or push a new commit to trigger automatic deployment.

## Step 8: Verify Deployment

1. Visit your Vercel URL (e.g., `your-project.vercel.app`)
2. Test:
   - User registration
   - Login
   - Create a listing
   - Browse items
   - Send messages

## Important Notes

### File Uploads on Vercel

⚠️ **Current Limitation**: Files uploaded to `/public/uploads` are:
- Stored temporarily
- Lost on redeploy
- Limited to 10MB

**Solution**: Migrate to Supabase Storage (see Step 6)

### Database

✅ **Supabase**: Fully supported on Vercel
- Works with serverless functions
- No connection pooling issues
- Automatic backups

### Environment Variables

- `NEXT_PUBLIC_*` variables are exposed to the browser
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client
- Use Vercel's environment variable encryption

### Custom Domain

1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. SSL is automatic

## Troubleshooting

### Build Fails

- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript errors are fixed

### Database Connection Errors

- Verify Supabase credentials are correct
- Check Supabase project is active
- Verify database schema is created

### File Upload Errors

- Check file size (10MB limit)
- Verify `/public/uploads` directory exists
- Consider migrating to Supabase Storage

### Environment Variables Not Working

- Redeploy after adding variables
- Check variable names match exactly
- Verify no typos in values

## Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Supabase database schema created
- [ ] Data migrated (if applicable)
- [ ] Test user registration
- [ ] Test item creation
- [ ] Test messaging
- [ ] Verify file uploads work
- [ ] Set up custom domain (optional)
- [ ] Configure email service for OTP (optional)

## Next Steps

1. **Set up email service** for OTP verification (SendGrid, Resend, etc.)
2. **Migrate file uploads** to Supabase Storage
3. **Set up monitoring** (Vercel Analytics)
4. **Configure backups** in Supabase
5. **Set up CI/CD** (automatic on Vercel with GitHub)

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Discord](https://vercel.com/discord)
- Check deployment logs in Vercel dashboard

Your app should now be live! 🚀



