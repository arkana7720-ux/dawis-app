import { NextResponse } from "next/server";
import { updateKelompok, deleteKelompok } from "@/lib/repo";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  if (!body.nama?.trim())
    return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
  try {
    await updateKelompok(Number(id), body.nama.trim(), body.kode?.trim() || "");
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await deleteKelompok(Number(id));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
