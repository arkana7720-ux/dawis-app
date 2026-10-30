"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { invalidateApi } from "@/lib/clientApi";
import {
  Avatar,
  Badge,
  Btn,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  Icon,
  Modal,
  PageHeader,
  Skeleton,
  StatCard,
  inputCls,
} from "@/components/ui";

interface Akun {
  id: string;
  username: string;
  nama: string;
  created_at: string;
  is_admin: boolean;
  aktif: boolean;
  terakhir_masuk: string | null;
  jumlah_kelompok: number;
  jumlah_bangunan: number;
  jumlah_keluarga: number;
  jumlah_warga: number;
}

const KATA = ["Mawar", "Melati", "Kenanga", "Anggrek", "Cempaka", "Dahlia", "Seroja"];

function passwordAcak(): string {
  const kata = KATA[Math.floor(Math.random() * KATA.length)];
  const angka = Math.floor(100 + Math.random() * 900);
  return `${kata}${angka}`;
}

function tanggal(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function pesanDari(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

async function kirim(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Gagal (HTTP ${res.status})`);
  return body;
}

/* -------------------------------------------------------------------------- */
/* Modal kelola satu akun                                                     */
/* -------------------------------------------------------------------------- */

function KelolaModal({
  akun,
  semua,
  saya,
  onClose,
  onChanged,
}: {
  akun: Akun;
  semua: Akun[];
  saya: string;
  onClose: () => void;
  onChanged: (pesan: string) => Promise<void> | void;
}) {
  const [nama, setNama] = useState(akun.nama);
  const [aktif, setAktif] = useState(akun.aktif);
  const [pass, setPass] = useState("");
  const [passBaru, setPassBaru] = useState("");
  const [target, setTarget] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [paham, setPaham] = useState(false);
  const [sibuk, setSibuk] = useState("");
  const [pesan, setPesan] = useState<{ ok: boolean; text: string } | null>(null);

  const diriSendiri = akun.id === saya;
  const punyaData = akun.jumlah_kelompok > 0 || akun.jumlah_warga > 0;
  const ringkasanData = `${akun.jumlah_kelompok} kelompok, ${akun.jumlah_bangunan} bangunan, ${akun.jumlah_keluarga} keluarga, ${akun.jumlah_warga} warga`;
  const tujuan = semua.filter((a) => a.id !== akun.id && a.aktif);
  const cocok = konfirmasi.trim().toLowerCase() === akun.username.toLowerCase();

  const jalankan = async (kunci: string, aksi: () => Promise<void>) => {
    setSibuk(kunci);
    setPesan(null);
    try {
      await aksi();
    } catch (e) {
      setPesan({ ok: false, text: pesanDari(e) });
    } finally {
      setSibuk("");
    }
  };

  const simpanNama = () =>
    jalankan("nama", async () => {
      const baru = nama.trim();
      if (baru.length < 2) throw new Error("Nama minimal 2 karakter.");
      await kirim(`/api/admin/accounts/${akun.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: baru }),
      });
      setNama(baru);
      setPesan({ ok: true, text: "Nama berhasil diperbarui." });
      await onChanged("Nama akun diperbarui");
    });

  const gantiStatus = () =>
    jalankan("status", async () => {
      const baru = !aktif;
      await kirim(`/api/admin/accounts/${akun.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aktif: baru }),
      });
      setAktif(baru);
      setPesan({
        ok: true,
        text: baru
          ? "Akun diaktifkan kembali. Ibu tersebut sudah bisa login."
          : "Akun dinonaktifkan. Data warga tetap aman, hanya login yang diblokir.",
      });
      await onChanged(baru ? "Akun diaktifkan" : "Akun dinonaktifkan");
    });

  const resetPassword = () =>
    jalankan("pass", async () => {
      if (pass.length < 6) throw new Error("Password minimal 6 karakter.");
      await kirim(`/api/admin/accounts/${akun.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass }),
      });
      setPassBaru(pass);
      setPass("");
      setPesan({ ok: true, text: "Password berhasil diganti." });
      await onChanged("Password diganti");
    });

  const pindahkan = () =>
    jalankan("pindah", async () => {
      if (!target) throw new Error("Pilih akun tujuan dulu.");
      const hasil = await kirim(`/api/admin/accounts/${akun.id}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: target }),
      });
      await onChanged(`Data dipindahkan (${hasil.warga} warga)`);
      onClose();
    });

  const hapus = () =>
    jalankan("hapus", async () => {
      if (!cocok) throw new Error("Ketik username akun dengan benar untuk konfirmasi.");
      if (punyaData && !paham)
        throw new Error('Centang "saya paham data ikut terhapus" terlebih dahulu.');
      const q = new URLSearchParams({ confirm: konfirmasi.trim() });
      if (punyaData) q.set("paksa", "1");
      await kirim(`/api/admin/accounts/${akun.id}?${q.toString()}`, { method: "DELETE" });
      await onChanged(`Akun ${akun.username.toUpperCase()} dihapus permanen`);
      onClose();
    });

  return (
    <Modal open onClose={onClose} title={`Kelola ${akun.nama || akun.username}`} wide>
      <div className="rounded-xl bg-white/70 px-4 py-3 ring-1 ring-white/70">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-bold uppercase tracking-wider text-emerald-700">
            {akun.username}
          </span>
          {akun.is_admin && <Badge color="violet">Admin</Badge>}
          {diriSendiri && <Badge color="green">Akun Anda</Badge>}
          {!aktif && <Badge color="red">Nonaktif</Badge>}
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          Daftar {tanggal(akun.created_at)} · {akun.jumlah_kelompok} kelompok ·{" "}
          {akun.jumlah_bangunan} bangunan · {akun.jumlah_keluarga} keluarga ·{" "}
          {akun.jumlah_warga} jiwa
        </p>
      </div>

      {pesan && (
        <div
          className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs font-medium ring-1 ${
            pesan.ok
              ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
              : "bg-red-50 text-red-700 ring-red-100"
          }`}
        >
          <Icon name={pesan.ok ? "check" : "alert"} className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{pesan.text}</span>
        </div>
      )}

      {/* Nama */}
      <div className="space-y-2 rounded-xl border border-white/70 bg-white/40 p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          Nama tampil
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            className={`${inputCls} min-w-0 flex-1`}
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Nama lengkap ibu Dawis"
          />
          <Btn size="sm" onClick={simpanNama} disabled={sibuk === "nama" || nama.trim() === akun.nama}>
            {sibuk === "nama" ? "Menyimpan..." : "Simpan"}
          </Btn>
        </div>
        <p className="text-[11px] text-slate-500">
          Nama ini yang tampil di sidebar akun tersebut, bukan username.
        </p>
      </div>

      {/* Password */}
      <div className="space-y-2 rounded-xl border border-white/70 bg-white/40 p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          Reset password
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            className={`${inputCls} min-w-0 flex-1`}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="Password baru (min. 6 karakter)"
            autoComplete="new-password"
          />
          <Btn size="sm" variant="secondary" onClick={() => setPass(passwordAcak())}>
            Acak
          </Btn>
          <Btn size="sm" onClick={resetPassword} disabled={sibuk === "pass" || pass.length < 6}>
            {sibuk === "pass" ? "Menyimpan..." : "Simpan"}
          </Btn>
        </div>
        {passBaru && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 ring-1 ring-emerald-100">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                Password baru
              </p>
              <p className="font-mono text-sm font-bold text-emerald-800">{passBaru}</p>
            </div>
            <Btn
              size="sm"
              variant="ghost"
              onClick={() => navigator.clipboard?.writeText(passBaru)}
            >
              Salin
            </Btn>
          </div>
        )}
        <p className="text-[11px] text-slate-500">
          Berikan password ini ke ibu tersebut, lalu minta ia menggantinya di menu Akun Saya.
        </p>
      </div>

      {/* Status */}
      {!diriSendiri && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/70 bg-white/40 p-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Status akun
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {aktif
                ? "Akun aktif dan bisa login."
                : "Akun dinonaktifkan. Data warga tetap tersimpan."}
            </p>
          </div>
          <Btn
            size="sm"
            variant={aktif ? "secondary" : "primary"}
            onClick={gantiStatus}
            disabled={sibuk === "status"}
          >
            {sibuk === "status" ? "Memproses..." : aktif ? "Nonaktifkan" : "Aktifkan"}
          </Btn>
        </div>
      )}

      {/* Pindah data */}
      {!diriSendiri && punyaData && tujuan.length > 0 && (
        <div className="space-y-2 rounded-xl border border-white/70 bg-white/40 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Pindahkan data ke akun lain
          </p>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Gunakan ini kalau ibu tersebut salah daftar dan datanya harus ikut pindah. Seluruh
            kelompok beserta isinya akan menjadi milik akun tujuan.
          </p>
          <div className="flex flex-wrap gap-2">
            <select
              className={`${inputCls} min-w-0 flex-1`}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="">Pilih akun tujuan…</option>
              {tujuan.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nama || "(tanpa nama)"} — {a.username.toUpperCase()}
                </option>
              ))}
            </select>
            <Btn
              size="sm"
              variant="secondary"
              onClick={pindahkan}
              disabled={sibuk === "pindah" || !target}
            >
              <Icon name="swap" className="h-4 w-4" />
              {sibuk === "pindah" ? "Memindahkan..." : "Pindahkan"}
            </Btn>
          </div>
        </div>
      )}

      {/* Hapus */}
      {!diriSendiri && (
        <div className="space-y-2 rounded-xl bg-red-50/60 p-3 ring-1 ring-red-100">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-red-600">
            <Icon name="alert" className="h-3.5 w-3.5" />
            Hapus permanen
          </p>
          <p className="text-[11px] leading-relaxed text-red-700/80">
            {punyaData
              ? `Akun ini masih memiliki data: ${ringkasanData}. Menghapus akun akan ikut menghapus SEMUA data tersebut dan tidak bisa dikembalikan. Sebaiknya pindahkan datanya dulu.`
              : "Akun belum memiliki data. Penghapusan tidak bisa dibatalkan."}
          </p>
          <input
            className={inputCls}
            value={konfirmasi}
            onChange={(e) => setKonfirmasi(e.target.value)}
            placeholder={`Ketik ${akun.username.toUpperCase()} untuk konfirmasi`}
            autoComplete="off"
            spellCheck={false}
          />
          {punyaData && (
            <label className="flex items-start gap-2 text-[11px] font-medium text-red-700">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-red-300"
                checked={paham}
                onChange={(e) => setPaham(e.target.checked)}
              />
              Saya paham seluruh data akun ini akan ikut terhapus permanen.
            </label>
          )}
          <Btn
            size="sm"
            variant="danger"
            onClick={hapus}
            disabled={sibuk === "hapus" || !cocok || (punyaData && !paham)}
          >
            <Icon name="trash" className="h-4 w-4" />
            {sibuk === "hapus" ? "Menghapus..." : "Hapus akun permanen"}
          </Btn>
        </div>
      )}
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Halaman                                                                    */
/* -------------------------------------------------------------------------- */

