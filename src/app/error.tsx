"use client";

import { useEffect } from "react";
import { Btn, Card, Icon, PageHeader } from "@/components/ui";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:py-16">
      <Card className="p-6 sm:p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 ring-1 ring-amber-200/60">
          <Icon name="alert" className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-lg font-extrabold text-slate-900">
          Terjadi kesalahan
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Halaman ini tidak bisa dimuat. Coba muat ulang. Jika masih gagal,
          hubungi pengelola Dawis.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-[10px] text-slate-400">
            Kode: {error.digest}
          </p>
        )}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Btn onClick={reset}>Coba lagi</Btn>
          <Btn variant="secondary" onClick={() => (window.location.href = "/")}>
            Ke beranda
          </Btn>
        </div>
      </Card>
    </div>
  );
}
