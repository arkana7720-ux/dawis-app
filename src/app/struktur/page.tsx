"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Btn,
  Card,
  ErrorState,
  Field,
  Icon,
  inputCls,
  Modal,
  PageHeader,
  Skeleton,
  Spinner,
} from "@/components/ui";
import { validasiWarga } from "@/lib/calc";
import { WargaFields, emptyWargaValues } from "@/components/WargaFields";
import { fetchApi, invalidateApi } from "@/lib/clientApi";

interface Anggota {
  id: number;
  nama: string;
  hubungan: string;
  jenis_kelamin: string;
  tanggal_lahir: string;
  bpjs: string;
  status_kb: string;
  catatan: string;
  usia: number | null;
  is_hamil?: boolean;
  hpl_kehamilan?: string;
  risiko_kehamilan?: string;
}
interface KeluargaNode extends Anggota {
  id: number;
  nama_krt: string;
  catatan: string;
  anggota: Anggota[];
}
interface BangunanNode {
  id: number;
  nama: string;
  tipe: string;
  keterangan: string;
  jumlah_warga: number;
  keluarga: KeluargaNode[];
}
interface KelompokNode {
  id: number;
  nama: string;
  kode: string;
  bangunan: BangunanNode[];
}

const emptyWarga = {
  id: 0,
  keluarga_id: "",
  ...emptyWargaValues,
};

