import type { NextApiRequest, NextApiResponse } from 'next';
import { getCurrentUser } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = await getCurrentUser(token || null);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.status(200).json({ user: userWithoutPassword });
}



