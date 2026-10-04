/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_BOT_USERNAME: string;
  readonly VITE_TELEGRAM_APP_SHORT_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
