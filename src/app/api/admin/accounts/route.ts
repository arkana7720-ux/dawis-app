import { NextResponse } from "next/server";
import { fail, forbidden, unauthorized, withDb } from "@/lib/api";
import { getProfile } from "@/lib/auth";
import { accountRows, getAdminDb, isBanned, listAuthUsers } from "@/lib/admin";

export async function GET() {
  const { db, user } = await withDb();
  if (!user) return unauthorized();

  const profile = await getProfile(db, user.id);
  if (!profile?.is_admin) return forbidden();

  try {
    const admin = getAdminDb();
    const [rows, authUsers] = await Promise.all([accountRows(admin), listAuthUsers(admin)]);
    const byId = new Map(authUsers.map((u) => [u.id, u]));

    const accounts = rows.map((r) => {
      const auth = byId.get(r.id);
      return {
        ...r,
        aktif: !isBanned(auth),
        terakhir_masuk: auth?.last_sign_in_at ?? null,
      };
    });

    return NextResponse.json({ accounts, saya: user.id });
  } catch (e) {
    return fail(e);
  }
}