export default function AdminPage() {
  const [akun, setAkun] = useState<Akun[] | null>(null);
  const [saya, setSaya] = useState("");
  const [ditolak, setDitolak] = useState(false);
  const [err, setErr] = useState("");
  const [cari, setCari] = useState("");
  const [pilih, setPilih] = useState<Akun | null>(null);
  const [toast, setToast] = useState("");

  const muat = useCallback(async (): Promise<Akun[]> => {
    setErr("");
    const res = await fetch("/api/admin/accounts");
    const body = await res.json().catch(() => ({}));
    if (res.status === 403) {
      setDitolak(true);
      return [];
    }
    if (!res.ok) throw new Error(body.error || "Gagal memuat daftar akun");
    setAkun(body.accounts);
    setSaya(body.saya);
    return body.accounts as Akun[];
  }, []);

  const load = useCallback(() => {
    muat().catch((e) => setErr(pesanDari(e)));
  }, [muat]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const segarkan = async (pesan: string) => {
    setToast(pesan);
    invalidateApi();
    try {
      const list = await muat();
      setPilih((p) => (p ? list.find((a) => a.id === p.id) ?? null : null));
    } catch (e) {
      setErr(pesanDari(e));
    }
  };

  const daftar = useMemo(() => {
    const q = cari.trim().toLowerCase();
    if (!q) return akun ?? [];
    return (akun ?? []).filter((a) =>
      `${a.nama} ${a.username}`.toLowerCase().includes(q)
    );
  }, [akun, cari]);

  const totalWarga = (akun ?? []).reduce((n, a) => n + a.jumlah_warga, 0);
  const nonaktif = (akun ?? []).filter((a) => !a.aktif).length;

  if (ditolak) {
    return (
      <>
        <PageHeader title="Kelola Akun" subtitle="Panel pengelola Dawis" />
        <Card className="p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 text-amber-500 ring-1 ring-amber-200/60 backdrop-blur-md">
            <Icon name="key" className="h-7 w-7" />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-700">
            Halaman ini hanya untuk pengelola akun
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">
            Akun Anda bukan admin. Hubungi pengelola Dawis jika perlu mengubah atau menghapus akun.
          </p>
          <div className="mt-4 flex justify-center">
            <Link href="/">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-white/80 backdrop-blur-md">
                Kembali ke Dashboard
              </span>
            </Link>
          </div>
        </Card>
      </>
    );
  }

  if (err) return <ErrorState message={err} onRetry={load} />;

  return (
    <>
      <PageHeader
        title="Kelola Akun"
        subtitle="Reset password, perbaiki nama, atau hapus akun yang salah daftar"
        actions={
          <Btn variant="secondary" onClick={load} disabled={!akun}>
            <Icon name="refresh" className="h-4 w-4" />
            Segarkan
          </Btn>
        }
      />

      <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-white/70 bg-white/60 px-4 py-3 shadow-sm shadow-slate-900/5 ring-1 ring-emerald-100/60 backdrop-blur-md">
        <Icon name="key" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <p className="text-xs leading-relaxed text-emerald-900/80">
          Panel ini hanya mengelola <b>akun</b>. Data warga tiap kelompok tetap tidak dapat dibuka
          dari sini — hanya pemiliknya yang bisa melihat dan mengubahnya.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Akun"
          value={akun ? akun.length : "–"}
          sub="terdaftar"
          icon="users"
          tint="from-emerald-100/80 via-white/40 to-teal-100/60"
          accent="from-emerald-500 to-teal-600"
        />
        <StatCard
          label="Nonaktif"
          value={akun ? nonaktif : "–"}
          sub="tidak bisa login"
          icon="alert"
          tint="from-amber-100/80 via-white/40 to-orange-100/60"
          accent="from-amber-400 to-orange-500"
        />
        <StatCard
          className="col-span-2 sm:col-span-1"
          label="Warga"
          value={akun ? totalWarga : "–"}
          sub="seluruh akun"
          icon="family"
          tint="from-violet-100/80 via-white/40 to-purple-100/60"
          accent="from-violet-500 to-purple-600"
        />
      </div>

      <Card>
        <CardHeader
          title="Daftar Akun"
          desc="Semua ibu Dawis yang sudah mendaftar"
          action={
            <div className="relative">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              />
              <input
                className={`${inputCls} w-56 pl-9`}
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                placeholder="Cari nama / username"
              />
            </div>
          }
        />

        {!akun ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : daftar.length === 0 ? (
          <EmptyState message={cari ? "Tidak ada akun yang cocok." : "Belum ada akun."} />
        ) : (
          <ul className="divide-y divide-white/60">
            {daftar.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-emerald-50/50 sm:px-5">
                <Avatar name={a.nama || a.username} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {a.nama || "(tanpa nama)"}
                    </p>
                    {a.id === saya && <Badge color="green">Anda</Badge>}
                    {a.is_admin && <Badge color="violet">Admin</Badge>}
                    {!a.aktif && <Badge color="red">Nonaktif</Badge>}
                  </div>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                    {a.username}
                    <span className="ml-2 font-sans normal-case tracking-normal text-slate-500">
                      · {a.jumlah_kelompok} kelompok · {a.jumlah_warga} jiwa
                    </span>
                  </p>
                </div>
                <Btn size="sm" variant="secondary" onClick={() => setPilih(a)}>
                  Kelola
                </Btn>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="mt-4 px-1 text-[11px] leading-relaxed text-slate-500">
        Menghapus akun akan menghapus seluruh data miliknya (kelompok, bangunan, keluarga, warga).
        Untuk akun yang sudah punya data, pindahkan dulu datanya ke akun lain lewat tombol Kelola.
      </p>

      {pilih && (
        <KelolaModal
          key={pilih.id}
          akun={pilih}
          semua={akun ?? []}
          saya={saya}
          onClose={() => setPilih(null)}
          onChanged={segarkan}
        />
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xl md:bottom-8">
          {toast}
        </div>
      )}
    </>
  );
}
