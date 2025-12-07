import type { NextApiRequest, NextApiResponse } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { Item } from '@/lib/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = await getCurrentUser(token || null);

  if (req.method === 'GET') {
    const { categoryId, sellerId, status, approvalStatus } = req.query;
    let items = await db.items.getAll();

    // Filter by approvalStatus: non-admins only see approved items (except their own)
    if (!user || user.role !== 'admin') {
      items = items.filter(i => {
        // Always show approved items
        if (i.approvalStatus === 'approved') return true;
        // Show pending/rejected items only if user is viewing their own items
        if (sellerId && i.sellerId === sellerId && user && i.sellerId === user.id) {
          return true;
        }
        return false;
      });
    } else if (approvalStatus) {
      // Admin can filter by approvalStatus if specified
      items = items.filter(i => i.approvalStatus === approvalStatus);
    }

    if (categoryId) {
      items = items.filter(i => i.categoryId === categoryId);
    }
    if (sellerId) {
      items = items.filter(i => i.sellerId === sellerId);
    }
    if (status) {
      items = items.filter(i => i.status === status);
    }

    // Sort by newest first
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.status(200).json({ items });
  }

  if (req.method === 'POST') {
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { title, description, price, quantity, images, categoryId, subcategoryId, location, condition } = req.body;

    if (!title || !description || !price || !categoryId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if category has subcategories
    const category = await db.categories.getById(categoryId);
    if (category && category.subcategories.length > 0 && !subcategoryId) {
      return res.status(400).json({ error: 'Subcategory is required for this category' });
    }

    const item: Item = {
      id: generateId(),
      title,
      description,
      price: parseFloat(price),
      quantity: quantity ? parseInt(quantity, 10) : 1,
      images: images || [],
      categoryId,
      subcategoryId: subcategoryId || '', // Allow empty string if no subcategories
      sellerId: user.id,
      status: 'available',
      // Admin users' items are automatically approved
      approvalStatus: user.role === 'admin' ? 'approved' : 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      location,
      condition,
    };

    await db.items.create(item);
    return res.status(201).json({ item });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

