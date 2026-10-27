"use client";

import { useEffect, useState } from "react";
import { Btn, Field, Icon, inputCls, Modal, Spinner } from "@/components/ui";
import type { PickerKelompok } from "./KeluargaPicker";

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Gagal menyimpan data.");
  return json as { id: number };
}

/**
 * Untuk akun yang belum punya kelompok/bangunan/keluarga: bantu buat 3 data
 * prasyarat dulu, lalu langsung lanjut mengisi data warga.
 */
export function TambahWargaWizard({
  open,
  onClose,
  struktur,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  struktur: PickerKelompok[];
  onDone: (keluargaId: number, namaKrt: string) => void;
}) {
  const [kelompokId, setKelompokId] = useState("");
  const [newKelompok, setNewKelompok] = useState(false);
  const [namaKelompok, setNamaKelompok] = useState("");
  const [kode, setKode] = useState("");

  const [bangunanId, setBangunanId] = useState("");
  const [newBangunan, setNewBangunan] = useState(false);
  const [namaBangunan, setNamaBangunan] = useState("");
  const [tipe, setTipe] = useState("milik");

  const [keluargaId, setKeluargaId] = useState("");
  const [newKeluarga, setNewKeluarga] = useState(false);
  const [namaKrt, setNamaKrt] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const k = struktur[0];
    const b = k?.bangunan?.[0];
    const f = b?.keluarga?.[0];
    setKelompokId(String(k?.id ?? ""));
    setNewKelompok(!k);
    setNamaKelompok("");
    setKode("");
    setBangunanId(String(b?.id ?? ""));
    setNewBangunan(!b);
    setNamaBangunan("");
    setTipe("milik");
    setKeluargaId(String(f?.id ?? ""));
    setNewKeluarga(!f);
    setNamaKrt("");
    setErrors({});
    setErr("");
    setSaving(false);
    // Reset hanya saat modal dibuka.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const bangunanList = struktur.find((k) => String(k.id) === kelompokId)?.bangunan ?? [];
  const keluargaList = bangunanList.find((b) => String(b.id) === bangunanId)?.keluarga ?? [];

  const kMode = newKelompok ? "new" : "existing";
  const bMode = newKelompok || newBangunan || bangunanList.length === 0 ? "new" : "existing";
  const fMode =
    newKelompok || bMode === "new" || newKeluarga || keluargaList.length === 0
      ? "new"
      : "existing";

  const gantiKelompok = (id: string) => {
    setKelompokId(id);
    const b = struktur.find((k) => String(k.id) === id)?.bangunan?.[0];
    setBangunanId(String(b?.id ?? ""));
    setNewBangunan(!b);
    setKeluargaId(String(b?.keluarga?.[0]?.id ?? ""));
    setNewKeluarga(!b?.keluarga?.[0]);
  };

  const gantiBangunan = (id: string) => {
    setBangunanId(id);
    const b = bangunanList.find((x) => String(x.id) === id);
    setKeluargaId(String(b?.keluarga?.[0]?.id ?? ""));
    setNewKeluarga(!b?.keluarga?.[0]);
  };

  const simpan = async () => {
    const next: Record<string, string> = {};
    if (kMode === "new" && !namaKelompok.trim()) next.namaKelompok = "Nama kelompok wajib diisi.";
    if (bMode === "new" && !namaBangunan.trim())
      next.namaBangunan = "Nama bangunan/rumah wajib diisi.";
    if (fMode === "new" && !namaKrt.trim())
      next.namaKrt = "Nama kepala keluarga wajib diisi.";
    setErrors(next);
    setErr("");
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      let kid = Number(kelompokId);
      if (kMode === "new") {
        const r = await postJson("/api/kelompok", {
          nama: namaKelompok.trim(),
          kode: kode.trim(),
        });
        kid = r.id;
      }
      if (!kid) throw new Error("Kelompok belum dipilih.");

      let bid = bMode === "new" ? 0 : Number(bangunanId);
      if (bMode === "new") {
        const r = await postJson("/api/bangunan", {
          kelompok_id: kid,
          nama: namaBangunan.trim(),
          tipe,
          keterangan: "",
        });
        bid = r.id;
      }
      if (!bid) throw new Error("Bangunan belum dipilih.");

      let fid = fMode === "new" ? 0 : Number(keluargaId);
      if (fMode === "new") {
        const r = await postJson("/api/keluarga", {
          bangunan_id: bid,
          nama_krt: namaKrt.trim(),
          catatan: "",
        });
        fid = r.id;
      }
      if (!fid) throw new Error("Keluarga belum dipilih.");

      const nama = fMode === "new" ? namaKrt.trim() : "";
      onDone(fid, nama);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan data.");
    } finally {
      setSaving(false);
    }
  };

  const section = "rounded-xl bg-white p-3.5 ring-1 ring-slate-200";

  return (
    <Modal open={open} onClose={onClose} title="Persiapan Data Warga" wide>
      <div className="rounded-xl bg-emerald-50 px-3.5 py-3 ring-1 ring-inset ring-emerald-100">
        <p className="text-sm font-bold text-emerald-900">Warga harus punya keluarga</p>
        <p className="mt-1 text-xs leading-relaxed text-emerald-800">
          Sebelum mengisi warga, lengkapi 3 data berikut. Cukup sekali saja — setelah ini Anda
          bisa menambah warga lain dengan lebih cepat.
        </p>
      </div>

      <section className={section}>
        <div className="mb-2.5 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
            1
          </span>
          <p className="text-sm font-bold text-slate-800">Kelompok</p>
        </div>

        {struktur.length > 0 && !newKelompok ? (
          <Field label="Pilih kelompok">
            <select
              className={inputCls}
              value={kelompokId}
              onChange={(e) => gantiKelompok(e.target.value)}
            >
              {struktur.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <div className="space-y-2.5">
            <Field
              label="Nama Kelompok"
              required
              error={errors.namaKelompok}
              hint="Contoh: Kelompok 1"
            >
              <input
                className={inputCls}
                placeholder="cth: Kelompok 1"
                value={namaKelompok}
                onChange={(e) => setNamaKelompok(e.target.value)}
              />
            </Field>
            <Field label="Kode Wilayah (opsional)">
              <input
                className={inputCls}
                placeholder="cth: GABUS.011.004.008"
                value={kode}
                onChange={(e) => setKode(e.target.value)}
              />
            </Field>
          </div>
        )}

        {struktur.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (newKelompok) {
                setNewKelompok(false);
                gantiKelompok(kelompokId || String(struktur[0]?.id ?? ""));
              } else {
                setNewKelompok(true);
              }
            }}
            className="mt-2 text-[11px] font-semibold text-emerald-700 hover:underline"
          >
            {newKelompok ? "Pilih kelompok yang sudah ada" : "+ Buat kelompok baru"}
          </button>
        )}
      </section>

      <section className={section}>
        <div className="mb-2.5 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
            2
          </span>
          <p className="text-sm font-bold text-slate-800">Bangunan / Rumah</p>
        </div>

        {bangunanList.length > 0 && !newBangunan ? (
          <Field label="Pilih bangunan">
            <select
              className={inputCls}
              value={bangunanId}
              onChange={(e) => gantiBangunan(e.target.value)}
            >
              {bangunanList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nama}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <div className="space-y-2.5">
            <Field
              label="Nama Bangunan / Rumah"
              required
              error={errors.namaBangunan}
              hint="Contoh: Rumah Bpk. Sudarno"
            >
              <input
                className={inputCls}
                placeholder="cth: Rumah Bpk. Sudarno"
                value={namaBangunan}
                onChange={(e) => setNamaBangunan(e.target.value)}
              />
            </Field>
            <Field label="Status Tempat Tinggal">
              <select
                className={inputCls}
                value={tipe}
                onChange={(e) => setTipe(e.target.value)}
              >
                <option value="milik">Milik Sendiri</option>
                <option value="kontrakan">Kontrakan/Sewa</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </Field>
          </div>
        )}

        {bangunanList.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (newBangunan) {
                setNewBangunan(false);
                gantiBangunan(bangunanId || String(bangunanList[0]?.id ?? ""));
              } else {
                setNewBangunan(true);
              }
            }}
            className="mt-2 text-[11px] font-semibold text-emerald-700 hover:underline"
          >
            {newBangunan ? "Pilih bangunan yang sudah ada" : "+ Buat bangunan baru"}
          </button>
        )}
        {newKelompok && (
          <p className="mt-2 text-[11px] text-slate-400">
            Bangunan ini akan masuk ke kelompok yang baru dibuat.
          </p>
        )}
      </section>

      <section className={section}>
        <div className="mb-2.5 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
            3
          </span>
          <p className="text-sm font-bold text-slate-800">Keluarga</p>
        </div>

        {keluargaList.length > 0 && !newKeluarga ? (
          <Field label="Pilih keluarga (KRT)">
            <select
              className={inputCls}
              value={keluargaId}
              onChange={(e) => setKeluargaId(e.target.value)}
            >
              {keluargaList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nama_krt}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <Field
            label="Nama Kepala Rumah Tangga (KRT)"
            required
            error={errors.namaKrt}
            hint="Nama orang yang menjadi kepala keluarga, contoh: Bpk. Sudarno"
          >
            <input
              className={inputCls}
              placeholder="cth: Bpk. Sudarno"
              value={namaKrt}
              onChange={(e) => setNamaKrt(e.target.value)}
            />
          </Field>
        )}

        {keluargaList.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (newKeluarga) {
                setNewKeluarga(false);
                setKeluargaId(String(keluargaList[0]?.id ?? ""));
              } else {
                setNewKeluarga(true);
              }
            }}
            className="mt-2 text-[11px] font-semibold text-emerald-700 hover:underline"
          >
            {newKeluarga ? "Pilih keluarga yang sudah ada" : "+ Buat keluarga baru"}
          </button>
        )}
        {bMode === "new" && (
          <p className="mt-2 text-[11px] text-slate-400">
            Keluarga ini akan masuk ke bangunan yang baru dibuat.
          </p>
        )}
      </section>

      <div className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-[11px] leading-relaxed text-slate-500">
        <Icon name="check" className="mr-1 inline h-3 w-3 text-emerald-600" />
        Setelah ini Anda langsung mengisi nama, jenis kelamin, dan tanggal lahir warga.
      </div>

      {err && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{err}</p>
      )}

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <Btn variant="secondary" onClick={onClose} disabled={saving}>
          Batal
        </Btn>
        <Btn onClick={simpan} disabled={saving}>
          {saving && <Spinner className="h-3.5 w-3.5" />}
          {saving ? "Menyimpan…" : "Lanjut Isi Data Warga"}
        </Btn>
      </div>
    </Modal>
  );
}
