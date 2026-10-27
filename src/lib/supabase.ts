import { createBrowserClient } from "@supabase/ssr";

export function supabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL belum diisi. Salin dari Vercel Project Settings → Environment Variables ke .env.local"
    );
  }
  return url;
}

export function supabaseKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY belum diisi. Salin dari Vercel Project Settings → Environment Variables ke .env.local"
    );
  }
  return key;
}

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/** Supabase client untuk komponen client. Sesi disimpan di cookie. */
export function getBrowserSupabase() {
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl(), supabaseKey());
  }
  return browserClient;
}
