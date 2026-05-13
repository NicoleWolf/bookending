import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// True when real Supabase credentials are configured; false in plain-dev mode
export const hasSupabase = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl     ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key',
);
