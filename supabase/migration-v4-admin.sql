-- ============================================================================
-- Migration v4 — Panel admin untuk mengelola akun ibu Dawis
-- Jalankan sekali di Supabase → SQL Editor (atau lewat Management API).
--
-- Isi:
--   1. Kolom profiles.is_admin
--   2. User biasa hanya boleh mengubah "nama" miliknya sendiri
--      (tidak bisa mengubah username / menaikkan diri jadi admin)
--   3. Fungsi agregat admin_account_list() — hanya untuk service role
--   4. Menandai akun istri (U11289) sebagai admin
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tanda admin
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- ----------------------------------------------------------------------------
-- 2. Batasi hak ubah profil
--    Sebelumnya "authenticated" bebas update semua kolom di barisnya sendiri,
--    sehingga seorang user bisa menaikkan dirinya menjadi admin.
--    Sekarang hanya kolom "nama" yang boleh diubah sendiri.
-- ----------------------------------------------------------------------------
revoke insert, update, delete on public.profiles from authenticated;
grant update (nama) on public.profiles to authenticated;

-- Hak bawaan Supabase menyisakan TRUNCATE/REFERENCES/TRIGGER; tidak dipakai
-- aplikasi dan sebaiknya dicabut.
revoke truncate, references, trigger on public.profiles from authenticated;
revoke truncate, references, trigger on public.kelompok from authenticated;
revoke truncate, references, trigger on public.bangunan from authenticated;
revoke truncate, references, trigger on public.keluarga from authenticated;
revoke truncate, references, trigger on public.warga from authenticated;

-- ----------------------------------------------------------------------------
-- 3. Daftar akun + jumlah data (untuk panel admin)
--    Tidak pernah membuka isi data warga — hanya angka jumlahnya.
--    Hanya bisa dipanggil oleh service role (dipakai server aplikasi).
-- ----------------------------------------------------------------------------
create or replace function public.admin_account_list()
returns table (
  id uuid,
  username text,
  nama text,
  created_at timestamptz,
  is_admin boolean,
  jumlah_kelompok bigint,
  jumlah_bangunan bigint,
  jumlah_keluarga bigint,
  jumlah_warga bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.username,
    p.nama,
    p.created_at,
    p.is_admin,
    count(distinct k.id)::bigint,
    count(distinct b.id)::bigint,
    count(distinct f.id)::bigint,
    count(distinct w.id)::bigint
  from public.profiles p
  left join public.kelompok k on k.owner_id = p.id
  left join public.bangunan b on b.kelompok_id = k.id
  left join public.keluarga f on f.bangunan_id = b.id
  left join public.warga w on w.keluarga_id = f.id
  group by p.id, p.username, p.nama, p.created_at, p.is_admin
  order by p.created_at asc;
$$;

revoke all on function public.admin_account_list() from public;
revoke all on function public.admin_account_list() from anon, authenticated;
grant execute on function public.admin_account_list() to service_role;

-- ----------------------------------------------------------------------------
-- 4. Tandai admin pertama (istri)
-- ----------------------------------------------------------------------------
update public.profiles
set is_admin = true
where lower(username) = lower('u11289');

-- ----------------------------------------------------------------------------
-- 5. Verifikasi
-- ----------------------------------------------------------------------------
select
  username,
  nama,
  is_admin,
  (select count(*) from public.profiles) as total_akun
from public.profiles
order by created_at;
