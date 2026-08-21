import { NextResponse } from "next/server";
import { getStruktur, createBangunan } from "@/lib/repo";

export async function GET() {
  try {
    return NextResponse.json(await getStruktur());
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.kelompok_id)
    return NextResponse.json({ error: "Kelompok wajib dipilih" }, { status: 400 });
  if (!body.nama?.trim())
    return NextResponse.json({ error: "Nama bangunan wajib diisi" }, { status: 400 });
  try {
    const id = await createBangunan({
      kelompok_id: Number(body.kelompok_id),
      nama: body.nama.trim(),
      tipe: body.tipe || "milik",
      keterangan: body.keterangan?.trim() || "",
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
