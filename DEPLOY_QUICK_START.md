# Quick Deploy to Vercel 🚀

## Fastest Way to Deploy

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push
```

### 2. Deploy via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Click **"Deploy"** (Vercel auto-detects Next.js)

### 3. Add Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables:

**Required:**
```
NEXT_PUBLIC_SUPABASE_URL = your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key
SUPABASE_SERVICE_ROLE_KEY = your-service-role-key
USE_SUPABASE = true
JWT_SECRET = generate-a-random-string
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Set Up Supabase

1. Create Supabase project at [supabase.com](https://supabase.com)
2. Run SQL from `supabase-schema.sql` in Supabase SQL Editor
3. Copy credentials to Vercel environment variables

### 5. Redeploy

After adding env vars, redeploy from Vercel dashboard.

## That's It! 🎉

Your app will be live at `your-project.vercel.app`

---

## Or Use Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

Follow prompts to add environment variables.

---

**Note**: File uploads currently save to `/public/uploads` which has limitations on Vercel. Consider migrating to Supabase Storage for production (see `VERCEL_DEPLOYMENT.md`).



