# Deploy Directly to Vercel - Quick Guide

You can deploy directly from your terminal without pushing to GitHub first!

## Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

## Step 2: Login to Vercel

```bash
vercel login
```

This will open your browser to authenticate.

## Step 3: Deploy

From your project directory, run:

```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No (first time) or Yes (if updating)
- **Project name?** → scaperhub (or your choice)
- **Directory?** → `./` (current directory)

## Step 4: Add Environment Variables

After first deployment, add environment variables:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add USE_SUPABASE
vercel env add JWT_SECRET
```

Or add them via Vercel Dashboard → Your Project → Settings → Environment Variables

## Step 5: Deploy to Production

```bash
vercel --prod
```

## That's It! 🎉

Your app will be live at `your-project.vercel.app`

---

## Quick Commands

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View deployments
vercel ls

# View logs
vercel logs
```

## Environment Variables Needed

Before deploying, make sure you have:
- Supabase project set up
- Supabase Storage bucket created
- All environment variables ready

See `VERCEL_DEPLOYMENT.md` for complete setup instructions.



