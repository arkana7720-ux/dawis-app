import { NextResponse } from "next/server";
import { getDb } from "./db";
import { ambilClaims } from "./session";

/** Ambil client database + user yang sedang login untuk Route Handler. */
export async function withDb() {
  const db = await getDb();
  // Verifikasi JWT dilakukan lokal (lihat lib/session.ts) agar tidak ada
  // perjalanan bolak-balik ke server Auth di setiap request.
  const claims = await ambilClaims(db);
  const id = typeof claims?.sub === "string" ? claims.sub : null;
  return { db, user: id ? { id } : null };
}

export function unauthorized() {
  return NextResponse.json(
    { error: "Sesi tidak ditemukan. Silakan login ulang." },
    { status: 401 }
  );
}

export function forbidden() {
  return NextResponse.json(
    { error: "Halaman ini hanya untuk pengelola akun." },
    { status: 403 }
  );
}

export function fail(e: unknown) {
  const message = e instanceof Error ? e.message : String(e);
  return NextResponse.json({ error: message }, { status: 500 });
}
