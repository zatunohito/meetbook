import "server-only";
import { db, must } from "./db";
import type {
  Announcement,
  Book,
  BookReview,
  BookWithContext,
  EventRow,
  Message,
  Publisher,
  Reader,
  Store,
  StoreBook,
  Thread,
} from "./types";
import type { MatchContext } from "./match";

// ---------------- 書籍 ----------------

type BookJoinRow = Book & {
  publisher: Pick<Publisher, "id" | "slug" | "name"> | null;
  store_books: (Pick<StoreBook, "is_weekly_pick"> & { store: Pick<Store, "id" | "slug" | "name" | "region" | "is_published"> | null })[];
};

const BOOK_SELECT =
  "*, publisher:publishers(id, slug, name), store_books(is_weekly_pick, store:stores(id, slug, name, region, is_published))";

function toContext(row: BookJoinRow): BookWithContext {
  const { store_books, ...book } = row;
  return {
    ...book,
    stores: store_books
      .filter((sb) => sb.store?.is_published)
      .map((sb) => ({
        id: sb.store!.id,
        slug: sb.store!.slug,
        name: sb.store!.name,
        region: sb.store!.region,
        is_weekly_pick: sb.is_weekly_pick,
      })),
  };
}

export async function listBooksWithContext(): Promise<BookWithContext[]> {
  const rows = must(await db().from("books").select(BOOK_SELECT).eq("is_published", true)) as BookJoinRow[];
  return rows.map(toContext);
}

export async function getBookWithContext(id: string): Promise<BookWithContext | null> {
  if (!isUuid(id)) return null;
  const row = must(await db().from("books").select(BOOK_SELECT).eq("id", id).maybeSingle()) as BookJoinRow | null;
  return row ? toContext(row) : null;
}

export async function listReviews(bookId: string): Promise<BookReview[]> {
  return must(
    await db().from("book_reviews").select("*").eq("book_id", bookId).eq("is_published", true).order("created_at", { ascending: false }),
  );
}

export async function listExplicitRelations(bookId: string) {
  return must(
    await db()
      .from("book_relations")
      .select("note, related:books!book_relations_related_book_id_fkey(id, title, author, cover_url)")
      .eq("book_id", bookId),
  ) as unknown as { note: string | null; related: Pick<Book, "id" | "title" | "author" | "cover_url"> | null }[];
}

// ---------------- 書店・出版社 ----------------

export async function listStores(): Promise<Store[]> {
  return must(await db().from("stores").select("*").eq("is_published", true).order("name"));
}

export async function getStoreBySlug(slug: string): Promise<Store | null> {
  return must(await db().from("stores").select("*").eq("slug", slug).eq("is_published", true).maybeSingle());
}

export async function getStore(id: string): Promise<Store | null> {
  if (!isUuid(id)) return null;
  return must(await db().from("stores").select("*").eq("id", id).maybeSingle());
}

export async function listStoreBooks(storeId: string) {
  return must(
    await db()
      .from("store_books")
      .select("is_weekly_pick, staff_comment, verified_at, book:books(id, title, author, cover_url, is_published)")
      .eq("store_id", storeId)
      .order("verified_at", { ascending: false }),
  ) as unknown as (Pick<StoreBook, "is_weekly_pick" | "staff_comment" | "verified_at"> & {
    book: Pick<Book, "id" | "title" | "author" | "cover_url" | "is_published"> | null;
  })[];
}

export async function listPublishers(): Promise<Publisher[]> {
  return must(await db().from("publishers").select("*").eq("is_published", true).order("name"));
}

export async function getPublisherBySlug(slug: string): Promise<Publisher | null> {
  return must(await db().from("publishers").select("*").eq("slug", slug).eq("is_published", true).maybeSingle());
}

export async function getPublisher(id: string): Promise<Publisher | null> {
  if (!isUuid(id)) return null;
  return must(await db().from("publishers").select("*").eq("id", id).maybeSingle());
}

export async function listBooksByPublisher(publisherId: string): Promise<Book[]> {
  return must(await db().from("books").select("*").eq("publisher_id", publisherId).order("published_on", { ascending: false, nullsFirst: false }));
}

// ---------------- イベント・お知らせ ----------------

export async function listUpcomingEvents(filter?: { storeId?: string; publisherId?: string }, limit = 10) {
  let q = db()
    .from("events")
    .select("*, store:stores(slug, name), publisher:publishers(slug, name)")
    .eq("is_published", true)
    .gte("starts_at", new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString())
    .order("starts_at")
    .limit(limit);
  if (filter?.storeId) q = q.eq("store_id", filter.storeId);
  if (filter?.publisherId) q = q.eq("publisher_id", filter.publisherId);
  return must(await q) as (EventRow & {
    store: Pick<Store, "slug" | "name"> | null;
    publisher: Pick<Publisher, "slug" | "name"> | null;
  })[];
}

export async function listAnnouncements(limit = 5): Promise<Announcement[]> {
  return must(
    await db().from("announcements").select("*").eq("is_published", true).lte("published_at", new Date().toISOString()).order("published_at", { ascending: false }).limit(limit),
  );
}

