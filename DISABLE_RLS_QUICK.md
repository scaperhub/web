# Quick Fix: Disable RLS (30 seconds)

## Steps:
1. Supabase Dashboard → **Storage** → **Buckets**
2. Click **`uploads`** bucket
3. Find **"RLS enabled"** toggle
4. **Turn it OFF** ✅
5. Save
6. Done!

## If you can't find the toggle:
- Go to **Storage** → **Policies** → **`uploads`**
- Delete any existing policies
- Or create a policy that allows everything:

```sql
CREATE POLICY "Allow all operations"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'uploads')
WITH CHECK (bucket_id = 'uploads');
```

That's it! Try uploading again.
