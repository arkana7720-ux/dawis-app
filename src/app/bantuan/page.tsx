"use client";

import Link from "next/link";
import { Btn, Card, CardHeader, Icon, PageHeader } from "@/components/ui";

const LANGKAH: { judul: string; poin: string[] }[] = [
  {
    judul: "1. Daftar akun",
    poin: [
      "Buka /register, isi Nomor ID Dawis (mis. U11289) dan password (minimal 6 karakter).",
      "Setelah berhasil, Anda akan diarahkan ke halaman login. Nomor ID sudah terisi otomatis.",
      "Masuk dengan password yang tadi dibuat.",
    ],
  },
  {
    judul: "2. Siapkan struktur wilayah",
    poin: [
      "Buka menu Struktur Wilayah.",
      "Buat Kelompok (mis. Kelompok 1).",
      "Di dalam kelompok, buat Bangunan (rumah/kontrakan).",
      "Di dalam bangunan, buat Keluarga dan isi nama Kepala Rumah Tangga (KRT).",
    ],
  },
  {
    judul: "3. Isi data warga",
    poin: [
      "Buka menu Data Warga, lalu 'Tambah Warga' atau 'Mulai Isi Data Warga' (panduan).",
      "Pilih keluarga, isi nama, jenis kelamin, tanggal lahir (boleh hanya tahun).",
      "Usia, kategori usia, dan status WUS/PUS dihitung otomatis.",
      "Gunakan 'Simpan & Tambah Lagi' untuk mengisi satu keluarga sekaligus.",
    ],
  },
  {
    judul: "4. Lihat ringkasan & laporan",
    poin: [
      "Dashboard menampilkan kartu statistik dan grafik otomatis.",
      "Menu Laporan menampilkan rekap siap cetak dan ekspor CSV/Excel.",
      "Tombol 'Cetak' menghasilkan kertas putih bersih untuk dicetak.",
    ],
  },
  {
    judul: "5. Kirim WhatsApp",
    poin: [
      "Tap ikon WhatsApp di baris warga (atau di kartu HP / modal Detail).",
      "Pesan sudah terisi otomatis dari data warga — bisa diedit sebelum dikirim.",
      "Untuk mengubah format permanen, buka 'Atur template default' di modal yang sama.",
    ],
  },
  {
    judul: "6. Kelola akun sendiri",
    poin: [
      "Menu Akun Saya: ubah password, lihat username, dan kelompok yang dikelola.",
      "Username tidak bisa diubah. Jika salah, minta admin menghapus lalu daftar ulang.",
    ],
  },
];

export default function BantuanPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Bantuan & Cara Pakai"
        subtitle="Panduan singkat untuk mulai memakai Dawis Digital"
        actions={
          <Link href="/warga">
            <Btn>
              <Icon name="users" className="h-4 w-4" />
              Mulai isi data
            </Btn>
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {LANGKAH.map((l) => (
          <Card key={l.judul} className="p-5">
            <CardHeader title={l.judul} />
            <ul className="space-y-2 p-5 pt-4">
              {l.poin.map((p, i) => (
                <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <CardHeader title="Tips" />
        <ul className="space-y-2 p-5 pt-4 text-sm leading-relaxed text-slate-600">
          <li className="flex gap-2.5">
            <Icon name="leaf" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            Pasang aplikasi di HP lewat banner "Pasang Dawis di HP" agar lebih cepat.
          </li>
          <li className="flex gap-2.5">
            <Icon name="leaf" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            Data setiap akun terpisah — warga milik akun lain tidak terlihat.
          </li>
          <li className="flex gap-2.5">
            <Icon name="leaf" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            Lupa password: hubungi admin (Kelola Akun → Reset password).
          </li>
        </ul>
      </Card>
    </div>
  );
}
