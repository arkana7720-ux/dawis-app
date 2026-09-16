"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import {
  Avatar,
  Badge,
  Btn,
  Card,
  CardHeader,
  ErrorState,
  Icon,
  inputCls,
  Modal,
  Skeleton,
} from "@/components/ui";
import { formatTanggal, KATEGORI_USIA_LIST } from "@/lib/calc";

interface Stats {
  totals: Record<string, number>;
  byKelompok: Array<Record<string, string | number>>;
  distribusiUsia: Array<{ label: string; L: number; P: number }>;
  distribusiKategoriBaru: Array<{ label: string; nama: string; L: number; P: number }>;
  kbAktif?: number;
}

interface WargaRow {
  id: number;
  nama: string;
  hubungan: string;
  jenis_kelamin: string;
  tanggal_lahir: string;
  keluarga_nama: string;
  bangunan_nama: string;
  kelompok_nama: string;
  usia: number | null;
  kategori: string;
  kategori_usia_baru: string;
  wus: boolean;
  pus: boolean;
  status_warga: string;
  is_hamil: boolean;
  hpl_kehamilan: string;
  risiko_kehamilan: string;
}

interface TreeKelompok {
  id: number;
  nama: string;
  kode: string;
  bangunan: Array<{
    id: number;
    nama: string;
    tipe: string;
    keterangan: string;
    jumlah_warga: number;
    keluarga: Array<{ id: number; nama_krt: string; catatan: string; anggota: unknown[] }>;
  }>;
}

type DetailType =
  | "bangunan"
  | "keluarga"
  | "individu"
  | "lp"
  | "balita"
  | "lansia"
  | "hamil"
  | "wus"
  | "pus";

const DETAIL_META: Record<DetailType, { title: string; desc?: string }> = {
  bangunan: { title: "Daftar Bangunan" },
  keluarga: { title: "Daftar Keluarga" },
  individu: { title: "Semua Warga" },
  lp: { title: "Sebaran Jenis Kelamin" },
  balita: { title: "Balita", desc: "Usia 0–4 tahun" },
  lansia: { title: "Lansia", desc: "Usia 60 tahun ke atas" },
  hamil: { title: "Ibu Hamil", desc: "Warga perempuan aktif yang sedang hamil" },
  wus: { title: "WUS", desc: "Wanita Usia Subur (15–49 th)" },
  pus: { title: "PUS", desc: "Pasangan Usia Subur" },
};

