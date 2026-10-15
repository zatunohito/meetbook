// 長崎の出版社の刊行物を、公開書誌データから取り込む SQL を生成する。
//
//   node scripts/import-books.mjs        → supabase/seed_books.sql を出力
//
// データ源
//   - 国立国会図書館サーチ OpenSearch API（書名・著者・出版社・刊行年・ISBN・NDC・件名）
//   - openBD（書影・内容紹介。ある場合のみ）
// 取扱書店（在庫）は確認できないため登録しない。ジャンルは NDC と件名から機械的に対応づける。

import { writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

// 出版社（publishers.slug）ごとの NDL 検索語と取り込み件数
const TARGETS = [
  { slug: "nagasaki-bunken", query: "長崎文献社", take: 48 },
  { slug: "seibo-no-kishi", query: "聖母の騎士社", take: 28 },
  { slug: "dowakan", query: "童話館出版", take: 20 },
  { slug: "nagasaki-press", query: "ながさきプレス", take: 12 },
  { slug: "n-henshushitsu", query: "えぬ編集室", take: 6 },
  { slug: "eesworks", query: "イーズワークス", take: 6 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (res.ok) return res;
      if (res.status === 404) return null;
    } catch {}
    await sleep(2000 * (i + 1));
  }
  throw new Error(`取得に失敗: ${url}`);
}

const decode = (s) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1].trim()) : null;
};
const tags = (xml, re) => [...xml.matchAll(re)].map((m) => decode(m[1].trim()));

function parseItem(xml) {
  const isbn = xml.match(/<dc:identifier xsi:type="dcndl:ISBN">([^<]+)</)?.[1]?.replace(/-/g, "");
  const cdata = xml.match(/<!\[CDATA\[([\s\S]*?)\]\]>/)?.[1] ?? "";
  const resp = cdata.match(/責任表示：([^<]+)/)?.[1]?.trim() ?? null;
  return {
    title: tag(xml, "dc:title"),
    volume: tag(xml, "dcndl:volume"),
    author: resp,
    publisher: tag(xml, "dc:publisher"),
    issued: tag(xml, "dcterms:issued"),
    isbn: isbn && /^(97[89])?\d{9}[\dX]$/.test(isbn) ? isbn : null,
    ndc: xml.match(/xsi:type="dcndl:NDC10">([^<]+)</)?.[1] ?? xml.match(/xsi:type="dcndl:NDC9">([^<]+)</)?.[1] ?? xml.match(/xsi:type="dcndl:NDC8">([^<]+)</)?.[1] ?? null,
    subjects: tags(xml, /<dc:subject>([^<]+)<\/dc:subject>/g),
    link: tag(xml, "link"),
  };
}

// ---- NDC・件名 → MEET BOOK のジャンル ----
const LOCAL_RE = /長崎|出島|島原|五島|平戸|佐世保|雲仙|対馬|壱岐|諫早|大村|軍艦島|端島|浦上|外海|稲佐|眼鏡橋|西海|天草/;
const PEACE_RE = /原爆|被爆|平和|戦争|空襲|核兵器/;
function genresOf(b, fallback) {
  const g = new Set();
  const n = b.ndc ?? "";
  const top = n[0];
  const two = n.slice(0, 2);
  const three = n.slice(0, 3);
  if (top === "1") g.add(["16", "17", "18", "19"].includes(two) ? "religion" : "philosophy");
  if (top === "2") g.add(two === "29" ? "travel" : "history");
  if (top === "3") g.add(two === "38" ? "history" : "society");
  if (top === "4") g.add("nature");
  if (top === "5") g.add(two === "59" ? "life" : "society");
  if (top === "6") g.add(["61", "62", "64", "65", "66"].includes(two) ? "life" : "society");
  if (top === "7") {
    if (n.startsWith("726.1")) g.add("comics");
    else if (n.startsWith("726.6")) g.add("picturebook");
    else if (["78", "79"].includes(two)) g.add("life");
    else g.add("art");
  }
  if (top === "8") g.add("language");
  if (top === "9") {
    if (["911", "921", "931", "941", "951", "961", "971", "981", "991"].includes(three)) g.add("poetry");
    else if (/^9[1-9][45]/.test(three) || three === "916") g.add("poetry");
    else g.add("literature");
  }
  if (/^\d{3}\.?\d*193/.test(n.replace(".", "")) || n.startsWith("219.3") || n.startsWith("291.93")) g.add("local");
  const text = `${b.title} ${b.subjects.join(" ")}`;
  if (LOCAL_RE.test(text)) g.add("local");
  if (PEACE_RE.test(text)) g.add("peace");
  if (/キリシタン|カトリック|キリスト|教会|聖書|殉教|修道/.test(text)) g.add("religion");
  if (/絵本/.test(text)) g.add("picturebook");
  if (g.size === 0) fallback.forEach((x) => g.add(x));
  return [...g].slice(0, 4);
}

