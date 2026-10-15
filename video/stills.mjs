// 確認用：主要なフレームを静止画で書き出す
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
const base = path.join(os.homedir(), "Library/Caches/ms-playwright");
const dir = readdirSync(base).find((d) => d.startsWith("chromium_headless_shell-"));
const browserExecutable = path.join(base, dir, "chrome-headless-shell-mac-arm64", "chrome-headless-shell");
const serveUrl = await bundle({ entryPoint: path.join(import.meta.dirname, "src/index.ts"), publicDir: path.join(import.meta.dirname, "public") });
const composition = await selectComposition({ serveUrl, id: "MeetBook", browserExecutable });
for (const f of process.argv.slice(2).map(Number)) {
  await renderStill({ composition, serveUrl, frame: f, output: path.join(import.meta.dirname, `out/still-${f}.png`), browserExecutable });
  console.log("still", f);
}
