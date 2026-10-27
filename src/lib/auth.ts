import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Login memakai "username" (mis. A12345), bukan email.
 * Supabase Auth butuh email, jadi username dipetakan ke alamat internal.
 * Email ini tidak pernah dikirim / dipakai — konfirmasi email harus dimatikan
 * di Supabase (Authentication → Providers → Email → Confirm email = off).
 */
export const USERNAME_EMAIL_DOMAIN = "dawis-app.vercel.app";

/** 1 huruf di depan + angka/huruf, total 4–12 karakter. Contoh: A12345 */
export const USERNAME_RE = /^[a-z][a-z0-9]{3,11}$/;

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, "");
}

export function isValidUsername(username: string): boolean {
  return USERNAME_RE.test(username);
}

export function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@${USERNAME_EMAIL_DOMAIN}`;
}

export function emailToUsername(email: string | undefined | null): string {
  if (!email) return "";
  const at = email.indexOf("@");
  return at === -1 ? email : email.slice(0, at);
}

export interface Profile {
  id: string;
  username: string;
  nama: string;
}

export async function getProfile(
  db: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data } = await db
    .from("profiles")
    .select("id, username, nama")
    .eq("id", userId)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}
