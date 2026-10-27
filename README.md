# Dawis Digital

Aplikasi web pengelolaan data warga **Dasa Wisma RT 04/RW 11 Rorotan**.
Menggantikan Google Sheet "Data Dawis Yusril" dengan database Supabase
(PostgreSQL), tampilan responsif (HP & desktop), dan akses dari mana saja.

**Live:** https://dawis-app.vercel.app

## Fitur

- **Login per ibu Dawis** — setiap akun punya username sendiri dan **hanya
  melihat data kelompok miliknya**. Akun lain tidak bisa membuka data tersebut,
  termasuk lewat tautan langsung.
- **Dashboard** — kartu statistik, grafik distribusi usia per jenis kelamin,
  komposisi kategori usia, rekap per kelompok (dihitung otomatis dari data).
- **Data Warga** — tabel lengkap dengan pencarian & filter (kelompok, kategori
  usia, jenis kelamin, WUS/PUS), tambah/edit/hapus. Form tambah warga
  berpanduan: pilih keluarga lewat pencarian (atau buat keluarga/bangunan baru
  langsung dari form), tanggal lahir boleh hanya tahun, ada peringatan nama
  ganda, dan tombol **Simpan & Tambah Lagi**.
- **Panduan akun baru** — akun yang belum punya data dibimbing lewat
  **Persiapan Data Warga** (Kelompok → Bangunan → Keluarga) di halaman Data
  Warga, lalu langsung mengisi warga. Tidak perlu impor Excel. Dashboard juga
  menampilkan checklist **Persiapan Awal** sampai keempat langkah selesai.
- **Struktur Wilayah** — kelola hierarki Kelompok → Bangunan → Keluarga (KRT)
  → Anggota. Bangunan bisa ditandai milik sendiri / kontrakan.
- **Laporan** — rekapitulasi format mirip sheet lama, siap cetak dan ekspor
  CSV/Excel.
- **Akun Saya** — ubah password sendiri, lihat username dan kelompok yang dikelola.
- **Panel Admin** (khusus akun admin) — daftar semua akun, reset password,
  perbaiki nama, nonaktifkan akun ganda, pindahkan data, atau hapus akun yang
  salah daftar. Panel ini **tidak** bisa membuka isi data warga akun lain.
- Usia, kategori usia, kategori (Balita/Anak/Remaja/Dewasa/Lansia), serta
  status **WUS/PUS dihitung otomatis** dari tanggal lahir.

## Akun & Login

- **Username**: diawali huruf, 4–12 karakter huruf/angka. Contoh `A12345`.
- **Password**: dipilih sendiri saat daftar, minimal 6 karakter. Bisa diubah di
  menu **Akun Saya**.
- Pendaftaran akun baru dilakukan sendiri oleh masing-masing ibu Dawis lewat
  halaman **/register**. Setelah daftar, akun baru membuat kelompok, bangunan,
  dan keluarga lewat **Struktur Wilayah** atau panduan **Persiapan Data Warga**
  di halaman Data Warga. Datanya terpisah dari akun lain sejak awal.
- **Admin**: akun dengan `profiles.is_admin = true` mendapat menu **Kelola Akun**
  (`/admin`) untuk mengurus akun ibu Dawis lain. Admin **tidak** bisa melihat
  data warga akun lain — hanya nama, username, dan jumlah datanya.
- Bisa juga dibuatkan langsung dari komputer pengelola:
  `npm run create-user -- A12345 password123 "Ibu Siti"`.
- Lupa password: admin membuka **/admin** → **Kelola** → **Reset password**.
  Alternatif dari komputer: `npm run reset-password -- A12345 passwordbaru`
  (butuh `SUPABASE_SERVICE_ROLE_KEY` di `.env.local`).

### Pengaturan Supabase yang wajib

Supabase Auth memakai email di balik layar
(`<username>@dawis-app.vercel.app`), jadi:

1. **Authentication → Providers → Email**
   - **Confirm email: OFF** (wajib — alamat internal ini tidak pernah dikirimi surat)
   - Enable Email provider: ON
2. **Authentication → Sign In / Providers** — biarkan sign up aktif agar ibu
   Dawis bisa mendaftar sendiri.

## Arsitektur

| Bagian | Teknologi |
|---|---|
| Frontend + API | Next.js 15 (App Router) |
| Database | Supabase PostgreSQL + Row Level Security |
| Auth | Supabase Auth (cookie session via `@supabase/ssr`) |
| Hosting | Vercel |

Tabel: `kelompok` → `bangunan` → `keluarga` → `warga`, ditambah `profiles`
(username pemilik). Setiap baris `kelompok` punya `owner_id`; RLS memfilter
seluruh turunannya berdasarkan pemilik.

