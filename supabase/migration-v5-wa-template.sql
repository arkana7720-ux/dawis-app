-- ============================================================================
-- Migration v5 — Template pesan WhatsApp milik tiap akun
-- Jalankan sekali di Supabase → SQL Editor (atau lewat Management API).
--
-- Isi:
--   1. Kolom profiles.wa_template (teks template, kosong = pakai bawaan)
--   2. Izinkan user mengubah kolom itu pada barisnya sendiri
--      (grant v4 hanya memberi akses ke kolom "nama")
-- ============================================================================

alter table public.profiles
  add column if not exists wa_template text not null default '';

grant update (wa_template) on public.profiles to authenticated;
