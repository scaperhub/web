import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Only create Supabase clients if URL and key are provided
const hasSupabaseConfig = supabaseUrl && supabaseAnonKey;

// Client-side Supabase client (uses anon key)
let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

if (hasSupabaseConfig) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });
    supabaseAdminInstance = createClient(
      supabaseUrl,
      supabaseServiceRoleKey || supabaseAnonKey,
      {
        auth: {
          persistSession: false,
        },
      }
    );
  } catch (error) {
    // Silently fail if Supabase can't be initialized
    console.warn('Failed to initialize Supabase client:', error);
  }
}

export const supabase = supabaseInstance;
export const supabaseAdmin = supabaseAdminInstance;
