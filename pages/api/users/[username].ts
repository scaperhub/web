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
    return res.status(400).json({ error: 'Username is required' });
  }

  const user = await db.users.getByUsername(username);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Remove password from response
  const { password, ...userWithoutPassword } = user;

  return res.status(200).json({ user: userWithoutPassword });
}



