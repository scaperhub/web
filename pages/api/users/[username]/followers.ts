import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { User } from '@/lib/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username } = req.query;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Missing username' });
  }

  const profileUser = await db.users.getByUsername(username);

  if (!profileUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  const allUsers = (await db.users.getAll()) as User[];
  const followers = allUsers
    .filter((u: User) => u.following && u.following.includes(profileUser.id))
    .map(({ password, ...user }: User) => user); // Remove passwords

  return res.status(200).json({ followers });
}
