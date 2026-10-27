"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase";
import {
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
  user: { id: string; username: string; nama: string };
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
                <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Nama
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-slate-800">
                    {me.user.nama || "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Username
                  </p>
                  <p className="mt-0.5 font-mono text-sm font-bold uppercase tracking-wider text-emerald-700">
                    {me.user.username || "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Kelompok yang Anda kelola
                  </p>
                  {me.kelompok.length === 0 ? (
                    <p className="mt-0.5 text-sm text-slate-400">
                      Belum ada. Tambahkan di menu Struktur Wilayah.
                    </p>
                  ) : (
                    <ul className="mt-1 space-y-1">
                      {me.kelompok.map((k) => (
                        <li key={k.id} className="text-sm font-semibold text-slate-700">
                          {k.nama}
                          {k.kode && (
                            <span className="ml-2 text-xs font-medium text-slate-400">
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
