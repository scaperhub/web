import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

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

  // Get all users and find who follows this user
  const allUsers = await db.users.getAll();
  const followers = allUsers
    .filter(u => u.following && u.following.includes(profileUser.id))
    .map(({ password, ...user }) => user); // Remove passwords

  return res.status(200).json({ followers });
}



