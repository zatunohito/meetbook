// ローカルプレビュー：Supabase と同じ構成（Postgres + PostgREST）を手元で立ち上げ、Next.js を起動する。
// Docker 不要。DB は .local-dev/pgdata に保存され、再起動しても残る。
//
//   pnpm preview:local          起動（初回はマイグレーションとシードを実行）
//   pnpm preview:local --reset  DB を作り直してから起動
//
// 本番の Supabase を使うときは、このスクリプトではなく `pnpm dev`（.env.local の値を使用）で起動する。

import { spawn } from "node:child_process";
import { createHmac, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
import EmbeddedPostgres from "embedded-postgres";

const root = path.resolve(import.meta.dirname, "..");
const dev = path.join(root, ".local-dev");
const dataDir = path.join(dev, "pgdata");
const secretsFile = path.join(dev, "secrets.json");
const PG_PORT = 54329;
const REST_PORT = 54322;
const API_PORT = 54321;

mkdirSync(dev, { recursive: true });
if (process.argv.includes("--reset")) rmSync(dataDir, { recursive: true, force: true });

// ローカル専用の鍵（初回に生成して保存）
const secrets = existsSync(secretsFile)
  ? JSON.parse(readFileSync(secretsFile, "utf8"))
  : { jwt: randomBytes(32).toString("hex"), session: randomBytes(32).toString("hex"), admin: randomBytes(9).toString("base64url") };
writeFileSync(secretsFile, JSON.stringify(secrets, null, 2), { mode: 0o600 });

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
function jwt(payload) {
  const body = `${b64({ alg: "HS256", typ: "JWT" })}.${b64(payload)}`;
  return `${body}.${createHmac("sha256", secrets.jwt).update(body).digest("base64url")}`;
}
const serviceKey = jwt({ role: "service_role", iss: "local", iat: 1700000000, exp: 4000000000 });

// ---- Postgres ----
const pg = new EmbeddedPostgres({ databaseDir: dataDir, port: PG_PORT, user: "postgres", password: "postgres", persistent: true });
const fresh = !existsSync(path.join(dataDir, "PG_VERSION"));
if (fresh) await pg.initialise();
await pg.start();

if (fresh) {
  const client = pg.getPgClient();
  await client.connect();
  // Supabase 標準のロール構成を再現
  await client.query(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create role authenticator login password 'postgres' noinherit;
    grant anon, authenticated, service_role to authenticator;
  `);
  const migrations = path.join(root, "supabase", "migrations");
  for (const f of (await import("node:fs")).readdirSync(migrations).filter((f) => f.endsWith(".sql")).sort()) {
    await client.query(readFileSync(path.join(migrations, f), "utf8"));
    console.log(`  migration: ${f}`);
  }
  await client.query(`
    grant usage on schema public to anon, authenticated, service_role;
    grant all on all tables in schema public to service_role;
    grant all on all sequences in schema public to service_role;
    grant execute on all functions in schema public to service_role;
  `);
  for (const f of ["seed.sql", "seed_books.sql", "seed_photos.sql"]) {
    const file = path.join(root, "supabase", f);
    if (!existsSync(file)) continue;
    await client.query(readFileSync(file, "utf8"));
    console.log(`  seed: supabase/${f}`);
  }
  await client.end();
}

// ---- PostgREST ----
// libpq は embedded-postgres 同梱のものを使う（Homebrew 不要）
const fromEmbedded = createRequire(createRequire(import.meta.url).resolve("embedded-postgres"));
const pgLib = path.join(path.dirname(fromEmbedded.resolve("@embedded-postgres/darwin-arm64")), "..", "native", "lib");
const rest = spawn(path.join(dev, "bin", "postgrest"), [], {
  env: {
    ...process.env,
    DYLD_LIBRARY_PATH: pgLib,
    PGRST_DB_URI: `postgres://authenticator:postgres@127.0.0.1:${PG_PORT}/postgres`,
    PGRST_DB_SCHEMAS: "public",
    PGRST_DB_ANON_ROLE: "anon",
    PGRST_JWT_SECRET: secrets.jwt,
    PGRST_SERVER_PORT: String(REST_PORT),
    PGRST_SERVER_HOST: "127.0.0.1",
    PGRST_LOG_LEVEL: "error",
  },
  stdio: "inherit",
});

// ---- Supabase 互換の入口（/rest/v1 → PostgREST） ----
const api = http.createServer((req, res) => {
  if (!req.url.startsWith("/rest/v1")) {
    res.writeHead(404).end();
    return;
  }
  const upstream = http.request(
    { host: "127.0.0.1", port: REST_PORT, path: req.url.slice("/rest/v1".length) || "/", method: req.method, headers: req.headers },
    (r) => {
      res.writeHead(r.statusCode ?? 502, r.headers);
      r.pipe(res);
    },
  );
  upstream.on("error", () => res.writeHead(502).end());
  req.pipe(upstream);
});
api.listen(API_PORT, "127.0.0.1");

// ---- Next.js ----
const next = spawn("npx", ["next", "dev"], {
  cwd: root,
  env: {
    ...process.env,
    SUPABASE_URL: `http://127.0.0.1:${API_PORT}`,
    SUPABASE_SERVICE_ROLE_KEY: serviceKey,
    SESSION_SECRET: secrets.session,
    ADMIN_USER: "admin",
    ADMIN_PASSWORD: secrets.admin,
    LOCAL_UPLOAD_DIR: path.join(dev, "uploads"),
  },
  stdio: "inherit",
});

console.log(`\nローカルプレビュー：http://localhost:3000`);
console.log(`管理画面 /admin のユーザー名は admin、パスワードは .local-dev/secrets.json の "admin" です。\n`);

async function shutdown() {
  next.kill();
  rest.kill();
  api.close();
  await pg.stop();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("SIGHUP", shutdown);
next.on("exit", shutdown);
