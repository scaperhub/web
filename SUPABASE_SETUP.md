# Supabase Integration Guide

This guide will help you set up Supabase for your ScaperHub project.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: ScaperHub (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be set up (2-3 minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")
   - **service_role key** (under "Project API keys" - keep this secret!)

## Step 3: Set Up Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Enable Supabase (set to 'true' to use Supabase, 'false' for JSON files)
USE_SUPABASE=true

# JWT Secret (keep your existing one)
JWT_SECRET=your-jwt-secret-here
```

**Important**: 
- Never commit `.env.local` to git (it's already in `.gitignore`)
- The `NEXT_PUBLIC_` prefix makes these variables available in the browser
- The service role key should NEVER be exposed to the client

## Step 4: Create Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the contents of `supabase-schema.sql`
4. Click "Run" (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned"

This creates all the necessary tables, indexes, and security policies.

## Step 5: Migrate Existing Data (Optional)

If you have existing data in JSON files:

1. Make sure your `.env.local` is set up correctly
2. Run the migration script:

```bash
npm install dotenv
npx ts-node scripts/migrate-to-supabase.ts
```

This will migrate all your existing users, items, categories, messages, etc. to Supabase.

## Step 6: Update Your Code

The code is already set up! The `lib/db.ts` file automatically uses Supabase when:
- `USE_SUPABASE=true` is set, OR
- Supabase environment variables are present

## Step 7: Update API Routes to Use Async

All API routes need to be updated to use `async/await` since database operations are now asynchronous.

### Example: `pages/api/items/index.ts`

**Before:**
```typescript
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const items = db.items.getAll();
  // ...
}
```

**After:**
```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const items = await db.items.getAll();
  // ...
}
```

You'll need to update all API routes in:
- `pages/api/items/`
- `pages/api/users/`
- `pages/api/categories/`
- `pages/api/messages/`
- `pages/api/auth/`
- `pages/api/admin/`

## Step 8: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Test basic functionality:
   - Register a new user
   - Create a category
   - List an item
   - Send a message

3. Check Supabase dashboard:
   - Go to **Table Editor** to see your data
   - Verify data is being created correctly

## Step 9: Deploy to Production

### Vercel Deployment

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `USE_SUPABASE=true`
   - `JWT_SECRET`

4. Deploy!

### Other Platforms

Add the same environment variables to your hosting platform.

## Troubleshooting

### "Missing Supabase credentials" error

- Check that `.env.local` exists and has the correct variables
- Restart your development server after adding environment variables
- Make sure variable names match exactly (case-sensitive)

### "relation does not exist" error

- Make sure you ran the SQL schema in Supabase SQL Editor
- Check that all tables were created (go to Table Editor)

### "Row Level Security" errors

- The schema includes RLS policies that allow all operations
- If you need to restrict access, update the policies in Supabase dashboard

### Migration script fails

- Make sure `SUPABASE_SERVICE_ROLE_KEY` is set (not just anon key)
- Check that your JSON files exist in the `data/` directory
- Verify your Supabase project is active

## Security Best Practices

1. **Never expose service role key** - Only use it server-side
2. **Use RLS policies** - Restrict access based on user authentication
3. **Enable email verification** - Use Supabase Auth for better security
4. **Regular backups** - Supabase provides automatic backups on paid plans
5. **Monitor usage** - Check Supabase dashboard for unusual activity

## Next Steps

- Set up Supabase Auth for better authentication
- Configure email templates for OTP
- Set up database backups
- Monitor performance in Supabase dashboard
- Consider using Supabase Storage for images instead of local uploads

## Need Help?

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- Check your Supabase project logs in the dashboard



