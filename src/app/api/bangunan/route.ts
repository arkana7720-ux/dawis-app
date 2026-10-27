import { NextResponse } from "next/server";
import { getStruktur, createBangunan } from "@/lib/repo";
import { fail, unauthorized, withDb } from "@/lib/api";

export async function GET() {
  const { db, user } = await withDb();
  if (!user) return unauthorized();
  try {
    return NextResponse.json(await getStruktur(db));
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  const { db, user } = await withDb();
  if (!user) return unauthorized();

  const body = await req.json();
  if (!body.kelompok_id)
    return NextResponse.json({ error: "Kelompok wajib dipilih" }, { status: 400 });
  if (!body.nama?.trim())
    return NextResponse.json({ error: "Nama bangunan wajib diisi" }, { status: 400 });
  try {
    const id = await createBangunan(db, {
      kelompok_id: Number(body.kelompok_id),
      nama: body.nama.trim(),
      tipe: body.tipe || "milik",
      keterangan: body.keterangan?.trim() || "",
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    return fail(e);
  }
}
