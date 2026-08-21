create table if not exists public.kelompok (
  id bigint generated always as identity primary key,
  nama text not null,
  kode text default '' not null,
  urutan integer default 0 not null,
  created_at timestamptz default now() not null
);

create table if not exists public.bangunan (
  id bigint generated always as identity primary key,
  kelompok_id bigint not null references public.kelompok (id) on delete cascade,
  nama text not null,
  tipe text default 'milik' not null,
  keterangan text default '' not null,
  urutan integer default 0 not null
);

create table if not exists public.keluarga (
  id bigint generated always as identity primary key,
  bangunan_id bigint not null references public.bangunan (id) on delete cascade,
  nama_krt text not null,
  catatan text default '' not null,
  urutan integer default 0 not null
);

create table if not exists public.warga (
  id bigint generated always as identity primary key,
  keluarga_id bigint references public.keluarga (id) on delete cascade,
  nama text not null,
  hubungan text default '' not null,
  jenis_kelamin text default '' not null,
  tanggal_lahir text default '' not null,
  bpjs text default '' not null,
  status_kb text default '' not null,
  catatan text default '' not null
);

create index if not exists bangunan_kelompok_idx on public.bangunan (kelompok_id);
create index if not exists keluarga_bangunan_idx on public.keluarga (bangunan_id);
create index if not exists warga_keluarga_idx on public.warga (keluarga_id);

alter table public.kelompok enable row level security;
alter table public.bangunan enable row level security;
alter table public.keluarga enable row level security;
alter table public.warga enable row level security;

drop policy if exists "kelompok_full_access" on public.kelompok;
create policy "kelompok_full_access" on public.kelompok
  for all to anon using (true) with check (true);

drop policy if exists "bangunan_full_access" on public.bangunan;
create policy "bangunan_full_access" on public.bangunan
  for all to anon using (true) with check (true);

drop policy if exists "keluarga_full_access" on public.keluarga;
create policy "keluarga_full_access" on public.keluarga
  for all to anon using (true) with check (true);

drop policy if exists "warga_full_access" on public.warga;
create policy "warga_full_access" on public.warga
  for all to anon using (true) with check (true);
