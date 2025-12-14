// Single Supabase-backed DB; JSON fallback removed.
function createDb(): any {
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasUrl || !hasAnon) {
    throw new Error(
      'Supabase is required but NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are missing.'
    );
  }

  // Lazy require to avoid bundling issues in some environments.
  const supabaseExport = require('./db-supabase');

  const supabaseDb =
    (supabaseExport as any)?.db ||
    (supabaseExport as any)?.default?.db ||
    (supabaseExport as any)?.default ||
    supabaseExport;

  if (!supabaseDb || !(supabaseDb as any).items) {
    const envInfo = {
      hasUrl,
      hasAnon,
      hasService: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
    throw new Error(
      `Supabase db failed to initialize (missing items collection). Env: ${JSON.stringify(envInfo)}`
    );
  }

  return supabaseDb;
}

export const db: any = createDb();
