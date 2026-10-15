// `npm run dev`：.env.local に Supabase の接続先があればそれを使い、無ければローカルプレビュー（手元の DB）で起動する。
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const envFile = path.join(root, ".env.local");
const hasSupabase = existsSync(envFile) && /^SUPABASE_URL=\S+/m.test(readFileSync(envFile, "utf8"));

if (hasSupabase) {
  console.log("Supabase（.env.local）に接続して起動します");
  const child = spawn("npx", ["next", "dev"], { cwd: root, stdio: "inherit" });
  child.on("exit", (code) => process.exit(code ?? 0));
} else {
  console.log(".env.local が無いため、ローカルの DB で起動します（npm run preview:local と同じ）");
  await import("./local-preview.mjs");
}
