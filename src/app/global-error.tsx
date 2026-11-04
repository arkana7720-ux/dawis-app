"use client";

import { useEffect } from "react";
import { Btn } from "@/components/ui";

export default function GlobalError({
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
    <html lang="id">
      <body className="min-h-screen bg-gradient-to-br from-[#fffdf6] via-[#f6fbf7] to-[#eef8f2] font-sans text-slate-900">
        <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
          <h1 className="text-xl font-extrabold">Aplikasi bermasalah</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Silakan muat ulang halaman. Jika berulang, hubungi pengelola Dawis.
          </p>
          <div className="mt-5 flex gap-2">
            <Btn onClick={reset}>Muat ulang</Btn>
            <Btn variant="secondary" onClick={() => (window.location.href = "/")}>
              Beranda
            </Btn>
          </div>
        </div>
      </body>
    </html>
  );
}