// ---------------- 読者 ----------------

export async function getReader(id: string): Promise<Reader | null> {
  if (!isUuid(id)) return null;
  return must(await db().from("readers").select("*").eq("id", id).maybeSingle());
}

export async function getMatchContext(readerId: string, books: BookWithContext[]): Promise<MatchContext> {
  const [meets, follows] = await Promise.all([
    db().from("reader_meets").select("book_id").eq("reader_id", readerId),
    db().from("reader_follows").select("target_type, target_id").eq("reader_id", readerId),
  ]);
  const meetBookIds = new Set(must(meets).map((m: { book_id: string }) => m.book_id));
  const f = must(follows) as { target_type: string; target_id: string }[];
  return {
    meetBookIds,
    meetBooks: books.filter((b) => meetBookIds.has(b.id)),
    followedStoreIds: new Set(f.filter((x) => x.target_type === "store").map((x) => x.target_id)),
    followedPublisherIds: new Set(f.filter((x) => x.target_type === "publisher").map((x) => x.target_id)),
  };
}

export async function listMeetBooks(readerId: string) {
  return must(
    await db()
      .from("reader_meets")
      .select("created_at, book:books(id, title, author, cover_url, publisher_name, publisher:publishers(name))")
      .eq("reader_id", readerId)
      .order("created_at", { ascending: false }),
  ) as unknown as {
    created_at: string;
    book: (Pick<Book, "id" | "title" | "author" | "cover_url" | "publisher_name"> & { publisher: { name: string } | null }) | null;
  }[];
}

export async function listFollows(readerId: string) {
  const f = must(
    await db().from("reader_follows").select("target_type, target_id, created_at").eq("reader_id", readerId).order("created_at", { ascending: false }),
  ) as { target_type: "store" | "publisher"; target_id: string; created_at: string }[];
  const storeIds = f.filter((x) => x.target_type === "store").map((x) => x.target_id);
  const pubIds = f.filter((x) => x.target_type === "publisher").map((x) => x.target_id);
  const [stores, publishers] = await Promise.all([
    storeIds.length ? db().from("stores").select("id, slug, name, area").in("id", storeIds) : { data: [], error: null },
    pubIds.length ? db().from("publishers").select("id, slug, name, location").in("id", pubIds) : { data: [], error: null },
  ]);
  return {
    stores: must(stores) as Pick<Store, "id" | "slug" | "name" | "area">[],
    publishers: must(publishers) as Pick<Publisher, "id" | "slug" | "name" | "location">[],
  };
}

export async function isFollowing(readerId: string, type: "store" | "publisher", targetId: string) {
  const row = must(
    await db().from("reader_follows").select("target_id").eq("reader_id", readerId).eq("target_type", type).eq("target_id", targetId).maybeSingle(),
  );
  return !!row;
}

// ---------------- 相談 ----------------

export type ThreadListItem = Thread & {
  store: Pick<Store, "id" | "slug" | "name"> | null;
  book: Pick<Book, "id" | "title"> | null;
  messages: Pick<Message, "message_id" | "body" | "sender_role" | "created_at">[];
};

const THREAD_SELECT =
  "*, store:stores(id, slug, name), book:books(id, title), messages(message_id, body, sender_role, created_at)";

function sortLatest(threads: ThreadListItem[]) {
  for (const t of threads) t.messages.sort((a, b) => a.created_at.localeCompare(b.created_at));
  return threads;
}

export async function listReaderThreads(readerId: string): Promise<ThreadListItem[]> {
  return sortLatest(
    must(await db().from("threads").select(THREAD_SELECT).eq("reader_id", readerId).order("last_message_at", { ascending: false })),
  );
}

export async function listStoreThreads(storeId: string, status?: string): Promise<ThreadListItem[]> {
  let q = db().from("threads").select(THREAD_SELECT).eq("store_id", storeId).order("last_message_at", { ascending: false });
  if (status) q = q.eq("status", status);
  return sortLatest(must(await q));
}

export async function getThread(threadId: string) {
  if (!isUuid(threadId)) return null;
  const t = must(await db().from("threads").select(THREAD_SELECT).eq("thread_id", threadId).maybeSingle()) as ThreadListItem | null;
  return t ? sortLatest([t])[0] : null;
}

/** 未読：相手側のメッセージが自分の最終既読より新しい */
export function isUnread(t: ThreadListItem, viewer: "reader" | "store") {
  const lastRead = viewer === "reader" ? t.reader_last_read_at : t.store_last_read_at;
  const other = viewer === "reader" ? "store" : "reader";
  return t.messages.some((m) => m.sender_role === other && (!lastRead || m.created_at > lastRead));
}

/** 閲覧時に既読を更新（ページのレンダリング中にのみ呼ぶ。Server Action としては公開しない） */
export async function markThreadRead(threadId: string, viewer: "reader" | "store") {
  must(await db().from("threads").update({ [`${viewer}_last_read_at`]: new Date().toISOString() }).eq("thread_id", threadId));
}

export function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
