import { NextResponse } from "next/server";
import { getDb } from "./db";

/** Ambil client database + user yang sedang login untuk Route Handler. */
export async function withDb() {
  const db = await getDb();
  const {
    data: { user },
  } = await db.auth.getUser();
  return { db, user };
}

export function unauthorized() {
  return NextResponse.json(
    { error: "Sesi tidak ditemukan. Silakan login ulang." },
    { status: 401 }
  );
}

export function fail(e: unknown) {
  const message = e instanceof Error ? e.message : String(e);
  return NextResponse.json({ error: message }, { status: 500 });
}
