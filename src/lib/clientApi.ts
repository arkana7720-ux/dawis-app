/**
 * Cache kecil untuk GET data di sisi browser.
 *
 * Tujuan: perpindahan antar halaman tidak perlu memuat ulang data yang sama
 * (mis. daftar warga 100 KB) dan klik tidak terasa menunggu.
 *
 * Aturan:
 * - Data dipakai ulang maksimal 15 detik.
 * - Setelah ada perubahan data (simpan/hapus), panggil `invalidateApi()`
 *   supaya halaman berikutnya mengambil data terbaru dan sidebar ikut segar.
 * - Permintaan yang sedang berjalan dipakai bersama (tidak dobel).
 */

const TTL_MS = 15_000;
const cache = new Map<string, { t: number; data: unknown }>();
const inflight = new Map<string, Promise<unknown>>();
const listeners = new Set<() => void>();

export async function fetchApi<T>(url: string, ttlMs = TTL_MS): Promise<T> {
  const now = Date.now();
  const hit = cache.get(url);
  if (hit && now - hit.t < ttlMs) return hit.data as T;

  const pending = inflight.get(url);
  if (pending) return pending as Promise<T>;

  const p = fetch(url)
    .then(async (r) => {
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || "Gagal memuat data");
      }
      return r.json();
    })
    .then((data) => {
      cache.set(url, { t: Date.now(), data });
      return data;
    })
    .finally(() => inflight.delete(url));

  inflight.set(url, p);
  return p as Promise<T>;
}

/** Hapus semua cache dan beri tahu komponen (mis. sidebar) untuk memuat ulang. */
export function invalidateApi() {
  cache.clear();
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // abaikan
    }
  });
}

/** Daftar pemanggil yang ingin tahu saat data berubah. Mengembalikan fungsi berhenti. */
export function subscribeApi(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
