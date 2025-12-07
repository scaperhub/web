import type { NextApiRequest, NextApiResponse } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { User } from '@/lib/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = await getCurrentUser(token || null);

  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'GET') {
    const { status } = req.query;
    const allUsers = await db.users.getAll();

    // Remove passwords
    let users = allUsers.map(({ password, ...user }) => user) as Omit<User, 'password'>[];

    if (status) {
      users = users.filter(u => u.status === status);
    }

    // Sort by newest first
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.status(200).json({ users });
  }

  if (req.method === 'PUT') {
    const { userId, status, verified } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const updates: Partial<User> = {};

    if (status !== undefined) {
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      updates.status = status;
    }

    if (verified !== undefined) {
      updates.verified = verified === true;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }

    const updatedUser = await db.users.update(userId, updates);

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = updatedUser;
    return res.status(200).json({ user: userWithoutPassword });
  }

  // DELETE handler added above
  return res.status(405).json({ error: 'Method not allowed' });
}


  if (req.method === 'DELETE' || req.method === 'delete') {
    console.log('[Admin Users API] DELETE request received, method:', req.method);
    const { userId } = req.body;
    console.log('[Admin Users API] UserId to delete:', userId);

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // Check if user exists
    const userToDelete = await db.users.getById(userId);
    if (!userToDelete) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting yourself
    if (userId === user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    try {
      const success = await db.users.delete(userId);

      if (!success) {
        return res.status(500).json({ error: 'Failed to delete user. Please check server logs for details.' });
      }

      return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ 
        error: 'Failed to delete user', 
        details: error.message || 'Unknown error occurred' 
      });
    }
  }
