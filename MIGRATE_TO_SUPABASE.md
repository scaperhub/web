# Migrating Local Data to Supabase

Your local database has data, but Vercel's serverless functions don't persist JSON files. You need to migrate to Supabase.

## Quick Setup

### 1. Set up Supabase Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables and add:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (optional, for admin operations)
USE_SUPABASE=true
```

### 2. Run the Supabase Schema

1. Go to your Supabase project → SQL Editor
2. Run the SQL from `supabase-schema.sql` file

### 3. Migrate Your Local Data

Run this script to migrate your local JSON data to Supabase:

```bash
node scripts/migrate-to-supabase.js
```

Or manually import the data using the Supabase dashboard.

## Alternative: Keep Using JSON Files (Not Recommended for Production)

If you want to keep using JSON files, you'll need to:
1. Commit the `data/` directory to git
2. The files will be read-only on Vercel
3. This won't work for writes/updates

**Note:** JSON file-based storage is only suitable for development. For production, use Supabase.


