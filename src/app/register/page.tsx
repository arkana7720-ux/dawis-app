"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { Btn, Field, Icon, inputCls } from "@/components/ui";
import { getBrowserSupabase } from "@/lib/supabase";
import { isValidUsername, normalizeUsername, usernameToEmail } from "@/lib/auth";
import { invalidateApi } from "@/lib/clientApi";

export default function RegisterPage() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [berhasil, setBerhasil] = useState<string | null>(null);
  const [sisa, setSisa] = useState(5);

  // Setelah pendaftaran berhasil: tampilkan konfirmasi, lalu buka halaman
  // login otomatis. Tombol "Masuk di sini" memotong hitungan ini.
  useEffect(() => {
    if (!berhasil) return;
    if (sisa <= 0) {
      router.replace(`/login?daftar=berhasil&u=${encodeURIComponent(berhasil)}`);
      return;
    }
    const t = window.setTimeout(() => setSisa((n) => n - 1), 1000);
    return () => window.clearTimeout(t);
  }, [berhasil, sisa, router]);

  const masukSekarang = () => {
    if (!berhasil) return;
    router.replace(`/login?daftar=berhasil&u=${encodeURIComponent(berhasil)}`);
  };

  const submit = async () => {
    const uname = normalizeUsername(username);
    const namaBersih = nama.trim();

    if (!namaBersih) return setError("Nama lengkap wajib diisi.");
    if (!isValidUsername(uname))
      return setError(
        "Nomor ID Dawis harus diawali huruf, 4–12 huruf/angka. Contoh: U11289."
      );
    if (password.length < 6) return setError("Password minimal 6 karakter.");
    if (password !== confirm) return setError("Konfirmasi password tidak sama.");

    setLoading(true);
    setError("");

    const sb = getBrowserSupabase();

    const { data: taken, error: rpcErr } = await sb.rpc("username_taken", {
      p_username: uname,
    });
    if (rpcErr) {
      setLoading(false);
      return setError(
        "Database belum siap (fungsi username_taken belum ada). Jalankan migration-v3-auth.sql di Supabase."
      );
    }
    if (taken) {
      setLoading(false);
      return setError("Nomor ID Dawis sudah terdaftar. Langsung masuk, atau gunakan ID Dawis lain.");
    }

    const { data, error: err } = await sb.auth.signUp({
      email: usernameToEmail(uname),
      password,
      options: { data: { username: uname, nama: namaBersih } },
    });

    if (err) {
      setLoading(false);
      const m = err.message.toLowerCase();
      if (m.includes("already registered") || m.includes("already been registered"))
        return setError("Nomor ID Dawis sudah terdaftar. Langsung masuk, atau gunakan ID Dawis lain.");
      if (m.includes("database error"))
        return setError(
          "Pendaftaran gagal disimpan. Kemungkinan Nomor ID Dawis sudah dipakai — coba ID lain."
        );
      return setError(err.message);
    }

    if (!data.session) {
      setLoading(false);
      return setError(
        "Akun dibuat tetapi belum aktif. Pengelola perlu mematikan 'Confirm email' di Supabase (Authentication → Providers → Email)."
      );
    }

    // Tutup sesi yang otomatis dibuat Supabase, supaya warga tidak langsung
    // masuk aplikasi. Middleware juga akan memantulkan user yang masih login
    // dari halaman /login, jadi langkah ini wajib.
    await sb.auth.signOut({ scope: "local" }).catch(() => {});
    invalidateApi();

    setLoading(false);
    setPassword("");
    setConfirm("");
    setShowPass(false);
    setSisa(5);
    setBerhasil(uname);
  };

  return (
    <AuthShell
      title={berhasil ? "Pendaftaran Berhasil" : "Daftar Akun Dawis"}
      subtitle={
        berhasil
          ? "Akun Anda sudah dibuat. Tinggal masuk memakai password yang tadi Anda pilih."
          : "Satu akun untuk satu ibu Dawis. Data Anda terpisah dari akun lain."
      }
      footer={
        berhasil ? null : (
          <p className="text-center text-xs text-slate-500">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-bold text-emerald-600 hover:text-emerald-500">
              Masuk di sini
            </Link>
          </p>
        )
      }
    >
      {berhasil ? (
        <div role="status" aria-live="polite">
          <div className="flex flex-col items-center rounded-2xl bg-emerald-50 px-4 py-6 text-center ring-1 ring-emerald-100">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
              <Icon name="check" className="h-7 w-7" />
            </span>
            <p className="mt-3 text-sm font-bold text-emerald-900">Pendaftaran berhasil</p>
            <p className="mt-1 text-xs leading-relaxed text-emerald-800">
              Akun dengan Nomor ID Dawis{" "}
              <span className="font-mono font-bold tracking-wide">{berhasil.toUpperCase()}</span>{" "}
              sudah dibuat. Silakan masuk memakai password yang tadi Anda pilih.
            </p>
          </div>

          <div className="mt-4 rounded-xl bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-800 ring-1 ring-amber-100">
            <span className="font-semibold">Catat password Anda.</span> Jika lupa, hubungi pengelola
            Dawis untuk mengatur ulang.
          </div>

          <Btn onClick={masukSekarang} className="mt-4 w-full">
            Masuk di sini
          </Btn>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            Halaman masuk terbuka otomatis dalam {sisa} detik…
          </p>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Field label="Nama Lengkap" required>
            <input
              className={inputCls}
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="cth: Ibu Siti Aminah"
              autoComplete="name"
            />
          </Field>

          <Field label="Username / Nomor ID Dawis" required>
            <input
              className={inputCls}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="cth: U11289"
              autoComplete="username"
              autoCapitalize="characters"
              spellCheck={false}
            />
            <span className="mt-1 block text-[11px] leading-relaxed text-slate-500">
              Masukkan Nomor ID Dawis Anda, dan pastikan sesuai dengan ID Dawis yang Anda miliki,
              tidak bisa ubah setelah daftar. Contoh:{" "}
              <span className="font-semibold text-slate-600">U11289</span>
            </span>
          </Field>

          <Field label="Password" required>
            <div className="relative">
              <input
                className={`${inputCls} pr-11`}
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-600"
                aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"}
              >
                <Icon name={showPass ? "x" : "eye"} className="h-4 w-4" />
              </button>
            </div>
          </Field>

          <Field label="Ulangi Password" required>
            <input
              className={inputCls}
              type={showPass ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Ketik ulang password"
              autoComplete="new-password"
            />
          </Field>

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700 ring-1 ring-red-100">
              <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Btn type="submit" disabled={loading} className="w-full">
            {loading ? "Mendaftar..." : "Daftar"}
          </Btn>
        </form>
      )}
    </AuthShell>
  );
}
