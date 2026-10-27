"use client";

import { useState } from "react";
import { Field, Icon, inputCls } from "@/components/ui";
import {
  HUBUNGAN_LIST,
  STATUS_KB_LIST,
  RISIKO_KEHAMILAN_LIST,
  hitungUsia,
} from "@/lib/calc";

export interface WargaFormValues {
  nama: string;
  hubungan: string;
  jenis_kelamin: string;
  tanggal_lahir: string;
  bpjs: string;
  status_kb: string;
  catatan: string;
  is_hamil: boolean;
  hpl_kehamilan: string;
  risiko_kehamilan: string;
}

export const emptyWargaValues: WargaFormValues = {
  nama: "",
  hubungan: "",
  jenis_kelamin: "",
  tanggal_lahir: "",
  bpjs: "",
  status_kb: "",
  catatan: "",
  is_hamil: false,
  hpl_kehamilan: "",
  risiko_kehamilan: "normal",
};

/**
 * Field data warga yang dipakai bersama oleh halaman Data Warga dan Struktur
 * Wilayah, supaya data yang ditangkap selalu sama (termasuk data kehamilan).
 */
export function WargaFields({
  value,
  onChange,
  errors = {},
  autoFocusNama = false,
}: {
  value: WargaFormValues;
  onChange: (value: WargaFormValues) => void;
  errors?: Record<string, string>;
  autoFocusNama?: boolean;
}) {
  const [mode, setMode] = useState<"full" | "year">(
    /^\d{4}$/.test(value.tanggal_lahir) ? "year" : "full"
  );
  const [kbOpen, setKbOpen] = useState(false);
  const [optionalOpen, setOptionalOpen] = useState(
    Boolean(value.bpjs || value.catatan || value.status_kb)
  );

  const set = (patch: Partial<WargaFormValues>) => onChange({ ...value, ...patch });

  const usia = hitungUsia(value.tanggal_lahir);
  const female = value.jenis_kelamin === "P";
  const kbVisible =
    female &&
    ((usia !== null && usia >= 15 && usia <= 49) || usia === null || !!value.status_kb || kbOpen);
  const hamilEligible =
    female && ((usia !== null && usia >= 15 && usia <= 49) || value.is_hamil);

  const today = new Date().toISOString().slice(0, 10);
  const tglHint =
    usia !== null
      ? /^\d{4}$/.test(value.tanggal_lahir)
        ? `Usia diperkirakan ${usia} tahun (dari tahun lahir).`
        : `Usia saat ini ${usia} tahun.`
      : mode === "year"
        ? "Cukup tahunnya, contoh 1980."
        : "Pilih tanggal, bulan, dan tahun.";

  const pilihJk = (jk: "L" | "P") => {
    set({ jenis_kelamin: jk, ...(jk === "L" ? { is_hamil: false } : {}) });
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Nama Lengkap" required error={errors.nama}>
        <input
          id="warga-nama"
          className={inputCls}
          autoFocus={autoFocusNama}
          autoComplete="off"
          placeholder="cth: Siti Aminah"
          value={value.nama}
          onChange={(e) => set({ nama: e.target.value })}
        />
      </Field>

      <Field label="Jenis Kelamin" required error={errors.jenis_kelamin}>
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: "L" as const, label: "Laki-laki" },
            { v: "P" as const, label: "Perempuan" },
          ].map((o) => {
            const active = value.jenis_kelamin === o.v;
            return (
              <button
                key={o.v}
                type="button"
                aria-pressed={active}
                onClick={() => pilihJk(o.v)}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold ring-1 transition-all ${
                  active
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-300"
                    : "bg-white text-slate-500 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Tanggal Lahir" required error={errors.tanggal_lahir} hint={tglHint}>
        {mode === "full" ? (
          <input
            type="date"
            max={today}
            className={inputCls}
            value={/^\d{4}-\d{2}-\d{2}$/.test(value.tanggal_lahir) ? value.tanggal_lahir : ""}
            onChange={(e) => set({ tanggal_lahir: e.target.value })}
          />
        ) : (
          <input
            className={inputCls}
            inputMode="numeric"
            maxLength={4}
            placeholder="cth: 1980"
            value={value.tanggal_lahir}
            onChange={(e) => set({ tanggal_lahir: e.target.value.replace(/\D/g, "").slice(0, 4) })}
          />
        )}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            if (mode === "full") {
              setMode("year");
              set({ tanggal_lahir: value.tanggal_lahir.slice(0, 4) });
            } else {
              setMode("full");
              set({ tanggal_lahir: "" });
            }
          }}
          className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline"
        >
          <Icon name="calendar" className="h-3 w-3" />
          {mode === "full" ? "Hanya tahu tahun lahir" : "Isi tanggal lengkap"}
        </button>
      </Field>

      <Field label="Hubungan dalam Keluarga" hint="KRT = kepala rumah tangga.">
        <select
          className={inputCls}
          value={value.hubungan}
          onChange={(e) => set({ hubungan: e.target.value })}
        >
          <option value="">— Pilih —</option>
          {HUBUNGAN_LIST.map((h) => (
            <option key={h}>{h}</option>
          ))}
        </select>
      </Field>

      {kbVisible && (
        <Field label="Status KB" hint="Pilih alat kontrasepsi yang sedang dipakai (opsional).">
          <select
            className={inputCls}
            value={value.status_kb}
            onChange={(e) => set({ status_kb: e.target.value })}
          >
            {STATUS_KB_LIST.map((s) => (
              <option key={s || "-"} value={s}>
                {s || "— Tidak KB —"}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div className={kbVisible ? "" : "sm:col-span-2"}>
        <button
          type="button"
          onClick={() => setOptionalOpen(!optionalOpen)}
          className="flex w-full items-center justify-between gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-left ring-1 ring-inset ring-slate-100 transition-colors hover:bg-slate-100"
        >
          <span className="min-w-0">
            <span className="block text-xs font-bold text-slate-600">Detail tambahan</span>
            <span className="block text-[11px] text-slate-400">BPJS & catatan — boleh dilewati</span>
          </span>
          <Icon
            name="chevronDown"
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
              optionalOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {optionalOpen && (
        <>
          <Field
            label="No. BPJS (opsional)"
            hint="Nomor BPJS/KIS. Kosongkan jika tidak ada."
          >
            <input
              className={inputCls}
              inputMode="numeric"
              placeholder="cth: 0001234567890"
              value={value.bpjs}
              onChange={(e) => set({ bpjs: e.target.value })}
            />
          </Field>
          <Field label="Catatan (opsional)">
            <input
              className={inputCls}
              placeholder="cth: baru pindah, perlu verifikasi"
              value={value.catatan}
              onChange={(e) => set({ catatan: e.target.value })}
            />
          </Field>
          {!kbVisible && (
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={() => setKbOpen(true)}
                className="text-[11px] font-semibold text-emerald-700 hover:underline"
              >
                Tampilkan status KB
              </button>
            </div>
          )}
        </>
      )}

      {hamilEligible && (
        <div className="rounded-xl bg-rose-50/70 p-3.5 ring-1 ring-inset ring-rose-100 sm:col-span-2">
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span className="min-w-0">
              <span className="block text-sm font-bold text-slate-700">🤰 Sedang Hamil</span>
              <span className="block text-xs text-slate-400">
                Aktifkan untuk tracking kehamilan ibu ini
              </span>
            </span>
            <input
              type="checkbox"
              className="peer sr-only"
              checked={value.is_hamil}
              onChange={(e) => set({ is_hamil: e.target.checked })}
            />
            <span className="relative h-6 w-11 shrink-0 rounded-full bg-slate-200 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-emerald-500 peer-checked:after:translate-x-5" />
          </label>
          {value.is_hamil && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Perkiraan Lahir / HPL">
                <input
                  type="date"
                  className={inputCls}
                  value={
                    /^\d{4}-\d{2}-\d{2}$/.test(value.hpl_kehamilan)
                      ? value.hpl_kehamilan
                      : ""
                  }
                  onChange={(e) => set({ hpl_kehamilan: e.target.value })}
                />
              </Field>
              <Field label="Risiko Kehamilan">
                <select
                  className={inputCls}
                  value={value.risiko_kehamilan}
                  onChange={(e) => set({ risiko_kehamilan: e.target.value })}
                >
                  {RISIKO_KEHAMILAN_LIST.map((r) => (
                    <option key={r} value={r}>
                      {r === "normal" ? "Normal" : "Risiko Tinggi"}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
