import fs from "fs";
import path from "path";

/**
 * Membuat akun Dawis langsung (tanpa lewat halaman /register).
 *
 * Pakai:
 *   npm run create-user -- A12345 password123 "Ibu Siti"
 *
 * Butuh SUPABASE_SERVICE_ROLE_KEY di .env.local.
 * Profil (username + nama) dibuat otomatis oleh trigger database.
 */

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv();

const USERNAME_RE = /^[a-z][a-z0-9]{3,11}$/;

async function main() {
  const [usernameRaw, password, ...namaParts] = process.argv.slice(2);
  const username = (usernameRaw ?? "").trim().toLowerCase();
  const nama = namaParts.join(" ").trim();

  if (!username || !password) {
    console.error('Pakai: npm run create-user -- A12345 password123 "Ibu Siti"');
    process.exit(1);
  }
  if (!USERNAME_RE.test(username)) {
    console.error("Username harus diawali huruf, 4–12 karakter huruf/angka. Contoh: A12345");
    process.exit(1);
  }
  if (password.length < 6) {
    console.error("Password minimal 6 karakter.");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Butuh NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local (Supabase → Settings → API → service_role)."
    );
    process.exit(1);
  }

  const { createClient } = await import("@supabase/supabase-js");
  const admin = createClient(url, key, { auth: { persistSession: false } });

  const { data: taken, error: rpcErr } = await admin.rpc("username_taken", {
    p_username: username,
  });
  if (rpcErr) throw new Error(rpcErr.message);
  if (taken) throw new Error(`Username "${username}" sudah dipakai.`);

  const { data, error } = await admin.auth.admin.createUser({
    email: `${username}@dawis-app.vercel.app`,
    password,
    email_confirm: true,
    user_metadata: { username, nama },
  });
  if (error) throw new Error(error.message);

  console.log(`Akun dibuat: ${username}${nama ? ` (${nama})` : ""}`);
  console.log(`User ID: ${data.user?.id}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