## Menjalankan Lokal

```bash
npm install
vercel env pull .env.local --environment=production   # atau isi manual
npm run dev       # buka http://localhost:3000
```

Environment yang dibutuhkan di `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# dipakai server untuk Panel Admin + script (import / reset password)
SUPABASE_SERVICE_ROLE_KEY=...
```

> `SUPABASE_SERVICE_ROLE_KEY` **wajib** ada di Vercel (Production) agar Panel
> Admin berfungsi. Jangan pernah memakai prefix `NEXT_PUBLIC_` untuk key ini —
> nilainya tidak boleh sampai ke browser.

## Setup Supabase Baru

Jalankan berurutan di **SQL Editor**:

1. `supabase/schema.sql`
2. `supabase/migration-v2.sql`
3. `supabase/migration-v3-auth.sql`
4. `supabase/migration-v4-admin.sql`
5. `supabase/claim-existing-data.sql` (kalau ada data lama yang perlu dipindahkan)

Lalu isi `.env.local` (Settings → API) dan daftarkan akun pertama lewat
`/register`. Jadikan akun itu admin:

```sql
update public.profiles set is_admin = true where lower(username) = lower('A12345');
```

## Migrasi ke multi-akun (database yang sudah berisi data)

**Urutan penting — jangan dibalik.**

1. **Backup**: Supabase → Database → Backups, atau ekspor tabel lewat Table Editor.
2. Jalankan `supabase/migration-v3-auth.sql` di SQL Editor.
   Setelah ini aplikasi lama tidak bisa lagi mengakses data tanpa login —
   jadi langsung lanjut ke langkah 3.
3. Deploy versi baru (`vercel deploy --prod`).
4. Buka aplikasi → **Daftar** → buat akun untuk pemilik data lama (istri Anda)
   dengan username & password pilihannya.
5. Edit `supabase/claim-existing-data.sql`: ganti `A12345` dengan username
   tersebut, lalu jalankan. Semua kelompok/bangunan/keluarga/warga lama
   menjadi milik akun itu.
6. Ibu Dawis lainnya mendaftar sendiri lewat `/register`, lalu membuat
   kelompoknya di menu **Struktur Wilayah**.
7. Jalankan `supabase/migration-v4-admin.sql` untuk mengaktifkan **Panel
   Admin**, lalu tandai akun pengelola:
   `update public.profiles set is_admin = true where lower(username) = 'u11289';`

`npm run import` sekarang memakai service role dan hanya menghapus data milik
`DAWIS_OWNER_USERNAME` (tambahkan variabel itu di `.env.local`), sehingga tidak
menyentuh data akun lain.

## Panel Admin

Buka menu **Kelola Akun** (atau `/admin`). Hanya akun dengan
`profiles.is_admin = true` yang bisa masuk; akun lain akan melihat pesan
"halaman ini hanya untuk pengelola".

| Kemampuan | Keterangan |
|---|---|
| Lihat daftar akun | nama, username, tanggal daftar, status, jumlah kelompok/bangunan/keluarga/warga |
| Reset password | tanpa perlu terminal; password bisa diacak otomatis lalu disalin |
| Perbaiki nama tampil | nama yang muncul di sidebar akun tersebut |
| Nonaktifkan / aktifkan | login diblokir, data tetap utuh |
| Pindahkan data | seluruh kelompok beserta isinya dipindah ke akun lain |
| Hapus permanen | wajib mengetik ulang username; akun yang masih punya data wajib mencentang peringatan |

Aturan keamanan:

- `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di server (Route Handler). Browser
  tidak pernah menerimanya.
- Panel hanya membaca **metadata** akun lewat fungsi SQL `admin_account_list()`.
  Isi data warga tetap dilindungi RLS per pemilik.
- User biasa hanya boleh mengubah kolom `nama` miliknya sendiri; `username`
  dan `is_admin` tidak bisa diubah lewat API publik.
- Akun sendiri tidak bisa dinonaktifkan/dihapus, dan admin terakhir tidak bisa
  dihapus.
- Menghapus akun ikut menghapus seluruh datanya (relasi `on delete cascade`).
  Untuk akun yang sudah berisi data, **pindahkan datanya dulu**.

## Deploy

Project Vercel `dawis-app` sudah terhubung; env vars production sudah diset.
Deploy ulang setelah ada perubahan:

```bash
vercel deploy --prod --token=<TOKEN>
```

Catatan: deploy dari dalam folder workspace ini bisa terblokir sistem Vercel
karena metadata git repo lain ikut terbawa — deploy dari salinan folder di
luar repo git jika itu terjadi.
