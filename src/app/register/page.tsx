"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { Btn, Field, Icon, inputCls } from "@/components/ui";
import { getBrowserSupabase } from "@/lib/supabase";
import { isValidUsername, normalizeUsername, usernameToEmail } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const uname = normalizeUsername(username);
    const namaBersih = nama.trim();

    if (!namaBersih) return setError("Nama lengkap wajib diisi.");
    if (!isValidUsername(uname))
      return setError(
        "Username harus diawali huruf dan minimal 4 karakter, hanya huruf/angka. Contoh: A12345."
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
      return setError("Username sudah dipakai. Pilih username lain atau langsung login.");
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
        return setError("Username sudah dipakai. Pilih username lain atau langsung login.");
      if (m.includes("database error"))
        return setError(
          "Pendaftaran gagal disimpan. Kemungkinan username sudah dipakai — coba username lain."
        );
      return setError(err.message);
    }

    if (!data.session) {
      setLoading(false);
      return setError(
        "Akun dibuat tetapi belum aktif. Pengelola perlu mematikan 'Confirm email' di Supabase (Authentication → Providers → Email)."
      );
    }

    router.replace("/struktur");
    router.refresh();
  };

  return (
    <AuthShell
      title="Daftar Akun Dawis"
      subtitle="Satu akun untuk satu ibu Dawis. Data Anda terpisah dari akun lain."
      footer={
        <p className="text-center text-xs text-slate-500">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-bold text-emerald-600 hover:text-emerald-500">
            Masuk di sini
          </Link>
        </p>
      }
    >
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

        <Field label="Username" required>
          <input
            className={inputCls}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="cth: A12345"
            autoComplete="username"
            autoCapitalize="characters"
            spellCheck={false}
          />
          <span className="mt-1 block text-[11px] text-slate-400">
            Huruf di depan + angka, contoh <span className="font-semibold">A12345</span>. Tidak bisa
            diubah setelah daftar.
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
    </AuthShell>
  );
}
