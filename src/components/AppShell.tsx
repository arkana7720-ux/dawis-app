"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { Botanical, Icon } from "@/components/ui";
import { fetchApi, subscribeApi } from "@/lib/clientApi";

const NAV_UTAMA = [
  { href: "/", label: "Dashboard", icon: "home" },
  { href: "/warga", label: "Data Warga", icon: "users" },
  { href: "/struktur", label: "Struktur Wilayah", icon: "building" },
  { href: "/laporan", label: "Laporan", icon: "report" },
];

const NAV_ADMIN = { href: "/admin", label: "Kelola Akun", icon: "key" };

const AUTH_PAGES = new Set(["/login", "/register"]);

interface Me {
  user: { username: string; nama: string; is_admin?: boolean };
  kelompok: { id: number; nama: string }[];
}

function inisial(nama: string, username: string): string {
  const dariNama = nama
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (dariNama || username.slice(0, 2) || "?").toUpperCase();
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  const isAuthPage = AUTH_PAGES.has(pathname);
  const isAdmin = Boolean(me?.user.is_admin);
  const NAV = isAdmin ? [...NAV_UTAMA, NAV_ADMIN] : NAV_UTAMA;

  useEffect(() => {
    if (isAuthPage) return;
    let aktif = true;
    // Cukup sekali saat halaman dimuat; tidak perlu tiap pindah menu.
    // Setelah data berubah, invalidateApi() akan memicu muat ulang.
    const loadMe = () => {
      fetchApi<Me>("/api/me")
        .then((j) => {
          if (aktif) setMe(j);
        })
        .catch(() => {});
    };
    loadMe();
    const unsubscribe = subscribeApi(loadMe);
    return () => {
      aktif = false;
      unsubscribe();
    };
  }, [isAuthPage]);

  // Panaskan data dan halaman yang paling sering dibuka supaya klik menu
  // terasa instan. Dilewati kalau pengguna menghemat kuota atau jaringan lambat.
  useEffect(() => {
    if (isAuthPage || !me) return;
    const conn = (navigator as unknown as {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType || "")) return;

    const mulai = () => {
      for (const url of ["/api/stats", "/api/warga", "/api/bangunan"]) {
        fetchApi(url).catch(() => {});
      }
      // Unduh halaman tujuan lebih dulu agar perpindahan menu tidak menunggu.
      for (const href of [...NAV.map((n) => n.href), "/akun"]) {
        if (href !== pathname) router.prefetch(href);
      }
    };
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };
    if (w.requestIdleCallback) {
      w.requestIdleCallback(mulai, { timeout: 2500 });
      return;
    }
    const t = setTimeout(mulai, 1500);
    return () => clearTimeout(t);
  }, [isAuthPage, me, pathname, router]);

  if (isAuthPage) return <>{children}</>;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const avatarText = inisial(me?.user.nama ?? "", me?.user.username ?? "");

  return (
    <div className="relative min-h-screen">
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#fffdf6] via-[#f6fbf7] to-[#eef8f2]" />
        <div className="absolute -left-32 -top-24 h-[420px] w-[420px] rounded-full bg-emerald-100/50 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-[380px] w-[380px] rounded-full bg-teal-100/40 blur-3xl" />
        <div className="absolute left-1/3 top-1/2 h-[360px] w-[360px] rounded-full bg-amber-100/30 blur-3xl" />
        <Botanical className="absolute -right-10 top-10 h-[360px] w-[300px] rotate-[8deg] text-emerald-900 opacity-[0.06] md:right-10" />
        <Botanical className="absolute -left-16 bottom-8 h-[320px] w-[260px] -rotate-[14deg] text-teal-900 opacity-[0.05] md:left-[280px]" />
      </div>

      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col overflow-hidden border-r border-white/10 bg-gradient-to-b from-[#0F172A] via-[#101B2D] to-[#0B1120] md:flex">
        <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <span className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />
          <Botanical className="absolute -bottom-16 -right-20 h-[300px] w-[240px] -rotate-[18deg] text-emerald-300 opacity-[0.06]" />
        </span>
        <div className="flex items-center gap-3 px-5 pb-7 pt-7">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
            <Icon name="building" className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#0F172A] bg-emerald-400" />
          </div>
          <div>
            <p className="text-base font-extrabold tracking-tight text-white">
              Dawis Digital
            </p>
            <p className="text-[11px] font-medium text-slate-400">RT 04/RW 11 Rorotan</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
            Menu Utama
          </p>
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive(n.href)
                  ? "bg-gradient-to-r from-emerald-500/25 via-emerald-500/10 to-transparent text-white ring-1 ring-inset ring-emerald-400/25"
                  : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-100"
              }`}
            >
              {isActive(n.href) && (
                <span className="absolute -left-4 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-emerald-400 shadow-[0_0_16px_3px_rgba(16,185,129,0.65)]" />
              )}
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                  isActive(n.href)
                    ? "bg-emerald-500/20 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                    : "bg-white/[0.04] text-slate-500 group-hover:bg-white/10 group-hover:text-slate-200"
                }`}
              >
                <Icon name={n.icon} className="h-4 w-4" />
              </span>
              {n.label}
              {isActive(n.href) && (
                <Icon name="chevron" className="ml-auto h-3.5 w-3.5 text-emerald-400" />
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4">
          <Link
            href="/akun"
            className={`group block rounded-2xl bg-white/[0.04] p-4 ring-1 ring-inset backdrop-blur-sm transition-all ${
              isActive("/akun")
                ? "ring-emerald-400/40"
                : "ring-white/10 hover:bg-white/[0.07]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-[11px] font-bold text-white ring-1 ring-inset ring-emerald-300/40">
                {avatarText}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-100">
                  {me?.user.nama || "Akun Saya"}
                </p>
                <p className="truncate font-mono text-[10px] uppercase tracking-wider text-slate-500">
                  {me?.user.username || "kelola akun"}
                </p>
              </div>
              <Icon
                name="chevron"
                className="h-4 w-4 shrink-0 text-slate-600 transition-all group-hover:translate-x-0.5 group-hover:text-emerald-400"
              />
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-black/20 px-3 py-2 ring-1 ring-inset ring-white/5">
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Kelompok
              </span>
              <span className="text-[11px] font-extrabold tracking-widest text-emerald-300">
                {me ? me.kelompok.length : "–"}
              </span>
            </div>
          </Link>
        </div>
      </aside>

      <header className="no-print sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-white/5 bg-[#0F172A] px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-md shadow-emerald-500/30">
            <Icon name="building" className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-extrabold tracking-tight text-white">Dawis Digital</p>
            <p className="text-[10px] font-medium text-slate-400">RT 04/RW 11 Rorotan</p>
          </div>
        </div>
        <Link
          href="/akun"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-xs font-bold text-white ring-2 ring-emerald-400/30"
          aria-label={`Akun saya ${avatarText}`}
        >
          {avatarText}
        </Link>
      </header>

      <main className="relative z-10 pb-28 md:pb-10 md:pl-[260px]">
        <div
          key={pathname}
          className="animate-fade-up mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-9 lg:px-10"
        >
          {children}
        </div>
      </main>

      <nav
        className={`no-print fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 grid ${
          isAdmin ? "grid-cols-5" : "grid-cols-4"
        } gap-1 rounded-2xl border border-white/70 bg-white/75 p-1.5 shadow-xl shadow-slate-900/10 backdrop-blur-xl md:hidden`}
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`relative flex flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-semibold transition-all ${
              isActive(n.href)
                ? "bg-emerald-500/10 text-emerald-600"
                : "text-slate-400 active:bg-slate-100"
            }`}
          >
            <Icon name={n.icon} className="h-5 w-5" />
            {n.label.split(" ")[0]}
          </Link>
        ))}
      </nav>
    </div>
  );
}
