"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, must } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { bool, list, str, strs } from "@/lib/form";
import { pickKeys } from "@/lib/taxonomy";
import { parseBookForm } from "@/lib/book-form";
import { lookupIsbn as lookupIsbn_ } from "@/lib/openbd";
import { isUuid } from "@/lib/queries";

export type FormState = { error?: string; ok?: string } | undefined;

export async function updateOwnPublisher(_: FormState, form: FormData): Promise<FormState> {
  const { id } = await requireRole("publisher");
  const website = str(form, "website_url", 300);
  if (website && !/^https?:\/\//.test(website)) return { error: "WebサイトはURLで入力してください。" };
  must(
    await db()
      .from("publishers")
      .update({
        location: str(form, "location", 100),
        description: str(form, "description", 3000),
        website_url: website,
        consultation_enabled: bool(form, "consultation_enabled"),
        consultation_note: str(form, "consultation_note", 1000),
        genres: pickKeys("genre", strs(form, "genres")),
        tags: list(form, "tags").slice(0, 12),
        mission: str(form, "mission", 300),
        seeking: str(form, "seeking", 300),
      })
      .eq("id", id),
  );
  revalidatePath("/", "layout");
  return { ok: "出版社情報を保存しました。" };
}

export async function saveOwnBook(bookId: string | null, _: FormState, form: FormData): Promise<FormState> {
  const { id } = await requireRole("publisher");
  let data;
  try {
    data = parseBookForm(form);
  } catch (e) {
    return { error: (e as Error).message };
  }
  const row = { ...data, publisher_id: id, publisher_name: null };
  if (bookId) {
    if (!isUuid(bookId)) return { error: "本が見つかりません。" };
    const res = await db().from("books").update(row).eq("id", bookId).eq("publisher_id", id).select("id");
    if (res.error) return { error: dupMessage(res.error.message) };
    if (!res.data?.length) return { error: "自社の刊行本のみ編集できます。" };
    revalidatePath("/", "layout");
    return { ok: "保存しました。" };
  }
  const res = await db().from("books").insert(row).select("id").single();
  if (res.error) return { error: dupMessage(res.error.message) };
  revalidatePath("/", "layout");
  redirect(`/publisher/books/${res.data.id}?created=1`);
}

/** ISBN から openBD の書誌を下書きとして取り込む（保存は確認後） */
export async function lookupIsbn(_: unknown, form: FormData) {
  await requireRole("publisher");
  return lookupIsbn_(str(form, "isbn", 20));
}

function dupMessage(msg: string) {
  return msg.includes("books_isbn_key") ? "この ISBN の本はすでに登録されています。" : msg;
}
