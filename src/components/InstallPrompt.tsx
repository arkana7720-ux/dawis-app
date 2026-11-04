"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "dawis-install-dismissed";

export function InstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const pasang = async () => {
    if (!evt) return;
    await evt.prompt();
    const choice = await evt.userChoice;
    if (choice.outcome === "accepted") setShow(false);
    setEvt(null);
  };

  const tutup = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Pasang aplikasi"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-xl px-3 pb-3 sm:px-4 sm:pb-4"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/95 p-3 shadow-2xl shadow-slate-900/20 backdrop-blur-md sm:p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-700/20">
          <Icon name="download" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900">Pasang Dawis di HP</p>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Buka lebih cepat dari layar utama, tanpa mengetik alamat.
          </p>
        </div>
        <button
          type="button"
          onClick={pasang}
          className="shrink-0 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-700/25 transition-all hover:bg-emerald-800 active:scale-[0.98]"
        >
          Pasang
        </button>
        <button
          type="button"
          onClick={tutup}
          aria-label="Tutup"
          className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <Icon name="x" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
