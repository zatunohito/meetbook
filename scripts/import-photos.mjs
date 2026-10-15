// 書店ページ用の写真を Wikimedia Commons（自由なライセンスの写真）から選び、SQL を生成する。
//
//   node scripts/import-photos.mjs   → supabase/seed_photos.sql
//
// お店そのものの写真ではなく「お店が入る建物・お店の周辺」の写真であることを、写真ごとの説明に明記する。
// 撮影者・ライセンス・出典ページを photo_meta に保存し、画面に表示する（CC BY / BY-SA の表示義務のため）。
// 写真がすでに登録されている書店（お店から提供された写真など）は上書きしない。

import { writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const API = "https://commons.wikimedia.org/w/api.php";
const UA = { "User-Agent": "MEETBOOK/0.1 (photo import for a local bookstore guide)" };
const OK_LICENSE = /^(CC0|Public domain|CC BY(-SA)? [\d.]+)$/i;

// slug → 検索語・採用するファイル名のパターン・写真の説明
const PLAN = [
  { slugs: ["kobundo"], caption: "浜町アーケード（お店の周辺）", queries: ["Hamamachi Nagasaki", "浜町アーケード"],
    match: /Hamanomachi Arcade 2024|^File:Hamamachi Arcade\.jpg|Hamamachi Shopping Street 2021|Hamano-machi Arcade Station 20180804/ },
  { slugs: ["metro-honten"], caption: "アミュプラザ長崎（お店が入る建物）", queries: ["アミュプラザ長崎"],
    match: /Amu Plaza Nagasaki 0[12]|正面全景|Amu Plaza Nagasaki at evening 0[13]|Nagasaki Station and Amu Plaza Nagasaki 01/ },
  { slugs: ["tsutaya-cocowalk"], caption: "みらい長崎ココウォーク（お店が入る建物）", queries: ["Cocowalk Nagasaki"],
    match: /Mirai Nagasaki Cocowalk|Cocowalk Nagasaki - panoramio|Cocowalk entrance - panoramio\.jpg|Cocowalk in naight|View of cocowalk/ },
  { slugs: ["kinokuniya"], caption: "ゆめタウン夢彩都（お店が入る建物）", queries: ["ゆめタウン夢彩都"],
    match: /Youme-town yume-site|Yume-town yume-site/ },
  { slugs: ["leiden"], caption: "出島（お店の周辺）", queries: ["Dejima Nagasaki"],
    match: /Dejima and trams|Dutch Trading Post on Dejima from Tamae|Former Dejima Protestant|Stone seawall on the west side of Dejima/ },
  { slugs: ["maiguma"], caption: "浜口町・大学病院前（お店の周辺）", queries: ["Hamaguchi Nagasaki", "Nagasaki University Hospital tram"],
    match: /Hamaguchi machi station - panoramio|Hamaguchi night view|大学病院前電停|Daigaku bioin mae|3003 at Daigaku/ },
  { slugs: ["shirokiji"], caption: "長崎駅周辺（お店の周辺）", queries: ["Nagasaki Station"],
    match: /Nagasaki station 2024 3|Nagasaki station 20170527|Nagasaki Station 20200407|Nagasaki station ekisya|Nagasaki Station \(Nagasaki Electric Tramway\) 2008/ },
  { slugs: ["kusano-sumiyoshi"], caption: "住吉（お店の周辺）", queries: ["Nagasaki Sumiyoshi", "Sumiyoshi shopping street Nagasaki"],
    match: /Nagasaki Electric Tramway Sumiyoshi Station\.JPG|Nagasaki Sumiyoshi tram stop|Nagasaki Sumiyoshi Post office|Sun-mall Sumiyoshi/ },
  { slugs: ["inori-no-oka"], caption: "南山手・大浦天主堂（お店の周辺）", queries: ["Oura Church", "Minamiyamate Nagasaki"],
    match: /Oura Church 20170222|Oura Cathedral 20140117\.JPG|Oura Catholic Church - Nagasaki|Minamiyamate Rest House|Nagasaki Minamiyamate Museum|Nagasaki view from Glover Garden/ },
];
const MAX = 6;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(params) {
  for (let i = 0; i < 5; i++) {
    const res = await fetch(`${API}?${new URLSearchParams({ format: "json", ...params })}`, { headers: UA });
    if (res.ok) return res.json();
    await sleep(5000 * (i + 1)); // 429 などは間隔を空けて再試行
  }
  throw new Error("Wikimedia Commons API に接続できませんでした");
}
const plain = (html) => (html ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

const rows = [];
for (const p of PLAN) {
  const titles = [];
  for (const q of p.queries) {
    const d = await api({ action: "query", list: "search", srsearch: q, srnamespace: "6", srlimit: "30" });
    for (const r of d.query.search) if (p.match.test(r.title) && !titles.includes(r.title)) titles.push(r.title);
    await sleep(1500);
  }
  const info = await api({ action: "query", titles: titles.slice(0, 20).join("|"), prop: "imageinfo", iiprop: "url|extmetadata|size", iiurlwidth: "1280" });
  await sleep(1500);
  const photos = Object.values(info.query.pages)
    .map((pg) => {
      const ii = pg.imageinfo?.[0];
      const m = ii?.extmetadata ?? {};
      return ii && {
        title: pg.title,
        url: ii.thumburl ?? ii.url,
        landscape: ii.width >= ii.height,
        license: plain(m.LicenseShortName?.value),
        author: plain(m.Artist?.value) || "不明",
        source: ii.descriptionurl,
      };
    })
    .filter((x) => x && x.landscape && OK_LICENSE.test(x.license))
    .sort((a, b) => titles.indexOf(a.title) - titles.indexOf(b.title))
    .slice(0, MAX);
  console.log(`${p.slugs.join(", ")}: ${photos.length}枚`);
  for (const ph of photos) console.log(`  ${ph.title.slice(5)} ／ ${ph.author} ／ ${ph.license}`);
  for (const slug of p.slugs) rows.push({ slug, caption: p.caption, photos });
}

const q = (v) => `'${String(v).replace(/'/g, "''")}'`;
const sql = rows
  .filter((r) => r.photos.length)
  .map((r) => {
    const urls = `ARRAY[${r.photos.map((ph) => q(ph.url)).join(", ")}]::text[]`;
    const meta = Object.fromEntries(r.photos.map((ph) => [ph.url, { caption: r.caption, author: ph.author, license: ph.license, source: ph.source }]));
    return `update public.stores set
  photo_urls = ${urls},
  photo_meta = ${q(JSON.stringify(meta))}::jsonb,
  photo_credit = '写真はお店の周辺・建物の様子です（Wikimedia Commons）。お店の写真が届きしだい差し替えます。'
where slug = ${q(r.slug)} and cardinality(photo_urls) = 0;`;
  })
  .join("\n\n");

writeFileSync(
  path.join(root, "supabase", "seed_photos.sql"),
  `-- 書店ページの写真（Wikimedia Commons の自由ライセンス写真）
-- 生成：node scripts/import-photos.mjs（${new Date().toISOString().slice(0, 10)}）
-- お店そのものではなく、お店が入る建物・周辺の写真。撮影者・ライセンス・出典は photo_meta に保存し画面に表示する。
-- 写真がすでにある書店は上書きしない。

${sql}
`,
);
console.log("\nsupabase/seed_photos.sql を出力しました");
