import fs from "fs";
import path from "path";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv();

import { parseTanggalLahir } from "../src/lib/calc";

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else field += c;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function clean(s?: string): string {
  return (s || "").replace(/\s+/g, " ").trim();
}

interface ParsedBangunan {
  nama: string;
  tipe: string;
  keterangan: string;
}

function parseBangunanName(raw: string): ParsedBangunan {
  let tipe = "milik";
  const ketParts: string[] = [];
  let nama = clean(raw.replace(/\(([^)]*)\)/g, (_m, inner: string) => {
    const t = clean(inner);
    const low = t.toLowerCase();
    if (low.startsWith("kontrakan")) {
      tipe = "kontrakan";
      const rest = clean(t.slice("kontrakan".length));
      if (rest) ketParts.push(rest);
      return "";
    }
    ketParts.push(t);
    return "";
  }));
  nama = clean(nama);
  return { nama, tipe, keterangan: ketParts.join(", ") };
}

async function main() {
  const { supabase } = await import("../src/lib/supabase");

  async function insertRow(table: string, payload: any): Promise<number> {
    const { data, error } = await supabase.from(table).insert(payload).select("id").single();
    if (error) throw new Error(`${table}: ${error.message}`);
    return data.id;
  }

  const csvPath = path.join(process.cwd(), "data", "source-dawis.csv");
  const rows = parseCSV(fs.readFileSync(csvPath, "utf8"));

  console.log("Menghapus data lama di Supabase...");
  const { error: delErr } = await supabase.from("kelompok").delete().neq("id", 0);
  if (delErr) throw new Error(delErr.message);

let currentKelompokId: number | null = null;
let currentBangunanId: number | null = null;
let currentKeluargaId: number | null = null;
let inDetail = false;
let bangunanUrutan = 0;
let keluargaUrutan = 0;
let kelompokUrutan = 0;
const stats = { kelompok: 0, bangunan: 0, keluarga: 0, warga: 0 };

for (const r of rows) {
  const cols = r.slice(1);
  const c = (i: number) => clean(cols[i] ?? "");
  const col0 = c(0);

  const kelMatch = col0.match(/^KELOMPOK\s*(\d+)\s*:\s*(.+)$/i);
  if (kelMatch) {
    currentKelompokId = await insertRow("kelompok", {
      nama: `Kelompok ${kelMatch[1]}`,
      kode: clean(kelMatch[2]),
      urutan: ++kelompokUrutan,
    });
    stats.kelompok++;
    bangunanUrutan = 0;
    currentBangunanId = null;
    currentKeluargaId = null;
    inDetail = false;
    continue;
  }

  if (col0.toUpperCase() === "NO" && c(1).toUpperCase() === "BANGUNAN") {
    inDetail = true;
    continue;
  }
  if (!inDetail) continue;
  if (!col0 && !c(1) && !c(2) && !c(3)) continue;
  if (currentKelompokId === null) continue;

  if (col0 && /^\d+$/.test(col0)) {
    const parsed = parseBangunanName(c(1));
    currentBangunanId = await insertRow("bangunan", {
      kelompok_id: currentKelompokId,
      nama: parsed.nama,
      tipe: parsed.tipe,
      keterangan: parsed.keterangan,
      urutan: ++bangunanUrutan,
    });
    stats.bangunan++;
    currentKeluargaId = null;
    keluargaUrutan = 0;
  }

  const krtName = c(2);
  if (krtName && currentBangunanId !== null) {
    let famNama = krtName;
    let catatan = "";
    const mOrang = famNama.match(/\((\d+\s*orang)\)/i);
    if (mOrang) {
      catatan = mOrang[1];
      famNama = clean(famNama.replace(mOrang[0], ""));
    }
    currentKeluargaId = await insertRow("keluarga", {
      bangunan_id: currentBangunanId,
      nama_krt: famNama,
      catatan,
      urutan: ++keluargaUrutan,
    });
    stats.keluarga++;
  }

  const individu = c(3);
  if (individu && currentKeluargaId !== null) {
    await insertRow("warga", {
      keluarga_id: currentKeluargaId,
      nama: individu,
      hubungan: c(4),
      jenis_kelamin: c(8).toUpperCase() === "P" ? "P" : c(8).toUpperCase() === "L" ? "L" : "",
      tanggal_lahir: parseTanggalLahir(c(6)),
      bpjs: c(10),
      status_kb: c(11),
    });
    stats.warga++;
  }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
