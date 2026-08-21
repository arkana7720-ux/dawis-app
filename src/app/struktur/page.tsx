"use client";

import { useEffect, useState } from "react";
import {
  Avatar,
  Badge,
  Btn,
  Card,
  ErrorState,
  Field,
  Icon,
  IconBtn,
  inputCls,
  Modal,
  PageHeader,
  Skeleton,
  Spinner,
} from "@/components/ui";
import { HUBUNGAN_LIST, STATUS_KB_LIST } from "@/lib/calc";

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
  nama: "",
  hubungan: "",
  jenis_kelamin: "",
  tanggal_lahir: "",
  bpjs: "",
  status_kb: "",
  catatan: "",
};

export default function StrukturPage() {
  const [data, setData] = useState<KelompokNode[] | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [kelModal, setKelModal] = useState<{ open: boolean; id?: number; nama: string; kode: string }>({ open: false, nama: "", kode: "" });
  const [bngModal, setBngModal] = useState<{ open: boolean; id?: number; kelompok_id: string; nama: string; tipe: string; keterangan: string }>({ open: false, kelompok_id: "", nama: "", tipe: "milik", keterangan: "" });
  const [famModal, setFamModal] = useState<{ open: boolean; id?: number; bangunan_id: string; nama_krt: string; catatan: string }>({ open: false, bangunan_id: "", nama_krt: "", catatan: "" });
  const [wrgModal, setWrgModal] = useState({ ...emptyWarga, open: false });
  const [tab, setTab] = useState<number | null>(null);
  const [err, setErr] = useState("");

  const load = () => {
    setLoadErr("");
    fetch("/api/bangunan")
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || "Gagal memuat data");
        return r.json();
      })
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
    if (!wrgModal.nama.trim()) return setErr("Nama wajib diisi");
    if (!wrgModal.keluarga_id) return setErr("Keluarga tidak valid");
    const ok = await saveJson(
      wrgModal.id ? `/api/warga/${wrgModal.id}` : "/api/warga",
      wrgModal.id ? "PUT" : "POST",
      { ...wrgModal, keluarga_id: Number(wrgModal.keluarga_id) }
    );
    if (ok) {
      setWrgModal({ ...emptyWarga, open: false });
      setErr("");
      load();
    }
  };

  const hapus = async (url: string, label: string) => {
    if (!confirm(`Hapus "${label}"? Data di dalamnya juga akan terhapus.`)) return;
    await fetch(url, { method: "DELETE" });
    load();
  };

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

  return (
    <>
      <PageHeader
        title="Struktur Wilayah"
        subtitle="Kelola kelompok, bangunan, dan keluarga"
        actions={
          <Btn onClick={() => { setErr(""); setKelModal({ open: true, nama: "", kode: "" }); }}>
            <Icon name="plus" className="h-4 w-4" />
            Kelompok
          </Btn>
        }
      />

      <div className="mb-4 inline-flex flex-wrap rounded-xl bg-slate-100 p-1">
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
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums ${sel ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                {k.bangunan.reduce((a, b) => a + b.jumlah_warga, 0)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-5">
        {data.filter((k) => k.id === active?.id).map((k) => (
          <Card key={k.id} className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3.5 sm:px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-md shadow-emerald-500/20">
                  <Icon name="family" className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">{k.nama}</p>
                  <p className="text-xs text-slate-500">
                    <span className="font-mono text-[11px]">{k.kode || "-"}</span> ·{" "}
                    {k.bangunan.length} bangunan ·{" "}
                    {k.bangunan.reduce((a, b) => a + b.jumlah_warga, 0)} jiwa
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <Btn size="sm" variant="secondary" onClick={() => { setErr(""); setBngModal({ open: true, kelompok_id: String(k.id), nama: "", tipe: "milik", keterangan: "" }); }}>
                  <Icon name="plus" className="h-3.5 w-3.5" />
                  Bangunan
                </Btn>
                <IconBtn icon="edit" tone="primary" title="Edit kelompok" onClick={() => { setErr(""); setKelModal({ open: true, id: k.id, nama: k.nama, kode: k.kode }); }} />
                <IconBtn icon="trash" tone="danger" title="Hapus kelompok" onClick={() => hapus(`/api/kelompok/${k.id}`, k.nama)} />
              </div>
            </div>

            <div className="divide-y divide-slate-50">
              {k.bangunan.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-slate-400">
                  Belum ada bangunan di kelompok ini.
                </p>
              )}
              {k.bangunan.map((b) => (
                <div key={b.id} className="px-4 py-3.5 sm:px-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <Icon name="building" className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-1.5 font-semibold text-slate-800">
                          <span className="truncate">{b.nama}</span>
                          {b.tipe === "kontrakan" && <Badge color="amber">Kontrakan</Badge>}
                          {b.tipe === "lainnya" && <Badge>Lainnya</Badge>}
                        </p>
                        <p className="text-xs text-slate-500">
                          {b.keluarga.length} keluarga · {b.jumlah_warga} jiwa
                          {b.keterangan ? ` · ${b.keterangan}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <Btn size="sm" variant="secondary" onClick={() => { setErr(""); setFamModal({ open: true, bangunan_id: String(b.id), nama_krt: "", catatan: "" }); }}>
                        <Icon name="plus" className="h-3.5 w-3.5" />
                        Keluarga
                      </Btn>
                      <IconBtn icon="edit" tone="primary" title="Edit bangunan" onClick={() => { setErr(""); setBngModal({ open: true, id: b.id, kelompok_id: String(k.id), nama: b.nama, tipe: b.tipe, keterangan: b.keterangan }); }} />
                      <IconBtn icon="trash" tone="danger" title="Hapus bangunan" onClick={() => hapus(`/api/bangunan/${b.id}`, b.nama)} />
                    </div>
                  </div>

                  {b.keluarga.length > 0 && (
                    <div className="ml-[15px] mt-3 space-y-3 border-l-2 border-emerald-100 pl-4 sm:pl-6">
                      {b.keluarga.map((f) => (
                        <div key={f.id}>
                          <div className="group/f flex flex-wrap items-center justify-between gap-2">
                            <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-700">
                              <Icon name="key" className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                              <span className="truncate">{f.nama_krt}</span>
                              {f.catatan && (
                                <span className="shrink-0 text-xs font-normal text-slate-400">({f.catatan})</span>
                              )}
                            </p>
                            <div className="flex gap-0.5 opacity-60 transition-opacity group-hover/f:opacity-100">
                              <button
                                className="rounded-lg px-2 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
                                onClick={() => { setErr(""); setWrgModal({ ...emptyWarga, open: true, keluarga_id: String(f.id) }); }}
                              >
                                + Anggota
                              </button>
                              <button
                                className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100"
                                onClick={() => { setErr(""); setFamModal({ open: true, id: f.id, bangunan_id: String(b.id), nama_krt: f.nama_krt, catatan: f.catatan }); }}
                              >
                                Edit
                              </button>
                              <button
                                className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                                onClick={() => hapus(`/api/keluarga/${f.id}`, f.nama_krt)}
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                          {f.anggota.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {f.anggota.map((a) => (
                                <li
                                  key={a.id}
                                  className="group/a flex items-center justify-between gap-2 rounded-xl bg-slate-50/80 px-3 py-2 text-sm ring-1 ring-inset ring-transparent transition-all hover:bg-white hover:ring-slate-200"
                                >
                                  <span className="flex min-w-0 items-center gap-2.5">
                                    <Avatar name={a.nama} size="sm" />
                                    <span className="min-w-0 truncate">
                                      <span className="font-medium text-slate-700">{a.nama}</span>
                                      <span className="ml-2 text-xs text-slate-400">
                                        {a.hubungan || "-"} · {a.jenis_kelamin || "?"} · {a.usia ?? "?"} th
                                      </span>
                                    </span>
                                  </span>
                                  <span className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover/a:opacity-100">
                                    <IconBtn
                                      icon="edit"
                                      title="Edit"
                                      onClick={() => { setErr(""); setWrgModal({ open: true, id: a.id, keluarga_id: String(f.id), nama: a.nama, hubungan: a.hubungan, jenis_kelamin: a.jenis_kelamin, tanggal_lahir: a.tanggal_lahir, bpjs: a.bpjs, status_kb: a.status_kb, catatan: a.catatan || "" }); }}
                                    />
                                    <IconBtn
                                      icon="trash"
                                      tone="danger"
                                      title="Hapus"
                                      onClick={() => { if (confirm(`Hapus "${a.nama}"?`)) fetch(`/api/warga/${a.id}`, { method: "DELETE" }).then(load); }}
                                    />
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

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

      <Modal open={wrgModal.open} onClose={() => setWrgModal({ ...emptyWarga, open: false })} title={wrgModal.id ? "Edit Anggota" : "Tambah Anggota"} wide>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nama Lengkap" required>
            <input className={inputCls} value={wrgModal.nama} onChange={(e) => setWrgModal({ ...wrgModal, nama: e.target.value })} />
          </Field>
          <Field label="Hubungan">
            <select className={inputCls} value={wrgModal.hubungan} onChange={(e) => setWrgModal({ ...wrgModal, hubungan: e.target.value })}>
              <option value="">— Pilih —</option>
              {HUBUNGAN_LIST.map((h) => <option key={h}>{h}</option>)}
            </select>
          </Field>
          <Field label="Jenis Kelamin">
            <select className={inputCls} value={wrgModal.jenis_kelamin} onChange={(e) => setWrgModal({ ...wrgModal, jenis_kelamin: e.target.value })}>
              <option value="">— Pilih —</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </Field>
          <Field label="Tanggal Lahir">
            {/^\d{4}$/.test(wrgModal.tanggal_lahir) ? (
              <>
                <input
                  className={inputCls}
                  value={wrgModal.tanggal_lahir}
                  onChange={(e) => setWrgModal({ ...wrgModal, tanggal_lahir: e.target.value })}
                />
                <p className="mt-1 text-[11px] text-amber-600">
                  Data lama hanya menyimpan tahun lahir. Biarkan apa adanya atau isi lengkap
                  (format TTTT-BB-HH).
                </p>
              </>
            ) : (
              <input type="date" className={inputCls} value={/^\d{4}-\d{2}-\d{2}$/.test(wrgModal.tanggal_lahir) ? wrgModal.tanggal_lahir : ""} onChange={(e) => setWrgModal({ ...wrgModal, tanggal_lahir: e.target.value })} />
            )}
          </Field>
          <Field label="BPJS / No. Kartu">
            <input className={inputCls} value={wrgModal.bpjs} onChange={(e) => setWrgModal({ ...wrgModal, bpjs: e.target.value })} />
          </Field>
          <Field label="Status KB">
            <select className={inputCls} value={wrgModal.status_kb} onChange={(e) => setWrgModal({ ...wrgModal, status_kb: e.target.value })}>
              {STATUS_KB_LIST.map((s) => (
                <option key={s || "-"} value={s}>{s || "— Tidak KB —"}</option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Catatan">
              <textarea className={inputCls} rows={2} value={wrgModal.catatan} onChange={(e) => setWrgModal({ ...wrgModal, catatan: e.target.value })} />
            </Field>
          </div>
        </div>
        {err && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => setWrgModal({ ...emptyWarga, open: false })}>Batal</Btn>
          <Btn onClick={saveWarga}>Simpan</Btn>
        </div>
      </Modal>
    </>
  );
}
