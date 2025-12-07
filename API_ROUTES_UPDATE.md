# API Routes Update Guide

All API routes need to be updated to use `async/await` since database operations are now asynchronous when using Supabase.

## Pattern to Follow

**Before:**
```typescript
const items = db.items.getAll();
db.items.create(item);
```

**After:**
```typescript
const items = await db.items.getAll();
await db.items.create(item);
```

## Files That Need Updates

Update all database calls in these files to use `await`:

1. `pages/api/items/index.ts` ✅ (partially updated)
2. `pages/api/items/[id].ts`
3. `pages/api/categories/index.ts` ✅ (partially updated)
4. `pages/api/categories/[id].ts`
5. `pages/api/users/[username].ts`
6. `pages/api/users/[username]/followers.ts`
7. `pages/api/users/[username]/following.ts`
8. `pages/api/users/follow.ts`
9. `pages/api/users/update.ts`
10. `pages/api/users/by-ids.ts`
11. `pages/api/auth/login.ts`
12. `pages/api/auth/register.ts`
13. `pages/api/auth/verify-otp.ts`
14. `pages/api/auth/resend-otp.ts`
15. `pages/api/messages/index.ts`
16. `pages/api/admin/users.ts`
17. `pages/api/admin/items.ts`

## Quick Find & Replace

Search for these patterns and add `await`:

- `db.users.` → `await db.users.`
- `db.items.` → `await db.items.`
- `db.categories.` → `await db.categories.`
- `db.messages.` → `await db.messages.`
- `db.conversations.` → `await db.conversations.`
- `db.otps.` → `await db.otps.`

## Example: Complete Route Update

**Before:**
```typescript
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const items = db.items.getAll();
    return res.status(200).json({ items });
  }
}
```

**After:**
```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const items = await db.items.getAll();
    return res.status(200).json({ items });
  }
}
```

Note: The handler function itself must be `async` if you're using `await` inside it.