function toDate(issued) {
  const m = issued?.match(/(\d{4})(?:\.(\d{1,2}))?/);
  if (!m) return null;
  return `${m[1]}-${(m[2] ?? "1").padStart(2, "0")}-01`;
}

const FALLBACK = { dowakan: ["picturebook"], "seibo-no-kishi": ["religion"], "nagasaki-bunken": ["local"], "nagasaki-press": ["local"] };

const picked = [];
const seenIsbn = new Set();
for (const t of TARGETS) {
  const url = `https://ndlsearch.ndl.go.jp/api/opensearch?publisher=${encodeURIComponent(t.query)}&mediatype=books&cnt=300`;
  const xml = await (await get(url)).text();
  const items = xml.split("<item>").slice(1).map(parseItem);
  const seenTitle = new Set();
  const usable = items
    .filter((b) => b.isbn && b.title && b.publisher?.includes(t.query.replace("出版", "")))
    .sort((a, b) => (toDate(b.issued) ?? "").localeCompare(toDate(a.issued) ?? ""))
    .filter((b) => {
      const key = b.title.replace(/\s/g, "");
      if (seenTitle.has(key) || seenIsbn.has(b.isbn)) return false;
      seenTitle.add(key);
      seenIsbn.add(b.isbn);
      return true;
    })
    .slice(0, t.take);
  console.log(`${t.query}: ${items.length}件中 ${usable.length}件を採用`);
  for (const b of usable) picked.push({ ...b, slug: t.slug, genres: genresOf(b, FALLBACK[t.slug] ?? []) });
  await sleep(1500);
}

// ---- openBD で書影・内容紹介を補う ----
for (let i = 0; i < picked.length; i += 100) {
  const chunk = picked.slice(i, i + 100);
  const res = await get(`https://api.openbd.jp/v1/get?isbn=${chunk.map((b) => b.isbn).join(",")}`);
  const data = res ? await res.json() : [];
  data.forEach((d, j) => {
    if (!d) return;
    const texts = d.onix?.CollateralDetail?.TextContent ?? [];
    chunk[j].cover = d.summary?.cover || null;
    chunk[j].description = texts.find((x) => x.TextType === "03")?.Text ?? texts.find((x) => x.TextType === "02")?.Text ?? null;
  });
}

// ---- SQL 出力 ----
const q = (v) => (v == null ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const arr = (xs) => `'{${xs.map((x) => `"${x.replace(/["\\]/g, "")}"`).join(",")}}'`;
const rows = picked.map((b) => {
  const title = b.volume ? `${b.title} ${b.volume}` : b.title;
  const keywords = b.subjects.filter((s) => s.length <= 30).slice(0, 8);
  return `  (${q(b.isbn)}, ${q(title)}, ${q(b.author)}, (select id from public.publishers where slug = ${q(b.slug)}), ${arr(b.genres)}, ${arr(keywords)}, ${q(b.description ?? null)}, ${q(b.cover ?? null)}, ${q(toDate(b.issued))}, ${q(b.cover || b.description ? "ndl+openbd" : "ndl")}, ${q(b.link)})`;
});

const sql = `-- 長崎の出版社の刊行物（${picked.length}冊）
-- 生成：node scripts/import-books.mjs（${new Date().toISOString().slice(0, 10)}）
-- 出典：国立国会図書館サーチ（書誌・NDC・件名）、openBD（書影・内容紹介）。source_url は NDL の書誌ページ。
-- ジャンルは NDC と件名から自動で対応づけたもの。取扱書店（在庫）は未確認のため登録しない。
-- 何度流しても安全（同じ ISBN の本は追加しない）。

insert into public.books (isbn, title, author, publisher_id, genres, keywords, description, cover_url, published_on, data_source, source_url) values
${rows.join(",\n")}
on conflict (isbn) do nothing;
`;
writeFileSync(path.join(root, "supabase", "seed_books.sql"), sql);
const withCover = picked.filter((b) => b.cover).length;
const withDesc = picked.filter((b) => b.description).length;
console.log(`\n${picked.length}冊を supabase/seed_books.sql に出力（書影 ${withCover}冊・内容紹介 ${withDesc}冊）`);
