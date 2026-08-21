export interface WargaLike {
  nama: string;
  hubungan?: string | null;
  jenis_kelamin?: string | null;
  tanggal_lahir?: string | null;
}

const BULAN_ID: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, mei: 5, jun: 6,
  jul: 7, agu: 8, agt: 8, sep: 9, okt: 10, nov: 11, des: 12,
};

export function parseTanggalLahir(raw?: string | null): string {
  if (!raw) return "";
  const s = String(raw).trim();
  if (!s) return "";
  if (/^\d{4}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[-/\s]([A-Za-z]+)[-/\s](\d{4})$/);
  if (m) {
    const d = parseInt(m[1], 10);
    const mon = BULAN_ID[m[2].slice(0, 3).toLowerCase()];
    if (mon && d >= 1 && d <= 31) {
      return `${m[3]}-${String(mon).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
  }
  const m2 = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m2) return `${m2[1]}-${m2[2].padStart(2, "0")}-${m2[3].padStart(2, "0")}`;
  return s;
}

export function hitungUsia(ttl?: string | null): number | null {
  if (!ttl) return null;
  const s = String(ttl).trim();
  if (/^\d{4}$/.test(s)) return new Date().getFullYear() - parseInt(s, 10);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const lahir = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
  const now = new Date();
  let usia = now.getFullYear() - lahir.getFullYear();
  const before =
    now.getMonth() < lahir.getMonth() ||
    (now.getMonth() === lahir.getMonth() && now.getDate() < lahir.getDate());
  if (before) usia--;
  return usia >= 0 && usia < 130 ? usia : null;
}

export function kategoriUsia(usia: number | null): string {
  if (usia === null) return "";
  if (usia <= 4) return "0-4";
  if (usia <= 9) return "5-9";
  if (usia <= 14) return "10-14";
  if (usia <= 19) return "15-19";
  if (usia <= 24) return "20-24";
  if (usia <= 29) return "25-29";
  if (usia <= 34) return "30-34";
  if (usia <= 39) return "35-39";
  if (usia <= 44) return "40-44";
  if (usia <= 49) return "45-49";
  if (usia <= 54) return "50-54";
  if (usia <= 59) return "55-59";
  if (usia <= 64) return "60-64";
  return "65+";
}

export function kategori(usia: number | null): string {
  if (usia === null) return "";
  if (usia < 5) return "Balita";
  if (usia < 10) return "Anak";
  if (usia < 19) return "Remaja";
  if (usia < 60) return "Dewasa";
  return "Lansia";
}

export function isWUS(w: WargaLike, usia: number | null): boolean {
  return (
    (w.jenis_kelamin || "").toUpperCase() === "P" &&
    usia !== null &&
    usia >= 15 &&
    usia <= 49
  );
}

export function isMarried(w: WargaLike): boolean {
  const h = (w.hubungan || "").toLowerCase();
  return h.includes("istri") || h.includes("suami");
}

export function isPUS(w: WargaLike, usia: number | null): boolean {
  return isWUS(w, usia) && isMarried(w);
}

export const KATEGORI_USIA_LIST = [
  "0-4", "5-9", "10-14", "15-19", "20-24", "25-29", "30-34",
  "35-39", "40-44", "45-49", "50-54", "55-59", "60-64", "65+",
];

export const KATEGORI_LIST = ["Balita", "Anak", "Remaja", "Dewasa", "Lansia"];

export const HUBUNGAN_LIST = [
  "KRT", "KRT/Ayah", "KRT/Ibu", "KRT/Suami", "KRT/Istri",
  "Ayah", "Ibu", "Suami", "Istri", "Anak", "Anak Perempuan",
  "Cucu", "Menantu", "Mertua", "Saudara", "Famili Lain", "Lainnya",
];

export const STATUS_KB_LIST = [
  "", "Pil", "Suntik", "IUD", "Implan", "Kondom", "MOW", "MOP", "TIAL", "Lainnya",
];

export const STATUS_WARGA_LIST = ["aktif", "pindah", "meninggal"];

export const RISIKO_KEHAMILAN_LIST = ["normal", "tinggi"];

export function formatTanggal(ttl?: string | null): string {
  if (!ttl) return "-";
  const m = String(ttl).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(ttl);
  const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${parseInt(m[3], 10)}-${bulan[parseInt(m[2], 10) - 1]}-${m[1]}`;
}
