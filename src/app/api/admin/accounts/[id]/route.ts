import { NextResponse } from "next/server";
import { fail, forbidden, unauthorized, withDb } from "@/lib/api";
import { getProfile } from "@/lib/auth";
import { accountRows, getAdminDb } from "@/lib/admin";

const BAN_PERMANEN = "876000h"; // ±100 tahun

async function pastikanAdmin() {
  const { db, user } = await withDb();
  if (!user) return { error: unauthorized(), user: null };
  const profile = await getProfile(db, user.id);
  if (!profile?.is_admin) return { error: forbidden(), user: null };
  return { error: null, user };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await pastikanAdmin();
  if (guard.error || !guard.user) return guard.error ?? unauthorized();
  const user = guard.user;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const nama = typeof body.nama === "string" ? body.nama.trim() : undefined;
  const password = typeof body.password === "string" ? body.password : undefined;
  const aktif = typeof body.aktif === "boolean" ? body.aktif : undefined;

  if (nama !== undefined && (nama.length < 2 || nama.length > 80))
    return NextResponse.json({ error: "Nama harus 2–80 karakter." }, { status: 400 });
  if (password !== undefined && password.length < 6)
    return NextResponse.json({ error: "Password minimal 6 karakter." }, { status: 400 });
  if (aktif === false && id === user.id)
    return NextResponse.json(
      { error: "Akun Anda sendiri tidak bisa dinonaktifkan." },
      { status: 400 }
    );

  try {
    const admin = getAdminDb();
    const { data: target, error: cariErr } = await admin
      .from("profiles")
      .select("id, username, nama")
      .eq("id", id)
      .maybeSingle();
    if (cariErr) throw new Error(cariErr.message);
    if (!target) return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });

    if (nama !== undefined && nama !== target.nama) {
      const { error } = await admin.from("profiles").update({ nama }).eq("id", id);
      if (error) throw new Error(error.message);
      await admin.auth.admin.updateUserById(id, { user_metadata: { nama } });
    }

    if (password) {
      const { error } = await admin.auth.admin.updateUserById(id, { password });
      if (error) throw new Error(error.message);
    }

    if (aktif !== undefined) {
      const { error } = await admin.auth.admin.updateUserById(id, {
        ban_duration: aktif ? "none" : BAN_PERMANEN,
      });
      if (error) throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await pastikanAdmin();
  if (guard.error || !guard.user) return guard.error ?? unauthorized();
  const user = guard.user;

  const { id } = await params;
  const url = new URL(req.url);
  const konfirmasi = (url.searchParams.get("confirm") ?? "").trim().toLowerCase();
  const paksa = url.searchParams.get("paksa") === "1";

  if (id === user.id)
    return NextResponse.json({ error: "Akun Anda sendiri tidak bisa dihapus." }, { status: 400 });

  try {
    const admin = getAdminDb();
    const { data: target, error: cariErr } = await admin
      .from("profiles")
      .select("id, username, is_admin")
      .eq("id", id)
      .maybeSingle();
    if (cariErr) throw new Error(cariErr.message);
    if (!target) return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });

    if (konfirmasi !== target.username.toLowerCase())
      return NextResponse.json(
        { error: `Ketik ulang username "${target.username}" untuk konfirmasi.` },
        { status: 400 }
      );

    const rows = await accountRows(admin);
    const baris = rows.find((r) => r.id === id);
    const totalWarga = baris?.jumlah_warga ?? 0;
    const totalKelompok = baris?.jumlah_kelompok ?? 0;

    if ((totalKelompok > 0 || totalWarga > 0) && !paksa)
      return NextResponse.json(
        {
          error: `Akun ini masih memiliki data (${totalKelompok} kelompok, ${totalWarga} warga). Pindahkan datanya dulu, atau centang "saya paham data ikut terhapus".`,
        },
        { status: 409 }
      );

    if (target.is_admin && rows.filter((r) => r.is_admin).length <= 1)
      return NextResponse.json(
        { error: "Ini satu-satunya akun admin dan tidak bisa dihapus." },
        { status: 400 }
      );

    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, terhapus: totalWarga });
  } catch (e) {
    return fail(e);
  }
}
