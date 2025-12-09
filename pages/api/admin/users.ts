import type { NextApiRequest, NextApiResponse } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { User } from '@/lib/types';
import { sendWelcomeEmail } from '@/lib/otp';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Log the method for debugging
  console.log('[Admin Users API] Method:', req.method);
  
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = await getCurrentUser(token || null);

  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'GET') {
    const { status } = req.query;
    const allUsers = (await db.users.getAll()) as User[];

    // Remove passwords
    let users: Omit<User, 'password'>[] = allUsers.map(({ password, ...user }: User) => user);

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
      if (!['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
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

    // Get the user before updating to check if status is changing to 'approved'
    const userBeforeUpdate = await db.users.getById(userId);
    if (!userBeforeUpdate) {
      return res.status(404).json({ error: 'User not found' });
    }

    const wasPending = userBeforeUpdate.status === 'pending';
    const isBeingApproved = status === 'approved';

    console.log('[Admin Users API] Status change:', {
      userId,
      previousStatus: userBeforeUpdate.status,
      newStatus: status,
      wasPending,
      isBeingApproved,
      willSendEmail: wasPending && isBeingApproved
    });

    const updatedUser = await db.users.update(userId, updates);

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Send welcome email if user was just approved
    if (wasPending && isBeingApproved) {
      console.log('[Admin Users API] Attempting to send welcome email to:', updatedUser.email);
      try {
        await sendWelcomeEmail(updatedUser.email, updatedUser.name);
        console.log('[Admin Users API] Welcome email sent successfully');
      } catch (error: any) {
        // Log error but don't fail the request
        console.error('[Admin Users API] Failed to send welcome email:', error);
        console.error('[Admin Users API] Error details:', error.message, error.stack);
      }
    } else {
      console.log('[Admin Users API] Welcome email not sent. Conditions:', {
        wasPending,
        isBeingApproved,
        previousStatus: userBeforeUpdate.status,
        newStatus: status
      });
    }

    const { password: _, ...userWithoutPassword } = updatedUser;
    return res.status(200).json({ user: userWithoutPassword });
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
      console.error('[Admin Users API] Error deleting user:', error);
      return res.status(500).json({ 
        error: 'Failed to delete user', 
        details: error.message || 'Unknown error occurred' 
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
