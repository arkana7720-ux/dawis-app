import { NextResponse } from "next/server";
import { createKeluarga } from "@/lib/repo";
import { fail, unauthorized, withDb } from "@/lib/api";

export async function POST(req: Request) {
  const { db, user } = await withDb();
  if (!user) return unauthorized();

  const body = await req.json();
  if (!body.bangunan_id)
    return NextResponse.json({ error: "Bangunan wajib dipilih" }, { status: 400 });
  if (!body.nama_krt?.trim())
    return NextResponse.json({ error: "Nama KRT wajib diisi" }, { status: 400 });
  try {
    const id = await createKeluarga(db, {
      bangunan_id: Number(body.bangunan_id),
      nama_krt: body.nama_krt.trim(),
      catatan: body.catatan?.trim() || "",
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    return fail(e);
  }
}
