"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { Btn, Field, Icon, inputCls } from "@/components/ui";
import { getBrowserSupabase } from "@/lib/supabase";
import { normalizeUsername, usernameToEmail } from "@/lib/auth";
import { invalidateApi } from "@/lib/clientApi";

function pesanError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Nomor ID Dawis atau password salah.";
  if (m.includes("email not confirmed"))
    return "Akun belum aktif. Hubungi pengelola untuk mengaktifkan.";
  if (m.includes("banned") || m.includes("user_banned"))
    return "Akun ini dinonaktifkan. Hubungi pengelola Dawis.";
  if (m.includes("too many requests"))
    return "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.";
  if (m.includes("failed to fetch") || m.includes("network"))
    return "Tidak bisa menghubungi server. Periksa koneksi internet.";
  return message;
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState(false);
  const passRef = useRef<HTMLInputElement>(null);

  // Datang dari halaman daftar (`/login?daftar=berhasil&u=...`): isi Nomor ID
  // Dawis otomatis, arahkan kursor ke kolom password, tampilkan banner sukses
  // selama 5 detik, lalu bersihkan URL agar banner tidak muncul lagi saat
  // halaman di-refresh. Query dibaca dari window supaya tidak butuh Suspense.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("daftar") !== "berhasil") return;

    const uname = normalizeUsername(q.get("u") || "");
    if (uname) setUsername(uname);
    setBanner(true);
    window.history.replaceState(null, "", "/login");

    const sembunyi = window.setTimeout(() => setBanner(false), 5000);
    const fokus = window.setTimeout(() => passRef.current?.focus(), 300);

    return () => {
      window.clearTimeout(sembunyi);
      window.clearTimeout(fokus);
    };
  }, []);

  const submit = async () => {
    const uname = normalizeUsername(username);
    if (!uname) return setError("Nomor ID Dawis wajib diisi.");
    if (!password) return setError("Password wajib diisi.");

    setLoading(true);
    setError("");

    const sb = getBrowserSupabase();
    const { error: err } = await sb.auth.signInWithPassword({
      email: usernameToEmail(uname),
      password,
    });

    if (err) {
      setLoading(false);
      setError(pesanError(err.message));
      return;
    }

    invalidateApi();
    router.replace("/");
    router.refresh();
  };

  return (
    <AuthShell
      title="Masuk"
      subtitle="Gunakan Nomor ID Dawis dan password akun Anda."
      footer={
        <p className="text-center text-xs text-slate-500">
          Belum punya akun?{" "}
          <Link href="/register" className="font-bold text-emerald-600 hover:text-emerald-500">
            Daftar di sini
          </Link>
        </p>
      }
    >
      {banner && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs leading-relaxed text-emerald-800 ring-1 ring-emerald-200"
        >
          <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <span>
            <span className="font-bold">Pendaftaran berhasil.</span> Silakan masuk dengan Nomor ID
            Dawis dan password yang tadi Anda buat.
          </span>
        </div>
      )}

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Field label="Username / Nomor ID Dawis" required>
          <input
            className={inputCls}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="cth: U11289"
            autoComplete="username"
            autoCapitalize="characters"
            spellCheck={false}
            inputMode="text"
          />
        </Field>

        <Field label="Password" required>
          <div className="relative">
            <input
              ref={passRef}
              className={`${inputCls} pr-11`}
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password Anda"
              autoComplete="current-password"
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

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700 ring-1 ring-red-100">
            <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Btn type="submit" disabled={loading} className="w-full">
          {loading ? "Memproses..." : "Masuk"}
        </Btn>
      </form>

      <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] leading-relaxed text-slate-500 ring-1 ring-slate-100">
        Lupa password? Hubungi pengelola Dawis untuk mengatur ulang password Anda.
      </p>
    </AuthShell>
  );
}
