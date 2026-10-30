"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getBrowserSupabase } from "@/lib/supabase";
import { invalidateApi } from "@/lib/clientApi";
import {
  Avatar,
  Btn,
  Card,
  CardHeader,
  ErrorState,
  Field,
  Icon,
  PageHeader,
  Skeleton,
  inputCls,
} from "@/components/ui";

interface Me {
  user: { id: string; username: string; nama: string; is_admin: boolean };
  kelompok: { id: number; nama: string; kode: string }[];
}

export default function AkunPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [err, setErr] = useState("");
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [passMsg, setPassMsg] = useState("");
  const [passErr, setPassErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const load = () => {
    setErr("");
    fetch("/api/me")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Gagal memuat akun");
        setMe(j);
      })
      .catch((e) => setErr(e.message));
  };

  useEffect(load, []);

  const gantiPassword = async () => {
    setPassMsg("");
    setPassErr("");
    if (pass1.length < 6) return setPassErr("Password baru minimal 6 karakter.");
    if (pass1 !== pass2) return setPassErr("Ulangi password tidak sama.");

    setSaving(true);
    const sb = getBrowserSupabase();
    const { error } = await sb.auth.updateUser({ password: pass1 });
    setSaving(false);

    if (error) {
      setPassErr(error.message);
      return;
    }
    setPass1("");
    setPass2("");
    setPassMsg("Password berhasil diubah. Gunakan password baru saat login berikutnya.");
  };

  const keluar = async () => {
    setLoggingOut(true);
    const sb = getBrowserSupabase();
    await sb.auth.signOut();
    invalidateApi();
    router.replace("/login");
    router.refresh();
  };

  if (err) return <ErrorState message={err} onRetry={load} />;

  return (
    <>
      <PageHeader
        title="Akun Saya"
        subtitle="Kelola password dan lihat wilayah data Anda"
        actions={
          <Btn variant="secondary" onClick={keluar} disabled={loggingOut}>
            <Icon name="key" className="h-4 w-4" />
            {loggingOut ? "Keluar..." : "Keluar"}
          </Btn>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Profil" desc="Identitas akun yang sedang login" />
          <div className="space-y-3 p-5">
            {!me ? (
              <>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-white/70 px-4 py-3 ring-1 ring-white/70">
                  <Avatar name={me.user.nama || me.user.username} />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      Nama
                    </p>
                    <p className="mt-0.5 truncate text-sm font-bold text-slate-900">
                      {me.user.nama || "—"}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl bg-white/70 px-4 py-3 ring-1 ring-white/70">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Username
                  </p>
                  <p className="mt-0.5 font-mono text-sm font-bold uppercase tracking-wider text-emerald-700">
                    {me.user.username || "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-white/70 px-4 py-3 ring-1 ring-white/70">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Kelompok yang Anda kelola
                  </p>
                  {me.kelompok.length === 0 ? (
                    <p className="mt-0.5 text-sm text-slate-500">
                      Belum ada. Tambahkan di menu Struktur Wilayah.
                    </p>
                  ) : (
                    <ul className="mt-1 space-y-1">
                      {me.kelompok.map((k) => (
                        <li key={k.id} className="text-sm font-semibold text-slate-700">
                          {k.nama}
                          {k.kode && (
                            <span className="ml-2 text-xs font-medium text-slate-500">
                              {k.kode}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Ubah Password" desc="Minimal 6 karakter" />
          <div className="space-y-3 p-5">
            <Field label="Password Baru" required>
              <input
                className={inputCls}
                type="password"
                value={pass1}
                onChange={(e) => setPass1(e.target.value)}
                autoComplete="new-password"
                placeholder="Password baru"
              />
            </Field>
            <Field label="Ulangi Password Baru" required>
              <input
                className={inputCls}
                type="password"
                value={pass2}
                onChange={(e) => setPass2(e.target.value)}
                autoComplete="new-password"
                placeholder="Ketik ulang password baru"
              />
            </Field>

            {passErr && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700 ring-1 ring-red-100">
                <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{passErr}</span>
              </div>
            )}
            {passMsg && (
              <div className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{passMsg}</span>
              </div>
            )}

            <Btn onClick={gantiPassword} disabled={saving} className="w-full">
              {saving ? "Menyimpan..." : "Simpan Password"}
            </Btn>
          </div>
        </Card>
      </div>

      {me?.user.is_admin && (
        <Card className="mt-4">
          <CardHeader
            title="Panel Pengelola"
            desc="Kelola akun ibu Dawis: reset password, nonaktifkan, atau hapus akun"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <p className="max-w-lg text-xs leading-relaxed text-slate-500">
              Reset password akun yang lupa sandi, nonaktifkan akun ganda, atau hapus akun yang
              salah daftar. Data warga setiap akun tetap tidak dapat dibuka dari panel ini.
            </p>
            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-700/25 transition-all hover:bg-emerald-800 active:scale-[0.98]"
            >
              <Icon name="key" className="h-4 w-4" />
              Buka Panel Admin
            </Link>
          </div>
        </Card>
      )}

      <Card className="mt-4">
        <CardHeader title="Data Anda bersifat pribadi" />
        <div className="px-5 py-4 text-xs leading-relaxed text-slate-500">
          Setiap akun hanya dapat melihat dan mengubah data kelompok miliknya sendiri. Akun lain
          tidak dapat membuka data Anda, dan Anda tidak dapat membuka data mereka — termasuk
          melalui tautan langsung.
        </div>
      </Card>
    </>
  );
}
