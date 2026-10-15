// 動画を書き出す：node render.mjs → out/meetbook.mp4
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { existsSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";

// Playwright が入れた headless Chromium を使う（Remotion 側で別途ダウンロードしない）
function findChromium() {
  const base = path.join(os.homedir(), "Library/Caches/ms-playwright");
  const dir = readdirSync(base).find((d) => d.startsWith("chromium_headless_shell-"));
  if (!dir) return undefined;
  const root = path.join(base, dir);
  const sub = readdirSync(root).find((d) => d.startsWith("chrome-headless-shell"));
  const exe = sub && path.join(root, sub, "chrome-headless-shell");
  return exe && existsSync(exe) ? exe : undefined;
}

const browserExecutable = findChromium();
const serveUrl = await bundle({ entryPoint: path.join(import.meta.dirname, "src/index.ts"), publicDir: path.join(import.meta.dirname, "public") });
const composition = await selectComposition({ serveUrl, id: "MeetBook", browserExecutable });
const outputLocation = path.join(import.meta.dirname, "out/meetbook.mp4");
let last = -1;
await renderMedia({
  composition,
  serveUrl,
  codec: "h264",
  outputLocation,
  browserExecutable,
  crf: 20,
  onProgress: ({ progress }) => {
    const pct = Math.floor(progress * 10) * 10;
    if (pct !== last) {
      last = pct;
      console.log(`rendering ${pct}%`);
    }
  },
});
console.log("done:", outputLocation);
