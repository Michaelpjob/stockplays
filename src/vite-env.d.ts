/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_FINNHUB_KEY?: string;
  readonly VITE_SHOW_BUILDER?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
  readonly VITE_PLAUSIBLE_DOMAIN?: string;
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
