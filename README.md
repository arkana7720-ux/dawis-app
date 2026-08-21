# Dawis Digital

Aplikasi web pengelolaan data warga **Dasa Wisma RT 04/RW 11 Rorotan**.
Menggantikan Google Sheet "Data Dawis Yusril" dengan database Supabase
(PostgreSQL), tampilan responsif (HP & desktop), dan akses dari mana saja.

**Live:** https://dawis-app.vercel.app

## Fitur

- **Dashboard** — kartu statistik, grafik distribusi usia per jenis kelamin,
  komposisi kategori usia, rekap per kelompok (dihitung otomatis dari data).
- **Data Warga** — tabel lengkap dengan pencarian & filter (kelompok, kategori
  usia, jenis kelamin, WUS/PUS), tambah/edit/hapus.
- **Struktur Wilayah** — kelola hierarki Kelompok → Bangunan → Keluarga (KRT)
  → Anggota. Bangunan bisa ditandai milik sendiri / kontrakan.
- **Laporan** — rekapitulasi format mirip sheet lama, siap cetak dan ekspor
  CSV/Excel.
- Usia, kategori usia, kategori (Balita/Anak/Remaja/Dewasa/Lansia), serta
  status **WUS/PUS dihitung otomatis** dari tanggal lahir.

## Arsitektur

| Bagian | Teknologi |
|---|---|
| Frontend + API | Next.js 15 (App Router) |
| Database | Supabase PostgreSQL |
| Hosting | Vercel |

Tabel: `kelompok` → `bangunan` → `keluarga` → `warga` (lihat `supabase/schema.sql`).

## Menjalankan Lokal

```bash
npm install
npm run dev       # buka http://localhost:3000
```

Koneksi database dibaca dari `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

## Setup Supabase Baru

1. Buat project di supabase.com
2. SQL Editor → jalankan `supabase/schema.sql`
3. Settings → API → copy Project URL & Publishable Key ke `.env.local`
4. Import data awal: `npm run import` (membaca `data/source-dawis.csv`,
   menghapus data lama lalu mengisi ulang)

## Deploy

Project Vercel `dawis-app` sudah terhubung; env vars production sudah diset.
Deploy ulang setelah ada perubahan:

```bash
vercel deploy --prod --token=<TOKEN>
```

Catatan: deploy dari dalam folder workspace ini bisa terblokir sistem Vercel
karena metadata git repo lain ikut terbawa — deploy dari salinan folder di
luar repo git jika itu terjadi.
