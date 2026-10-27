import { NextResponse } from "next/server";
import { getStats } from "@/lib/repo";
import { fail, unauthorized, withDb } from "@/lib/api";

export async function GET() {
  const { db, user } = await withDb();
  if (!user) return unauthorized();
  try {
    return NextResponse.json(await getStats(db));
  } catch (e) {
    return fail(e);
  }
}
