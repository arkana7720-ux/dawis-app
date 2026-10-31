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
        wa_template: profile?.wa_template ?? "",
      },
      kelompok: kelompok ?? [],
    });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: Request) {
  const { db, user } = await withDb();
  if (!user) return unauthorized();

  const body = await req.json().catch(() => ({}));
  if (typeof body.wa_template !== "string")
    return NextResponse.json({ error: "Template tidak valid." }, { status: 400 });

  const template = body.wa_template.trim();
  if (template.length > 2000)
    return NextResponse.json(
      { error: "Template maksimal 2000 karakter." },
      { status: 400 }
    );

  try {
    const { data, error } = await db
      .from("profiles")
      .update({ wa_template: template })
      .eq("id", user.id)
      .select("wa_template")
      .maybeSingle();
    if (error) throw new Error(error.message);

    return NextResponse.json({ wa_template: data?.wa_template ?? template });
  } catch (e) {
    return fail(e);
  }
}
