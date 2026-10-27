"use client";

import { useState } from "react";
import { Field, Icon, inputCls } from "@/components/ui";

export interface PickerKeluarga {
  id: number;
  nama_krt: string;
  anggota?: Array<{ id: number }>;
}
export interface PickerBangunan {
  id: number;
  nama: string;
  keluarga: PickerKeluarga[];
}
export interface PickerKelompok {
  id: number;
  nama: string;
  bangunan: PickerBangunan[];
}

interface FlatKeluarga {
  kelompok: string;
  bangunan: string;
  keluarga: PickerKeluarga;
}

/**
 * Pemilih keluarga dengan pencarian + pembuatan keluarga/bangunan baru
 * langsung dari form warga, supaya tidak perlu pindah halaman.
 */
export function KeluargaPicker({
  struktur,
  value,
  onChange,
  onCreated,
  error,
  lastUsedId,
}: {
  struktur: PickerKelompok[];
  value: string;
  onChange: (id: string) => void;
  onCreated: (id: number) => void;
  error?: string;
  lastUsedId?: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [cErr, setCErr] = useState("");
  const [saving, setSaving] = useState(false);

  const [cKelompok, setCKelompok] = useState("");
  const [cBangunan, setCBangunan] = useState("");
  const [newBangunan, setNewBangunan] = useState(false);
  const [namaBangunan, setNamaBangunan] = useState("");
  const [tipe, setTipe] = useState("milik");
  const [namaKrt, setNamaKrt] = useState("");

  const flat: FlatKeluarga[] = struktur.flatMap((k) =>
    k.bangunan.flatMap((b) =>
      b.keluarga.map((f) => ({ kelompok: k.nama, bangunan: b.nama, keluarga: f }))
    )
  );

  const selected = flat.find((f) => String(f.keluarga.id) === value);
  const lastUsed = flat.find((f) => f.keluarga.id === lastUsedId);

  const term = q.toLowerCase().trim();
  const filtered = term
    ? flat.filter((f) =>
        `${f.kelompok} ${f.bangunan} ${f.keluarga.nama_krt}`.toLowerCase().includes(term)
      )
    : flat;

  const bangunanList = struktur.find((k) => String(k.id) === cKelompok)?.bangunan ?? [];

  const startCreate = () => {
    setCreating(true);
    setCErr("");
    setQ("");
    const k = struktur[0];
    const b = k?.bangunan[0];
    setCKelompok(String(k?.id ?? ""));
    setCBangunan(String(b?.id ?? ""));
    setNewBangunan(!b);
    setNamaBangunan("");
    setNamaKrt("");
    setTipe("milik");
  };

  const gantiKelompok = (id: string) => {
    setCKelompok(id);
    const b = struktur.find((k) => String(k.id) === id)?.bangunan[0];
    setCBangunan(String(b?.id ?? ""));
    setNewBangunan(!b);
  };

  const simpanBaru = async () => {
    setCErr("");
    if (!cKelompok) return setCErr("Pilih kelompok dulu.");
    if (!namaKrt.trim()) return setCErr("Nama kepala keluarga wajib diisi.");

    setSaving(true);
    try {
      let bangunanId = Number(cBangunan);
      if (newBangunan) {
        if (!namaBangunan.trim()) {
          setCErr("Nama bangunan/rumah wajib diisi.");
          return;
        }
        const res = await fetch("/api/bangunan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kelompok_id: Number(cKelompok),
            nama: namaBangunan.trim(),
            tipe,
            keterangan: "",
          }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          setCErr(j.error || "Gagal membuat bangunan.");
          return;
        }
        bangunanId = Number(j.id);
      }
      if (!bangunanId) {
        setCErr("Pilih bangunan atau buat bangunan baru.");
        return;
      }
      const res = await fetch("/api/keluarga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bangunan_id: bangunanId,
          nama_krt: namaKrt.trim(),
          catatan: "",
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCErr(j.error || "Gagal membuat keluarga.");
        return;
      }
      setCreating(false);
      setOpen(false);
      onCreated(Number(j.id));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sm:col-span-2">
      <Field label="Keluarga (Bangunan)" required error={error}>
        <button
          type="button"
          onClick={() => {
            setOpen(!open);
            setCreating(false);
            setCErr("");
          }}
          className={`${inputCls} flex items-center justify-between gap-2 text-left`}
        >
          <span className={`min-w-0 truncate ${selected ? "text-slate-900" : "text-slate-400"}`}>
            {selected
              ? `${selected.kelompok} › ${selected.bangunan} › ${selected.keluarga.nama_krt}`
              : "Pilih keluarga…"}
          </span>
          <Icon
            name="chevronDown"
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </Field>

      {open && (
        <div className="mt-2 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
          <div className="border-b border-slate-100 p-2.5">
            <div className="relative">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              />
              <input
                autoFocus
                className={`${inputCls} py-2 pl-9 text-sm`}
                placeholder="Ketik nama KRT, bangunan, atau kelompok…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          {creating ? (
            <div className="space-y-2.5 bg-slate-50/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-700">Keluarga baru</p>
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="text-[11px] font-semibold text-slate-400 hover:text-slate-600"
                >
                  Batal
                </button>
              </div>

              {struktur.length === 0 ? (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-700">
                  Belum ada kelompok. Buat kelompok dulu lewat menu Struktur Wilayah.
                </p>
              ) : (
                <>
                  {struktur.length > 1 && (
                    <Field label="Kelompok">
                      <select
                        className={`${inputCls} py-2 text-sm`}
                        value={cKelompok}
                        onChange={(e) => gantiKelompok(e.target.value)}
                      >
                        {struktur.map((k) => (
                          <option key={k.id} value={k.id}>
                            {k.nama}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}

                  {!newBangunan ? (
                    <Field label="Bangunan / Rumah">
                      <select
                        className={`${inputCls} py-2 text-sm`}
                        value={cBangunan}
                        onChange={(e) => setCBangunan(e.target.value)}
                      >
                        {bangunanList.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.nama}
                          </option>
                        ))}
                      </select>
                    </Field>
                  ) : (
                    <>
                      <Field label="Nama Bangunan / Rumah" required>
                        <input
                          className={`${inputCls} py-2 text-sm`}
                          placeholder="cth: Rumah Bpk. Sudarno"
                          value={namaBangunan}
                          onChange={(e) => setNamaBangunan(e.target.value)}
                        />
                      </Field>
                      <Field label="Status Tempat Tinggal">
                        <select
                          className={`${inputCls} py-2 text-sm`}
                          value={tipe}
                          onChange={(e) => setTipe(e.target.value)}
                        >
                          <option value="milik">Milik Sendiri</option>
                          <option value="kontrakan">Kontrakan/Sewa</option>
                          <option value="lainnya">Lainnya</option>
                        </select>
                      </Field>
                    </>
                  )}

                  {!newBangunan && (
                    <button
                      type="button"
                      onClick={() => setNewBangunan(true)}
                      className="text-[11px] font-semibold text-emerald-700 hover:underline"
                    >
                      + Bangunan baru
                    </button>
                  )}

                  <Field label="Nama Kepala Rumah Tangga (KRT)" required>
                    <input
                      className={`${inputCls} py-2 text-sm`}
                      placeholder="cth: Bpk. Sudarno"
                      value={namaKrt}
                      onChange={(e) => setNamaKrt(e.target.value)}
                    />
                  </Field>
                </>
              )}

              {cErr && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-medium text-red-600">
                  {cErr}
                </p>
              )}

              {struktur.length > 0 && (
                <button
                  type="button"
                  onClick={simpanBaru}
                  disabled={saving}
                  className="w-full rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                >
                  {saving ? "Menyimpan…" : "Simpan Keluarga"}
                </button>
              )}
            </div>
          ) : (
            <>
              {lastUsed && !term && String(lastUsed.keluarga.id) !== value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange(String(lastUsed.keluarga.id));
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 border-b border-slate-100 bg-emerald-50/50 px-3 py-2 text-left text-xs hover:bg-emerald-50"
                >
                  <Icon name="refresh" className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-semibold text-emerald-800">Terakhir dipakai: </span>
                    <span className="text-emerald-700">{lastUsed.keluarga.nama_krt}</span>
                  </span>
                </button>
              )}

              <div className="max-h-56 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="px-3 py-6 text-center text-xs text-slate-400">
                    {flat.length === 0
                      ? "Belum ada keluarga. Buat keluarga baru di bawah."
                      : "Tidak ada keluarga yang cocok."}
                  </p>
                ) : (
                  filtered.map((f) => {
                    const aktif = String(f.keluarga.id) === value;
                    const jumlah = f.keluarga.anggota?.length ?? 0;
                    return (
                      <button
                        key={f.keluarga.id}
                        type="button"
                        onClick={() => {
                          onChange(String(f.keluarga.id));
                          setOpen(false);
                          setQ("");
                        }}
                        className={`flex w-full items-center gap-2 border-b border-slate-50 px-3 py-2.5 text-left last:border-0 ${
                          aktif ? "bg-emerald-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-800">
                            {f.keluarga.nama_krt}
                          </span>
                          <span className="block truncate text-[11px] text-slate-400">
                            {f.bangunan} · {f.kelompok}
                          </span>
                        </span>
                        <span className="shrink-0 text-[11px] text-slate-400">
                          {jumlah} anggota
                        </span>
                        {aktif && (
                          <Icon name="check" className="h-4 w-4 shrink-0 text-emerald-600" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              <button
                type="button"
                onClick={startCreate}
                className="flex w-full items-center gap-1.5 border-t border-slate-100 bg-slate-50/70 px-3 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
              >
                <Icon name="plus" className="h-3.5 w-3.5" />
                Buat keluarga baru
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