const KATEGORI_COLORS = ["#f59e0b", "#10b981", "#0ea5e9", "#6366f1", "#f43f5e"];

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-white/95 px-3 py-2 text-xs shadow-xl ring-1 ring-slate-200 backdrop-blur">
      {label && <p className="mb-1 font-bold text-slate-700">{label}</p>}
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: p.color || p.payload?.fill }}
          />
          <span className="text-slate-500">{p.name}</span>
          <span className="ml-auto pl-4 font-bold tabular-nums text-slate-800">
            {p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  grad,
  onClick,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  grad: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${grad} p-3 text-white shadow-md shadow-slate-900/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] sm:p-5 ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <span className="pointer-events-none absolute -right-5 -top-5 h-16 w-16 rounded-full bg-white/10 sm:h-24 sm:w-24" />
      <span className="pointer-events-none absolute -bottom-6 -left-6 h-14 w-14 rounded-full bg-black/5" />
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-white/75 sm:text-xs">
            {label}
          </p>
          <p className="mt-1 text-lg font-extrabold leading-tight tracking-tight tabular-nums sm:mt-2 sm:text-[26px] sm:leading-none">
            {value}
          </p>
          {sub && (
            <p className="mt-0.5 truncate text-[9px] font-medium text-white/60 sm:text-[11px]">
              {sub}
            </p>
          )}
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-inset ring-white/25 transition-transform group-hover:scale-110 sm:h-11 sm:w-11 sm:rounded-xl">
          <Icon name={icon} className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>
      </div>
      {onClick && (
        <span className="relative mt-2 hidden items-center gap-1 text-[10px] font-bold text-white/60 transition-colors group-hover:text-white sm:mt-3 sm:inline-flex sm:text-[11px]">
          Lihat detail
          <Icon name="chevron" className="h-3 w-3" />
        </span>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState("");
  const [today, setToday] = useState("");
  const [detail, setDetail] = useState<DetailType | null>(null);
  const [tree, setTree] = useState<TreeKelompok[] | null>(null);
  const [warga, setWarga] = useState<WargaRow[] | null>(null);
  const [dErr, setDErr] = useState("");
  const [dq, setDq] = useState("");
  const [cetak, setCetak] = useState(false);

  const cetakPdf = async () => {
    if (!warga) {
      try {
        const r = await fetch("/api/warga");
        if (!r.ok) throw new Error();
        setWarga(await r.json());
      } catch {
        return;
      }
    }
    setCetak(true);
  };

  useEffect(() => {
    if (!cetak) return;
    const done = () => setCetak(false);
    window.addEventListener("afterprint", done);
    const t = setTimeout(() => window.print(), 150);
    return () => {
      clearTimeout(t);
      window.removeEventListener("afterprint", done);
    };
  }, [cetak]);

  const load = () => {
    setErr("");
    fetch("/api/stats")
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || "Gagal memuat data");
        return r.json();
      })
      .then(setStats)
      .catch((e) => setErr(e.message));
  };

  useEffect(() => {
    load();
    setToday(
      new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
  }, []);

  useEffect(() => {
    if (!detail) return;
    setDq("");
    setDErr("");
    const needTree = detail === "bangunan" || detail === "keluarga";
    if (needTree && !tree) {
      fetch("/api/bangunan")
        .then(async (r) => {
          if (!r.ok) throw new Error("Gagal memuat data");
          return r.json();
        })
        .then(setTree)
        .catch((e) => setDErr(e.message));
    }
    if (!needTree && !warga) {
      fetch("/api/warga")
        .then(async (r) => {
          if (!r.ok) throw new Error("Gagal memuat data");
          return r.json();
        })
        .then(setWarga)
        .catch((e) => setDErr(e.message));
    }
  }, [detail, tree, warga]);

  const detailRows = useMemo(() => {
    const term = dq.toLowerCase().trim();
    const match = (hay: string) => !term || hay.toLowerCase().includes(term);
    if (detail === "bangunan") {
      if (!tree) return [];
      return tree
        .flatMap((k) =>
          k.bangunan.map((b) => ({
            id: b.id,
            nama: b.nama,
            tipe: b.tipe,
            keterangan: b.keterangan,
            kelompok: k.nama,
            jmlKeluarga: b.keluarga.length,
            jiwa: b.jumlah_warga,
          }))
        )
        .filter((b) => match(`${b.nama} ${b.kelompok}`));
    }
    if (detail === "keluarga") {
      if (!tree) return [];
      return tree
        .flatMap((k) =>
          k.bangunan.flatMap((b) =>
            b.keluarga.map((f) => ({
              id: f.id,
              nama: f.nama_krt,
              catatan: f.catatan,
              bangunan: b.nama,
              kelompok: k.nama,
              anggota: f.anggota.length,
            }))
          )
        )
        .filter((f) => match(`${f.nama} ${f.bangunan} ${f.kelompok}`));
    }
    if (!warga) return [];
    let rows = warga.filter((w) => w.status_warga === "aktif");
    if (detail === "balita") rows = rows.filter((w) => w.kategori === "Balita");
    if (detail === "lansia") rows = rows.filter((w) => w.kategori === "Lansia");
    if (detail === "hamil") rows = rows.filter((w) => w.is_hamil);
    if (detail === "wus") rows = rows.filter((w) => w.wus);
    if (detail === "pus") rows = rows.filter((w) => w.pus);
    rows = rows.filter((w) => match(`${w.nama} ${w.bangunan_nama} ${w.kelompok_nama}`));
    if (detail === "hamil")
      return [...rows].sort(
        (a, b) =>
          (b.risiko_kehamilan === "tinggi" ? 1 : 0) - (a.risiko_kehamilan === "tinggi" ? 1 : 0) ||
          (a.hpl_kehamilan || "9999").localeCompare(b.hpl_kehamilan || "9999")
      );
    return rows;
  }, [detail, dq, tree, warga]);

  const closeDetail = () => setDetail(null);
  const needTree = detail === "bangunan" || detail === "keluarga";
  const dLoading = needTree ? !tree : !warga;
  const retryDetail = () => {
    if (needTree) setTree(null);
    else setWarga(null);
  };

  if (err) return <ErrorState message={err} onRetry={load} />;

  if (!stats)
    return (
      <>
        <Skeleton className="h-9 w-56" />
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[84px] sm:h-[104px]" />
          ))}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-5">
          <Skeleton className="h-80 lg:col-span-3" />
          <Skeleton className="h-80 lg:col-span-2" />
        </div>
      </>
    );

  const t = stats.totals;
  const pieData = [
    { name: "Balita", value: t.balita },
    { name: "Anak", value: t.anak },
    { name: "Remaja", value: t.remaja },
    { name: "Dewasa", value: t.dewasa },
    { name: "Lansia", value: t.lansia },
  ].filter((d) => d.value > 0);

  const meta = detail ? DETAIL_META[detail] : null;

  return (
    <>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Ringkasan data warga Dasa Wisma RT 04/RW 11 Rorotan
          </p>
        </div>
        <div className="flex items-center gap-2">
          {today && (
            <span className="hidden rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200 sm:inline-flex">
              {today}
            </span>
          )}
          <Link href="/laporan">
            <Btn variant="secondary" size="sm">Laporan</Btn>
          </Link>
          <Btn variant="secondary" size="sm" onClick={cetakPdf}>
            <Icon name="printer" className="h-4 w-4" />
            Cetak PDF
          </Btn>
          <a href="/api/export">
            <Btn size="sm">Ekspor Data</Btn>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        <StatCard label="Bangunan" value={t.bangunan} sub="terdata" icon="building" grad="from-slate-500 to-slate-700" onClick={() => setDetail("bangunan")} />
        <StatCard label="Keluarga" value={t.keluarga} sub="kepala rumah tangga" icon="key" grad="from-sky-500 to-blue-600" onClick={() => setDetail("keluarga")} />
        <StatCard label="Total Individu" value={t.individu} sub="jiwa tercatat" icon="users" grad="from-emerald-500 to-teal-600" onClick={() => setDetail("individu")} />
        <StatCard label="Laki-laki / Perempuan" value={`${t.laki} / ${t.perempuan}`} sub="rasio jenis kelamin" icon="family" grad="from-violet-500 to-purple-600" onClick={() => setDetail("lp")} />
        <StatCard label="Balita" value={t.balita} sub="usia 0–4 tahun" icon="baby" grad="from-amber-400 to-orange-500" onClick={() => setDetail("balita")} />
        <StatCard label="Lansia" value={t.lansia} sub="usia 60+ tahun" icon="elderly" grad="from-orange-500 to-red-500" onClick={() => setDetail("lansia")} />
        <StatCard label="Ibu Hamil" value={t.ibu_hamil} sub="sedang hamil" icon="heart" grad="from-rose-600 to-red-600" onClick={() => setDetail("hamil")} />
        <StatCard label="WUS" value={t.wus} sub="wanita usia subur" icon="heart" grad="from-pink-500 to-rose-500" onClick={() => setDetail("wus")} />
        <StatCard label="PUS" value={t.pus} sub="pasangan usia subur" icon="report" grad="from-fuchsia-500 to-pink-600" onClick={() => setDetail("pus")} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            title="Distribusi Usia per Jenis Kelamin"
            desc="Jumlah jiwa pada setiap kelompok usia"
          />
          <div className="h-72 px-2 pb-2 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.distribusiUsia} barGap={3} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#eef2f6" strokeDasharray="4 4" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={48}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(148,163,184,0.08)" }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
                <Bar dataKey="L" name="Laki-laki" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={18} />
                <Bar dataKey="P" name="Perempuan" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Komposisi Kategori Usia" desc="Proporsi seluruh warga" />
          <div className="relative h-72 px-2 pb-2 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="58%"
                  outerRadius="80%"
                  paddingAngle={3}
                  cornerRadius={5}
                  strokeWidth={0}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={KATEGORI_COLORS[i % KATEGORI_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-6">
              <p className="text-3xl font-extrabold tracking-tight tabular-nums text-slate-900">
                {t.individu}
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Jiwa
              </p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 border-t border-slate-100 px-4 py-3">
            {pieData.map((d, i) => (
              <span key={d.name} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <span className="h-2 w-2 rounded-full" style={{ background: KATEGORI_COLORS[i] }} />
                {d.name}
                <span className="font-bold tabular-nums text-slate-700">{d.value}</span>
              </span>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-4 overflow-hidden">
        <CardHeader title="Rekapitulasi per Kelompok" desc="Perbandingan antar kelompok dasawisma" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[11px] uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3 font-bold">Kelompok</th>
                <th className="px-3 py-3 text-center font-bold">Bangunan</th>
                <th className="px-3 py-3 text-center font-bold">Keluarga</th>
                <th className="px-3 py-3 text-center font-bold">Individu</th>
                <th className="px-3 py-3 text-center font-bold">L</th>
                <th className="px-3 py-3 text-center font-bold">P</th>
                <th className="px-3 py-3 text-center font-bold">Balita</th>
                <th className="px-3 py-3 text-center font-bold">WUS</th>
                <th className="px-3 py-3 text-center font-bold">PUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stats.byKelompok.map((k) => (
                <tr key={String(k.id)} className="transition-colors hover:bg-emerald-50/30">
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-800">{k.nama}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-slate-400">{k.kode}</p>
                  </td>
                  <td className="px-3 py-3.5 text-center tabular-nums text-slate-600">{k.bangunan}</td>
                  <td className="px-3 py-3.5 text-center tabular-nums text-slate-600">{k.keluarga}</td>
                  <td className="px-3 py-3.5 text-center font-bold tabular-nums text-slate-900">{k.individu}</td>
                  <td className="px-3 py-3.5 text-center tabular-nums text-slate-600">{k.laki}</td>
                  <td className="px-3 py-3.5 text-center tabular-nums text-slate-600">{k.perempuan}</td>
                  <td className="px-3 py-3.5 text-center tabular-nums text-slate-600">{k.balita}</td>
                  <td className="px-3 py-3.5 text-center"><Badge color="pink" dot>{k.wus}</Badge></td>
                  <td className="px-3 py-3.5 text-center"><Badge color="rose" dot>{k.pus}</Badge></td>
                </tr>
              ))}
              <tr className="bg-gradient-to-r from-emerald-50/80 to-teal-50/60 font-extrabold text-slate-900">
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center gap-2">
                    TOTAL
                    <Badge color="green">{stats.byKelompok.length} kelompok</Badge>
                  </span>
                </td>
                <td className="px-3 py-3.5 text-center tabular-nums">{t.bangunan}</td>
                <td className="px-3 py-3.5 text-center tabular-nums">{t.keluarga}</td>
                <td className="px-3 py-3.5 text-center tabular-nums">{t.individu}</td>
                <td className="px-3 py-3.5 text-center tabular-nums">{t.laki}</td>
                <td className="px-3 py-3.5 text-center tabular-nums">{t.perempuan}</td>
                <td className="px-3 py-3.5 text-center tabular-nums">{t.balita}</td>
                <td className="px-3 py-3.5 text-center tabular-nums">{t.wus}</td>
                <td className="px-3 py-3.5 text-center tabular-nums">{t.pus}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-4 overflow-hidden">
        <CardHeader
          title="Distribusi Kategori Usia Baru per Jenis Kelamin"
          desc="Balita 0-5 · Anak 6-9 · Remaja 10-24 · Dewasa 25-59 · Lansia 60+"
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[11px] uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3 font-bold">Kategori Usia Baru</th>
                <th className="px-3 py-3 text-center font-bold">Laki-laki</th>
                <th className="px-3 py-3 text-center font-bold">Perempuan</th>
                <th className="px-3 py-3 text-center font-bold">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stats.distribusiKategoriBaru.map((d) => (
                <tr key={d.label} className="transition-colors hover:bg-emerald-50/30">
                  <td className="px-5 py-3.5 font-semibold text-slate-800">
                    {d.label} · {d.nama}
                  </td>
                  <td className="px-3 py-3.5 text-center tabular-nums text-slate-600">{d.L}</td>
                  <td className="px-3 py-3.5 text-center tabular-nums text-slate-600">{d.P}</td>
                  <td className="px-3 py-3.5 text-center font-bold tabular-nums text-slate-900">
                    {d.L + d.P}
                  </td>
                </tr>
              ))}
              <tr className="bg-gradient-to-r from-emerald-50/80 to-teal-50/60 font-extrabold text-slate-900">
                <td className="px-5 py-3.5">TOTAL</td>
                <td className="px-3 py-3.5 text-center tabular-nums">{t.laki}</td>
                <td className="px-3 py-3.5 text-center tabular-nums">{t.perempuan}</td>
                <td className="px-3 py-3.5 text-center tabular-nums">{t.individu}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <div className="print-area bg-white text-slate-900">
        <div className="mb-5 flex items-center gap-4 border-b-4 border-double border-slate-800 pb-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-slate-400 text-emerald-700">
            <Icon name="building" className="h-8 w-8" />
          </div>
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Pemerintah DKI Jakarta · Kecamatan Cilincing
            </p>
            <h1 className="text-xl font-extrabold uppercase leading-tight tracking-tight">
              Data Warga Binaan Dasa Wisma
            </h1>
            <p className="text-sm font-semibold text-slate-600">
              RT 04 / RW 11 — Kelurahan Rorotan, Jakarta Utara
            </p>
          </div>
          <div className="h-16 w-16 shrink-0" />
        </div>

        <div className="mb-6 text-center">
          <h2 className="inline-block border-b-2 border-slate-800 pb-1 text-base font-extrabold uppercase tracking-wider">
            Laporan Ringkasan Statistik
          </h2>
          <p className="mt-1.5 text-xs text-slate-500">ID U11289 · Dicetak: {today}</p>
        </div>

        <table className="mb-2 w-full border-collapse text-center text-sm">
          <tbody>
            <tr>
              {[
                { l: "Total Jiwa", v: t.individu, hi: true },
                { l: "Keluarga (KK)", v: t.keluarga },
                { l: "Bangunan", v: t.bangunan },
                { l: "Kelompok", v: stats.byKelompok.length },
              ].map((b) => (
                <td key={b.l} className="border border-slate-300 px-2 py-3">
                  <p className={`text-2xl font-extrabold tabular-nums ${b.hi ? "text-emerald-700" : ""}`}>{b.v}</p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{b.l}</p>
                </td>
              ))}
            </tr>
            <tr>
              {[
                { l: "Laki-laki", v: t.laki },
                { l: "Perempuan", v: t.perempuan },
                { l: "Balita (0–4 th)", v: t.balita },
                { l: "Lansia (60+ th)", v: t.lansia },
              ].map((b) => (
                <td key={b.l} className="border border-slate-300 px-2 py-3">
                  <p className="text-xl font-extrabold tabular-nums">{b.v}</p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{b.l}</p>
                </td>
              ))}
            </tr>
            <tr>
              {[
                { l: "Ibu Hamil", v: t.ibu_hamil },
                { l: "WUS", v: t.wus },
                { l: "PUS", v: t.pus },
                { l: "Peserta KB Aktif", v: stats.kbAktif ?? 0 },
              ].map((b) => (
                <td key={b.l} className="border border-slate-300 px-2 py-3">
                  <p className="text-xl font-extrabold tabular-nums">{b.v}</p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{b.l}</p>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        {(t.pindah > 0 || t.meninggal > 0) && (
          <p className="mb-6 text-right text-[11px] italic text-slate-500">
            Arsip tidak dihitung di atas: {t.pindah} pindah · {t.meninggal} meninggal
          </p>
        )}

        <h3 className="mb-2 mt-6 text-sm font-extrabold uppercase tracking-wide">A. Rekapitulasi per Kelompok</h3>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-[11px] uppercase tracking-wider text-slate-600">
              <th className="border border-slate-300 px-3 py-2 text-left font-bold">Kelompok</th>
              <th className="border border-slate-300 px-2 py-2 text-center font-bold">Bangunan</th>
              <th className="border border-slate-300 px-2 py-2 text-center font-bold">Keluarga</th>
              <th className="border border-slate-300 px-2 py-2 text-center font-bold">Individu</th>
              <th className="border border-slate-300 px-2 py-2 text-center font-bold">L</th>
              <th className="border border-slate-300 px-2 py-2 text-center font-bold">P</th>
              <th className="border border-slate-300 px-2 py-2 text-center font-bold">Balita</th>
              <th className="border border-slate-300 px-2 py-2 text-center font-bold">WUS</th>
              <th className="border border-slate-300 px-2 py-2 text-center font-bold">PUS</th>
            </tr>
          </thead>
          <tbody>
            {stats.byKelompok.map((k) => (
              <tr key={String(k.id)} className="odd:bg-white even:bg-slate-50/50">
                <td className="border border-slate-300 px-3 py-1.5">
                  <span className="font-semibold">{k.nama}</span>{" "}
                  <span className="font-mono text-[10px] text-slate-400">{k.kode}</span>
                </td>
                <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">{k.bangunan}</td>
                <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">{k.keluarga}</td>
                <td className="border border-slate-300 px-2 py-1.5 text-center font-bold tabular-nums">{k.individu}</td>
                <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">{k.laki}</td>
                <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">{k.perempuan}</td>
                <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">{k.balita}</td>
                <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">{k.wus}</td>
                <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">{k.pus}</td>
              </tr>
            ))}
            <tr className="bg-emerald-50/70 font-extrabold">
              <td className="border border-slate-300 px-3 py-1.5">TOTAL</td>
              <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">{t.bangunan}</td>
              <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">{t.keluarga}</td>
              <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">{t.individu}</td>
              <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">{t.laki}</td>
              <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">{t.perempuan}</td>
              <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">{t.balita}</td>
              <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">{t.wus}</td>
              <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">{t.pus}</td>
            </tr>
          </tbody>
        </table>

        <h3 className="mb-2 mt-6 text-sm font-extrabold uppercase tracking-wide">B. Distribusi Usia per Jenis Kelamin</h3>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-[11px] uppercase tracking-wider text-slate-600">
              <th className="border border-slate-300 px-3 py-2 text-left font-bold">Kategori Usia</th>
              <th className="border border-slate-300 px-2 py-2 text-center font-bold">Laki-laki</th>
              <th className="border border-slate-300 px-2 py-2 text-center font-bold">Perempuan</th>
              <th className="border border-slate-300 px-2 py-2 text-center font-bold">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {KATEGORI_USIA_LIST.map((label) => {
              const d = stats.distribusiUsia.find((x) => x.label === label);
              const L = d?.L ?? 0;
              const P = d?.P ?? 0;
              return (
                <tr key={label} className="odd:bg-white even:bg-slate-50/50">
                  <td className="border border-slate-300 px-3 py-1.5">{label}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">{L}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">{P}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-center font-semibold tabular-nums">{L + P}</td>
                </tr>
              );
            })}
            <tr className="bg-emerald-50/70 font-extrabold">
              <td className="border border-slate-300 px-3 py-1.5">TOTAL</td>
              <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">{t.laki}</td>
              <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">{t.perempuan}</td>
              <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">{t.individu}</td>
            </tr>
          </tbody>
        </table>

        <h3 className="mb-2 mt-6 text-sm font-extrabold uppercase tracking-wide">B-1. Distribusi Kategori Usia Baru per Jenis Kelamin</h3>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-[11px] uppercase tracking-wider text-slate-600">
              <th className="border border-slate-300 px-3 py-2 text-left font-bold">Kategori Usia Baru</th>
              <th className="border border-slate-300 px-2 py-2 text-center font-bold">Laki-laki</th>
              <th className="border border-slate-300 px-2 py-2 text-center font-bold">Perempuan</th>
              <th className="border border-slate-300 px-2 py-2 text-center font-bold">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {stats.distribusiKategoriBaru.map((d) => (
              <tr key={d.label} className="odd:bg-white even:bg-slate-50/50">
                <td className="border border-slate-300 px-3 py-1.5">
                  {d.label} · {d.nama}
                </td>
                <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">{d.L}</td>
                <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">{d.P}</td>
                <td className="border border-slate-300 px-2 py-1.5 text-center font-semibold tabular-nums">
                  {d.L + d.P}
                </td>
              </tr>
            ))}
            <tr className="bg-emerald-50/70 font-extrabold">
              <td className="border border-slate-300 px-3 py-1.5">TOTAL</td>
              <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">{t.laki}</td>
              <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">{t.perempuan}</td>
              <td className="border border-slate-300 px-2 py-1.5 text-center tabular-nums">{t.individu}</td>
            </tr>
          </tbody>
        </table>

        <h3 className="mb-2 mt-6 text-sm font-extrabold uppercase tracking-wide">C. Daftar Warga (untuk pemeriksaan)</h3>
        {(() => {
          const aktif = (warga || []).filter((w) => w.status_warga === "aktif");
          return stats.byKelompok.map((k) => {
            const rows = aktif
              .filter((w) => w.kelompok_nama === k.nama)
              .sort(
                (a, b) =>
                  a.bangunan_nama.localeCompare(b.bangunan_nama) ||
                  a.keluarga_nama.localeCompare(b.keluarga_nama) ||
                  a.nama.localeCompare(b.nama)
              );
            const l = rows.filter((w) => w.jenis_kelamin === "L").length;
            const p = rows.length - l;
            return (
              <div key={String(k.id)} className="kelompok-block mb-5">
                <p className="mb-1.5 bg-slate-800 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-white">
                  {k.nama} — {rows.length} jiwa
                </p>
                <table className="w-full border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-600">
                      <th className="border border-slate-300 px-1.5 py-1.5 text-center font-bold w-8">No</th>
                      <th className="border border-slate-300 px-2 py-1.5 text-left font-bold">Nama</th>
                      <th className="border border-slate-300 px-1.5 py-1.5 text-center font-bold w-9">L/P</th>
                      <th className="border border-slate-300 px-1.5 py-1.5 text-center font-bold w-10">Usia</th>
                      <th className="border border-slate-300 px-2 py-1.5 text-left font-bold">Hubungan</th>
                      <th className="border border-slate-300 px-2 py-1.5 text-left font-bold">KRT</th>
                      <th className="border border-slate-300 px-2 py-1.5 text-left font-bold">Bangunan</th>
                      <th className="border border-slate-300 px-1.5 py-1.5 text-center font-bold w-14">Paraf</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((w, i) => (
                      <tr key={w.id} className="odd:bg-white even:bg-slate-50/50">
                        <td className="border border-slate-300 px-1.5 py-1 text-center tabular-nums">{i + 1}</td>
                        <td className="border border-slate-300 px-2 py-1 font-medium">
                          {w.nama}
                          {w.is_hamil && <span className="ml-1 text-[9px] font-bold uppercase text-rose-600">• Hamil</span>}
                        </td>
                        <td className="border border-slate-300 px-1.5 py-1 text-center">{w.jenis_kelamin || "-"}</td>
                        <td className="border border-slate-300 px-1.5 py-1 text-center tabular-nums">{w.usia ?? "-"}</td>
                        <td className="border border-slate-300 px-2 py-1">{w.hubungan || "-"}</td>
                        <td className="border border-slate-300 px-2 py-1">{w.keluarga_nama}</td>
                        <td className="border border-slate-300 px-2 py-1">{w.bangunan_nama}</td>
                        <td className="border border-slate-300 px-1.5 py-1"></td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-50/70 font-bold">
                      <td colSpan={1} className="border border-slate-300 px-1.5 py-1 text-center">Σ</td>
                      <td className="border border-slate-300 px-2 py-1">Subtotal: {rows.length} jiwa</td>
                      <td className="border border-slate-300 px-1.5 py-1 text-center">L: {l}</td>
                      <td className="border border-slate-300 px-1.5 py-1 text-center">P: {p}</td>
                      <td colSpan={4} className="border border-slate-300 px-2 py-1"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          });
        })()}

        <div className="mt-12 flex justify-end">
          <div className="text-center text-sm">
            <p className="text-slate-600">Jakarta Utara, {today}</p>
            <p className="font-semibold text-slate-700">Ketua Dasa Wisma</p>
            <div className="h-20" />
            <p className="font-semibold underline">( ................................ )</p>
          </div>
        </div>
      </div>

      <Modal
        open={!!detail}
        onClose={closeDetail}
        title={meta ? `${meta.title} (${detailRows.length})` : ""}
        wide
      >
        {meta?.desc && <p className="text-xs text-slate-400">{meta.desc}</p>}
        <input
          className={`${inputCls} mb-3`}
          placeholder="Cari dalam daftar..."
          value={dq}
          onChange={(e) => setDq(e.target.value)}
        />
        {dErr ? (
          <ErrorState message={dErr} onRetry={retryDetail} />
        ) : dLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : detailRows.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">Tidak ada data.</p>
        ) : (
          <div className="max-h-[55vh] space-y-1.5 overflow-y-auto pr-1">
            {(detail === "bangunan"
              ? (detailRows as Array<any>).map((b) => (
                  <div key={b.id} className="flex items-center gap-3 rounded-xl bg-slate-50/80 px-3 py-2.5 ring-1 ring-inset ring-transparent transition-all hover:bg-white hover:ring-slate-200">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <Icon name="building" className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-800">
                        {b.nama}
                        {b.tipe === "kontrakan" && <Badge color="amber">Kontrakan</Badge>}
                        {b.tipe === "lainnya" && <Badge>Lainnya</Badge>}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {b.kelompok}
                        {b.keterangan ? ` · ${b.keterangan}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right text-xs text-slate-500">
                      <p><span className="font-bold tabular-nums text-slate-700">{b.jmlKeluarga}</span> keluarga</p>
                      <p><span className="font-bold tabular-nums text-slate-700">{b.jiwa}</span> jiwa</p>
                    </div>
                  </div>
                ))
              : detail === "keluarga"
                ? (detailRows as Array<any>).map((f) => (
                    <div key={f.id} className="flex items-center gap-3 rounded-xl bg-slate-50/80 px-3 py-2.5 ring-1 ring-inset ring-transparent transition-all hover:bg-white hover:ring-slate-200">
                      <Avatar name={f.nama} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {f.nama}
                          {f.catatan && <span className="ml-1.5 text-xs font-normal text-slate-400">({f.catatan})</span>}
                        </p>
                        <p className="truncate text-xs text-slate-400">{f.bangunan} — {f.kelompok}</p>
                      </div>
                      <span className="shrink-0 text-xs text-slate-500">
                        <span className="font-bold tabular-nums text-slate-700">{f.anggota}</span> anggota
                      </span>
                    </div>
                  ))
                : (detailRows as WargaRow[]).map((w) => (
                    <div key={w.id} className="flex items-center gap-3 rounded-xl bg-slate-50/80 px-3 py-2.5 ring-1 ring-inset ring-transparent transition-all hover:bg-white hover:ring-slate-200">
                      <Avatar name={w.nama} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">{w.nama}</p>
                        <p className="truncate text-xs text-slate-400">
                          {w.hubungan || "-"} · {w.bangunan_nama} — {w.kelompok_nama}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {detail === "lp" && (
                          <Badge color={w.jenis_kelamin === "L" ? "blue" : "pink"}>
                            {w.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}
                          </Badge>
                        )}
                        {detail === "hamil" && w.hpl_kehamilan && (
                          <span className="hidden text-[11px] font-medium text-slate-400 sm:inline">
                            HPL {formatTanggal(w.hpl_kehamilan)}
                          </span>
                        )}
                        {detail === "hamil" && (
                          <Badge color={w.risiko_kehamilan === "tinggi" ? "red" : "green"} dot>
                            {w.risiko_kehamilan === "tinggi" ? "Risiko Tinggi" : "Normal"}
                          </Badge>
                        )}
                        {detail !== "lp" && detail !== "individu" && detail !== "hamil" && w.wus && <Badge color="pink" dot>WUS</Badge>}
                        {detail !== "lp" && detail !== "individu" && detail !== "hamil" && w.pus && <Badge color="rose" dot>PUS</Badge>}
                        <span className="w-10 text-right text-sm font-bold tabular-nums text-slate-700">
                          {w.usia ?? "-"}{" "}
                          <span className="text-[10px] font-medium text-slate-400">th</span>
                        </span>
                      </div>
                    </div>
                  )))}
          </div>
        )}
      </Modal>

      <style jsx global>{`
        .print-area {
          display: none;
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          body * {
            visibility: hidden;
          }
          .print-area {
            display: block !important;
            position: absolute;
            inset: 0;
            background: white;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area tr {
            page-break-inside: avoid;
          }
          .kelompok-block p {
            break-after: avoid;
          }
        }
      `}</style>
    </>
  );
}
