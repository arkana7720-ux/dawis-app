import { NextResponse } from "next/server";
import { fail, unauthorized, withDb } from "@/lib/api";
import { getProfile } from "@/lib/auth";

export async function GET() {
  const { db, user } = await withDb();
  if (!user) return unauthorized();

  try {
    const profile = await getProfile(db, user.id);
    const { data: kelompok, error } = await db
      .from("kelompok")
      .select("id, nama, kode")
      .order("urutan");
    if (error) throw new Error(error.message);

    return NextResponse.json({
      user: {
        id: user.id,
        username: profile?.username ?? "",
        nama: profile?.nama ?? "",
        is_admin: profile?.is_admin ?? false,
      },
      kelompok: kelompok ?? [],
    });
  } catch (e) {
    return fail(e);
  }
}
