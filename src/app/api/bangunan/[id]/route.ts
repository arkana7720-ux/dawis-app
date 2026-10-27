import { NextResponse } from "next/server";
import { updateBangunan, deleteBangunan } from "@/lib/repo";
import { fail, unauthorized, withDb } from "@/lib/api";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { db, user } = await withDb();
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  if (!body.nama?.trim())
    return NextResponse.json({ error: "Nama bangunan wajib diisi" }, { status: 400 });
  try {
    await updateBangunan(db, Number(id), {
      kelompok_id: Number(body.kelompok_id),
      nama: body.nama.trim(),
      tipe: body.tipe || "milik",
      keterangan: body.keterangan?.trim() || "",
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
    await deleteBangunan(db, Number(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
