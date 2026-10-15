import { describe, expect, it } from "vitest";
import { extractTerms, pickSerendipity, recommendBooks, storeCompatibility, type MatchContext } from "./match";
import type { BookWithContext, Reader } from "./types";

// テスト専用の最小フィクスチャ（アプリのデータとしては使わない）
const reader = (p: Partial<Reader> = {}): Reader => ({
  id: "r1",
  display_name: null,
  interests: [],
  favorite_books: null,
  favorite_genres: [],
  current_thoughts: null,
  unexplored_genres: [],
  store_styles: [],
  atmospheres: [],
  adventure_level: 3,
  home_area: null,
  onboarded_at: "2026-01-01",
  ...p,
});

const book = (id: string, p: Partial<BookWithContext> = {}): BookWithContext => ({
  id,
  isbn: null,
  title: `本${id}`,
  author: null,
  publisher_id: null,
  publisher_name: null,
  genres: [],
  keywords: [],
  description: null,
  cover_url: null,
  published_on: null,
  target_readers: null,
  consultation_note: null,
  data_source: "manual",
  source_url: null,
  is_published: true,
  created_at: "2026-01-01",
  publisher: null,
  stores: [],
  ...p,
});

const ctx = (p: Partial<MatchContext> = {}): MatchContext => ({
  meetBookIds: new Set(),
  meetBooks: [],
  followedStoreIds: new Set(),
  followedPublisherIds: new Set(),
  ...p,
});

const storeA = { id: "s1", slug: "a", name: "A書店", region: "omura", is_weekly_pick: false };

describe("recommendBooks", () => {
  it("関心テーマに合う本を理由つきで上位にする", () => {
    const r = reader({ interests: ["philosophy"] });
    const recs = recommendBooks(r, [book("1", { genres: ["mystery"] }), book("2", { genres: ["philosophy"] })], ctx());
    expect(recs.map((x) => x.book.id)).toEqual(["2"]);
    expect(recs[0].reasons[0]).toContain("哲学・思想");
  });

  it("在庫だけでは推薦しないが、根拠がある本には取扱書店を理由に添える", () => {
    const r = reader({ interests: ["history"], home_area: "omura" });
    const recs = recommendBooks(r, [book("1", { stores: [storeA] }), book("2", { genres: ["history"], stores: [storeA] })], ctx());
    expect(recs.map((x) => x.book.id)).toEqual(["2"]);
    expect(recs[0].reasons.at(-1)).toContain("A書店");
  });

  it("最近考えていることの語が本文に含まれると理由になる", () => {
    const r = reader({ current_thoughts: "島の暮らし、働き方" });
    const recs = recommendBooks(r, [book("1", { description: "五島の島の暮らしを描く" })], ctx());
    expect(recs[0].reasons.some((x) => x.includes("島の暮らし"))).toBe(true);
  });

  it("MEET済みの本は除外する", () => {
    const r = reader({ interests: ["history"] });
    const recs = recommendBooks(r, [book("1", { genres: ["history"] })], ctx({ meetBookIds: new Set(["1"]) }));
    expect(recs).toHaveLength(0);
  });
});

describe("pickSerendipity", () => {
  it("普段のジャンルの本は選ばず、隣接ジャンルの本を接点の説明つきで選ぶ", () => {
    const r = reader({ interests: ["philosophy"], adventure_level: 2 });
    const s = pickSerendipity(r, [book("1", { genres: ["philosophy"] }), book("2", { genres: ["religion"] }), book("3", { genres: ["comics"] })], ctx(), 0);
    expect(s?.book.id).toBe("2");
    expect(s?.why).toContain("哲学・思想");
  });

  it("挑戦度が最大でなければ、接点のない本は選ばない", () => {
    const r = reader({ interests: ["philosophy"], adventure_level: 4 });
    expect(pickSerendipity(r, [book("1", { genres: ["comics"] })], ctx(), 0)).toBeNull();
    expect(pickSerendipity({ ...r, adventure_level: 5 }, [book("1", { genres: ["comics"] })], ctx(), 0)?.book.id).toBe("1");
  });
});

describe("storeCompatibility", () => {
  it("店舗情報がなければ算出しない", () => {
    expect(storeCompatibility(reader(), { specialty_genres: [], atmosphere_tags: [], style_tags: [], region: null }).score).toBeNull();
  });

  it("登録済み項目のみで0〜100を算出し根拠を返す", () => {
    const r = reader({ interests: ["local"], atmospheres: ["quiet"] });
    const c = storeCompatibility(r, { specialty_genres: ["local"], atmosphere_tags: ["quiet"], style_tags: [], region: null });
    expect(c.score).toBe(43); // (15 + 15) / 70
    expect(c.reasons).toHaveLength(2);
  });
});

describe("extractTerms", () => {
  it("句読点で区切り2文字以上の語を返す", () => {
    expect(extractTerms("祈り、海。と")).toEqual(["祈り"]);
  });
});
