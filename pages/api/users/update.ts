import type { NextApiRequest, NextApiResponse } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { User } from '@/lib/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  const currentUser = await getCurrentUser(token || null);

  if (!currentUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { name, bio, avatar, backgroundPicture, country, city } = req.body;

  // Only allow updating specific fields (username cannot be changed)
  const updates: Partial<User> = {};
  if (name !== undefined) updates.name = name;
  if (bio !== undefined) updates.bio = bio;
  if (avatar !== undefined) updates.avatar = avatar;
  if (backgroundPicture !== undefined) updates.backgroundPicture = backgroundPicture;
  if (country !== undefined) updates.country = country;
  if (city !== undefined) updates.city = city;

  const updatedUser = await db.users.update(currentUser.id, updates);

  if (!updatedUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Remove password from response
  const { password, ...userWithoutPassword } = updatedUser;

  return res.status(200).json({ user: userWithoutPassword });
}



