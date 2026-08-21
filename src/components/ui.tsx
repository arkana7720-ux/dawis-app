"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

const ICONS: Record<string, string> = {
  home: "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10",
  users:
    "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6-4a3 3 0 11-3-3",
  building:
    "M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M9 11h1m4 0h1M9 14h1m4 0h1",
  report:
    "M9 17v-6m4 6V7m4 10v-3M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z",
  search: "M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z",
  plus: "M12 5v14m-7-7h14",
  edit: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7m-2.5-9.5a2.12 2.12 0 013 3L12 22l-4 1 1-4 9.5-9.5z",
  trash: "M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2m-6 5v6m4-6v6",
  x: "M6 6l12 12M18 6L6 18",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5 5 5-5m-5 5V3",
  printer:
    "M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-12 0h12v6H6v-6z",
  baby: "M12 3a3 3 0 100 6 3 3 0 000-6zm-7 18a7 7 0 0114 0M8 10l-2 3m12-3l2 3",
  heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
  elderly: "M12 2a2 2 0 100 4 2 2 0 000-4zm0 4v6l-3 8m3-8l3 8M9 6l-3 2m12-2l3 2",
  family:
    "M16 11a3 3 0 100-6 3 3 0 000 6zM8 11a3 3 0 100-6 3 3 0 000 6zM2 21v-1a6 6 0 019-5.2M22 21v-1a6 6 0 00-6-6c-.9 0-1.76.2-2.53.55",
  key: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  alert: "M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
  refresh: "M23 4v6h-6M1 20v-6h6m20-2a9 9 0 11-3-6.7L23 10M1 14a9 9 0 003 6.7L1 24",
  inbox: "M22 12h-6l-2 3h-4l-2-3H2m18.06-5.19L18.06 2.19A2 2 0 0016.41 1.5H7.59a2 2 0 00-1.65.69L3.94 6.81A2 2 0 003.5 8.09V18a2 2 0 002 2h13a2 2 0 002-2V8.09c0-.46-.14-.9-.44-1.28z",
  chevron: "M9 18l6-6-6-6",
  chevronDown: "M6 9l6 6 6-6",
  eye: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z",
  dots: "M12 6.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM12 13.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM12 20.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
  filter: "M4 6h16M7 12h10m-7 6h4",
  check: "M5 13l4 4L19 7",
  swap: "M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4",
  calendar:
    "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
};

const FILLED = new Set(["wa"]);

const WA_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z";

export function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: keyof typeof ICONS | string;
  className?: string;
}) {
  if (FILLED.has(name)) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
        <path d={WA_PATH} />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d={ICONS[name] || ICONS.inbox} />
    </svg>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-white ring-1 ring-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  desc,
  action,
}: {
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
      <div>
        <h2 className="text-sm font-bold text-slate-800">{title}</h2>
        {desc && <p className="mt-0.5 text-xs text-slate-400">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-slate-900 sm:text-2xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

type BtnProps = {
  children?: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
};

export function Btn({
  children,
  onClick,
  variant = "primary",
  size = "md",
  type = "button",
  disabled,
  className = "",
}: BtnProps) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2.5 text-sm" };
  const variants = {
    primary:
      "bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 hover:bg-emerald-500",
    secondary:
      "bg-white text-slate-700 ring-1 ring-slate-200 shadow-xs hover:bg-slate-50 hover:ring-slate-300",
    danger: "bg-red-600 text-white shadow-sm shadow-red-600/25 hover:bg-red-500",
    ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function IconBtn({
  icon,
  onClick,
  title,
  tone = "default",
  className = "",
}: {
  icon: string;
  onClick?: () => void;
  title?: string;
  tone?: "default" | "danger" | "primary";
  className?: string;
}) {
  const tones = {
    default: "text-slate-400 hover:text-slate-700 hover:bg-slate-100",
    danger: "text-slate-400 hover:text-red-600 hover:bg-red-50",
    primary: "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50",
  };
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-lg p-1.5 transition-all hover:scale-110 ${tones[tone]} ${className}`}
    >
      <Icon name={icon} className="h-4 w-4" />
    </button>
  );
}

export function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 outline-none transition-shadow placeholder:text-slate-400 hover:ring-slate-300 focus:ring-2 focus:ring-emerald-500 focus-visible:outline-none";

export function Badge({
  children,
  color = "slate",
  dot = false,
}: {
  children: ReactNode;
  color?:
    | "slate"
    | "green"
    | "blue"
    | "amber"
    | "red"
    | "violet"
    | "indigo"
    | "purple"
    | "pink"
    | "rose"
    | "orange";
  dot?: boolean;
}) {
  const colors: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600 ring-slate-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    blue: "bg-sky-50 text-sky-700 ring-sky-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    violet: "bg-violet-50 text-violet-700 ring-violet-200",
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    purple: "bg-purple-50 text-purple-700 ring-purple-200",
    pink: "bg-pink-50 text-pink-700 ring-pink-200",
    rose: "bg-rose-50 text-rose-700 ring-rose-200",
    orange: "bg-orange-50 text-orange-700 ring-orange-200",
  };
  const dots: Record<string, string> = {
    slate: "bg-slate-400",
    green: "bg-emerald-500",
    blue: "bg-sky-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    violet: "bg-violet-500",
    indigo: "bg-indigo-500",
    purple: "bg-purple-500",
    pink: "bg-pink-500",
    rose: "bg-rose-500",
    orange: "bg-orange-500",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${colors[color]}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dots[color]}`} />}
      {children}
    </span>
  );
}

const AVATAR_TONES = [
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
];

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const tone = AVATAR_TONES[hash % AVATAR_TONES.length];
  const sizes = { sm: "h-7 w-7 text-[10px]", md: "h-9 w-9 text-xs" };
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${tone} ${sizes[size]}`}
    >
      {initials || "?"}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={`animate-scale-in flex max-h-[85vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${
            wide ? "sm:max-w-2xl" : "sm:max-w-lg"
          }`}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
            <h2 className="truncate text-base font-bold text-slate-900">{title}</h2>
            <IconBtn icon="x" onClick={onClose} title="Tutup" />
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">{children}</div>
        </div>
      </div>
    </>,
    document.body
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/60 ${className}`} />;
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-white/40 border-t-white ${className}`}
    />
  );
}

export function EmptyState({
  message,
  action,
}: {
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
        <Icon name="inbox" className="h-7 w-7" />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-400">{message}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-400 ring-1 ring-red-100">
        <Icon name="alert" className="h-7 w-7" />
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-700">Terjadi kesalahan</p>
      <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-400">{message}</p>
      {onRetry && (
        <div className="mt-4 flex justify-center">
          <Btn variant="secondary" size="sm" onClick={onRetry}>
            Coba Lagi
          </Btn>
        </div>
      )}
    </Card>
  );
}
