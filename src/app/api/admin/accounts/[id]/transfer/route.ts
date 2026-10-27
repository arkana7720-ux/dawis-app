import { NextResponse } from "next/server";
import { fail, forbidden, unauthorized, withDb } from "@/lib/api";
import { getProfile } from "@/lib/auth";
import { accountRows, getAdminDb } from "@/lib/admin";

/**
 * Pindahkan seluruh kelompok milik satu akun ke akun lain.
 * Dipakai sebelum menghapus akun yang salah daftar, agar data warga tidak hilang.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { db, user } = await withDb();
  if (!user) return unauthorized();

  const profile = await getProfile(db, user.id);
  if (!profile?.is_admin) return forbidden();

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const targetId = typeof body.targetId === "string" ? body.targetId : "";

  if (!targetId) return NextResponse.json({ error: "Pilih akun tujuan." }, { status: 400 });
  if (targetId === id)
    return NextResponse.json({ error: "Akun tujuan harus berbeda." }, { status: 400 });

  try {
    const admin = getAdminDb();
    const rows = await accountRows(admin);
    const asal = rows.find((r) => r.id === id);
    const tujuan = rows.find((r) => r.id === targetId);

    if (!asal) return NextResponse.json({ error: "Akun asal tidak ditemukan." }, { status: 404 });
    if (!tujuan)
      return NextResponse.json({ error: "Akun tujuan tidak ditemukan." }, { status: 404 });
    if (asal.jumlah_kelompok === 0)
      return NextResponse.json({ error: "Akun ini tidak punya kelompok untuk dipindah." }, { status: 400 });

    const { error } = await admin.from("kelompok").update({ owner_id: targetId }).eq("owner_id", id);
    if (error) throw new Error(error.message);

    return NextResponse.json({
      ok: true,
      kelompok: asal.jumlah_kelompok,
      bangunan: asal.jumlah_bangunan,
      keluarga: asal.jumlah_keluarga,
      warga: asal.jumlah_warga,
    });
  } catch (e) {
    return fail(e);
  }
}
