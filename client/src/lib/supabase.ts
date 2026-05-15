import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// True when real Supabase credentials are configured; false in plain-dev mode
export const hasSupabase = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl     ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key',
);

// Capture PASSWORD_RECOVERY at module load time — before React renders.
// Supabase processes the URL hash immediately on createClient(), firing the
// event before any React effect can register a listener.
let _pendingRecovery = false;
supabase.auth.onAuthStateChange((event) => {
  if (event === 'PASSWORD_RECOVERY') _pendingRecovery = true;
});

export function consumePasswordRecovery(): boolean {
  const val = _pendingRecovery;
  _pendingRecovery = false;
  return val;
}
