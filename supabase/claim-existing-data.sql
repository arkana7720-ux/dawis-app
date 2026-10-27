-- ============================================================================
-- Pindahkan data lama ke akun istri Anda.
--
-- LANGKAH:
--   1. Jalankan migration-v3-auth.sql
--   2. Buka aplikasi → /register → daftar dengan username istri Anda
--      (contoh: A12345) dan password pilihannya sendiri.
--   3. Ganti 'A12345' di bawah dengan username tersebut, lalu jalankan file ini.
--
-- Data lama (kelompok/bangunan/keluarga/warga) saat ini owner_id-nya NULL
-- sehingga belum terlihat oleh siapa pun. Baris di bawah menjadikan akun
-- tersebut pemiliknya.
-- ============================================================================

update public.kelompok
set owner_id = (
  select p.id
  from public.profiles p
  where lower(p.username) = lower('A12345')
)
where owner_id is null;

-- Cek hasilnya: jumlah kelompok yang sekarang dimiliki akun tersebut.
select
  p.username,
  count(k.id) as jumlah_kelompok
from public.profiles p
left join public.kelompok k on k.owner_id = p.id
where lower(p.username) = lower('A12345')
group by p.username;
