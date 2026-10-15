"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, must } from "@/lib/db";
import { getSession, requireRole } from "@/lib/session";
import { str } from "@/lib/form";
import { getBookWithContext, getStore, getThread } from "@/lib/queries";
import type { ThreadStatus } from "@/lib/types";

export type ConsultState = { error?: string } | undefined;

export async function createThread(_: ConsultState, form: FormData): Promise<ConsultState> {
  const { id } = await requireRole("reader");
  const store = await getStore(str(form, "store_id") ?? "");
  if (!store || !store.is_published) return { error: "相談先の書店を選んでください。" };
  const bookId = str(form, "book_id");
  const book = bookId ? await getBookWithContext(bookId) : null;
  if (bookId && !book) return { error: "本が見つかりませんでした。" };
  const body = str(form, "body", 4000);
  if (!body || body.length < 5) return { error: "相談内容を5文字以上で入力してください。" };

  const subject = str(form, "subject", 80) ?? (book ? `『${book.title}』について` : `${store.name}への相談`);
  const thread = must(
    await db()
      .from("threads")
      .insert({ reader_id: id, store_id: store.id, book_id: book?.id ?? null, subject, reader_last_read_at: new Date().toISOString() })
      .select("thread_id")
      .single(),
  ) as { thread_id: string };
  must(await db().from("messages").insert({ thread_id: thread.thread_id, body, sender_role: "reader" }));
  revalidatePath("/", "layout");
  redirect(`/connections/threads/${thread.thread_id}?sent=1`);
}

/** 読者・書店どちらからの返信も受け付け、セッションの役割で送信者を決める */
export async function postMessage(threadId: string, _: ConsultState, form: FormData): Promise<ConsultState> {
  const session = await getSession();
  const thread = await getThread(threadId);
  if (!session || !thread) return { error: "スレッドが見つかりません。" };
  const role =
    session.role === "reader" && thread.reader_id === session.id
      ? "reader"
      : session.role === "store" && thread.store_id === session.id
        ? "store"
        : null;
  if (!role) return { error: "このスレッドに返信する権限がありません。" };
  const body = str(form, "body", 4000);
  if (!body) return { error: "メッセージを入力してください。" };

  must(await db().from("messages").insert({ thread_id: threadId, body, sender_role: role }));
  const patch: Record<string, string> = { [`${role}_last_read_at`]: new Date().toISOString() };
  // 書店が返信したら「対応中」へ。読者が解決済みスレッドに書き込んだら再オープン
  if (role === "store" && thread.status === "open") patch.status = "in_progress";
  if (role === "reader" && thread.status === "resolved") patch.status = "open";
  must(await db().from("threads").update(patch).eq("thread_id", threadId));
  revalidatePath("/", "layout");
  return {};
}

export async function setThreadStatus(threadId: string, status: ThreadStatus) {
  const { id } = await requireRole("store");
  if (!["open", "in_progress", "resolved"].includes(status)) return;
  const thread = await getThread(threadId);
  if (!thread || thread.store_id !== id) return;
  must(await db().from("threads").update({ status }).eq("thread_id", threadId));
  revalidatePath("/", "layout");
}
