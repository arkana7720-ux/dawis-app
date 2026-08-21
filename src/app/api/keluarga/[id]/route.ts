import { NextResponse } from "next/server";
import { updateKeluarga, deleteKeluarga } from "@/lib/repo";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  if (!body.nama_krt?.trim())
    return NextResponse.json({ error: "Nama KRT wajib diisi" }, { status: 400 });
  try {
    await updateKeluarga(Number(id), {
      nama_krt: body.nama_krt.trim(),
      catatan: body.catatan?.trim() || "",
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await deleteKeluarga(Number(id));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
