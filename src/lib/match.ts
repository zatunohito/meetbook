// 推薦ロジック。読者のアンケート回答 × 書籍の属性 × 実店舗在庫 から、根拠つきのスコアを算出する。
// すべて DB に登録された実データのみから理由文を組み立て、推測や架空の情報は出さない。

import { bridgeBetween, genreLabel, regionLabel, styleLabel, atmosphereLabel } from "./taxonomy";
import type { BookWithContext, Reader, Store } from "./types";

export type MatchContext = {
  meetBookIds: Set<string>;
  meetBooks: BookWithContext[];
  followedStoreIds: Set<string>;
  followedPublisherIds: Set<string>;
};

export type Recommendation = {
  book: BookWithContext;
  score: number;
  reasons: string[];
};

const uniq = <T,>(xs: T[]) => [...new Set(xs)];

/** 自由記述から照合用の語を取り出す（2文字以上の語のみ） */
export function extractTerms(text: string | null | undefined) {
  if (!text) return [];
  return uniq(
    text
      .split(/[\s、。,.・／/「」『』（）()！？!?\n]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2 && t.length <= 20),
  ).slice(0, 30);
}

function bookText(b: BookWithContext) {
  return [b.title, b.description ?? "", b.keywords.join(" "), b.author ?? ""].join(" ");
}

function availabilityReason(book: BookWithContext, reader: Reader, ctx: MatchContext) {
  if (book.stores.length === 0) return { score: 0, reason: null as string | null };
  const followed = book.stores.find((s) => ctx.followedStoreIds.has(s.id));
  if (followed) return { score: 3, reason: `つながっている「${followed.name}」で取扱があります` };
  const near = reader.home_area ? book.stores.find((s) => s.region === reader.home_area) : undefined;
  if (near) return { score: 2.5, reason: `${regionLabel(reader.home_area!)}の「${near.name}」で手に取れます` };
  const first = book.stores[0];
  const more = book.stores.length > 1 ? `ほか${book.stores.length - 1}店` : "";
  return { score: 1.5, reason: `「${first.name}」${more}で取扱があります` };
}

/** あなたへのおすすめ／MEETカード用のスコアリング */
export function recommendBooks(reader: Reader, books: BookWithContext[], ctx: MatchContext): Recommendation[] {
  const interests = new Set(reader.interests);
  const favorites = new Set(reader.favorite_genres);
  const thoughtTerms = extractTerms(reader.current_thoughts);
  const favTerms = extractTerms(reader.favorite_books);

  const out: Recommendation[] = [];
  for (const book of books) {
    if (ctx.meetBookIds.has(book.id)) continue;
    let score = 0;
    const reasons: string[] = [];

    const hitInterests = book.genres.filter((g) => interests.has(g));
    if (hitInterests.length) {
      score += 3 * hitInterests.length;
      reasons.push(`関心のあるテーマ「${hitInterests.map(genreLabel).join("」「")}」の本です`);
    }
    const hitFav = book.genres.filter((g) => favorites.has(g) && !interests.has(g));
    if (hitFav.length) {
      score += 2 * hitFav.length;
      reasons.push(`好きなジャンル「${hitFav.map(genreLabel).join("」「")}」に重なります`);
    }

    const text = bookText(book);
    const hitThought = thoughtTerms.find((t) => text.includes(t));
    if (hitThought) {
      score += 3;
      reasons.push(`最近考えている「${hitThought}」に触れる一冊です`);
    }
    const hitFavTerm = favTerms.find((t) => text.includes(t));
    if (hitFavTerm) {
      score += 2;
      reasons.push(`好きな本として挙げた「${hitFavTerm}」とつながりがあります`);
    }

    const sameAuthor = book.author ? ctx.meetBooks.find((m) => m.author === book.author) : undefined;
    if (sameAuthor) {
      score += 2;
      reasons.push(`MEETした『${sameAuthor.title}』と同じ著者です`);
    } else {
      const samePub = book.publisher_id ? ctx.meetBooks.find((m) => m.publisher_id === book.publisher_id) : undefined;
      if (samePub && book.publisher) {
        score += 1;
        reasons.push(`MEETした『${samePub.title}』と同じ${book.publisher.name}の本です`);
      }
    }

    if (book.publisher) {
      const followed = ctx.followedPublisherIds.has(book.publisher.id);
      score += followed ? 2 : interests.has("local") ? 1.5 : 0.5;
      reasons.push(
        followed
          ? `つながっている長崎の出版社「${book.publisher.name}」の刊行物です`
          : `長崎の出版社「${book.publisher.name}」の刊行物です`,
      );
    }

    // 読者側の根拠が1つもない本は、おすすめとしては出さない（在庫だけでは推薦しない）
    const readerReasons = reasons.length;
    const avail = availabilityReason(book, reader, ctx);
    if (avail.reason) {
      score += avail.score;
      reasons.push(avail.reason);
    }
    if (readerReasons === 0) continue;
    out.push({ book, score, reasons });
  }
  return out.sort((a, b) => b.score - a.score || a.book.title.localeCompare(b.book.title, "ja"));
}

