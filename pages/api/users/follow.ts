import type { NextApiRequest, NextApiResponse } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const currentUser = await getCurrentUser(token || null);

  if (!currentUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    if (userId === currentUser.id) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const userToFollow = await db.users.getById(userId);
    if (!userToFollow) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = await db.users.getById(currentUser.id);
    if (!user) {
      return res.status(404).json({ error: 'Current user not found' });
    }

    // Check if already following
    if (user.following && user.following.includes(userId)) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // Add to following list
    const updatedFollowing = user.following ? [...user.following, userId] : [userId];
    const updatedUser = await db.users.update(currentUser.id, { following: updatedFollowing });

    if (!updatedUser) {
      return res.status(500).json({ error: 'Failed to follow user' });
    }

    const { password, ...userWithoutPassword } = updatedUser;
    return res.status(200).json({ user: userWithoutPassword });
  }

  if (req.method === 'DELETE') {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const user = await db.users.getById(currentUser.id);
    if (!user) {
      return res.status(404).json({ error: 'Current user not found' });
    }

    // Check if following
    if (!user.following || !user.following.includes(userId)) {
      return res.status(400).json({ error: 'Not following this user' });
    }

    // Remove from following list
    const updatedFollowing = user.following.filter(id => id !== userId);
    const updatedUser = await db.users.update(currentUser.id, { following: updatedFollowing });

    if (!updatedUser) {
      return res.status(500).json({ error: 'Failed to unfollow user' });
    }

    const { password, ...userWithoutPassword } = updatedUser;
    return res.status(200).json({ user: userWithoutPassword });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

