// 説明動画用のスクリーンショットを撮る（ローカルの開発サーバー http://localhost:3000 が起動している前提）。
// 自動操作用のブラウザは独自の Cookie を持つため、普段使っているブラウザのログイン状態には影響しない。
// デモ用の読者（みなと）とその相談を作成する。撮影後に削除すること（相談はひとやすみ書店の受信箱に入るため）。

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = "http://localhost:3000";
const OUT = path.join(import.meta.dirname, "public", "shots");
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const phone = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "ja-JP", colorScheme: "light" };

async function shot(page, name, { scrollTo, wait = 800 } = {}) {
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => {});
  if (scrollTo) {
    await page.locator(scrollTo).first().scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -90));
  }
  await page.waitForTimeout(wait);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log("captured", name);
}

// ---------- 読者 ----------
const reader = await browser.newContext(phone);
const p = await reader.newPage();
await p.goto(`${BASE}/welcome`, { waitUntil: "networkidle" });
await shot(p, "01-welcome");
await p.getByRole("button", { name: "読者としてはじめる" }).click();
await p.waitForURL("**/onboarding");
await p.waitForLoadState("networkidle");
await p.locator("#display_name").fill("みなと");
for (const t of ["地域文化（長崎）", "歴史", "哲学・思想"]) await p.locator("label", { hasText: t }).first().click();
await shot(p, "02-onboarding");
const next = () => p.getByRole("button", { name: /次へ/ }).click();
await next();
await p.locator("section:not([hidden]) label", { hasText: "詩・エッセイ" }).click();
await next();
await p.locator("section:not([hidden]) textarea").fill("祈り、街の記憶");
await next();
await p.locator("section:not([hidden]) label", { hasText: "宗教・祈り" }).click();
await next();
await p.locator("section:not([hidden]) label", { hasText: "喫茶で本と過ごす" }).click();
await next();
for (const t of ["静かで落ち着いた", "レトロ"]) await p.locator("section:not([hidden]) label", { hasText: t }).click();
await next();
await p.locator('section:not([hidden]) input[value="4"]').check();
await p.locator("section:not([hidden]) select").selectOption("nagasaki_center");
await p.getByRole("button", { name: /はじめる/ }).click();
await p.waitForURL("**/home");
await p.waitForLoadState("networkidle");
await shot(p, "03-home", { wait: 1500 });
await shot(p, "04-home-serendipity", { scrollTo: "text=偶然の一冊" });
await shot(p, "05-home-stores", { scrollTo: "text=相性のいい本屋" });

await p.goto(`${BASE}/meet`, { waitUntil: "networkidle" });
await shot(p, "06-meet");

await p.goto(`${BASE}/stores`, { waitUntil: "networkidle" });
await shot(p, "07-stores", { wait: 2500 });
await p.goto(`${BASE}/stores/hitoyasumi`, { waitUntil: "networkidle" });
await shot(p, "08-store-detail", { wait: 2500 });
await shot(p, "09-store-message", { scrollTo: "text=店員さんから" });

await p.goto(`${BASE}/meet`, { waitUntil: "networkidle" });
await p.locator('a[href^="/books/"]').first().click();
await p.waitForURL("**/books/**");
await p.waitForLoadState("networkidle");
const bookUrl = p.url();
await shot(p, "10-book");
await shot(p, "11-book-map", { scrollTo: "text=関係性マップ" });

// 書店への相談（デモ）
const bookId = bookUrl.split("/books/")[1];
await p.goto(`${BASE}/consult?book=${bookId}`, { waitUntil: "networkidle" });
await p.locator("#store_id").selectOption({ label: "ひとやすみ書店" });
await p.locator("#body").fill("この本、店頭で手に取れますか？ 似たテーマで、長崎の街歩きが楽しくなる本があれば教えてください。");
await shot(p, "12-consult");
await p.getByRole("button", { name: /送信する/ }).click();
await p.waitForURL("**/connections/threads/**");
await p.waitForLoadState("networkidle");
await shot(p, "13-thread");
await reader.close();

// ---------- 書店 ----------
const storeCtx = await browser.newContext(phone);
const s = await storeCtx.newPage();
await s.goto(`${BASE}/welcome`, { waitUntil: "networkidle" });
await s.locator("#store_id").selectOption({ label: "ひとやすみ書店" });
await s.getByRole("button", { name: "書店として入る" }).click();
await s.waitForURL("**/store");
await s.waitForLoadState("networkidle");
await shot(s, "14-store-inbox");
await s.goto(`${BASE}/store/profile`, { waitUntil: "networkidle" });
await shot(s, "15-store-photos", { wait: 2000 });
await storeCtx.close();

// ---------- 出版社 ----------
const pubCtx = await browser.newContext(phone);
const b = await pubCtx.newPage();
await b.goto(`${BASE}/welcome`, { waitUntil: "networkidle" });
await b.locator("#publisher_id").selectOption({ label: "長崎文献社" });
await b.getByRole("button", { name: "出版社として入る" }).click();
await b.waitForURL("**/publisher");
await b.waitForLoadState("networkidle");
await shot(b, "16-publisher");
await pubCtx.close();

await browser.close();
console.log("done");
