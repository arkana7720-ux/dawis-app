-- Migration v2: Status Warga & Tracking Kehamilan
-- Jalankan di Supabase Dashboard > SQL Editor

alter table public.warga add column if not exists status_warga text not null default 'aktif';
alter table public.warga add column if not exists tgl_status_berubah text not null default '';
alter table public.warga add column if not exists catatan_status text not null default '';
alter table public.warga add column if not exists is_hamil boolean not null default false;
alter table public.warga add column if not exists hpl_kehamilan text not null default '';
alter table public.warga add column if not exists risiko_kehamilan text not null default 'normal';

create index if not exists warga_status_idx on public.warga (status_warga);
