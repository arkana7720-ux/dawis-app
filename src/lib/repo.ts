import { supabase } from "./supabase";
import {
  hitungUsia,
  kategoriUsia,
  kategori,
  kategoriUsiaBaru,
  KATEGORI_USIA_BARU_LIST,
  isWUS,
  isPUS,
} from "./calc";

type QB<T> = PromiseLike<{ data: T | null; error: { message: string } | null }>;

async function q<T>(promise: QB<T>): Promise<T> {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return data as T;
}

function isMissingColumnErr(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /column .* does not exist/i.test(msg);
}

export interface WargaRow {
  id: number;
  keluarga_id: number | null;
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
  keluarga_catatan: string;
  bangunan_id: number;
  bangunan_nama: string;
  bangunan_tipe: string;
  kelompok_id: number;
  kelompok_nama: string;
  usia: number | null;
  kategori_usia: string;
  kategori: string;
  kategori_usia_baru: string;
  wus: boolean;
  pus: boolean;
}

interface NestedRow {
  id: number;
  keluarga_id: number | null;
  nama: string;
  hubungan: string;
  jenis_kelamin: string;
  tanggal_lahir: string;
  bpjs: string;
  status_kb: string;
  catatan: string;
  status_warga?: string;
  tgl_status_berubah?: string;
  catatan_status?: string;
  is_hamil?: boolean;
  hpl_kehamilan?: string;
  risiko_kehamilan?: string;
  keluarga: {
    id: number;
    nama_krt: string;
    catatan: string;
    urutan: number;
    bangunan: {
      id: number;
      nama: string;
      tipe: string;
      keterangan: string;
      urutan: number;
      kelompok: { id: number; nama: string; kode: string; urutan: number };
    };
  } | null;
}

async function nextUrutan(
  table: "kelompok" | "bangunan" | "keluarga",
  filter?: { col: string; val: number }
): Promise<number> {
  let query = supabase.from(table).select("urutan").order("urutan", { ascending: false }).limit(1);
  if (filter) query = query.eq(filter.col, filter.val);
  const rows = await q<any[]>(query);
  return (rows[0]?.urutan ?? 0) + 1;
}

export async function getAllWarga(): Promise<WargaRow[]> {
  const rows = await q<NestedRow[]>(
    supabase.from("warga").select("*, keluarga(*, bangunan(*, kelompok(*)))")
  );

  const flat = rows.map((r) => {
    const usia = hitungUsia(r.tanggal_lahir);
    return {
      id: r.id,
      keluarga_id: r.keluarga_id,
      nama: r.nama,
      hubungan: r.hubungan,
      jenis_kelamin: r.jenis_kelamin,
      tanggal_lahir: r.tanggal_lahir,
      bpjs: r.bpjs,
      status_kb: r.status_kb,
      catatan: r.catatan,
      status_warga: r.status_warga ?? "aktif",
      tgl_status_berubah: r.tgl_status_berubah ?? "",
      catatan_status: r.catatan_status ?? "",
      is_hamil: !!r.is_hamil,
      hpl_kehamilan: r.hpl_kehamilan ?? "",
      risiko_kehamilan: r.risiko_kehamilan || "normal",
      keluarga_nama: r.keluarga?.nama_krt ?? "",
      keluarga_catatan: r.keluarga?.catatan ?? "",
      bangunan_id: r.keluarga?.bangunan?.id ?? 0,
      bangunan_nama: r.keluarga?.bangunan?.nama ?? "",
      bangunan_tipe: r.keluarga?.bangunan?.tipe ?? "",
      kelompok_id: r.keluarga?.bangunan?.kelompok?.id ?? 0,
      kelompok_nama: r.keluarga?.bangunan?.kelompok?.nama ?? "",
      _kU: r.keluarga?.bangunan?.kelompok?.urutan ?? 0,
      _bU: r.keluarga?.bangunan?.urutan ?? 0,
      _fU: r.keluarga?.urutan ?? 0,
      usia,
      kategori_usia: kategoriUsia(usia),
      kategori: kategori(usia),
      kategori_usia_baru: kategoriUsiaBaru(usia),
      wus: isWUS(r, usia),
      pus: isPUS(r, usia),
    };
  });

  flat.sort((a, b) => a._kU - b._kU || a._bU - b._bU || a._fU - b._fU || a.id - b.id);
  return flat.map(({ _kU, _bU, _fU, ...rest }) => rest);
}

export async function listKelompok() {
  return q<any[]>(supabase.from("kelompok").select("*").order("urutan"));
}

export async function createKelompok(nama: string, kode: string) {
  const urutan = await nextUrutan("kelompok");
  const row = await q<{ id: number }>(
    supabase.from("kelompok").insert({ nama, kode, urutan }).select("id").single()
  );
  return row.id;
}

