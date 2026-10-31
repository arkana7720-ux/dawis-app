/**
 * Template pesan WhatsApp untuk mengonfirmasi data warga.
 * Placeholder ditulis dengan kurung kurawal, mis. {nama}.
 */

export const DEFAULT_WA_TEMPLATE = `Assalamualaikum, mohon konfirmasi data warga Dasa Wisma RT 04/RW 11:

Nama: {nama}
Hubungan: {hubungan}
Alamat: {alamat} ({kelompok})
Usia: {usia} tahun

Terima kasih.`;

export const WA_PLACEHOLDERS: Array<{ token: string; label: string }> = [
  { token: "{nama}", label: "Nama warga" },
  { token: "{hubungan}", label: "Hubungan (KRT/Istri/Anak)" },
  { token: "{alamat}", label: "Bangunan" },
  { token: "{keluarga}", label: "Nama KRT" },
  { token: "{kelompok}", label: "Kelompok" },
  { token: "{usia}", label: "Usia" },
];

export interface WaData {
  nama: string;
  hubungan: string;
  alamat: string;
  kelompok: string;
  keluarga: string;
  usia: number | null;
}

/** Isi placeholder pada template; template kosong memakai versi bawaan. */
export function renderWaTemplate(template: string, data: WaData): string {
  const tpl = template.trim() ? template : DEFAULT_WA_TEMPLATE;
  const nilai: Record<string, string> = {
    nama: data.nama || "-",
    hubungan: data.hubungan || "-",
    alamat: data.alamat || "-",
    kelompok: data.kelompok || "-",
    keluarga: data.keluarga || "-",
    usia: data.usia == null ? "-" : String(data.usia),
  };

  return tpl.replace(/\{(nama|hubungan|alamat|keluarga|kelompok|usia)\}/g, (_, key: string) => nilai[key]);
}

/** Tautan click-to-chat WhatsApp dengan pesan yang sudah diisi. */
export function waHref(pesan: string): string {
  return `https://wa.me/?text=${encodeURIComponent(pesan)}`;
}
