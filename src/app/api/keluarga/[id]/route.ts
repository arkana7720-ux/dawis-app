import { NextResponse } from "next/server";
import { updateKeluarga, deleteKeluarga } from "@/lib/repo";
import { fail, unauthorized, withDb } from "@/lib/api";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { db, user } = await withDb();
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  if (!body.nama_krt?.trim())
    return NextResponse.json({ error: "Nama KRT wajib diisi" }, { status: 400 });
  try {
    await updateKeluarga(db, Number(id), {
      nama_krt: body.nama_krt.trim(),
      catatan: body.catatan?.trim() || "",
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
    await deleteKeluarga(db, Number(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