export async function updateKelompok(id: number, nama: string, kode: string) {
  await q(supabase.from("kelompok").update({ nama, kode }).eq("id", id));
}

export async function deleteKelompok(id: number) {
  await q(supabase.from("kelompok").delete().eq("id", id));
}

export async function createBangunan(data: {
  kelompok_id: number;
  nama: string;
  tipe: string;
  keterangan: string;
}) {
  const urutan = await nextUrutan("bangunan", { col: "kelompok_id", val: data.kelompok_id });
  const row = await q<{ id: number }>(
    supabase.from("bangunan").insert({ ...data, urutan }).select("id").single()
  );
  return row.id;
}

export async function updateBangunan(
  id: number,
  data: { kelompok_id: number; nama: string; tipe: string; keterangan: string }
) {
  await q(supabase.from("bangunan").update(data).eq("id", id));
}

export async function deleteBangunan(id: number) {
  await q(supabase.from("bangunan").delete().eq("id", id));
}

export async function createKeluarga(data: {
  bangunan_id: number;
  nama_krt: string;
  catatan: string;
}) {
  const urutan = await nextUrutan("keluarga", { col: "bangunan_id", val: data.bangunan_id });
  const row = await q<{ id: number }>(
    supabase.from("keluarga").insert({ ...data, urutan }).select("id").single()
  );
  return row.id;
}

export async function updateKeluarga(id: number, data: { nama_krt: string; catatan: string }) {
  await q(supabase.from("keluarga").update(data).eq("id", id));
}

export async function deleteKeluarga(id: number) {
  await q(supabase.from("keluarga").delete().eq("id", id));
}

export interface WargaInput {
  keluarga_id: number;
  nama: string;
  hubungan: string;
  jenis_kelamin: string;
  tanggal_lahir: string;
  bpjs: string;
  status_kb: string;
  catatan: string;
  is_hamil?: boolean;
  hpl_kehamilan?: string;
  risiko_kehamilan?: string;
}

function wargaBaseFields(data: WargaInput) {
  return {
    keluarga_id: data.keluarga_id,
    nama: data.nama,
    hubungan: data.hubungan,
    jenis_kelamin: data.jenis_kelamin,
    tanggal_lahir: data.tanggal_lahir,
    bpjs: data.bpjs,
    status_kb: data.status_kb,
    catatan: data.catatan,
  };
}

function wargaExtraFields(data: WargaInput) {
  return {
    is_hamil: !!data.is_hamil,
    hpl_kehamilan: data.hpl_kehamilan || "",
    risiko_kehamilan: data.risiko_kehamilan === "tinggi" ? "tinggi" : "normal",
  };
}

export async function createWarga(data: WargaInput) {
  try {
    const row = await q<{ id: number }>(
      supabase
        .from("warga")
        .insert({ ...wargaBaseFields(data), ...wargaExtraFields(data) })
        .select("id")
        .single()
    );
    return row.id;
  } catch (e) {
    if (isMissingColumnErr(e)) {
      const row = await q<{ id: number }>(
        supabase.from("warga").insert(wargaBaseFields(data)).select("id").single()
      );
      return row.id;
    }
    throw e;
  }
}

export async function updateWarga(id: number, data: WargaInput) {
  try {
    await q(
      supabase
        .from("warga")
        .update({ ...wargaBaseFields(data), ...wargaExtraFields(data) })
        .eq("id", id)
    );
  } catch (e) {
    if (isMissingColumnErr(e)) {
      await q(supabase.from("warga").update(wargaBaseFields(data)).eq("id", id));
      return;
    }
    throw e;
  }
}

export async function updateStatusWarga(
  id: number,
  data: { status_warga: string; tgl_status_berubah: string; catatan_status: string }
) {
  await q(supabase.from("warga").update(data).eq("id", id));
}

export async function deleteWarga(id: number) {
  await q(supabase.from("warga").delete().eq("id", id));
}

export async function getStruktur() {
  const [kelompok, bangunan, keluarga, warga] = await Promise.all([
    listKelompok(),
    q<any[]>(supabase.from("bangunan").select("*").order("urutan")),
    q<any[]>(supabase.from("keluarga").select("*").order("urutan")),
    getAllWarga(),
  ]);

  return kelompok.map((k) => ({
    ...k,
    bangunan: bangunan
      .filter((b) => b.kelompok_id === k.id)
      .map((b) => ({
        ...b,
        jumlah_warga: warga.filter((w) => w.bangunan_id === b.id && w.status_warga === "aktif").length,
        keluarga: keluarga
          .filter((f) => f.bangunan_id === b.id)
          .map((f) => ({
            ...f,
            anggota: warga.filter((w) => w.keluarga_id === f.id),
          })),
      })),
  }));
}

