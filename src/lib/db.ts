import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseKey, supabaseUrl } from "./supabase";

/**
 * Supabase client untuk Server Component / Route Handler.
 * Memakai cookie sesi user yang sedang login, sehingga RLS di database
 * otomatis membatasi data sesuai pemiliknya.
 */
export async function getDb() {
  const store = await cookies();

  return createServerClient(supabaseUrl(), supabaseKey(), {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(list) {
        try {
          for (const { name, value, options } of list) {
            store.set(name, value, options);
          }
        } catch {
          // Dipanggil dari Server Component (tidak boleh set cookie).
          // Middleware yang akan me-refresh sesi.
        }
      },
    },
  });
}
