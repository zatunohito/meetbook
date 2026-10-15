import "server-only";

// openBD（版元ドットコム等が提供する公開書誌データ）から ISBN で書誌情報を取得する
export type BibInfo = {
  isbn: string;
  title: string;
  author: string | null;
  publisher: string | null;
  published_on: string | null;
  cover_url: string | null;
  description: string | null;
};

export function normalizeIsbn(raw: string) {
  const s = raw.replace(/[^0-9Xx]/g, "").toUpperCase();
  return s.length === 10 || s.length === 13 ? s : null;
}

function toDate(pubdate: string | undefined) {
  if (!pubdate) return null;
  const d = pubdate.replace(/[^0-9]/g, "");
  if (d.length >= 8) return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  if (d.length === 6) return `${d.slice(0, 4)}-${d.slice(4, 6)}-01`;
  return null;
}

export async function fetchOpenBD(isbn: string): Promise<BibInfo | null> {
  const res = await fetch(`https://api.openbd.jp/v1/get?isbn=${encodeURIComponent(isbn)}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`openBD の取得に失敗しました（${res.status}）`);
  const [item] = (await res.json()) as unknown[];
  if (!item) return null;
  const { summary, onix } = item as {
    summary: { isbn: string; title: string; author?: string; publisher?: string; pubdate?: string; cover?: string };
    onix?: { CollateralDetail?: { TextContent?: { TextType: string; Text: string }[] } };
  };
  const texts = onix?.CollateralDetail?.TextContent ?? [];
  // 03: 内容紹介（長）, 02: 内容紹介（短）
  const description = texts.find((t) => t.TextType === "03")?.Text ?? texts.find((t) => t.TextType === "02")?.Text ?? null;
  return {
    isbn: summary.isbn,
    title: summary.title,
    author: summary.author || null,
    publisher: summary.publisher || null,
    published_on: toDate(summary.pubdate),
    cover_url: summary.cover || null,
    description,
  };
}

export type LookupResult = { error?: string; info?: BibInfo } | undefined;

export async function lookupIsbn(raw: string | null): Promise<LookupResult> {
  const isbn = raw ? normalizeIsbn(raw) : null;
  if (!isbn) return { error: "ISBN を10桁または13桁で入力してください。" };
  try {
    const info = await fetchOpenBD(isbn);
    if (!info) return { error: "openBD に該当する書誌が見つかりませんでした。手入力で登録してください。" };
    return { info };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
