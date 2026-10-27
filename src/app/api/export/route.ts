import { NextResponse } from "next/server";
import { getAllWarga } from "@/lib/repo";
import { fail, unauthorized, withDb } from "@/lib/api";

function esc(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const { db, user } = await withDb();
  if (!user) return unauthorized();

  try {
    const rows = await getAllWarga(db);
    const header = [
      "Kelompok", "Bangunan", "Tipe Bangunan", "Keluarga (KRT)", "Nama",
      "Hubungan", "L/P", "Tanggal Lahir", "Usia", "Kategori Usia", "Kategori",
      "Kategori Usia Baru", "Pendidikan",
      "BPJS", "Status KB", "WUS", "PUS",
    ];
    const lines = [header.join(",")];
    for (const w of rows) {
      lines.push(
        [
          w.kelompok_nama, w.bangunan_nama, w.bangunan_tipe, w.keluarga_nama, w.nama,
          w.hubungan, w.jenis_kelamin, w.tanggal_lahir, w.usia ?? "",
          w.kategori_usia, w.kategori, w.kategori_usia_baru, w.pendidikan, w.bpjs, w.status_kb,
          w.wus ? "WUS" : "Bukan WUS", w.pus ? "PUS" : "Bukan PUS",
        ]
          .map(esc)
          .join(",")
      );
    }
    const csv = "\uFEFF" + lines.join("\r\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="data-dawis-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (e) {
    return fail(e);
  }
}
