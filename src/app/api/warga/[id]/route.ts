import { NextResponse } from "next/server";
import { updateWarga, updateStatusWarga, deleteWarga } from "@/lib/repo";
import { parseTanggalLahir, validasiWarga, STATUS_WARGA_LIST } from "@/lib/calc";
import { fail, unauthorized, withDb } from "@/lib/api";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { db, user } = await withDb();
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  const fields = validasiWarga(body);
  if (!body.keluarga_id) fields.keluarga_id = "Keluarga wajib dipilih.";
  if (Object.keys(fields).length > 0)
    return NextResponse.json(
      { error: Object.values(fields)[0], fields },
      { status: 400 }
    );

  try {
    await updateWarga(db, Number(id), {
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
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { db, user } = await withDb();
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  if (!STATUS_WARGA_LIST.includes(body.status_warga))
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  try {
    await updateStatusWarga(db, Number(id), {
      status_warga: body.status_warga,
      tgl_status_berubah: parseTanggalLahir(body.tgl_status_berubah),
      catatan_status: body.catatan_status?.trim() || "",
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { db, user } = await withDb();
  if (!user) return unauthorized();

  const { id } = await params;
  try {
    await deleteWarga(db, Number(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