export async function getStats() {
  const [all, bangunanRows, keluargaRows] = await Promise.all([
    getAllWarga(),
    q<any[]>(supabase.from("bangunan").select("id, kelompok_id")),
    q<any[]>(supabase.from("keluarga").select("id, bangunan_id")),
  ]);

  const aktif = all.filter((x) => x.status_warga === "aktif");

  const byKelompok = (await listKelompok()).map((k) => {
    const w = aktif.filter((x) => x.kelompok_id === k.id);
    const bIds = bangunanRows.filter((b) => b.kelompok_id === k.id).map((b) => b.id);
    const fCount = keluargaRows.filter((f) => bIds.includes(f.bangunan_id)).length;
    return {
      id: k.id,
      nama: k.nama,
      kode: k.kode,
      bangunan: bIds.length,
      keluarga: fCount,
      individu: w.length,
      laki: w.filter((x) => x.jenis_kelamin === "L").length,
      perempuan: w.filter((x) => x.jenis_kelamin === "P").length,
      balita: w.filter((x) => x.kategori === "Balita").length,
      anak: w.filter((x) => x.kategori === "Anak").length,
      remaja: w.filter((x) => x.kategori === "Remaja").length,
      dewasa: w.filter((x) => x.kategori === "Dewasa").length,
      lansia: w.filter((x) => x.kategori === "Lansia").length,
      balita_b: w.filter((x) => x.kategori_usia_baru === "0-5").length,
      anak_b: w.filter((x) => x.kategori_usia_baru === "6-9").length,
      remaja_b: w.filter((x) => x.kategori_usia_baru === "10-24").length,
      dewasa_b: w.filter((x) => x.kategori_usia_baru === "25-59").length,
      lansia_b: w.filter((x) => x.kategori_usia_baru === "60+").length,
      pus: w.filter((x) => x.pus).length,
      wus: w.filter((x) => x.wus).length,
      ibuHamil: w.filter((x) => x.is_hamil).length,
    };
  });

  const total = byKelompok.reduce(
    (a, k) => ({
      bangunan: a.bangunan + k.bangunan,
      keluarga: a.keluarga + k.keluarga,
      individu: a.individu + k.individu,
      laki: a.laki + k.laki,
      perempuan: a.perempuan + k.perempuan,
      balita: a.balita + k.balita,
      anak: a.anak + k.anak,
      remaja: a.remaja + k.remaja,
      dewasa: a.dewasa + k.dewasa,
      lansia: a.lansia + k.lansia,
      balita_b: a.balita_b + k.balita_b,
      anak_b: a.anak_b + k.anak_b,
      remaja_b: a.remaja_b + k.remaja_b,
      dewasa_b: a.dewasa_b + k.dewasa_b,
      lansia_b: a.lansia_b + k.lansia_b,
      pus: a.pus + k.pus,
      wus: a.wus + k.wus,
      ibu_hamil: a.ibu_hamil + k.ibuHamil,
    }),
    {
      bangunan: 0, keluarga: 0, individu: 0, laki: 0, perempuan: 0,
      balita: 0, anak: 0, remaja: 0, dewasa: 0, lansia: 0,
      balita_b: 0, anak_b: 0, remaja_b: 0, dewasa_b: 0, lansia_b: 0,
      pus: 0, wus: 0,
      ibu_hamil: 0,
    }
  );

  const distribusiUsia = [
    "0-4", "5-9", "10-14", "15-19", "20-24", "25-29", "30-34",
    "35-39", "40-44", "45-49", "50-54", "55-59", "60-64", "65+",
  ].map((label) => ({
    label,
    L: aktif.filter((w) => w.kategori_usia === label && w.jenis_kelamin === "L").length,
    P: aktif.filter((w) => w.kategori_usia === label && w.jenis_kelamin === "P").length,
  }));

  const distribusiKategoriBaru = KATEGORI_USIA_BARU_LIST.map((k) => ({
    label: k.range,
    nama: k.nama,
    L: aktif.filter((w) => w.kategori_usia_baru === k.range && w.jenis_kelamin === "L").length,
    P: aktif.filter((w) => w.kategori_usia_baru === k.range && w.jenis_kelamin === "P").length,
  }));

  return {
    totals: {
      ...total,
      pindah: all.filter((x) => x.status_warga === "pindah").length,
      meninggal: all.filter((x) => x.status_warga === "meninggal").length,
    },
    byKelompok,
    distribusiUsia,
    distribusiKategoriBaru,
    kbAktif: aktif.filter((w) => w.status_kb && w.status_kb.trim() !== "").length,
  };
}
