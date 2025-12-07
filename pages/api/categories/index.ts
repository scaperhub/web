import type { NextApiRequest, NextApiResponse } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { Category, Subcategory } from '@/lib/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = await getCurrentUser(token || null);

  if (req.method === 'GET') {
    const categories = await db.categories.getAll();
    return res.status(200).json({ categories });
  }

  if (req.method === 'POST') {
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { name, description, subcategories } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const category: Category = {
      id: generateId(),
      name,
      description,
      createdAt: new Date().toISOString(),
      subcategories: (subcategories || []).map((sub: { name: string; description?: string }) => ({
        id: generateId(),
        name: sub.name,
        categoryId: '',
        description: sub.description,
        createdAt: new Date().toISOString(),
      })),
    };

    // Set categoryId for subcategories
    category.subcategories = category.subcategories.map(sub => ({
      ...sub,
      categoryId: category.id,
    }));

    await db.categories.create(category);
    return res.status(201).json({ category });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

