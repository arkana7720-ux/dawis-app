import { NextResponse } from "next/server";
import { listKelompok, createKelompok } from "@/lib/repo";

export async function GET() {
  try {
    return NextResponse.json(await listKelompok());
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.nama?.trim())
    return NextResponse.json({ error: "Nama kelompok wajib diisi" }, { status: 400 });
  try {
    const id = await createKelompok(body.nama.trim(), body.kode?.trim() || "");
    return NextResponse.json({ id }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
