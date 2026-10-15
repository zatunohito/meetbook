"use server";

// 書店が自分の店の情報・在庫・今週の本・イベントを更新する。対象は常にセッションの書店に限定する。

import { revalidatePath } from "next/cache";
import { db, must } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { bool, str } from "@/lib/form";
import { parseStoreProfile } from "@/lib/store-form";
import { isUuid } from "@/lib/queries";

export type FormState = { error?: string; ok?: string } | undefined;

export async function updateOwnStore(_: FormState, form: FormData): Promise<FormState> {
  const { id } = await requireRole("store");
  const row = parseStoreProfile(form);
  if (row.staff_message && !row.staff_name) return { error: "店員メッセージには話し手（例：店主 山田）を入れてください。" };
  must(await db().from("stores").update(row).eq("id", id));
  revalidatePath("/", "layout");
  return { ok: "保存しました。読者の画面にすぐ反映されます。" };
}

export async function addOwnStoreBook(_: FormState, form: FormData): Promise<FormState> {
  const { id } = await requireRole("store");
  const bookId = str(form, "book_id");
  if (!bookId || !isUuid(bookId)) return { error: "本を選んでください。" };
  const book = must(await db().from("books").select("id").eq("id", bookId).eq("is_published", true).maybeSingle());
  if (!book) return { error: "本が見つかりません。" };
  must(
    await db().from("store_books").upsert({
      store_id: id,
      book_id: bookId,
      is_weekly_pick: bool(form, "is_weekly_pick"),
      staff_comment: str(form, "staff_comment", 500),
      verified_at: new Date().toISOString(),
    }),
  );
  revalidatePath("/", "layout");
  return { ok: "取扱の本に登録しました。" };
}

export async function setWeeklyPick(bookId: string, on: boolean) {
  const { id } = await requireRole("store");
  if (!isUuid(bookId)) return;
  must(await db().from("store_books").update({ is_weekly_pick: on }).eq("store_id", id).eq("book_id", bookId));
  revalidatePath("/", "layout");
}

export async function confirmStock(bookId: string) {
  const { id } = await requireRole("store");
  if (!isUuid(bookId)) return;
  must(await db().from("store_books").update({ verified_at: new Date().toISOString() }).eq("store_id", id).eq("book_id", bookId));
  revalidatePath("/", "layout");
}

export async function removeOwnStoreBook(bookId: string) {
  const { id } = await requireRole("store");
  if (!isUuid(bookId)) return;
  must(await db().from("store_books").delete().eq("store_id", id).eq("book_id", bookId));
  revalidatePath("/", "layout");
}

function toTimestamp(v: string | null) {
  if (!v) return null;
  const d = new Date(`${v}:00+09:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function saveOwnEvent(eventId: string | null, _: FormState, form: FormData): Promise<FormState> {
  const { id } = await requireRole("store");
  const title = str(form, "title", 200);
  const startsAt = toTimestamp(str(form, "starts_at", 20));
  if (!title || !startsAt) return { error: "タイトルと開始日時は必須です。" };
  const link = str(form, "url", 500);
  const row = {
    title,
    starts_at: startsAt,
    ends_at: toTimestamp(str(form, "ends_at", 20)),
    description: str(form, "description", 3000),
    place: str(form, "place", 200),
    url: link && /^https?:\/\//.test(link) ? link : null,
    is_published: bool(form, "is_published"),
    store_id: id,
  };
  if (eventId) {
    if (!isUuid(eventId)) return { error: "イベントが見つかりません。" };
    const res = must(await db().from("events").update(row).eq("id", eventId).eq("store_id", id).select("id"));
    if (!res.length) return { error: "自店のイベントのみ編集できます。" };
  } else {
    must(await db().from("events").insert(row));
  }
  revalidatePath("/", "layout");
  return { ok: eventId ? "更新しました。" : "追加しました。" };
}
