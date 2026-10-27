import { NextResponse } from "next/server";
import { updateKelompok, deleteKelompok } from "@/lib/repo";
import { fail, unauthorized, withDb } from "@/lib/api";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { db, user } = await withDb();
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  if (!body.nama?.trim())
    return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
  try {
    await updateKelompok(db, Number(id), body.nama.trim(), body.kode?.trim() || "");
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
    await deleteKelompok(db, Number(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
