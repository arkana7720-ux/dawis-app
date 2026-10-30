"use client";

import { useEffect, useState } from "react";
import { Btn, Card, ErrorState, Icon, PageHeader, Skeleton, StatCard } from "@/components/ui";
import { KATEGORI_USIA_LIST } from "@/lib/calc";
import { fetchApi } from "@/lib/clientApi";

interface Stats {
  totals: Record<string, number>;
  byKelompok: Array<Record<string, string | number>>;
  distribusiUsia: Array<{ label: string; L: number; P: number }>;
  distribusiKategoriBaru: Array<{ label: string; nama: string; L: number; P: number }>;
  distribusiPendidikan: Array<{ label: string; nama: string; L: number; P: number }>;
}

export default function LaporanPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [cetak, setCetak] = useState(false);

  const load = () => {
    setLoadErr("");
    fetchApi<Stats>("/api/stats")
      .then(setStats)
      .catch((e) => setLoadErr(e.message));
  };

  useEffect(() => {
    load();
  }, []);

  if (loadErr) return <ErrorState message={loadErr} onRetry={load} />;

  if (!stats)
    return (
      <>
        <div className="mb-6 flex items-end justify-between">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-10 w-56" />
        </div>
        <Skeleton className="h-[720px]" />
      </>
    );

  const t = stats.totals;
  const today = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const kategoriRows: Array<{ label: string; key: string }> = [
    { label: "Bangunan", key: "bangunan" },
    { label: "Keluarga", key: "keluarga" },
    { label: "Individu", key: "individu" },
    { label: "Laki-laki", key: "laki" },
    { label: "Perempuan", key: "perempuan" },
    { label: "Balita", key: "balita" },
    { label: "Anak", key: "anak" },
    { label: "Remaja", key: "remaja" },
    { label: "Dewasa", key: "dewasa" },
    { label: "Lansia", key: "lansia" },
    { label: "Balita (0-5)", key: "balita_b" },
    { label: "Anak (6-9)", key: "anak_b" },
    { label: "Remaja (10-24)", key: "remaja_b" },
    { label: "Dewasa (25-59)", key: "dewasa_b" },
    { label: "Lansia (60+)", key: "lansia_b" },
    { label: "WUS", key: "wus" },
    { label: "PUS", key: "pus" },
  ];

  return (
    <>
      <div className="no-print">
        <PageHeader
          title="Laporan"
          subtitle="Rekapitulasi data warga — siap cetak & ekspor"
          actions={
            <>
              <a href="/api/export">
                <Btn variant="secondary">
                  <Icon name="download" className="h-4 w-4" />
                  Unduh Excel/CSV
                </Btn>
              </a>
              <Btn onClick={() => { setCetak(true); setTimeout(() => window.print(), 100); }}>
                <Icon name="printer" className="h-4 w-4" />
                Cetak
              </Btn>
            </>
          }
        />

        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <StatCard
            label="Bangunan"
            value={t.bangunan}
            icon="building"
            tint="from-sky-100/80 via-white/40 to-blue-100/60"
            accent="from-sky-500 to-blue-600"
          />
          <StatCard
            label="Keluarga"
            value={t.keluarga}
            icon="key"
            tint="from-amber-100/80 via-white/40 to-orange-100/60"
            accent="from-amber-400 to-orange-500"
          />
          <StatCard
            label="Jiwa"
            value={t.individu}
            icon="users"
            tint="from-violet-100/80 via-white/40 to-purple-100/60"
            accent="from-violet-500 to-purple-600"
          />
          <StatCard
            label="WUS"
            value={t.wus}
            icon="heart"
            tint="from-rose-100/80 via-white/40 to-pink-100/60"
            accent="from-rose-400 to-pink-500"
          />
        </div>
      </div>

      <Card className="print-area bg-white/85 p-6 sm:p-10">
        <div className="mb-6 flex items-center gap-4 border-b-4 border-double border-slate-800 pb-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md">
            <Icon name="building" className="h-8 w-8" />
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Pemerintah DKI Jakarta · Kecamatan Cilincing
            </p>
            <h1 className="text-lg font-extrabold uppercase leading-tight tracking-tight text-slate-900 sm:text-xl">
              Data Warga Binaan Dasa Wisma
            </h1>
            <p className="text-sm font-semibold text-slate-600">
              RT 04 / RW 11 — Kelurahan Rorotan, Jakarta Utara
            </p>
          </div>
        </div>

        <div className="mb-5 flex items-center justify-between text-xs text-slate-500">
          <span>ID U11289</span>
          <span>Dicetak: {today}</span>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-emerald-50/80 text-left text-[11px] uppercase tracking-wider text-emerald-900/70">
              <th className="border border-slate-300 px-3 py-2.5 font-bold">Kategori</th>
              {stats.byKelompok.map((k) => (
                <th key={String(k.id)} className="border border-slate-300 px-3 py-2.5 text-center font-bold">
                  {k.nama}
                </th>
              ))}
              <th className="border border-slate-300 px-3 py-2.5 text-center font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {kategoriRows.map((row) => (
              <tr
                key={row.key}
                className={
                  row.label === "Individu"
                    ? "bg-emerald-50/70 font-bold text-slate-900"
                    : "odd:bg-white even:bg-emerald-50/25"
                }
              >
                <td className="border border-slate-300 px-3 py-1.5 text-slate-700">{row.label}</td>
                {stats.byKelompok.map((k) => (
                  <td key={String(k.id)} className="border border-slate-300 px-3 py-1.5 text-center tabular-nums">
                    {k[row.key]}
                  </td>
                ))}
                <td className="border border-slate-300 px-3 py-1.5 text-center font-bold tabular-nums">{t[row.key]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        <h2 className="mb-3 mt-8 border-l-4 border-emerald-500 pl-2.5 text-sm font-extrabold uppercase tracking-wide text-slate-800">
          Distribusi Usia per Jenis Kelamin
        </h2>
        <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-emerald-50/80 text-[11px] uppercase tracking-wider text-emerald-900/70">
              <th className="border border-slate-300 px-3 py-2.5 text-left font-bold">Kategori Usia</th>
              <th className="border border-slate-300 px-3 py-2.5 text-center font-bold">Laki-laki</th>
              <th className="border border-slate-300 px-3 py-2.5 text-center font-bold">Perempuan</th>
              <th className="border border-slate-300 px-3 py-2.5 text-center font-bold">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {KATEGORI_USIA_LIST.map((label) => {
              const d = stats.distribusiUsia.find((x) => x.label === label)!;
              return (
                <tr key={label} className="odd:bg-white even:bg-emerald-50/25">
                  <td className="border border-slate-300 px-3 py-1.5 text-slate-700">{label}</td>
                  <td className="border border-slate-300 px-3 py-1.5 text-center tabular-nums">{d.L}</td>
                  <td className="border border-slate-300 px-3 py-1.5 text-center tabular-nums">{d.P}</td>
                  <td className="border border-slate-300 px-3 py-1.5 text-center font-semibold tabular-nums">
                    {d.L + d.P}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-emerald-50/70 font-bold text-slate-900">
              <td className="border border-slate-300 px-3 py-1.5">TOTAL</td>
              <td className="border border-slate-300 px-3 py-1.5 text-center tabular-nums">{t.laki}</td>
              <td className="border border-slate-300 px-3 py-1.5 text-center tabular-nums">{t.perempuan}</td>
              <td className="border border-slate-300 px-3 py-1.5 text-center tabular-nums">{t.individu}</td>
            </tr>
          </tbody>
        </table>
        </div>

        <h2 className="mb-3 mt-8 border-l-4 border-emerald-500 pl-2.5 text-sm font-extrabold uppercase tracking-wide text-slate-800">
          Distribusi Kategori Usia Baru per Jenis Kelamin
        </h2>
        <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-emerald-50/80 text-[11px] uppercase tracking-wider text-emerald-900/70">
              <th className="border border-slate-300 px-3 py-2.5 text-left font-bold">Kategori Usia Baru</th>
              <th className="border border-slate-300 px-3 py-2.5 text-center font-bold">Laki-laki</th>
              <th className="border border-slate-300 px-3 py-2.5 text-center font-bold">Perempuan</th>
              <th className="border border-slate-300 px-3 py-2.5 text-center font-bold">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {stats.distribusiKategoriBaru.map((d) => (
              <tr key={d.label} className="odd:bg-white even:bg-emerald-50/25">
                <td className="border border-slate-300 px-3 py-1.5 text-slate-700">
                  {d.label} · {d.nama}
                </td>
                <td className="border border-slate-300 px-3 py-1.5 text-center tabular-nums">{d.L}</td>
                <td className="border border-slate-300 px-3 py-1.5 text-center tabular-nums">{d.P}</td>
                <td className="border border-slate-300 px-3 py-1.5 text-center font-semibold tabular-nums">
                  {d.L + d.P}
                </td>
              </tr>
            ))}
            <tr className="bg-emerald-50/70 font-bold text-slate-900">
              <td className="border border-slate-300 px-3 py-1.5">TOTAL</td>
              <td className="border border-slate-300 px-3 py-1.5 text-center tabular-nums">{t.laki}</td>
              <td className="border border-slate-300 px-3 py-1.5 text-center tabular-nums">{t.perempuan}</td>
              <td className="border border-slate-300 px-3 py-1.5 text-center tabular-nums">{t.individu}</td>
            </tr>
          </tbody>
        </table>
        </div>

        <h2 className="mb-3 mt-8 border-l-4 border-emerald-500 pl-2.5 text-sm font-extrabold uppercase tracking-wide text-slate-800">
          Distribusi Pendidikan per Jenis Kelamin
        </h2>
        <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-emerald-50/80 text-[11px] uppercase tracking-wider text-emerald-900/70">
              <th className="border border-slate-300 px-3 py-2.5 text-left font-bold">Pendidikan</th>
              <th className="border border-slate-300 px-3 py-2.5 text-center font-bold">Laki-laki</th>
              <th className="border border-slate-300 px-3 py-2.5 text-center font-bold">Perempuan</th>
              <th className="border border-slate-300 px-3 py-2.5 text-center font-bold">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {stats.distribusiPendidikan.map((d) => (
              <tr key={d.label} className="odd:bg-white even:bg-emerald-50/25">
                <td className="border border-slate-300 px-3 py-1.5 text-slate-700">
                  {d.label} · {d.nama}
                </td>
                <td className="border border-slate-300 px-3 py-1.5 text-center tabular-nums">{d.L}</td>
                <td className="border border-slate-300 px-3 py-1.5 text-center tabular-nums">{d.P}</td>
                <td className="border border-slate-300 px-3 py-1.5 text-center font-semibold tabular-nums">
                  {d.L + d.P}
                </td>
              </tr>
            ))}
            <tr className="bg-emerald-50/70 font-bold text-slate-900">
              <td className="border border-slate-300 px-3 py-1.5">TOTAL</td>
              <td className="border border-slate-300 px-3 py-1.5 text-center tabular-nums">{t.laki}</td>
              <td className="border border-slate-300 px-3 py-1.5 text-center tabular-nums">{t.perempuan}</td>
              <td className="border border-slate-300 px-3 py-1.5 text-center tabular-nums">{t.individu}</td>
            </tr>
          </tbody>
        </table>
        </div>

        <div className="mt-12 flex justify-end">
          <div className="text-center text-sm">
            <p className="text-slate-600">Jakarta Utara, {today}</p>
            <p className="font-semibold text-slate-700">Ketua Dasa Wisma</p>
            <div className="h-20" />
            <p className="font-semibold text-slate-900 underline">( ................................ )</p>
          </div>
        </div>
      </Card>

      {cetak && (
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-area,
            .print-area * {
              visibility: visible;
            }
            .print-area {
              position: absolute;
              inset: 0;
              box-shadow: none !important;
              --tw-ring-shadow: 0 0 #0000;
            }
          }
        `}</style>
      )}
    </>
  );
}
