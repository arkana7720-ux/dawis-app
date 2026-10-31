"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Badge,
  Btn,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Icon,
  IconBtn,
  inputCls,
  Modal,
  PageHeader,
  Skeleton,
  Spinner,
  Toast,
} from "@/components/ui";
import {
  KeluargaPicker,
  type PickerKelompok,
} from "@/components/KeluargaPicker";
import {
  WargaFields,
  emptyWargaValues,
} from "@/components/WargaFields";
import { TambahWargaWizard } from "@/components/TambahWargaWizard";
import {
  KATEGORI_USIA_BARU_LIST,
  PENDIDIKAN_LIST,
  formatTanggal,
  labelKategoriUsiaBaru,
  labelPendidikan,
  validasiWarga,
} from "@/lib/calc";
import { fetchApi, invalidateApi } from "@/lib/clientApi";
import {
  DEFAULT_WA_TEMPLATE,
  WA_PLACEHOLDERS,
  renderWaTemplate,
  waHref,
} from "@/lib/wa";

interface WargaRow {
  id: number;
  keluarga_id: number;
  nama: string;
  hubungan: string;
  jenis_kelamin: string;
  tanggal_lahir: string;
  bpjs: string;
  status_kb: string;
  catatan: string;
  status_warga: string;
  tgl_status_berubah: string;
  catatan_status: string;
  is_hamil: boolean;
  hpl_kehamilan: string;
  risiko_kehamilan: string;
  keluarga_nama: string;
  bangunan_nama: string;
  kelompok_nama: string;
  usia: number | null;
  kategori_usia: string;
  kategori: string;
  kategori_usia_baru: string;
  pendidikan: string;
  wus: boolean;
  pus: boolean;
}

type StrukturNode = PickerKelompok;

const emptyForm = {
  id: 0,
  keluarga_id: "",
  ...emptyWargaValues,
};

const CHIPS = [
  { label: "Semua", jk: "", kat: "" },
  { label: "Laki-laki", jk: "L", kat: "" },
  { label: "Perempuan", jk: "P", kat: "" },
  { label: "Balita", jk: "", kat: "Balita" },
  { label: "Anak", jk: "", kat: "Anak" },
  { label: "Lansia", jk: "", kat: "Lansia" },
];

function GenderAvatar({ w, size = "md" }: { w: WargaRow; size?: "md" | "lg" }) {
  const male = w.jenis_kelamin === "L";
  const female = w.jenis_kelamin === "P";
  const grad = male
    ? "from-blue-400 to-indigo-500"
    : female
      ? "from-rose-400 to-pink-500"
      : "from-slate-300 to-slate-400";
  const dot = male ? "bg-blue-500" : female ? "bg-pink-500" : "bg-slate-400";
  const initials = w.nama
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();
  const sz = size === "lg" ? "h-14 w-14 text-lg" : "h-9 w-9 text-[11px]";
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${grad} ${sz} font-bold text-white shadow-sm`}
    >
      {initials || "?"}
      <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-white ${dot}`} />
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl bg-white/70 px-3 py-2 ring-1 ring-white/70">
      <span className="shrink-0 text-xs font-semibold text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-700">{value}</span>
    </div>
  );
}

