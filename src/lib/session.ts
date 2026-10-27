import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./supabase";

/**
 * Verifikasi sesi di server memakai kunci publik proyek (JWT ES256).
 *
 * `auth.getUser()` memanggil server Auth Supabase pada setiap request sehingga
 * terasa lambat. `getClaims()` memverifikasi tanda tangan JWT secara lokal.
 * Supaya tidak perlu mengunduh JWKS tiap request, hasilnya disimpan di memori
 * selama 10 menit (dan diambil ulang kalau kunci berganti).
 */

/** Satu kunci publik dari endpoint JWKS Supabase (bentuknya mengikuti JWK). */
type Jwk = { kty: string; key_ops: string[]; kid?: string } & Record<
  string,
  unknown
>;

const TTL_MS = 10 * 60 * 1000;

let cache: { keys: Jwk[]; at: number } | null = null;
let pending: Promise<Jwk[]> | null = null;

async function ambilJwks(paksa = false): Promise<Jwk[]> {
  const now = Date.now();
  if (!paksa && cache && now - cache.at < TTL_MS) return cache.keys;
  if (pending) return pending;

  pending = fetch(`${supabaseUrl()}/auth/v1/.well-known/jwks.json`, {
    cache: "no-store",
  })
    .then((r) => r.json())
    .then((j: { keys?: unknown }) => {
      const list = Array.isArray(j.keys) ? (j.keys as Jwk[]) : [];
      const sah = list.filter((k) => k && typeof k.kty === "string");
      if (sah.length > 0) cache = { keys: sah, at: Date.now() };
      return sah;
    })
    .finally(() => {
      pending = null;
    });

  return pending;
}

export async function ambilClaims(sb: SupabaseClient) {
  try {
    const { data, error } = await sb.auth.getClaims(undefined, {
      jwks: { keys: await ambilJwks() },
    });
    if (!error && data?.claims) return data.claims;
  } catch {
    // Kemungkinan kunci berganti — coba sekali lagi dengan JWKS terbaru.
  }

  try {
    const { data } = await sb.auth.getClaims(undefined, {
      jwks: { keys: await ambilJwks(true) },
    });
    return data?.claims ?? null;
  } catch {
    return null;
  }
}