/** 日付と読者IDから決まる擬似乱数（同じ日には同じ結果になる） */
export function dailySeed(readerId: string, day: string) {
  let h = 2166136261;
  for (const c of readerId + day) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type Serendipity = { book: BookWithContext; why: string; bridge: string[] };

/**
 * 偶然の一冊：好みの「周辺」にあるが、普段は選ばないジャンルの本を1冊。
 * 挑戦度が低いほど関心ジャンルと隣接する本に限定し、高いほど未開拓ジャンルを優先する。
 */
export function pickSerendipity(
  reader: Reader,
  books: BookWithContext[],
  ctx: MatchContext,
  seed: number,
): Serendipity | null {
  const comfort = new Set([...reader.interests, ...reader.favorite_genres]);
  const unexplored = new Set(reader.unexplored_genres);
  const level = reader.adventure_level;

  const candidates: (Serendipity & { weight: number })[] = [];
  for (const book of books) {
    if (ctx.meetBookIds.has(book.id) || book.genres.length === 0) continue;
    // 普段選ぶジャンルの本は対象外
    if (book.genres.some((g) => comfort.has(g))) continue;

    const bridge: string[] = [];
    let weight = 0;
    let why = "";

    // 関心ジャンルとの「接点」
    for (const g of book.genres) {
      for (const c of comfort) {
        const b = bridgeBetween(g, c);
        if (b && !why) {
          why = `普段読む「${genreLabel(c)}」と、この本の「${genreLabel(g)}」は、${b.why}からです。`;
          bridge.push(genreLabel(c), genreLabel(g));
          weight += level <= 3 ? 3 : 2;
        }
      }
    }
    const hitUnexplored = book.genres.find((g) => unexplored.has(g));
    if (hitUnexplored) {
      const text = `アンケートで「いつか読んでみたい」と答えた「${genreLabel(hitUnexplored)}」の本です。`;
      why = why ? `${text}${why}` : text;
      if (!bridge.length) bridge.push(genreLabel(hitUnexplored));
      weight += level >= 3 ? 3 : 1.5;
    }
    // 挑戦度が低い読者には、接点のない本は出さない
    if (!why) {
      if (level < 5) continue;
      why = `あなたの選ぶ本とは重ならない「${genreLabel(book.genres[0])}」の本です。挑戦度を最大にしているので、あえて遠くの一冊を選びました。`;
      bridge.push(genreLabel(book.genres[0]));
      weight += 1;
    }
    if (book.stores.length) {
      why += `「${book.stores[0].name}」で実際に手に取れます。`;
      weight += 1;
    }
    candidates.push({ book, why, bridge, weight });
  }
  if (!candidates.length) return null;

  // 重みの上位から、日替わりで1冊
  candidates.sort((a, b) => b.weight - a.weight);
  const top = candidates.filter((c) => c.weight >= candidates[0].weight - 1).slice(0, 5);
  const { book, why, bridge } = top[seed % top.length];
  return { book, why, bridge };
}

export type Compatibility = { score: number | null; reasons: string[] };

/**
 * 本屋との相性スコア（0〜100の目安）。
 * 書店側の情報（得意ジャンル・雰囲気・過ごし方・地域）が登録されている項目だけで算出し、
 * 1項目も無い場合は null（算出不可）を返す。
 */
export function storeCompatibility(
  reader: Reader,
  store: Pick<Store, "specialty_genres" | "atmosphere_tags" | "style_tags" | "region">,
): Compatibility {
  const reasons: string[] = [];
  let earned = 0;
  let possible = 0;

  if (store.specialty_genres.length) {
    possible += 40;
    const wanted = new Set([...reader.interests, ...reader.favorite_genres]);
    const hit = store.specialty_genres.filter((g) => wanted.has(g));
    const hitNew = store.specialty_genres.filter((g) => reader.unexplored_genres.includes(g) && !wanted.has(g));
    earned += Math.min(40, hit.length * 15 + hitNew.length * 8);
    if (hit.length) reasons.push(`得意ジャンルにあなたの関心「${hit.map(genreLabel).join("」「")}」があります`);
    if (hitNew.length) reasons.push(`読んでみたい「${hitNew.map(genreLabel).join("」「")}」も得意な店です`);
  }
  if (store.atmosphere_tags.length) {
    possible += 30;
    const hit = store.atmosphere_tags.filter((a) => reader.atmospheres.includes(a));
    earned += Math.min(30, hit.length * 15);
    if (hit.length) reasons.push(`好みの雰囲気「${hit.map(atmosphereLabel).join("」「")}」の店です`);
  }
  if (store.style_tags.length) {
    possible += 20;
    const hit = store.style_tags.filter((s) => reader.store_styles.includes(s));
    earned += Math.min(20, hit.length * 10);
    if (hit.length) reasons.push(`「${hit.map(styleLabel).join("」「")}」過ごし方に合います`);
  }
  if (store.region && reader.home_area) {
    possible += 10;
    if (store.region === reader.home_area) {
      earned += 10;
      reasons.push(`${regionLabel(store.region)}にあり、足を運びやすい店です`);
    }
  }
  if (possible === 0) return { score: null, reasons: [] };
  return { score: Math.round((earned / possible) * 100), reasons };
}
