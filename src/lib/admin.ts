import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { supabaseUrl } from "./supabase";

/**
 * Client dengan hak penuh (service role).
 * HANYA dipakai di server (Route Handler) setelah pemanggil diverifikasi admin.
 * Jangan pernah diimpor dari komponen client.
 */
export function getAdminDb(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY belum diisi di server. Tambahkan di Vercel → Settings → Environment Variables."
    );
  }
  return createClient(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Satu baris daftar akun dari fungsi SQL admin_account_list(). */
export interface AccountRow {
  id: string;
  username: string;
  nama: string;
  created_at: string;
  is_admin: boolean;
  jumlah_kelompok: number;
  jumlah_bangunan: number;
  jumlah_keluarga: number;
  jumlah_warga: number;
}

export async function accountRows(admin: SupabaseClient): Promise<AccountRow[]> {
  const { data, error } = await admin.rpc("admin_account_list");
  if (error) throw new Error(error.message);

  return ((data ?? []) as AccountRow[]).map((r) => ({
    ...r,
    jumlah_kelompok: Number(r.jumlah_kelompok),
    jumlah_bangunan: Number(r.jumlah_bangunan),
    jumlah_keluarga: Number(r.jumlah_keluarga),
    jumlah_warga: Number(r.jumlah_warga),
  }));
}

/** Supabase menandai akun nonaktif lewat banned_until. */
export function isBanned(user: Pick<User, "banned_until"> | undefined | null): boolean {
  if (!user?.banned_until) return false;
  return new Date(user.banned_until).getTime() > Date.now();
}

/** Ambil semua user Auth (untuk status aktif / terakhir masuk). */
export async function listAuthUsers(admin: SupabaseClient): Promise<User[]> {
  const semua: User[] = [];
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    semua.push(...data.users);
    if (data.users.length < 200) break;
  }
  return semua;
}
