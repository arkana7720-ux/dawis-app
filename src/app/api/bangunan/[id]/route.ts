import { NextResponse } from "next/server";
import { updateBangunan, deleteBangunan } from "@/lib/repo";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  if (!body.nama?.trim())
    return NextResponse.json({ error: "Nama bangunan wajib diisi" }, { status: 400 });
  try {
    await updateBangunan(Number(id), {
      kelompok_id: Number(body.kelompok_id),
      nama: body.nama.trim(),
      tipe: body.tipe || "milik",
      keterangan: body.keterangan?.trim() || "",
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await deleteBangunan(Number(id));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
