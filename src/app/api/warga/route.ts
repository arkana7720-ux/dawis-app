import { NextResponse } from "next/server";
import { getAllWarga, createWarga } from "@/lib/repo";
import { parseTanggalLahir, validasiWarga } from "@/lib/calc";
import { fail, unauthorized, withDb } from "@/lib/api";

export async function GET() {
  const { db, user } = await withDb();
  if (!user) return unauthorized();
  try {
    return NextResponse.json(await getAllWarga(db));
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  const { db, user } = await withDb();
  if (!user) return unauthorized();

  const body = await req.json();
  const fields = validasiWarga(body);
  if (!body.keluarga_id) fields.keluarga_id = "Keluarga wajib dipilih.";
  if (Object.keys(fields).length > 0)
    return NextResponse.json(
      { error: Object.values(fields)[0], fields },
      { status: 400 }
    );

  try {
    const id = await createWarga(db, {
      keluarga_id: Number(body.keluarga_id),
      nama: body.nama.trim(),
      hubungan: body.hubungan?.trim() || "",
      jenis_kelamin: String(body.jenis_kelamin).toUpperCase(),
      tanggal_lahir: parseTanggalLahir(body.tanggal_lahir),
      bpjs: body.bpjs?.trim() || "",
      status_kb: body.status_kb?.trim() || "",
      catatan: body.catatan?.trim() || "",
      is_hamil: !!body.is_hamil,
      hpl_kehamilan: parseTanggalLahir(body.hpl_kehamilan),
      risiko_kehamilan: body.risiko_kehamilan === "tinggi" ? "tinggi" : "normal",
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    return fail(e);
  }
}