export default function WargaPage() {
  const [rows, setRows] = useState<WargaRow[] | null>(null);
  const [struktur, setStruktur] = useState<StrukturNode[]>([]);
  const [loadErr, setLoadErr] = useState("");
  const [q, setQ] = useState("");
  const [fKel, setFKel] = useState("");
  const [fKat, setFKat] = useState("");
  const [fKatBaru, setFKatBaru] = useState("");
  const [fPend, setFPend] = useState("");
  const [fJk, setFJk] = useState("");
  const [fWus, setFWus] = useState("");
  const [fStatus, setFStatus] = useState<"aktif" | "arsip">("aktif");
  const [advOpen, setAdvOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [detailRow, setDetailRow] = useState<WargaRow | null>(null);
  const [statusModal, setStatusModal] = useState<{ open: boolean; w: WargaRow | null }>({ open: false, w: null });
  const [stForm, setStForm] = useState({ status: "pindah", tanggal: "", catatan: "" });
  const [savingStatus, setSavingStatus] = useState(false);
  const [stErr, setStErr] = useState("");
  const [menuFor, setMenuFor] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dupWarn, setDupWarn] = useState("");
  const [toast, setToast] = useState<{ msg: string; showReset?: boolean } | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [lastKeluargaId, setLastKeluargaId] = useState<number | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [strukturLoaded, setStrukturLoaded] = useState(false);
  const [waTpl, setWaTpl] = useState(DEFAULT_WA_TEMPLATE);
  const [waModal, setWaModal] = useState<{ open: boolean; w: WargaRow | null }>({
    open: false,
    w: null,
  });
  const [waText, setWaText] = useState("");
  const [waTplOpen, setWaTplOpen] = useState(false);
  const [waTplDraft, setWaTplDraft] = useState("");
  const [waSaving, setWaSaving] = useState(false);
  const [waMsg, setWaMsg] = useState("");
  const [waErr, setWaErr] = useState("");
  const waTplRef = useRef<HTMLTextAreaElement>(null);

  const load = () => {
    setLoadErr("");
    fetchApi<WargaRow[]>("/api/warga")
      .then(setRows)
      .catch((e) => setLoadErr(e.message));
  };

  const loadStruktur = () =>
    fetchApi<StrukturNode[]>("/api/bangunan")
      .then(setStruktur)
      .catch(() => {})
      .finally(() => setStrukturLoaded(true));

  useEffect(() => {
    load();
    loadStruktur();
  }, []);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const tpl = j?.user?.wa_template;
        if (typeof tpl === "string" && tpl.trim()) setWaTpl(tpl);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const counts = useMemo(() => {
    if (!rows) return { aktif: 0, arsip: 0 };
    return {
      aktif: rows.filter((w) => w.status_warga === "aktif").length,
      arsip: rows.filter((w) => w.status_warga !== "aktif").length,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    let base =
      fStatus === "aktif"
        ? rows.filter((w) => w.status_warga === "aktif")
        : rows.filter((w) => w.status_warga !== "aktif");
    const term = q.toLowerCase().trim();
    return base.filter((w) => {
      if (term) {
        const hay = `${w.nama} ${w.keluarga_nama} ${w.bangunan_nama} ${w.kelompok_nama}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (fKel && w.kelompok_nama !== fKel) return false;
      if (fKat && w.kategori !== fKat) return false;
      if (fKatBaru && w.kategori_usia_baru !== fKatBaru) return false;
      if (fPend && w.pendidikan !== fPend) return false;
      if (fJk && w.jenis_kelamin !== fJk) return false;
      if (fWus === "wus" && !w.wus) return false;
      if (fWus === "pus" && !w.pus) return false;
      return true;
    });
  }, [rows, q, fKel, fKat, fKatBaru, fPend, fJk, fWus, fStatus]);

  const flatKeluarga = useMemo(
    () =>
      struktur.flatMap((k) =>
        k.bangunan.flatMap((b) =>
          b.keluarga.map((f) => ({
            ...f,
            bangunan: b.nama,
            kelompok: k.nama,
          }))
        )
      ),
    [struktur]
  );

  const hasKeluarga = flatKeluarga.length > 0;

  const keluargaKosong = (id: string) => {
    const f = flatKeluarga.find((x) => String(x.id) === id);
    return !!f && (f.anggota?.length ?? 0) === 0;
  };

  const openAdd = () => {
    if (!strukturLoaded) {
      setToast({ msg: "Sedang memuat data keluarga. Coba lagi sebentar." });
      return;
    }
    setForm(emptyForm);
    setErr("");
    setErrors({});
    setDupWarn("");
    setFormKey((k) => k + 1);
    if (!hasKeluarga) {
      setWizardOpen(true);
      return;
    }
    const fid =
      lastKeluargaId && flatKeluarga.some((f) => f.id === lastKeluargaId)
        ? String(lastKeluargaId)
        : "";
    setForm({
      ...emptyForm,
      keluarga_id: fid,
      hubungan: fid && keluargaKosong(fid) ? "KRT" : "",
    });
    setModalOpen(true);
  };

  const openEdit = (w: WargaRow) => {
    setForm({
      id: w.id,
      keluarga_id: String(w.keluarga_id),
      nama: w.nama,
      hubungan: w.hubungan,
      jenis_kelamin: w.jenis_kelamin,
      tanggal_lahir: w.tanggal_lahir,
      bpjs: w.bpjs,
      status_kb: w.status_kb,
      catatan: w.catatan || "",
      is_hamil: w.is_hamil,
      hpl_kehamilan: w.hpl_kehamilan || "",
      risiko_kehamilan: w.risiko_kehamilan || "normal",
    });
    setErr("");
    setErrors({});
    setDupWarn("");
    setFormKey((k) => k + 1);
    setModalOpen(true);
  };

  const pilihKeluarga = (id: string) => {
    setForm((f) => ({
      ...f,
      keluarga_id: id,
      hubungan: f.hubungan || (keluargaKosong(id) ? "KRT" : ""),
    }));
    setErrors((e) => {
      const next = { ...e };
      delete next.keluarga_id;
      return next;
    });
  };

  const save = async (andAnother = false, force = false) => {
    const next = validasiWarga(form);
    if (!form.keluarga_id) next.keluarga_id = "Pilih keluarga dulu.";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      setErr("Periksa kembali kolom yang ditandai merah.");
      return;
    }
    setErr("");

    if (!form.id && !force) {
      const dup = rows?.find(
        (r) =>
          r.keluarga_id === Number(form.keluarga_id) &&
          r.nama.trim().toLowerCase() === form.nama.trim().toLowerCase()
      );
      if (dup) {
        setDupWarn(
          `"${form.nama.trim()}" sudah terdaftar di keluarga ini. Periksa dulu apakah ini orang yang sama.`
        );
        return;
      }
    }
    setDupWarn("");

    setSaving(true);
    const res = await fetch(form.id ? `/api/warga/${form.id}` : "/api/warga", {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, keluarga_id: Number(form.keluarga_id) }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      if (j.fields) setErrors(j.fields);
      return setErr(j.error || "Gagal menyimpan");
    }

    invalidateApi();
    setLastKeluargaId(Number(form.keluarga_id));
    const hidden = Boolean(hasFilter) || fStatus === "arsip";
    setToast({ msg: `Data ${form.nama.trim()} berhasil disimpan.`, showReset: hidden });

    if (andAnother && !form.id) {
      setForm({
        ...emptyForm,
        keluarga_id: form.keluarga_id,
        hubungan: keluargaKosong(form.keluarga_id) ? "KRT" : "",
      });
      setErrors({});
      setDupWarn("");
      setErr("");
      setFormKey((k) => k + 1);
      load();
      setTimeout(() => document.getElementById("warga-nama")?.focus(), 80);
    } else {
      setModalOpen(false);
      load();
    }
  };

  const hapus = async (w: WargaRow) => {
    if (!confirm(`Hapus permanen data "${w.nama}"?`)) return;
    await fetch(`/api/warga/${w.id}`, { method: "DELETE" });
    invalidateApi();
    setMenuFor(null);
    setDetailRow(null);
    load();
  };

  const openStatus = (w: WargaRow) => {
    setStatusModal({ open: true, w });
    setStForm({
      status: w.status_warga === "aktif" ? "pindah" : "aktif",
      tanggal: "",
      catatan: "",
    });
    setStErr("");
    setMenuFor(null);
  };

  const saveStatus = async () => {
    if (!statusModal.w) return;
    if (stForm.status !== "aktif" && !stForm.tanggal)
      return setStErr("Tanggal wajib diisi");
    setSavingStatus(true);
    const res = await fetch(`/api/warga/${statusModal.w.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status_warga: stForm.status,
        tgl_status_berubah: stForm.tanggal,
        catatan_status: stForm.catatan,
      }),
    });
    setSavingStatus(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      return setStErr(j.error || "Gagal menyimpan status");
    }
    setStatusModal({ open: false, w: null });
    invalidateApi();
    setDetailRow(null);
    load();
  };

  const dataWa = (w: WargaRow) => ({
    nama: w.nama,
    hubungan: w.hubungan,
    alamat: w.bangunan_nama,
    kelompok: w.kelompok_nama,
    keluarga: w.keluarga_nama,
    usia: w.usia,
  });

  const pesanWa = (w: WargaRow, tpl = waTpl) => renderWaTemplate(tpl, dataWa(w));

  const bukaWa = (w: WargaRow) => {
    setWaModal({ open: true, w });
    setWaText(pesanWa(w));
    setWaTplDraft(waTpl);
    setWaTplOpen(false);
    setWaMsg("");
    setWaErr("");
  };

  const sisipToken = (token: string) => {
    const el = waTplRef.current;
    const mulai = el?.selectionStart ?? waTplDraft.length;
    const akhir = el?.selectionEnd ?? waTplDraft.length;
    const baru = waTplDraft.slice(0, mulai) + token + waTplDraft.slice(akhir);
    setWaTplDraft(baru);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(mulai + token.length, mulai + token.length);
    });
  };

  const simpanTemplate = async () => {
    if (!waModal.w) return;
    setWaSaving(true);
    setWaMsg("");
    setWaErr("");
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wa_template: waTplDraft }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Gagal menyimpan template");
      const tplBaru = typeof j.wa_template === "string" && j.wa_template.trim()
        ? j.wa_template
        : DEFAULT_WA_TEMPLATE;
      if (waText === pesanWa(waModal.w)) setWaText(pesanWa(waModal.w, tplBaru));
      setWaTpl(tplBaru);
      setWaMsg("Template default tersimpan di akun Anda.");
    } catch (e) {
      setWaErr(e instanceof Error ? e.message : String(e));
    } finally {
      setWaSaving(false);
    }
  };

  const katColor = (k: string) =>
    k === "Balita"
      ? "amber"
      : k === "Anak"
        ? "green"
        : k === "Remaja"
          ? "blue"
          : k === "Dewasa"
            ? "indigo"
            : "purple";

  const katBaruColor = (k: string) =>
    k === "0-5"
      ? "slate"
      : k === "6-9"
        ? "orange"
        : k === "10-24"
          ? "rose"
          : k === "25-59"
            ? "pink"
            : "red";

  const pendColor = (k: string) =>
    k === "0-3"
      ? "slate"
      : k === "4-6"
        ? "green"
        : k === "7-12"
          ? "blue"
          : k === "13-15"
            ? "amber"
            : k === "16-18"
              ? "indigo"
              : k === "19-22"
                ? "purple"
                : "orange";

  const hubunganColor = (h: string) => {
    const s = (h || "").toLowerCase();
    if (s.includes("krt")) return "green";
    if (s.includes("istri") || s.includes("suami")) return "blue";
    return "slate";
  };

  const resetFilter = () => {
    setQ("");
    setFKel("");
    setFKat("");
    setFKatBaru("");
    setFPend("");
    setFJk("");
    setFWus("");
  };

  const hasFilter = q || fKel || fKat || fKatBaru || fPend || fJk || fWus;

  if (loadErr) return <ErrorState message={loadErr} onRetry={load} />;

  if (!rows)
    return (
      <>
        <div className="mb-6 flex items-end justify-between">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-[72px]" />
        <Skeleton className="mt-4 h-[520px]" />
      </>
    );

  return (
    <>
      <PageHeader
        title="Data Warga"
        subtitle={
          fStatus === "aktif"
            ? `${filtered.length} dari ${counts.aktif} warga aktif ditampilkan`
            : `${filtered.length} dari ${counts.arsip} warga arsip ditampilkan`
        }
        actions={
          <Btn onClick={openAdd}>
            <Icon name="plus" className="h-4 w-4" />
            Tambah Warga
          </Btn>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex gap-1 rounded-2xl border border-white/70 bg-white/50 p-1.5 shadow-sm shadow-slate-900/5 backdrop-blur-md">
          <button
            onClick={() => setFStatus("aktif")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all sm:text-sm ${
              fStatus === "aktif"
                ? "bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-200/80"
                : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
            }`}
          >
            Warga Aktif
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums ${
                fStatus === "aktif"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-white/70 text-slate-500 ring-1 ring-slate-200/60"
              }`}
            >
              {counts.aktif}
            </span>
          </button>
          <button
            onClick={() => setFStatus("arsip")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all sm:text-sm ${
              fStatus === "arsip"
                ? "bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-200/80"
                : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
            }`}
          >
            Arsip
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums ${
                fStatus === "arsip"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-white/70 text-slate-500 ring-1 ring-slate-200/60"
              }`}
            >
              {counts.arsip}
            </span>
          </button>
        </div>
        {fStatus === "arsip" && (
          <p className="text-xs text-slate-500">
            Berisi warga pindah / meninggal — tidak dihitung di dashboard.
          </p>
        )}
      </div>

      <Card className="mb-4 p-3 sm:p-4">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-2.5 md:flex-row md:items-center">
            <div className="relative md:flex-1">
              <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchRef}
                className={`${inputCls} pl-10 pr-16`}
                placeholder="Cari nama, keluarga, atau bangunan..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded-md bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-white/80 sm:flex">
                Ctrl K
              </kbd>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <button
                onClick={() => setAdvOpen(!advOpen)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold ring-1 backdrop-blur-md transition-all ${
                  advOpen || hasFilter
                    ? "bg-emerald-50/90 text-emerald-700 ring-emerald-200"
                    : "bg-white/70 text-slate-600 ring-slate-200/80 hover:bg-white/90 hover:text-slate-900"
                }`}
              >
                <Icon name="filter" className="h-3.5 w-3.5" />
                Filter
                {hasFilter && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                <Icon name="chevronDown" className={`ml-0.5 h-3.5 w-3.5 transition-transform ${advOpen ? "rotate-180" : ""}`} />
              </button>
              {hasFilter && (
                <button
                  onClick={resetFilter}
                  className="text-xs font-semibold text-slate-400 transition-colors hover:text-red-500"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          {advOpen && (
            <div className="hidden flex-wrap gap-2 md:flex">
              <select className={`${inputCls} w-44`} value={fKel} onChange={(e) => setFKel(e.target.value)}>
                <option value="">Semua Kelompok</option>
                {struktur.map((k) => (
                  <option key={k.id} value={k.nama}>{k.nama}</option>
                ))}
              </select>
              <select className={`${inputCls} w-36`} value={fKat} onChange={(e) => setFKat(e.target.value)}>
                <option value="">Kategori</option>
                {["Balita", "Anak", "Remaja", "Dewasa", "Lansia"].map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
              <select className={`${inputCls} w-40`} value={fKatBaru} onChange={(e) => setFKatBaru(e.target.value)}>
                <option value="">Kategori Baru</option>
                {KATEGORI_USIA_BARU_LIST.map((k) => (
                  <option key={k.range} value={k.range}>
                    {k.range}
                  </option>
                ))}
              </select>
              <select className={`${inputCls} w-36`} value={fPend} onChange={(e) => setFPend(e.target.value)}>
                <option value="">Pendidikan</option>
                {PENDIDIKAN_LIST.map((k) => (
                  <option key={k.range} value={k.range}>
                    {k.range}
                  </option>
                ))}
              </select>
              <select className={`${inputCls} w-32`} value={fJk} onChange={(e) => setFJk(e.target.value)}>
                <option value="">L & P</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
              <select className={`${inputCls} w-32`} value={fWus} onChange={(e) => setFWus(e.target.value)}>
                <option value="">Status</option>
                <option value="wus">WUS saja</option>
                <option value="pus">PUS saja</option>
              </select>
            </div>
          )}
        </div>

        <div className="mt-3 md:hidden">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {CHIPS.map((c) => {
              const active = fJk === c.jk && fKat === c.kat;
              return (
                <button
                  key={c.label}
                  onClick={() => {
                    setFJk(c.jk);
                    setFKat(c.kat);
                  }}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    active
                      ? "bg-emerald-700 text-white shadow-sm shadow-emerald-700/25"
                      : "bg-white/70 text-slate-600 ring-1 ring-white/70 hover:bg-white"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setAdvOpen(!advOpen)}
            className={`mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold ring-1 backdrop-blur-md transition-all ${
              advOpen
                ? "bg-emerald-50/90 text-emerald-700 ring-emerald-200"
                : "bg-white/70 text-slate-600 ring-slate-200/80 hover:bg-white/90"
            }`}
          >
            <Icon name="filter" className="h-3.5 w-3.5" />
            Filter Lanjutan
            {(fKel || fWus) && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
            <Icon name="chevronDown" className={`ml-0.5 h-3.5 w-3.5 transition-transform ${advOpen ? "rotate-180" : ""}`} />
          </button>
          {advOpen && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <select className={inputCls} value={fKel} onChange={(e) => setFKel(e.target.value)}>
                <option value="">Semua Kelompok</option>
                {struktur.map((k) => (
                  <option key={k.id} value={k.nama}>{k.nama}</option>
                ))}
              </select>
              <select className={inputCls} value={fKat} onChange={(e) => setFKat(e.target.value)}>
                <option value="">Semua Kategori</option>
                {["Balita", "Anak", "Remaja", "Dewasa", "Lansia"].map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
              <select className={inputCls} value={fKatBaru} onChange={(e) => setFKatBaru(e.target.value)}>
                <option value="">Semua Kategori Baru</option>
                {KATEGORI_USIA_BARU_LIST.map((k) => (
                  <option key={k.range} value={k.range}>
                    {k.range} · {k.nama}
                  </option>
                ))}
              </select>
              <select className={inputCls} value={fPend} onChange={(e) => setFPend(e.target.value)}>
                <option value="">Semua Pendidikan</option>
                {PENDIDIKAN_LIST.map((k) => (
                  <option key={k.range} value={k.range}>
                    {k.range} · {k.nama}
                  </option>
                ))}
              </select>
              <select className={inputCls} value={fJk} onChange={(e) => setFJk(e.target.value)}>
                <option value="">L & P</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
              <select className={inputCls} value={fWus} onChange={(e) => setFWus(e.target.value)}>
                <option value="">Semua Status</option>
                <option value="wus">WUS saja</option>
                <option value="pus">PUS saja</option>
              </select>
            </div>
          )}
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            message={
              hasFilter
                ? "Tidak ada data yang cocok dengan filter."
                : fStatus === "arsip"
                  ? "Belum ada warga dalam arsip."
                  : !strukturLoaded
                    ? "Memuat data keluarga…"
                    : struktur.length === 0
                      ? "Belum ada data awal. Lengkapi 3 langkah singkat dulu — kelompok, bangunan, dan keluarga — lalu langsung isi warga."
                      : !hasKeluarga
                        ? "Belum ada keluarga. Lengkapi dulu agar warga bisa ditambahkan."
                        : "Belum ada data warga."
            }
            action={
              hasFilter ? (
                <Btn variant="secondary" size="sm" onClick={resetFilter}>
                  Reset Filter
                </Btn>
              ) : fStatus === "arsip" || !strukturLoaded ? undefined : struktur.length === 0 ? (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Btn size="sm" onClick={() => setWizardOpen(true)}>
                    <Icon name="plus" className="h-3.5 w-3.5" />
                    Mulai Isi Data Warga
                  </Btn>
                  <Link href="/struktur">
                    <Btn size="sm" variant="secondary">
                      <Icon name="building" className="h-3.5 w-3.5" />
                      Struktur Wilayah
                    </Btn>
                  </Link>
                </div>
              ) : !hasKeluarga ? (
                <Btn size="sm" onClick={() => setWizardOpen(true)}>
                  <Icon name="plus" className="h-3.5 w-3.5" />
                  Lengkapi Data Keluarga
                </Btn>
              ) : (
                <Btn size="sm" onClick={openAdd}>
                  <Icon name="plus" className="h-3.5 w-3.5" />
                  Tambah Warga Pertama
                </Btn>
              )
            }
          />
        </Card>
      ) : (
        <>
          <Card className="hidden overflow-hidden md:block">
            <div className="max-h-[calc(100vh-330px)] min-h-[240px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-white/70 bg-white/80 backdrop-blur-md">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Warga</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Alamat</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Hubungan</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Usia</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Kategori</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Kategori Baru</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Pendidikan</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">KB</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/60">
                  {filtered.map((w) => (
                    <tr key={w.id} className="group transition-colors hover:bg-emerald-50/60">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <GenderAvatar w={w} />
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-800">{w.nama}</p>
                            <p className="text-xs text-slate-500">
                              {w.jenis_kelamin === "L" ? "Laki-laki" : w.jenis_kelamin === "P" ? "Perempuan" : "-"} ·{" "}
                              {formatTanggal(w.tanggal_lahir)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        <p className="truncate">{w.bangunan_nama}</p>
                        <p className="truncate text-[11px] text-slate-500">{w.kelompok_nama}</p>
                      </td>
                      <td className="px-3 py-3">
                        {w.hubungan ? (
                          <Badge color={hubunganColor(w.hubungan) as any}>{w.hubungan}</Badge>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center font-semibold tabular-nums text-slate-700">{w.usia ?? "-"}</td>
                      <td className="px-3 py-3">
                        {w.kategori ? (
                          <Badge color={katColor(w.kategori) as any}>{w.kategori}</Badge>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {w.kategori_usia_baru ? (
                          <Badge color={katBaruColor(w.kategori_usia_baru) as any}>
                            {labelKategoriUsiaBaru(w.usia)}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {w.pendidikan ? (
                          <Badge color={pendColor(w.pendidikan) as any}>
                            {labelPendidikan(w.usia)}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-3 py-3 text-slate-600">{w.status_kb || "-"}</td>
                      <td className="px-3 py-3">
                        {fStatus === "aktif" ? (
                          <div className="flex flex-wrap gap-1">
                            {w.is_hamil && (
                              <Badge color="rose" dot>🤰 Hamil</Badge>
                            )}
                            {w.wus && <Badge color="pink" dot>WUS</Badge>}
                            {w.pus && <Badge color="rose" dot>PUS</Badge>}
                            {!w.is_hamil && !w.wus && !w.pus && <span className="text-slate-300">-</span>}
                          </div>
                        ) : (
                          <div>
                            <Badge color={w.status_warga === "pindah" ? "amber" : "slate"} dot>
                              {w.status_warga === "pindah" ? "Pindah" : "Meninggal"}
                            </Badge>
                            {w.tgl_status_berubah && (
                              <p className="mt-0.5 text-[10px] text-slate-400">{formatTanggal(w.tgl_status_berubah)}</p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-0.5 opacity-60 transition-opacity group-hover:opacity-100">
                          <IconBtn icon="eye" tone="primary" title="Detail Warga" onClick={() => setDetailRow(w)} />
                          <IconBtn icon="edit" title="Edit" onClick={() => openEdit(w)} />
                          <IconBtn icon="swap" title="Ubah Status" onClick={() => openStatus(w)} />
                          <button
                            type="button"
                            onClick={() => bukaWa(w)}
                            title="Chat WhatsApp"
                            className="rounded-lg p-1.5 text-slate-400 transition-all hover:scale-110 hover:bg-emerald-50 hover:text-emerald-600"
                          >
                            <Icon name="wa" className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filtered.map((w) => (
              <Card key={w.id} className="p-4 transition-colors hover:bg-white/75">
                <div className="relative flex items-start gap-3">
                  <GenderAvatar w={w} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-800">{w.nama}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {w.hubungan && <Badge color={hubunganColor(w.hubungan) as any}>{w.hubungan}</Badge>}
                      {w.is_hamil && <Badge color="rose" dot>🤰 Hamil</Badge>}
                      {fStatus === "arsip" && (
                        <Badge color={w.status_warga === "pindah" ? "amber" : "slate"} dot>
                          {w.status_warga === "pindah" ? "Pindah" : "Meninggal"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="relative shrink-0">
                    <IconBtn icon="dots" title="Menu" onClick={() => setMenuFor(menuFor === w.id ? null : w.id)} />
                    {menuFor === w.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                        <div className="absolute right-0 top-9 z-20 w-40 overflow-hidden rounded-xl border border-white/70 bg-white/95 py-1 shadow-xl shadow-slate-900/10 backdrop-blur-md">
                          <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-600 hover:bg-emerald-50/70" onClick={() => { setDetailRow(w); setMenuFor(null); }}>
                            <Icon name="eye" className="h-3.5 w-3.5" /> Detail
                          </button>
                          <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-600 hover:bg-emerald-50/70" onClick={() => { openEdit(w); setMenuFor(null); }}>
                            <Icon name="edit" className="h-3.5 w-3.5" /> Edit Data
                          </button>
                          <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-emerald-700 hover:bg-emerald-50" onClick={() => openStatus(w)}>
                            <Icon name="swap" className="h-3.5 w-3.5" /> Ubah Status
                          </button>
                          <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50" onClick={() => hapus(w)}>
                            <Icon name="trash" className="h-3.5 w-3.5" /> Hapus
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                  <p className="flex items-center gap-1.5">
                    <Icon name="building" className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    {w.bangunan_nama} — {w.kelompok_nama}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Icon name="calendar" className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    {w.usia ?? "?"} tahun · {formatTanggal(w.tanggal_lahir)}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {w.kategori && <Badge color={katColor(w.kategori) as any}>{w.kategori}</Badge>}
                  {w.kategori_usia_baru && (
                    <Badge color={katBaruColor(w.kategori_usia_baru) as any}>
                      {labelKategoriUsiaBaru(w.usia)}
                    </Badge>
                  )}
                  {w.pendidikan && (
                    <Badge color={pendColor(w.pendidikan) as any}>
                      {labelPendidikan(w.usia)}
                    </Badge>
                  )}
                  {fStatus === "aktif" && w.wus && <Badge color="pink" dot>WUS</Badge>}
                  {fStatus === "aktif" && w.pus && <Badge color="rose" dot>PUS</Badge>}
                  {w.status_kb && <Badge color="blue">KB: {w.status_kb}</Badge>}
                </div>

                {fStatus === "arsip" && (
                  <div className="mt-3 rounded-xl bg-white/60 px-3 py-2 text-xs text-slate-600 ring-1 ring-white/70">
                    {w.status_warga === "pindah" ? "Pindah" : "Meninggal"}
                    {w.tgl_status_berubah ? ` · ${formatTanggal(w.tgl_status_berubah)}` : ""}
                    {w.catatan_status ? ` · ${w.catatan_status}` : ""}
                  </div>
                )}

                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/70 pt-3">
                  <Btn size="sm" variant="secondary" onClick={() => setDetailRow(w)}>
                    <Icon name="eye" className="h-3.5 w-3.5" />
                    Detail Warga
                  </Btn>
                  {fStatus === "aktif" ? (
                    <Btn size="sm" className="w-full" onClick={() => bukaWa(w)}>
                      <Icon name="wa" className="h-3.5 w-3.5" />
                      Chat WA
                    </Btn>
                  ) : (
                    <Btn size="sm" onClick={() => openStatus(w)}>
                      <Icon name="refresh" className="h-3.5 w-3.5" />
                      Aktifkan
                    </Btn>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Modal
        open={!!detailRow}
        onClose={() => setDetailRow(null)}
        title="Detail Warga"
      >
        {detailRow && (
          <>
            <div className="flex items-center gap-3">
              <GenderAvatar w={detailRow} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-base font-extrabold text-slate-900">{detailRow.nama}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {detailRow.hubungan && <Badge color={hubunganColor(detailRow.hubungan) as any}>{detailRow.hubungan}</Badge>}
                  {detailRow.kategori && <Badge color={katColor(detailRow.kategori) as any}>{detailRow.kategori}</Badge>}
                  {detailRow.is_hamil && <Badge color="rose" dot>🤰 Hamil</Badge>}
                  {detailRow.status_warga !== "aktif" && (
                    <Badge color={detailRow.status_warga === "pindah" ? "amber" : "slate"} dot>
                      {detailRow.status_warga === "pindah" ? "Pindah" : "Meninggal"}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <InfoRow label="Jenis Kelamin" value={detailRow.jenis_kelamin === "L" ? "Laki-laki" : detailRow.jenis_kelamin === "P" ? "Perempuan" : "-"} />
              <InfoRow label="Tanggal Lahir" value={`${formatTanggal(detailRow.tanggal_lahir)} · ${detailRow.usia ?? "?"} th`} />
              {detailRow.kategori_usia_baru && (
                <InfoRow
                  label="Kategori Usia (Baru)"
                  value={
                    <Badge color={katBaruColor(detailRow.kategori_usia_baru) as any}>
                      {labelKategoriUsiaBaru(detailRow.usia)}
                    </Badge>
                  }
                />
              )}
              {detailRow.pendidikan && (
                <InfoRow
                  label="Pendidikan (Berdasar Usia)"
                  value={
                    <Badge color={pendColor(detailRow.pendidikan) as any}>
                      {labelPendidikan(detailRow.usia)}
                    </Badge>
                  }
                />
              )}
              <InfoRow label="Alamat" value={`${detailRow.bangunan_nama} — ${detailRow.kelompok_nama}`} />
              <InfoRow label="Keluarga (KRT)" value={detailRow.keluarga_nama || "-"} />
              <InfoRow label="No. BPJS" value={detailRow.bpjs || "-"} />
              <InfoRow label="Status KB" value={detailRow.status_kb || "Tidak KB"} />
              {detailRow.is_hamil && (
                <>
                  <InfoRow label="Perkiraan Lahir (HPL)" value={detailRow.hpl_kehamilan ? formatTanggal(detailRow.hpl_kehamilan) : "-"} />
                  <InfoRow
                    label="Risiko Kehamilan"
                    value={
                      <Badge color={detailRow.risiko_kehamilan === "tinggi" ? "red" : "green"} dot>
                        {detailRow.risiko_kehamilan === "tinggi" ? "Risiko Tinggi" : "Normal"}
                      </Badge>
                    }
                  />
                </>
              )}
              {detailRow.status_warga !== "aktif" && (
                <InfoRow
                  label={detailRow.status_warga === "pindah" ? "Tanggal Pindah" : "Tanggal Meninggal"}
                  value={
                    <span>
                      {detailRow.tgl_status_berubah ? formatTanggal(detailRow.tgl_status_berubah) : "-"}
                      {detailRow.catatan_status && (
                        <span className="block text-xs font-normal text-slate-400">{detailRow.catatan_status}</span>
                      )}
                    </span>
                  }
                />
              )}
              {detailRow.catatan && <InfoRow label="Catatan" value={detailRow.catatan} />}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {detailRow.status_warga === "aktif" && (
                <Btn size="sm" className="w-full" onClick={() => bukaWa(detailRow)}>
                  <Icon name="wa" className="h-3.5 w-3.5" />
                  WA
                </Btn>
              )}
              <Btn size="sm" variant="secondary" onClick={() => { openEdit(detailRow); setDetailRow(null); }}>
                <Icon name="edit" className="h-3.5 w-3.5" />
                Edit
              </Btn>
              <Btn size="sm" variant="secondary" onClick={() => openStatus(detailRow)}>
                <Icon name="swap" className="h-3.5 w-3.5" />
                Status
              </Btn>
              <Btn size="sm" variant="danger" onClick={() => hapus(detailRow)}>
                <Icon name="trash" className="h-3.5 w-3.5" />
                Hapus
              </Btn>
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={statusModal.open && !!statusModal.w}
        onClose={() => setStatusModal({ open: false, w: null })}
        title="Ubah Status Warga"
      >
        {statusModal.w && (
          <>
            <div className="flex items-center gap-3 rounded-xl bg-white/70 p-3 ring-1 ring-white/70">
              <GenderAvatar w={statusModal.w} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-800">{statusModal.w.nama}</p>
                <p className="truncate text-xs text-slate-500">
                  {statusModal.w.hubungan || "-"} · {statusModal.w.bangunan_nama}
                </p>
              </div>
            </div>
            <Field label="Status Baru" required>
              <select
                className={inputCls}
                value={stForm.status}
                onChange={(e) => setStForm({ ...stForm, status: e.target.value })}
              >
                <option value="aktif">Aktif (batalkan arsip)</option>
                <option value="pindah">Pindah / Keluar</option>
                <option value="meninggal">Meninggal</option>
              </select>
            </Field>
            {stForm.status === "pindah" && (
              <>
                <Field label="Tanggal Pindah" required>
                  <input
                    type="date"
                    className={inputCls}
                    value={stForm.tanggal}
                    onChange={(e) => setStForm({ ...stForm, tanggal: e.target.value })}
                  />
                </Field>
                <Field label="Alamat Tujuan">
                  <input
                    className={inputCls}
                    placeholder="cth: Pindah ke Bekasi"
                    value={stForm.catatan}
                    onChange={(e) => setStForm({ ...stForm, catatan: e.target.value })}
                  />
                </Field>
              </>
            )}
            {stForm.status === "meninggal" && (
              <>
                <Field label="Tanggal Meninggal" required>
                  <input
                    type="date"
                    className={inputCls}
                    value={stForm.tanggal}
                    onChange={(e) => setStForm({ ...stForm, tanggal: e.target.value })}
                  />
                </Field>
                <Field label="Catatan">
                  <textarea
                    className={inputCls}
                    rows={2}
                    placeholder="cth: Sakit usia lanjut"
                    value={stForm.catatan}
                    onChange={(e) => setStForm({ ...stForm, catatan: e.target.value })}
                  />
                </Field>
              </>
            )}
            {stForm.status === "aktif" && (
              <p className="rounded-xl bg-emerald-50 px-3 py-2.5 text-xs leading-relaxed text-emerald-700">
                Warga akan ditampilkan kembali sebagai warga aktif dan otomatis dihitung di dashboard.
              </p>
            )}
            {stErr && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{stErr}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Btn variant="secondary" onClick={() => setStatusModal({ open: false, w: null })}>
                Batal
              </Btn>
              <Btn onClick={saveStatus} disabled={savingStatus}>
                {savingStatus && <Spinner className="h-3.5 w-3.5" />}
                {savingStatus ? "Menyimpan..." : "Simpan Status"}
              </Btn>
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? "Edit Data Warga" : "Tambah Warga"}
        wide
      >
        {err && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{err}</p>
        )}

        <KeluargaPicker
          struktur={struktur}
          value={form.keluarga_id}
          onChange={pilihKeluarga}
          onCreated={(id) => {
            invalidateApi();
            loadStruktur();
            setForm((f) => ({
              ...f,
              keluarga_id: String(id),
              hubungan: f.hubungan || "KRT",
            }));
            setErrors((e) => {
              const n = { ...e };
              delete n.keluarga_id;
              return n;
            });
          }}
          error={errors.keluarga_id}
          lastUsedId={lastKeluargaId}
        />

        <WargaFields
          key={`${form.id}-${formKey}`}
          value={form}
          onChange={(v) => {
            const berubah = (["nama", "jenis_kelamin", "tanggal_lahir"] as const).filter(
              (k) => v[k] !== form[k]
            );
            setForm((f) => ({ ...f, ...v }));
            if (berubah.length > 0) {
              setErrors((e) => {
                const nextErrors = { ...e };
                berubah.forEach((k) => delete nextErrors[k]);
                return nextErrors;
              });
              setErr("");
            }
          }}
          errors={errors}
        />

        {dupWarn && (
          <div className="rounded-xl bg-amber-50 px-3.5 py-3 ring-1 ring-inset ring-amber-200">
            <p className="text-xs font-medium leading-relaxed text-amber-800">{dupWarn}</p>
            <div className="mt-2 flex gap-2">
              <Btn size="sm" onClick={() => save(false, true)} disabled={saving}>
                Tetap Simpan
              </Btn>
              <Btn size="sm" variant="secondary" onClick={() => setDupWarn("")}>
                Batal
              </Btn>
            </div>
          </div>
        )}

        <p className="text-[11px] leading-relaxed text-slate-400">
          Usia, kategori usia, kategori usia baru (0-5/6-9/10-24/25-59/60+), pendidikan
          (0-3/4-6/7-12/13-15/16-18/19-22/23+), dan status WUS/PUS dihitung otomatis dari
          tanggal lahir.
        </p>
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Btn variant="secondary" onClick={() => setModalOpen(false)}>
            Batal
          </Btn>
          {!form.id && (
            <Btn variant="secondary" onClick={() => save(true)} disabled={saving}>
              Simpan &amp; Tambah Lagi
            </Btn>
          )}
          <Btn onClick={() => save(false)} disabled={saving}>
            {saving && <Spinner className="h-3.5 w-3.5" />}
            {saving ? "Menyimpan..." : "Simpan"}
          </Btn>
        </div>
      </Modal>

      <Modal
        open={waModal.open}
        onClose={() => setWaModal({ open: false, w: null })}
        title="Kirim WhatsApp"
        wide
      >
        {waModal.w && (
          <>
            <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white/70 p-3 ring-1 ring-white/70">
              <GenderAvatar w={waModal.w} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{waModal.w.nama}</p>
                <p className="truncate text-xs text-slate-500">
                  {waModal.w.bangunan_nama} — {waModal.w.kelompok_nama}
                </p>
              </div>
            </div>

            <Field
              label="Pesan WhatsApp"
              hint="Bisa diubah sebelum dikirim. Perubahan di sini tidak otomatis mengubah template default."
            >
              <textarea
                value={waText}
                onChange={(e) => setWaText(e.target.value)}
                rows={9}
                className={`${inputCls} resize-y font-normal leading-relaxed`}
              />
            </Field>

            <div className="overflow-hidden rounded-xl border border-white/70 bg-white/40">
              <button
                type="button"
                onClick={() => setWaTplOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left transition-colors hover:bg-white/60"
                aria-expanded={waTplOpen}
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600">
                  <Icon name="edit" className="h-3.5 w-3.5 text-emerald-600" />
                  Atur template default
                </span>
                <Icon
                  name="chevronDown"
                  className={`h-4 w-4 text-slate-500 transition-transform ${waTplOpen ? "rotate-180" : ""}`}
                />
              </button>

              {waTplOpen && (
                <div className="space-y-3 border-t border-white/70 px-3.5 py-3">
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    Template disimpan di akun Anda, jadi tetap sama saat dibuka dari HP lain. Klik
                    token untuk menyisipkannya ke posisi kursor.
                  </p>

                  <textarea
                    ref={waTplRef}
                    value={waTplDraft}
                    onChange={(e) => setWaTplDraft(e.target.value)}
                    rows={7}
                    aria-label="Template pesan WhatsApp"
                    className={`${inputCls} resize-y font-mono text-xs leading-relaxed`}
                  />

                  <div className="flex flex-wrap gap-1.5">
                    {WA_PLACEHOLDERS.map((p) => (
                      <button
                        key={p.token}
                        type="button"
                        onClick={() => sisipToken(p.token)}
                        title={p.label}
                        className="rounded-lg bg-emerald-50/90 px-2 py-1 font-mono text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200/80 transition-colors hover:bg-emerald-100"
                      >
                        {p.token}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Btn size="sm" onClick={simpanTemplate} disabled={waSaving}>
                      {waSaving && <Spinner className="h-3.5 w-3.5" />}
                      {waSaving ? "Menyimpan..." : "Simpan template"}
                    </Btn>
                    <Btn
                      size="sm"
                      variant="secondary"
                      onClick={() => setWaTplDraft(DEFAULT_WA_TEMPLATE)}
                      disabled={waSaving}
                    >
                      Pakai bawaan
                    </Btn>
                    <span className="text-[11px] text-slate-400">
                      {waTplDraft.length}/2000
                    </span>
                  </div>

                  {waMsg && (
                    <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50/90 px-3 py-2 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/70">
                      <Icon name="check" className="h-3.5 w-3.5" />
                      {waMsg}
                    </p>
                  )}
                  {waErr && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 ring-1 ring-red-200/70">
                      {waErr}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <Btn variant="secondary" onClick={() => setWaModal({ open: false, w: null })}>
                Tutup
              </Btn>
              <Btn variant="soft" onClick={() => setWaText(pesanWa(waModal.w!))}>
                <Icon name="refresh" className="h-3.5 w-3.5" />
                Isi ulang pesan
              </Btn>
              <a
                href={waHref(waText)}
                target="_blank"
                rel="noreferrer"
                onClick={() => setWaModal({ open: false, w: null })}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-700/25 transition-all hover:bg-emerald-800 active:scale-[0.98]"
              >
                <Icon name="wa" className="h-4 w-4" />
                Kirim via WhatsApp
              </a>
            </div>
          </>
        )}
      </Modal>

      <TambahWargaWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        struktur={struktur}
        onDone={(fid) => {
          setWizardOpen(false);
          invalidateApi();
          loadStruktur();
          setLastKeluargaId(fid);
          setForm({ ...emptyForm, keluarga_id: String(fid), hubungan: "KRT" });
          setErrors({});
          setErr("");
          setDupWarn("");
          setFormKey((k) => k + 1);
          setModalOpen(true);
        }}
      />

      {toast && (
        <Toast
          message={toast.msg}
          onClose={() => setToast(null)}
          action={
            toast.showReset ? (
              <button
                type="button"
                onClick={() => {
                  resetFilter();
                  setFStatus("aktif");
                  setToast(null);
                }}
                className="shrink-0 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-white/25"
              >
                Tampilkan
              </button>
            ) : undefined
          }
        />
      )}
    </>
  );
}
