import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '@/lib/supabase';

type Json = Record<string, any>;

function readJsonFile(p: string): any[] {
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch (err) {
    return [{ __error: 'failed_to_parse_json', message: (err as any)?.message || String(err) }];
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Json>) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const isProdLike = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
  const useSupabase = process.env.USE_SUPABASE === 'true' || isProdLike;

  try {
    if (useSupabase) {
      if (!supabaseAdmin) {
        return res.status(500).json({
          backend: 'supabase',
          error: 'supabaseAdmin is not initialized',
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          hasService: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        });
      }

      const [{ count: itemsCount, error: itemsCountErr }, { data: itemsSample, error: itemsErr }] =
        await Promise.all([
          supabaseAdmin.from('items').select('*', { count: 'exact', head: true }),
          supabaseAdmin
            .from('items')
            .select('id,status,"approvalStatus","createdAt","categoryId","sellerId"')
            .order('createdAt', { ascending: false })
            .limit(5),
        ]);

      const [{ count: categoriesCount, error: categoriesCountErr }, { data: categoriesSample, error: catsErr }] =
        await Promise.all([
          supabaseAdmin.from('categories').select('*', { count: 'exact', head: true }),
          supabaseAdmin
            .from('categories')
            .select('id,name,"createdAt"')
            .order('createdAt', { ascending: false })
            .limit(5),
        ]);

      return res.status(200).json({
        backend: 'supabase',
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasService: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        counts: {
          items: itemsCount ?? null,
          categories: categoriesCount ?? null,
        },
        errors: {
          itemsCount: itemsCountErr?.message || null,
          itemsSample: itemsErr?.message || null,
          categoriesCount: categoriesCountErr?.message || null,
          categoriesSample: catsErr?.message || null,
        },
        sample: {
          items: itemsSample || [],
          categories: categoriesSample || [],
        },
      });
    }

    // JSON/local fallback
    const dataDir = path.join(process.cwd(), 'data');
    const items = readJsonFile(path.join(dataDir, 'items.json'));
    const categories = readJsonFile(path.join(dataDir, 'categories.json'));

    return res.status(200).json({
      backend: 'json',
      dataDir,
      counts: {
        items: items.length,
        categories: categories.length,
      },
      sample: {
        items: items.slice(0, 3),
        categories: categories.slice(0, 3),
      },
    });
  } catch (err: any) {
    console.error('DB health check error:', err?.message || err);
    return res.status(500).json({ error: 'DB health check failed', message: err?.message || String(err) });
  }
}

