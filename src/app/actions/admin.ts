"use server";

// 管理画面の操作。既存データを壊さないよう、書店・出版社・書籍・感想・イベント・お知らせは
// 物理削除せず「公開／非公開」で管理する。在庫と関係性の紐付けのみ解除（削除）できる。

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, must } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { bool, list, str, strs } from "@/lib/form";
import { parseBookForm } from "@/lib/book-form";
import { parseStoreProfile } from "@/lib/store-form";
import { lookupIsbn } from "@/lib/openbd";
import { isKey, pickKeys } from "@/lib/taxonomy";
import { isUuid } from "@/lib/queries";

export type FormState = { error?: string; ok?: string } | undefined;

const SLUG = /^[a-z0-9][a-z0-9-]{1,60}$/;
const url = (v: string | null) => (v && /^https?:\/\//.test(v) ? v : null);

async function run(fn: () => Promise<void | string>): Promise<FormState> {
  await requireAdmin();
  try {
    const ok = await fn();
    revalidatePath("/", "layout");
    return { ok: ok || "保存しました。" };
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes("duplicate key")) return { error: "同じスラッグ／ISBN のデータがすでにあります。" };
    return { error: msg };
  }
}

// ---------------- 書店 ----------------

export async function saveStore(id: string | null, _: FormState, form: FormData): Promise<FormState> {
  const slug = str(form, "slug", 60);
  const name = str(form, "name", 100);
  const region = str(form, "region");
  const row = {
    ...parseStoreProfile(form),
    slug,
    name,
    area: str(form, "area", 100),
    region: isKey("region", region) ? region : null,
    sources: list(form, "sources").filter((u) => /^https?:\/\//.test(u)).slice(0, 20),
    admin_note: str(form, "admin_note", 2000),
    is_published: bool(form, "is_published"),
  };
  if (!name || !slug || !SLUG.test(slug)) {
    await requireAdmin();
    return { error: "店名と、半角英小文字・数字・ハイフンのスラッグは必須です。" };
  }
  if (id) return run(async () => void must(await db().from("stores").update(row).eq("id", id)));
  const res = await run(async () => {
    const created = must(await db().from("stores").insert(row).select("id").single()) as { id: string };
    id = created.id;
  });
  if (res?.error) return res;
  redirect(`/admin/stores/${id}?created=1`);
}

// ---------------- 出版社 ----------------

export async function savePublisher(id: string | null, _: FormState, form: FormData): Promise<FormState> {
  const slug = str(form, "slug", 60);
  const name = str(form, "name", 100);
  const row = {
    slug,
    name,
    location: str(form, "location", 100),
    description: str(form, "description", 3000),
    website_url: url(str(form, "website_url", 300)),
    consultation_enabled: bool(form, "consultation_enabled"),
    consultation_note: str(form, "consultation_note", 1000),
    genres: pickKeys("genre", strs(form, "genres")),
    tags: list(form, "tags").slice(0, 12),
    mission: str(form, "mission", 300),
    seeking: str(form, "seeking", 300),
    admin_note: str(form, "admin_note", 2000),
    is_published: bool(form, "is_published"),
  };
  if (!name || !slug || !SLUG.test(slug)) {
    await requireAdmin();
    return { error: "出版社名と、半角英小文字・数字・ハイフンのスラッグは必須です。" };
  }
  if (id) return run(async () => void must(await db().from("publishers").update(row).eq("id", id)));
  const res = await run(async () => {
    const created = must(await db().from("publishers").insert(row).select("id").single()) as { id: string };
    id = created.id;
  });
  if (res?.error) return res;
  redirect(`/admin/publishers/${id}?created=1`);
}

// ---------------- 書籍 ----------------

export async function saveBook(id: string | null, _: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  let data;
  try {
    data = parseBookForm(form);
  } catch (e) {
    return { error: (e as Error).message };
  }
  const publisherId = str(form, "publisher_id");
  const row = {
    ...data,
    publisher_id: publisherId && isUuid(publisherId) ? publisherId : null,
    data_source: ["openbd", "ndl", "ndl+openbd"].includes(str(form, "data_source") ?? "") ? str(form, "data_source")! : "manual",
  };
  if (id) return run(async () => void must(await db().from("books").update(row).eq("id", id)));
  const res = await run(async () => {
    const created = must(await db().from("books").insert(row).select("id").single()) as { id: string };
    id = created.id;
  });
  if (res?.error) return res;
  redirect(`/admin/books/${id}?created=1`);
}

export async function adminLookupIsbn(_: unknown, form: FormData) {
  await requireAdmin();
  return lookupIsbn(str(form, "isbn", 20));
}

// ---------------- 在庫（取扱書店） ----------------

export async function setStoreBook(bookId: string, _: FormState, form: FormData): Promise<FormState> {
  const storeId = str(form, "store_id");
  if (!storeId || !isUuid(storeId) || !isUuid(bookId)) {
    await requireAdmin();
    return { error: "書店を選んでください。" };
  }
  return run(async () => {
    must(
      await db().from("store_books").upsert({
        store_id: storeId,
        book_id: bookId,
        is_weekly_pick: bool(form, "is_weekly_pick"),
        staff_comment: str(form, "staff_comment", 500),
        verified_at: new Date().toISOString(),
      }),
    );
    return "取扱書店を登録しました。";
  });
}

export async function removeStoreBook(bookId: string, storeId: string) {
  await requireAdmin();
  must(await db().from("store_books").delete().eq("book_id", bookId).eq("store_id", storeId));
  revalidatePath("/", "layout");
}

// ---------------- 感想 ----------------

export async function addReview(bookId: string, _: FormState, form: FormData): Promise<FormState> {
  const body = str(form, "body", 2000);
  const author = str(form, "author_label", 100);
  const source = str(form, "source", 200);
  if (!body || !author || !source) {
    await requireAdmin();
    return { error: "感想・投稿者・出典はすべて必須です（実データのみ登録できます）。" };
  }
  return run(async () => {
    must(await db().from("book_reviews").insert({ book_id: bookId, body, author_label: author, source }));
    return "感想を登録しました。";
  });
}

export async function setReviewPublished(reviewId: string, published: boolean) {
  await requireAdmin();
  must(await db().from("book_reviews").update({ is_published: published }).eq("id", reviewId));
  revalidatePath("/", "layout");
}

// ---------------- 関係性 ----------------

export async function addRelation(bookId: string, _: FormState, form: FormData): Promise<FormState> {
  const related = str(form, "related_book_id");
  if (!related || !isUuid(related) || related === bookId) {
    await requireAdmin();
    return { error: "関係づける本を選んでください。" };
  }
  return run(async () => {
    must(await db().from("book_relations").upsert({ book_id: bookId, related_book_id: related, note: str(form, "note", 200) }));
    return "関係を登録しました。";
  });
}

export async function removeRelation(bookId: string, relatedId: string) {
  await requireAdmin();
  must(await db().from("book_relations").delete().eq("book_id", bookId).eq("related_book_id", relatedId));
  revalidatePath("/", "layout");
}

// ---------------- イベント・お知らせ ----------------

function toTimestamp(v: string | null) {
  if (!v) return null;
  // datetime-local は JST として扱う
  const d = new Date(`${v}:00+09:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function saveEvent(id: string | null, _: FormState, form: FormData): Promise<FormState> {
  const title = str(form, "title", 200);
  const startsAt = toTimestamp(str(form, "starts_at", 20));
  if (!title || !startsAt) {
    await requireAdmin();
    return { error: "タイトルと開始日時は必須です。" };
  }
  const storeId = str(form, "store_id");
  const publisherId = str(form, "publisher_id");
  const row = {
    title,
    starts_at: startsAt,
    ends_at: toTimestamp(str(form, "ends_at", 20)),
    description: str(form, "description", 3000),
    place: str(form, "place", 200),
    url: url(str(form, "url", 500)),
    store_id: storeId && isUuid(storeId) ? storeId : null,
    publisher_id: publisherId && isUuid(publisherId) ? publisherId : null,
    is_published: bool(form, "is_published"),
  };
  return run(async () => {
    if (id) must(await db().from("events").update(row).eq("id", id));
    else must(await db().from("events").insert(row));
  });
}

export async function saveAnnouncement(id: string | null, _: FormState, form: FormData): Promise<FormState> {
  const title = str(form, "title", 200);
  if (!title) {
    await requireAdmin();
    return { error: "タイトルは必須です。" };
  }
  const row = {
    title,
    body: str(form, "body", 3000),
    url: url(str(form, "url", 500)),
    published_at: toTimestamp(str(form, "published_at", 20)) ?? new Date().toISOString(),
    is_published: bool(form, "is_published"),
  };
  return run(async () => {
    if (id) must(await db().from("announcements").update(row).eq("id", id));
    else must(await db().from("announcements").insert(row));
  });
}
