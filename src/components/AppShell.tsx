"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Icon } from "@/components/ui";

const NAV = [
  { href: "/", label: "Dashboard", icon: "home" },
  { href: "/warga", label: "Data Warga", icon: "users" },
  { href: "/struktur", label: "Struktur Wilayah", icon: "building" },
  { href: "/laporan", label: "Laporan", icon: "report" },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="min-h-screen">
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col bg-gradient-to-b from-[#0F172A] via-[#0F172A] to-[#0B1120] md:flex">
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
          <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-inset ring-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/25">
                <Icon name="family" className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-100">
                  Dasa Wisma RT 04/RW 11
                </p>
                <p className="text-[10px] text-slate-500">Kel. Rorotan, Jakarta Utara</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-black/20 px-3 py-2 ring-1 ring-inset ring-white/5">
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                ID Wilayah
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold tracking-widest text-emerald-300">
                <Icon name="check" className="h-3 w-3" />
                U11289
              </span>
            </div>
          </div>
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
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-xs font-bold text-white ring-2 ring-emerald-400/30">
          AD
        </span>
      </header>

      <main className="pb-28 md:pb-10 md:pl-[260px]">
        <div
          key={pathname}
          className="animate-fade-up mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8 lg:px-10"
        >
          {children}
        </div>
      </main>

      <nav
        className="no-print fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 grid grid-cols-4 gap-1 rounded-2xl border border-slate-200/60 bg-white/85 p-1.5 shadow-xl shadow-slate-900/10 backdrop-blur-xl md:hidden"
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
