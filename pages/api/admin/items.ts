import type { NextApiRequest, NextApiResponse } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Item, ItemApprovalStatus } from '@/lib/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = await getCurrentUser(token || null);

  if (!user || user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const { approvalStatus } = req.query;
    const statusFilter = Array.isArray(approvalStatus) ? approvalStatus[0] : approvalStatus;
    let items: Item[] = await db.items.getAll();

    // Filter by approvalStatus if specified
    if (statusFilter) {
      items = items.filter((i: Item) => i.approvalStatus === statusFilter);
    }

    // Sort by newest first
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.status(200).json({ items });
  }

  if (req.method === 'PUT') {
    const { itemId, approvalStatus } = req.body;

    if (!itemId || !approvalStatus) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['pending', 'approved', 'rejected'].includes(approvalStatus)) {
      return res.status(400).json({ error: 'Invalid approval status' });
    }

    const item = await db.items.update(itemId, { 
      approvalStatus: approvalStatus as ItemApprovalStatus,
      updatedAt: new Date().toISOString()
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    return res.status(200).json({ item });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
