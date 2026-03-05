import { createClient } from '@supabase/supabase-js';

// Fallback prevents build-time crash when env vars are not set.
// At runtime these must be real values (set in Vercel env).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
