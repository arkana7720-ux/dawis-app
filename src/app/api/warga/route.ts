import { NextResponse } from "next/server";
import { getAllWarga, createWarga } from "@/lib/repo";
import { parseTanggalLahir } from "@/lib/calc";

export async function GET() {
  try {
    return NextResponse.json(await getAllWarga());
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.keluarga_id)
    return NextResponse.json({ error: "Keluarga wajib dipilih" }, { status: 400 });
  if (!body.nama?.trim())
    return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
  try {
    const id = await createWarga({
      keluarga_id: Number(body.keluarga_id),
      nama: body.nama.trim(),
      hubungan: body.hubungan?.trim() || "",
      jenis_kelamin: body.jenis_kelamin || "",
      tanggal_lahir: parseTanggalLahir(body.tanggal_lahir),
      bpjs: body.bpjs?.trim() || "",
      status_kb: body.status_kb?.trim() || "",
      catatan: body.catatan?.trim() || "",
      is_hamil: !!body.is_hamil,
      hpl_kehamilan: parseTanggalLahir(body.hpl_kehamilan),
      risiko_kehamilan: body.risiko_kehamilan === "tinggi" ? "tinggi" : "normal",
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
