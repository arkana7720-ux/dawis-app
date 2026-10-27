import { NextResponse } from "next/server";
import { listKelompok, createKelompok } from "@/lib/repo";
import { fail, unauthorized, withDb } from "@/lib/api";

export async function GET() {
  const { db, user } = await withDb();
  if (!user) return unauthorized();
  try {
    return NextResponse.json(await listKelompok(db));
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  const { db, user } = await withDb();
  if (!user) return unauthorized();

  const body = await req.json();
  if (!body.nama?.trim())
    return NextResponse.json({ error: "Nama kelompok wajib diisi" }, { status: 400 });
  try {
    const id = await createKelompok(db, body.nama.trim(), body.kode?.trim() || "");
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    return fail(e);
  }
}
