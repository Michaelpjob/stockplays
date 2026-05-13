import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// `isDemoMode` is true when no Supabase project is configured.
// In that case the app falls back to in-memory mock data so the prototype
// is fully clickable without a backend. The moment both env vars exist the
// app talks to the real database (and auth, subscriptions, etc. persist).
export const isDemoMode = !url || !anonKey;

export const supabase = isDemoMode
  ? null
  : createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
