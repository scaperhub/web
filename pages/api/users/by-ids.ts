import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds)) {
    return res.status(400).json({ error: 'userIds array is required' });
  }

  const allUsers = await db.users.getAll();
  const requestedUsers = allUsers
    .filter(u => userIds.includes(u.id))
    .map(({ password, ...user }) => user); // Remove passwords

  return res.status(200).json({ users: requestedUsers });
}



