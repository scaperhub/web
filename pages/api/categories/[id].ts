import type { NextApiRequest, NextApiResponse } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { Subcategory } from '@/lib/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = await getCurrentUser(token || null);

  if (req.method === 'GET') {
    const category = await db.categories.getById(id as string);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    return res.status(200).json({ category });
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const category = await db.categories.getById(id as string);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const { name, description, subcategories } = req.body;
    const updates: any = {};

    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (subcategories) {
      updates.subcategories = subcategories.map((sub: { name: string; description?: string; id?: string }) => {
        if (sub.id) {
          // Update existing subcategory
          const existing = category.subcategories.find((s: any) => s.id === sub.id);
          if (existing) {
            return { ...existing, name: sub.name, description: sub.description };
          }
        }
        // Create new subcategory
        return {
          id: generateId(),
          name: sub.name,
          categoryId: id as string,
          description: sub.description,
          createdAt: new Date().toISOString(),
        };
      });
    }

    const updated = await db.categories.update(id as string, updates);
    return res.status(200).json({ category: updated });
  }

  if (req.method === 'DELETE') {
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db.categories.delete(id as string);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}



