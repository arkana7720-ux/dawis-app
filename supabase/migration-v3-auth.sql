-- ============================================================================
-- Migration v3 — Login per ibu Dawis + data terpisah per pemilik
-- Jalankan di Supabase Dashboard → SQL Editor (satu kali).
--
-- Setelah migrasi ini:
--   * Setiap akun hanya bisa melihat & mengubah data kelompok miliknya.
--   * Akses anonim (tanpa login) dicabut total.
--   * User didaftarkan lewat fungsi public.username_taken() + auth.signUp.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tabel profil (username yang dipakai untuk login)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  nama text not null default '',
  created_at timestamptz not null default now()
);

-- Username unik tanpa peduli huruf besar/kecil
create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ----------------------------------------------------------------------------
-- 2. Saat user baru mendaftar, otomatis dibuatkan baris profil
--    (username & nama dikirim dari aplikasi lewat options.data)
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_nama text;
begin
  v_username := lower(trim(coalesce(
    new.raw_user_meta_data ->> 'username',
    split_part(new.email, '@', 1)
  )));
  v_nama := coalesce(new.raw_user_meta_data ->> 'nama', '');

  insert into public.profiles (id, username, nama)
  values (new.id, v_username, v_nama);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 3. Cek ketersediaan username dari aplikasi (halaman daftar)
-- ----------------------------------------------------------------------------
create or replace function public.username_taken(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where lower(username) = lower(trim(p_username))
  );
$$;

revoke all on function public.username_taken(text) from public;
grant execute on function public.username_taken(text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4. Pemilik data: kelompok.owner_id → profiles.id
--    Data lama dibiarkan NULL dulu, lalu di-claim lewat claim-existing-data.sql
-- ----------------------------------------------------------------------------
alter table public.kelompok
  add column if not exists owner_id uuid references public.profiles (id) on delete cascade;

-- Saat aplikasi insert kelompok, owner_id otomatis diisi user yang login.
alter table public.kelompok
  alter column owner_id set default auth.uid();

create index if not exists kelompok_owner_idx on public.kelompok (owner_id);

-- ----------------------------------------------------------------------------
-- 5. Helper kepemilikan (dipakai policy tabel turunan)
-- ----------------------------------------------------------------------------
create or replace function public.owns_kelompok(p_kelompok_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.kelompok
    where id = p_kelompok_id and owner_id = auth.uid()
  );
$$;

create or replace function public.owns_bangunan(p_bangunan_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bangunan b
    join public.kelompok k on k.id = b.kelompok_id
    where b.id = p_bangunan_id and k.owner_id = auth.uid()
  );
$$;

create or replace function public.owns_keluarga(p_keluarga_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.keluarga f
    join public.bangunan b on b.id = f.bangunan_id
    join public.kelompok k on k.id = b.kelompok_id
    where f.id = p_keluarga_id and k.owner_id = auth.uid()
  );
$$;

revoke all on function public.owns_kelompok(bigint) from public;
revoke all on function public.owns_bangunan(bigint) from public;
revoke all on function public.owns_keluarga(bigint) from public;
grant execute on function public.owns_kelompok(bigint) to authenticated;
grant execute on function public.owns_bangunan(bigint) to authenticated;
grant execute on function public.owns_keluarga(bigint) to authenticated;

-- ----------------------------------------------------------------------------
-- 6. Hapus policy lama yang membuka akses ke anon (SANGAT PENTING)
-- ----------------------------------------------------------------------------
drop policy if exists kelompok_full_access on public.kelompok;
drop policy if exists bangunan_full_access on public.bangunan;
drop policy if exists keluarga_full_access on public.keluarga;
drop policy if exists warga_full_access on public.warga;

drop policy if exists kelompok_owner_select on public.kelompok;
drop policy if exists kelompok_owner_insert on public.kelompok;
drop policy if exists kelompok_owner_update on public.kelompok;
drop policy if exists kelompok_owner_delete on public.kelompok;

drop policy if exists bangunan_owner_select on public.bangunan;
drop policy if exists bangunan_owner_insert on public.bangunan;
drop policy if exists bangunan_owner_update on public.bangunan;
drop policy if exists bangunan_owner_delete on public.bangunan;

drop policy if exists keluarga_owner_select on public.keluarga;
drop policy if exists keluarga_owner_insert on public.keluarga;
drop policy if exists keluarga_owner_update on public.keluarga;
drop policy if exists keluarga_owner_delete on public.keluarga;

drop policy if exists warga_owner_select on public.warga;
drop policy if exists warga_owner_insert on public.warga;
drop policy if exists warga_owner_update on public.warga;
drop policy if exists warga_owner_delete on public.warga;

-- kelompok
create policy kelompok_owner_select on public.kelompok
  for select to authenticated using (owner_id = auth.uid());
create policy kelompok_owner_insert on public.kelompok
  for insert to authenticated with check (owner_id = auth.uid());
create policy kelompok_owner_update on public.kelompok
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy kelompok_owner_delete on public.kelompok
  for delete to authenticated using (owner_id = auth.uid());

-- bangunan
create policy bangunan_owner_select on public.bangunan
  for select to authenticated using (public.owns_kelompok(kelompok_id));
create policy bangunan_owner_insert on public.bangunan
  for insert to authenticated with check (public.owns_kelompok(kelompok_id));
create policy bangunan_owner_update on public.bangunan
  for update to authenticated using (public.owns_kelompok(kelompok_id))
  with check (public.owns_kelompok(kelompok_id));
create policy bangunan_owner_delete on public.bangunan
  for delete to authenticated using (public.owns_kelompok(kelompok_id));

-- keluarga
create policy keluarga_owner_select on public.keluarga
  for select to authenticated using (public.owns_bangunan(bangunan_id));
create policy keluarga_owner_insert on public.keluarga
  for insert to authenticated with check (public.owns_bangunan(bangunan_id));
create policy keluarga_owner_update on public.keluarga
  for update to authenticated using (public.owns_bangunan(bangunan_id))
  with check (public.owns_bangunan(bangunan_id));
create policy keluarga_owner_delete on public.keluarga
  for delete to authenticated using (public.owns_bangunan(bangunan_id));

-- warga
create policy warga_owner_select on public.warga
  for select to authenticated using (public.owns_keluarga(keluarga_id));
create policy warga_owner_insert on public.warga
  for insert to authenticated with check (public.owns_keluarga(keluarga_id));
create policy warga_owner_update on public.warga
  for update to authenticated using (public.owns_keluarga(keluarga_id))
  with check (public.owns_keluarga(keluarga_id));
create policy warga_owner_delete on public.warga
  for delete to authenticated using (public.owns_keluarga(keluarga_id));

-- ----------------------------------------------------------------------------
-- 7. Hak akses: cabut anon, beri authenticated
-- ----------------------------------------------------------------------------
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.kelompok to authenticated;
grant select, insert, update, delete on public.bangunan to authenticated;
grant select, insert, update, delete on public.keluarga to authenticated;
grant select, insert, update, delete on public.warga to authenticated;
grant usage, select on all sequences in schema public to authenticated;

revoke all on public.profiles from anon;
revoke all on public.kelompok from anon;
revoke all on public.bangunan from anon;
revoke all on public.keluarga from anon;
revoke all on public.warga from anon;

-- ----------------------------------------------------------------------------
-- Selesai. Lanjutkan dengan claim-existing-data.sql untuk memindahkan data lama
-- ke akun istri Anda (setelah akun tersebut dibuat lewat halaman /register).
-- ----------------------------------------------------------------------------
