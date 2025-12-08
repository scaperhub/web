import type { NextApiRequest, NextApiResponse } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = await getCurrentUser(token || null);

  if (req.method === 'GET') {
    const item = await db.items.getById(id as string);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    return res.status(200).json({ item });
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const item = await db.items.getById(id as string);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Only seller or admin can update
    if (item.sellerId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updates = req.body;
    
    // When a non-admin owner edits their item, reset approval status to 'pending'
    // This ensures edited items go through the approval process again
    if (item.sellerId === user.id && user.role !== 'admin') {
      // Force approval status to 'pending' for non-admin owners
      updates.approvalStatus = 'pending';
    } else if (item.sellerId === user.id && user.role === 'admin') {
      // Admin editing their own item keeps it approved (they can approve themselves)
      updates.approvalStatus = updates.approvalStatus || item.approvalStatus || 'approved';
    }
    // If admin is editing someone else's item, they can set approvalStatus explicitly via the request body
    
    const updated = await db.items.update(id as string, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({ item: updated });
  }

  if (req.method === 'DELETE') {
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const item = await db.items.getById(id as string);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Only seller or admin can delete
    if (item.sellerId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db.items.delete(id as string);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}



