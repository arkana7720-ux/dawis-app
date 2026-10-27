import { ReactNode } from "react";
import { Icon } from "./ui";

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0B1120] px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_0%,rgba(16,185,129,0.20),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_40%_at_80%_100%,rgba(20,184,166,0.12),transparent)]"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
            <Icon name="building" className="h-6 w-6" />
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#0B1120] bg-emerald-400" />
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight text-white">Dawis Digital</p>
            <p className="text-[11px] font-medium text-slate-400">RT 04/RW 11 Rorotan</p>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-2xl shadow-black/40 ring-1 ring-white/10 sm:p-8">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-6 space-y-4">{children}</div>
          {footer && <div className="mt-6 border-t border-slate-100 pt-4">{footer}</div>}
        </div>

        <p className="mt-6 text-center text-[11px] font-medium text-slate-500">
          Kel. Rorotan, Jakarta Utara
        </p>
      </div>
    </div>
  );
}