/** Tombol "⋯" dengan menu kecil, supaya aksi berbahaya tidak tampil permanen. */
function MenuTombol({
  terbuka,
  onToggle,
  children,
}: {
  terbuka: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label="Aksi lainnya"
        aria-expanded={terbuka}
        onClick={onToggle}
        className={`rounded-lg p-1.5 transition-colors ${
          terbuka
            ? "bg-slate-100 text-slate-700"
            : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        }`}
      >
        <Icon name="dots" className="h-4 w-4" />
      </button>
      {terbuka && (
        <>
          <div className="fixed inset-0 z-30" onClick={onToggle} />
          <div className="absolute right-0 top-full z-40 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-900/10">
            {children}
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({
  ikon,
  label,
  onClick,
  bahaya,
}: {
  ikon: string;
  label: string;
  onClick: () => void;
  bahaya?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold transition-colors ${
        bahaya ? "text-red-600 hover:bg-red-50" : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      <Icon name={ikon} className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

export default function StrukturPage() {
  const [data, setData] = useState<KelompokNode[] | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [kelModal, setKelModal] = useState<{ open: boolean; id?: number; nama: string; kode: string }>({ open: false, nama: "", kode: "" });
  const [bngModal, setBngModal] = useState<{ open: boolean; id?: number; kelompok_id: string; nama: string; tipe: string; keterangan: string }>({ open: false, kelompok_id: "", nama: "", tipe: "milik", keterangan: "" });
  const [famModal, setFamModal] = useState<{ open: boolean; id?: number; bangunan_id: string; nama_krt: string; catatan: string }>({ open: false, bangunan_id: "", nama_krt: "", catatan: "" });
  const [wrgModal, setWrgModal] = useState({ ...emptyWarga, open: false });
  const [tab, setTab] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const [wrgErrors, setWrgErrors] = useState<Record<string, string>>({});
  const [savingWarga, setSavingWarga] = useState(false);
  const [cari, setCari] = useState("");
  const [bukaFam, setBukaFam] = useState<Set<number>>(new Set());
  const [menu, setMenu] = useState<string | null>(null);

  const load = () => {
    setLoadErr("");
    fetchApi<KelompokNode[]>("/api/bangunan")
      .then(setData)
      .catch((e) => setLoadErr(e.message));
  };

  useEffect(() => {
    load();
  }, []);

  const saveJson = async (url: string, method: string, body: any) => {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "Gagal menyimpan");
      return false;
    }
    invalidateApi();
    return true;
  };

  const saveKelompok = async () => {
    if (!kelModal.nama.trim()) return setErr("Nama kelompok wajib diisi");
    const ok = await saveJson(
      kelModal.id ? `/api/kelompok/${kelModal.id}` : "/api/kelompok",
      kelModal.id ? "PUT" : "POST",
      { nama: kelModal.nama, kode: kelModal.kode }
    );
    if (ok) {
      setKelModal({ ...kelModal, open: false });
      setErr("");
      load();
    }
  };

  const saveBangunan = async () => {
    if (!bngModal.nama.trim()) return setErr("Nama bangunan wajib diisi");
    if (!bngModal.id && !bngModal.kelompok_id) return setErr("Pilih kelompok dulu");
    const ok = await saveJson(
      bngModal.id ? `/api/bangunan/${bngModal.id}` : "/api/bangunan",
      bngModal.id ? "PUT" : "POST",
      { ...bngModal, kelompok_id: Number(bngModal.kelompok_id) }
    );
    if (ok) {
      setBngModal({ ...bngModal, open: false });
      setErr("");
      load();
    }
  };

  const saveKeluarga = async () => {
    if (!famModal.nama_krt.trim()) return setErr("Nama KRT wajib diisi");
    if (!famModal.id && !famModal.bangunan_id) return setErr("Pilih bangunan dulu");
    const ok = await saveJson(
      famModal.id ? `/api/keluarga/${famModal.id}` : "/api/keluarga",
      famModal.id ? "PUT" : "POST",
      { ...famModal, bangunan_id: Number(famModal.bangunan_id) }
    );
    if (ok) {
      setFamModal({ ...famModal, open: false });
      setErr("");
      load();
    }
  };

  const saveWarga = async () => {
    const next = validasiWarga(wrgModal);
    if (!wrgModal.keluarga_id) next.keluarga_id = "Keluarga tidak valid.";
    setWrgErrors(next);
    if (Object.keys(next).length > 0) {
      setErr("Periksa kembali kolom yang ditandai merah.");
      return;
    }
    setErr("");
    setSavingWarga(true);
    const res = await fetch(
      wrgModal.id ? `/api/warga/${wrgModal.id}` : "/api/warga",
      {
        method: wrgModal.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...wrgModal, keluarga_id: Number(wrgModal.keluarga_id) }),
      }
    );
    setSavingWarga(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      if (j.fields) setWrgErrors(j.fields);
      setErr(j.error || "Gagal menyimpan");
      return;
    }
    setWrgModal({ ...emptyWarga, open: false });
    setWrgErrors({});
    setErr("");
    invalidateApi();
    load();
  };

  const hapus = async (url: string, label: string) => {
    if (!confirm(`Hapus "${label}"? Data di dalamnya juga akan terhapus.`)) return;
    await fetch(url, { method: "DELETE" });
    invalidateApi();
    load();
  };

  const toggleFam = (id: number) => {
    setBukaFam((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const tambahAnggota = (f: KeluargaNode) => {
    setErr("");
    setWrgErrors({});
    setBukaFam((s) => new Set(s).add(f.id));
    setWrgModal({
      ...emptyWarga,
      open: true,
      keluarga_id: String(f.id),
      hubungan: f.anggota.length === 0 ? "KRT" : "",
    });
  };

  const editAnggota = (f: KeluargaNode, a: Anggota) => {
    setErr("");
    setWrgErrors({});
    setWrgModal({
      open: true,
      id: a.id,
      keluarga_id: String(f.id),
      nama: a.nama,
      hubungan: a.hubungan,
      jenis_kelamin: a.jenis_kelamin,
      tanggal_lahir: a.tanggal_lahir,
      bpjs: a.bpjs,
      status_kb: a.status_kb,
      catatan: a.catatan || "",
      is_hamil: !!a.is_hamil,
      hpl_kehamilan: a.hpl_kehamilan || "",
      risiko_kehamilan: a.risiko_kehamilan || "normal",
    });
  };

  const hapusAnggota = async (a: Anggota) => {
    if (!confirm(`Hapus "${a.nama}" dari keluarga ini?`)) return;
    await fetch(`/api/warga/${a.id}`, { method: "DELETE" });
    invalidateApi();
    load();
  };

  /** Buka hasil pencarian: pindah kelompok, bentangkan keluarga, lalu sorot barisnya. */
  const bukaHasil = (kelompokId: number, keluargaId?: number, elemenId?: string) => {
    setTab(kelompokId);
    if (keluargaId) setBukaFam((s) => new Set(s).add(keluargaId));
    setCari("");
    setMenu(null);
    setTimeout(() => {
      if (elemenId) {
        document.getElementById(elemenId)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 150);
  };

  const ringkasan = useMemo(() => {
    const list = data ?? [];
    return {
      kelompok: list.length,
      bangunan: list.reduce((n, k) => n + k.bangunan.length, 0),
      keluarga: list.reduce(
        (n, k) => n + k.bangunan.reduce((m, b) => m + b.keluarga.length, 0),
        0
      ),
      jiwa: list.reduce(
        (n, k) => n + k.bangunan.reduce((m, b) => m + b.jumlah_warga, 0),
        0
      ),
    };
  }, [data]);

  const hasilCari = useMemo(() => {
    const q = cari.trim().toLowerCase();
    if (q.length < 2) return null;
    const hasil: Array<{
      jenis: "warga" | "keluarga" | "bangunan";
      kunci: string;
      judul: string;
      jejak: string;
      detail: string;
      kelompokId: number;
      keluargaId?: number;
      elemenId: string;
      anggota?: Anggota;
      keluarga?: KeluargaNode;
    }> = [];

    for (const k of data ?? []) {
      for (const b of k.bangunan) {
        if (b.nama.toLowerCase().includes(q)) {
          hasil.push({
            jenis: "bangunan",
            kunci: `cari-bng-${b.id}`,
            judul: b.nama,
            jejak: k.nama,
            detail: `${b.keluarga.length} keluarga · ${b.jumlah_warga} jiwa`,
            kelompokId: k.id,
            elemenId: `bng-${b.id}`,
          });
        }
        for (const f of b.keluarga) {
          if (f.nama_krt.toLowerCase().includes(q)) {
            hasil.push({
              jenis: "keluarga",
              kunci: `cari-fam-${f.id}`,
              judul: f.nama_krt,
              jejak: `${k.nama} › ${b.nama}`,
              detail: `${f.anggota.length} anggota`,
              kelompokId: k.id,
              keluargaId: f.id,
              elemenId: `fam-${f.id}`,
            });
          }
          for (const a of f.anggota) {
            if (a.nama.toLowerCase().includes(q)) {
              hasil.push({
                jenis: "warga",
                kunci: `cari-wrg-${a.id}`,
                judul: a.nama,
                jejak: `${k.nama} › ${b.nama} › ${f.nama_krt}`,
                detail: `${a.hubungan || "-"} · ${a.usia ?? "?"} th`,
                kelompokId: k.id,
                keluargaId: f.id,
                elemenId: `wrg-${a.id}`,
                anggota: a,
                keluarga: f,
              });
            }
          }
        }
      }
    }
    return hasil;
  }, [cari, data]);

  if (loadErr) return <ErrorState message={loadErr} onRetry={load} />;

  if (!data)
    return (
      <>
        <div className="mb-6 flex items-end justify-between">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="mt-4 h-64" />
      </>
    );

  const active = data.find((k) => k.id === tab) ?? data[0];

  const keluargaAktif = data
    .flatMap((k) =>
      k.bangunan.flatMap((b) =>
        b.keluarga.map((f) => ({ ...f, bangunan: b.nama, kelompok: k.nama }))
      )
    )
    .find((f) => String(f.id) === wrgModal.keluarga_id);

  return (
    <>
      <PageHeader
        title="Struktur Wilayah"
        subtitle="Susunan kelompok › bangunan › keluarga. Untuk mencari atau mengisi data orang, pakai menu Data Warga."
        actions={
          <Btn onClick={() => { setErr(""); setKelModal({ open: true, nama: "", kode: "" }); }}>
            <Icon name="plus" className="h-4 w-4" />
            Kelompok
          </Btn>
        }
      />

      {data.length === 0 && (
        <Card className="mb-5 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 ring-1 ring-emerald-100">
            <Icon name="building" className="h-7 w-7" />
          </div>
          <p className="mt-4 text-sm font-bold text-slate-700">Belum ada kelompok</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
            Buat kelompok pertama Anda, lalu tambahkan bangunan, keluarga, dan warganya. Data ini
            hanya terlihat oleh akun Anda.
          </p>
          <div className="mt-4 flex justify-center">
            <Btn onClick={() => { setErr(""); setKelModal({ open: true, nama: "", kode: "" }); }}>
              <Icon name="plus" className="h-4 w-4" />
              Tambah Kelompok
            </Btn>
          </div>
        </Card>
      )}

      {data.length > 0 && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Kelompok", nilai: ringkasan.kelompok },
              { label: "Bangunan", nilai: ringkasan.bangunan },
              { label: "Keluarga", nilai: ringkasan.keluarga },
              { label: "Jiwa", nilai: ringkasan.jiwa },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-white px-3.5 py-2.5 ring-1 ring-slate-200/70"
              >
                <p className="text-lg font-extrabold leading-tight tabular-nums text-slate-800">
                  {s.nilai}
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <div className="relative mb-4">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              className={`${inputCls} pl-9 pr-9`}
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Cari nama warga, kepala keluarga, atau bangunan…"
              aria-label="Cari di struktur wilayah"
            />
            {cari && (
              <button
                type="button"
                aria-label="Hapus pencarian"
                onClick={() => setCari("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            )}
          </div>

          {hasilCari ? (
            <Card>
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-bold text-slate-800">
                  Hasil pencarian “{cari.trim()}”
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {hasilCari.length === 0
                    ? "Tidak ada yang cocok. Coba potongan nama lain."
                    : `${hasilCari.length} data ditemukan`}
                </p>
              </div>
              {hasilCari.length > 0 && (
                <ul className="divide-y divide-slate-50">
                  {hasilCari.slice(0, 40).map((h) => (
                    <li
                      key={h.kunci}
                      className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        {h.jenis === "warga" ? (
                          <Avatar name={h.judul} size="sm" />
                        ) : (
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              h.jenis === "keluarga"
                                ? "bg-amber-50 text-amber-600"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <Icon
                              name={h.jenis === "keluarga" ? "key" : "building"}
                              className="h-4 w-4"
                            />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {h.judul}
                          </p>
                          <p className="truncate text-[11px] text-slate-400">
                            {h.jejak} · {h.detail}
                          </p>
                        </div>
                      </div>
                      <Btn
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          h.jenis === "warga" && h.anggota && h.keluarga
                            ? editAnggota(h.keluarga, h.anggota)
                            : bukaHasil(h.kelompokId, h.keluargaId, h.elemenId)
                        }
                      >
                        {h.jenis === "warga" ? "Edit" : "Buka"}
                      </Btn>
                    </li>
                  ))}
                </ul>
              )}
              {hasilCari.length > 40 && (
                <p className="border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-400">
                  Menampilkan 40 dari {hasilCari.length} hasil. Persempit kata kunci untuk melihat
                  sisanya.
                </p>
              )}
            </Card>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1">
                {data.map((k) => {
                  const sel = k.id === active?.id;
                  return (
                    <button
                      key={k.id}
                      onClick={() => setTab(k.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all sm:text-sm ${
                        sel
                          ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {k.nama}
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums ${
                          sel ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {k.bangunan.length} rumah
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-5">
        {data.filter((k) => k.id === active?.id).map((k) => {
          const totalKeluarga = k.bangunan.reduce((a, b) => a + b.keluarga.length, 0);
          const totalJiwa = k.bangunan.reduce((a, b) => a + b.jumlah_warga, 0);
          const kunciMenu = (kunci: string) => (menu === kunci ? null : kunci);

          return (
            <div key={k.id} id={`kel-${k.id}`}>
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-2xl border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3.5 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-md shadow-emerald-500/20">
                      <Icon name="family" className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-800">{k.nama}</p>
                      <p className="text-xs text-slate-500">
                        <span className="font-mono text-[11px]">{k.kode || "-"}</span> ·{" "}
                        {k.bangunan.length} bangunan · {totalKeluarga} keluarga · {totalJiwa} jiwa
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Btn
                      size="sm"
                      onClick={() => {
                        setErr("");
                        setBngModal({
                          open: true,
                          kelompok_id: String(k.id),
                          nama: "",
                          tipe: "milik",
                          keterangan: "",
                        });
                      }}
                    >
                      <Icon name="plus" className="h-3.5 w-3.5" />
                      Bangunan
                    </Btn>
                    <MenuTombol
                      terbuka={menu === `kel-${k.id}`}
                      onToggle={() => setMenu(kunciMenu(`kel-${k.id}`))}
                    >
                      <MenuItem
                        ikon="edit"
                        label="Edit kelompok"
                        onClick={() => {
                          setMenu(null);
                          setErr("");
                          setKelModal({ open: true, id: k.id, nama: k.nama, kode: k.kode });
                        }}
                      />
                      <MenuItem
                        ikon="trash"
                        label="Hapus kelompok"
                        bahaya
                        onClick={() => {
                          setMenu(null);
                          hapus(`/api/kelompok/${k.id}`, k.nama);
                        }}
                      />
                    </MenuTombol>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {k.bangunan.length === 0 && (
                    <div className="px-5 py-10 text-center">
                      <p className="text-sm font-semibold text-slate-600">Belum ada bangunan</p>
                      <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                        Bangunan adalah rumah atau kontrakan tempat keluarga tinggal.
                      </p>
                      <Btn
                        size="sm"
                        className="mt-3"
                        onClick={() => {
                          setErr("");
                          setBngModal({
                            open: true,
                            kelompok_id: String(k.id),
                            nama: "",
                            tipe: "milik",
                            keterangan: "",
                          });
                        }}
                      >
                        <Icon name="plus" className="h-3.5 w-3.5" />
                        Tambah Bangunan
                      </Btn>
                    </div>
                  )}

                  {k.bangunan.map((b) => (
                    <div key={b.id} id={`bng-${b.id}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50/70 px-3 py-2.5 sm:px-4">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200">
                            <Icon name="building" className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-slate-800">
                              <span className="truncate">{b.nama}</span>
                              {b.tipe === "kontrakan" && <Badge color="amber">Kontrakan</Badge>}
                              {b.tipe === "lainnya" && <Badge>Lainnya</Badge>}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {b.keluarga.length} keluarga · {b.jumlah_warga} jiwa
                              {b.keterangan ? ` · ${b.keterangan}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Btn
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setErr("");
                              setFamModal({
                                open: true,
                                bangunan_id: String(b.id),
                                nama_krt: "",
                                catatan: "",
                              });
                            }}
                          >
                            <Icon name="plus" className="h-3.5 w-3.5" />
                            Keluarga
                          </Btn>
                          <MenuTombol
                            terbuka={menu === `bng-${b.id}`}
                            onToggle={() => setMenu(kunciMenu(`bng-${b.id}`))}
                          >
                            <MenuItem
                              ikon="edit"
                              label="Edit bangunan"
                              onClick={() => {
                                setMenu(null);
                                setErr("");
                                setBngModal({
                                  open: true,
                                  id: b.id,
                                  kelompok_id: String(k.id),
                                  nama: b.nama,
                                  tipe: b.tipe,
                                  keterangan: b.keterangan,
                                });
                              }}
                            />
                            <MenuItem
                              ikon="trash"
                              label="Hapus bangunan"
                              bahaya
                              onClick={() => {
                                setMenu(null);
                                hapus(`/api/bangunan/${b.id}`, b.nama);
                              }}
                            />
                          </MenuTombol>
                        </div>
                      </div>

                      {b.keluarga.length === 0 ? (
                        <p className="px-4 pb-3 pl-12 text-xs text-slate-400 sm:pl-14">
                          Belum ada keluarga di bangunan ini. Tekan “+ Keluarga” untuk menambah.
                        </p>
                      ) : (
                        <div className="pb-2 pl-2 sm:pl-3">
                          {b.keluarga.map((f) => {
                            const buka = bukaFam.has(f.id);
                            return (
                              <div
                                key={f.id}
                                id={`fam-${f.id}`}
                                className="border-t border-slate-50 first:border-t-0"
                              >
                                <div className="flex items-center gap-1 pr-1.5 sm:pr-2.5">
                                  <button
                                    type="button"
                                    onClick={() => toggleFam(f.id)}
                                    aria-expanded={buka}
                                    className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-slate-50"
                                  >
                                    <Icon
                                      name={buka ? "chevronDown" : "chevron"}
                                      className="h-3.5 w-3.5 shrink-0 text-slate-400"
                                    />
                                    <span className="truncate text-sm font-semibold text-slate-700">
                                      {f.nama_krt}
                                    </span>
                                    <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                                      {f.anggota.length} orang
                                    </span>
                                    {f.catatan && (
                                      <span className="hidden shrink-0 truncate text-[11px] text-slate-400 sm:inline">
                                        ({f.catatan})
                                      </span>
                                    )}
                                  </button>
                                  <Btn
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => tambahAnggota(f)}
                                  >
                                    <Icon name="plus" className="h-3.5 w-3.5" />
                                    Anggota
                                  </Btn>
                                  <MenuTombol
                                    terbuka={menu === `fam-${f.id}`}
                                    onToggle={() => setMenu(kunciMenu(`fam-${f.id}`))}
                                  >
                                    <MenuItem
                                      ikon="edit"
                                      label="Edit keluarga"
                                      onClick={() => {
                                        setMenu(null);
                                        setErr("");
                                        setFamModal({
                                          open: true,
                                          id: f.id,
                                          bangunan_id: String(b.id),
                                          nama_krt: f.nama_krt,
                                          catatan: f.catatan,
                                        });
                                      }}
                                    />
                                    <MenuItem
                                      ikon="trash"
                                      label="Hapus keluarga"
                                      bahaya
                                      onClick={() => {
                                        setMenu(null);
                                        hapus(`/api/keluarga/${f.id}`, f.nama_krt);
                                      }}
                                    />
                                  </MenuTombol>
                                </div>

                                {buka &&
                                  (f.anggota.length === 0 ? (
                                    <p className="mb-2 ml-7 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-700 sm:ml-8">
                                      Belum ada anggota. Tekan “+ Anggota” untuk menambah warga.
                                    </p>
                                  ) : (
                                    <ul className="mb-2 ml-6 mr-1.5 space-y-1.5 border-l-2 border-emerald-100 pl-3 sm:ml-7 sm:mr-2.5">
                                      {f.anggota.map((a) => (
                                        <li
                                          key={a.id}
                                          id={`wrg-${a.id}`}
                                          className="flex items-center justify-between gap-2 rounded-xl bg-white px-2.5 py-2 ring-1 ring-slate-100"
                                        >
                                          <span className="flex min-w-0 items-center gap-2">
                                            <Avatar name={a.nama} size="sm" />
                                            <span className="min-w-0">
                                              <span className="block truncate text-sm font-medium text-slate-700">
                                                {a.nama}
                                              </span>
                                              <span className="block text-[11px] text-slate-400">
                                                {a.hubungan || "-"} · {a.jenis_kelamin || "?"} ·{" "}
                                                {a.usia ?? "?"} th
                                              </span>
                                            </span>
                                          </span>
                                          <MenuTombol
                                            terbuka={menu === `wrg-${a.id}`}
                                            onToggle={() => setMenu(kunciMenu(`wrg-${a.id}`))}
                                          >
                                            <MenuItem
                                              ikon="edit"
                                              label="Edit data"
                                              onClick={() => {
                                                setMenu(null);
                                                editAnggota(f, a);
                                              }}
                                            />
                                            <MenuItem
                                              ikon="trash"
                                              label="Hapus anggota"
                                              bahaya
                                              onClick={() => {
                                                setMenu(null);
                                                hapusAnggota(a);
                                              }}
                                            />
                                          </MenuTombol>
                                        </li>
                                      ))}
                                    </ul>
                                  ))}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          );
        })}
              </div>
            </>
          )}
        </>
      )}

      <Modal open={kelModal.open} onClose={() => setKelModal({ ...kelModal, open: false })} title={kelModal.id ? "Edit Kelompok" : "Tambah Kelompok"}>
        <div className="space-y-3">
          <Field label="Nama Kelompok" required>
            <input className={inputCls} value={kelModal.nama} onChange={(e) => setKelModal({ ...kelModal, nama: e.target.value })} placeholder="cth: Kelompok 3" />
          </Field>
          <Field label="Kode Wilayah">
            <input className={inputCls} value={kelModal.kode} onChange={(e) => setKelModal({ ...kelModal, kode: e.target.value })} placeholder="cth: GABUS.011.004.008" />
          </Field>
        </div>
        {err && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => setKelModal({ ...kelModal, open: false })}>Batal</Btn>
          <Btn onClick={saveKelompok}>Simpan</Btn>
        </div>
      </Modal>

      <Modal open={bngModal.open} onClose={() => setBngModal({ ...bngModal, open: false })} title={bngModal.id ? "Edit Bangunan" : "Tambah Bangunan"}>
        <div className="space-y-3">
          {!bngModal.id && (
            <Field label="Kelompok" required>
              <select className={inputCls} value={bngModal.kelompok_id} onChange={(e) => setBngModal({ ...bngModal, kelompok_id: e.target.value })}>
                <option value="">— Pilih —</option>
                {(data || []).map((k) => (
                  <option key={k.id} value={k.id}>{k.nama}</option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Nama Bangunan / Rumah" required>
            <input className={inputCls} value={bngModal.nama} onChange={(e) => setBngModal({ ...bngModal, nama: e.target.value })} placeholder="cth: Rumah Bpk. Sudarno" />
          </Field>
          <Field label="Status Tempat Tinggal">
            <select className={inputCls} value={bngModal.tipe} onChange={(e) => setBngModal({ ...bngModal, tipe: e.target.value })}>
              <option value="milik">Milik Sendiri</option>
              <option value="kontrakan">Kontrakan/Sewa</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </Field>
          <Field label="Keterangan">
            <input className={inputCls} value={bngModal.keterangan} onChange={(e) => setBngModal({ ...bngModal, keterangan: e.target.value })} placeholder="cth: 6 Pintu, Belakang Ruko" />
          </Field>
        </div>
        {err && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => setBngModal({ ...bngModal, open: false })}>Batal</Btn>
          <Btn onClick={saveBangunan}>Simpan</Btn>
        </div>
      </Modal>

      <Modal open={famModal.open} onClose={() => setFamModal({ ...famModal, open: false })} title={famModal.id ? "Edit Keluarga" : "Tambah Keluarga"}>
        <div className="space-y-3">
          {!famModal.id && (
            <Field label="Bangunan" required>
              <select className={inputCls} value={famModal.bangunan_id} onChange={(e) => setFamModal({ ...famModal, bangunan_id: e.target.value })}>
                <option value="">— Pilih —</option>
                {(data || []).flatMap((k) =>
                  k.bangunan.map((b) => (
                    <option key={b.id} value={b.id}>{k.nama} → {b.nama}</option>
                  ))
                )}
              </select>
            </Field>
          )}
          <Field label="Nama Kepala Rumah Tangga (KRT)" required>
            <input className={inputCls} value={famModal.nama_krt} onChange={(e) => setFamModal({ ...famModal, nama_krt: e.target.value })} />
          </Field>
          <Field label="Catatan">
            <input className={inputCls} value={famModal.catatan} onChange={(e) => setFamModal({ ...famModal, catatan: e.target.value })} placeholder="cth: 5 orang" />
          </Field>
        </div>
        {err && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => setFamModal({ ...famModal, open: false })}>Batal</Btn>
          <Btn onClick={saveKeluarga}>Simpan</Btn>
        </div>
      </Modal>

      <Modal open={wrgModal.open} onClose={() => { setWrgModal({ ...emptyWarga, open: false }); setErr(""); }} title={wrgModal.id ? "Edit Anggota" : "Tambah Anggota"} wide>
        <div className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500">
          <span className="font-semibold text-slate-400">Keluarga:</span>{" "}
          <span className="font-semibold text-slate-700">
            {keluargaAktif?.nama_krt ?? "-"}
          </span>
          {keluargaAktif && (
            <span className="text-slate-400">
              {" "}· {keluargaAktif.bangunan} · {keluargaAktif.kelompok}
            </span>
          )}
        </div>

        <WargaFields
          key={`${wrgModal.id}-${wrgModal.open}`}
          value={wrgModal}
          onChange={(v) => {
            const berubah = (["nama", "jenis_kelamin", "tanggal_lahir"] as const).filter(
              (k) => v[k] !== wrgModal[k]
            );
            setWrgModal((m) => ({ ...m, ...v }));
            if (berubah.length > 0) {
              setWrgErrors((e) => {
                const nextErrors = { ...e };
                berubah.forEach((k) => delete nextErrors[k]);
                return nextErrors;
              });
              setErr("");
            }
          }}
          errors={wrgErrors}
        />

        {err && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{err}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => { setWrgModal({ ...emptyWarga, open: false }); setErr(""); }}>Batal</Btn>
          <Btn onClick={saveWarga} disabled={savingWarga}>
            {savingWarga && <Spinner className="h-3.5 w-3.5" />}
            {savingWarga ? "Menyimpan..." : "Simpan"}
          </Btn>
        </div>
      </Modal>
    </>
  );
}
