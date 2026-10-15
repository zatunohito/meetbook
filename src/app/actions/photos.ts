"use server";

// 書店・出版社の写真の追加・並べ替え・削除。管理者、または本人（書店・出版社のセッション）のみ操作できる。

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db, must } from "@/lib/db";
import { checkBasicAuth } from "@/lib/admin-auth";
import { getSession } from "@/lib/session";
import { deletePhoto, savePhoto } from "@/lib/storage";
import { isUuid } from "@/lib/queries";

export type PhotoTarget = { kind: "store" | "publisher"; id: string };
export type PhotoResult = { error?: string; urls?: string[] };

const MAX_PHOTOS = 20;
const table = (t: PhotoTarget) => (t.kind === "store" ? "stores" : "publishers");

async function authorize(t: PhotoTarget) {
  if ((t.kind !== "store" && t.kind !== "publisher") || !isUuid(t.id)) return false;
  if (checkBasicAuth((await headers()).get("authorization"))) return true;
  const s = await getSession();
  return !!s && s.role === t.kind && s.id === t.id;
}

async function currentUrls(t: PhotoTarget) {
  const row = must(await db().from(table(t)).select("photo_urls").eq("id", t.id).maybeSingle()) as { photo_urls: string[] } | null;
  if (!row) throw new Error("対象が見つかりません。");
  return row.photo_urls;
}

async function store(t: PhotoTarget, urls: string[]) {
  must(await db().from(table(t)).update({ photo_urls: urls }).eq("id", t.id));
  revalidatePath("/", "layout");
  return { urls };
}

export async function uploadPhoto(t: PhotoTarget, form: FormData): Promise<PhotoResult> {
  if (!(await authorize(t))) return { error: "この写真を編集する権限がありません。" };
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "画像を選んでください。" };
  try {
    const urls = await currentUrls(t);
    if (urls.length >= MAX_PHOTOS) return { error: `写真は${MAX_PHOTOS}枚までです。` };
    const url = await savePhoto(Buffer.from(await file.arrayBuffer()), `${table(t)}/${t.id}`);
    return store(t, [...urls, url]);
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function removePhoto(t: PhotoTarget, url: string): Promise<PhotoResult> {
  if (!(await authorize(t))) return { error: "この写真を編集する権限がありません。" };
  const urls = await currentUrls(t);
  if (!urls.includes(url)) return { urls };
  await deletePhoto(url);
  // 写真ごとの説明・クレジットも外す
  const row = must(await db().from(table(t)).select("photo_meta").eq("id", t.id).single()) as { photo_meta: Record<string, unknown> };
  if (url in row.photo_meta) {
    const rest = { ...row.photo_meta };
    delete rest[url];
    must(await db().from(table(t)).update({ photo_meta: rest }).eq("id", t.id));
  }
  return store(t, urls.filter((u) => u !== url));
}

/** 並べ替え（index を to の位置へ）。先頭の写真がカード・トップに使われる */
export async function movePhoto(t: PhotoTarget, url: string, to: number): Promise<PhotoResult> {
  if (!(await authorize(t))) return { error: "この写真を編集する権限がありません。" };
  const urls = await currentUrls(t);
  const from = urls.indexOf(url);
  if (from < 0 || to < 0 || to >= urls.length) return { urls };
  const next = [...urls];
  next.splice(from, 1);
  next.splice(to, 0, url);
  return store(t, next);
}

export async function setPhotoCredit(t: PhotoTarget, credit: string): Promise<PhotoResult> {
  if (!(await authorize(t))) return { error: "この写真を編集する権限がありません。" };
  const v = credit.trim().slice(0, 200) || null;
  must(await db().from(table(t)).update({ photo_credit: v }).eq("id", t.id));
  revalidatePath("/", "layout");
  return {};
}

/** 書影（表紙画像）のアップロード。管理者、またはその本の出版社のみ */
export async function uploadCover(bookId: string, form: FormData): Promise<{ error?: string; url?: string }> {
  if (!isUuid(bookId)) return { error: "本が見つかりません。" };
  const book = must(await db().from("books").select("id, publisher_id, cover_url").eq("id", bookId).maybeSingle()) as
    | { id: string; publisher_id: string | null; cover_url: string | null }
    | null;
  if (!book) return { error: "本が見つかりません。" };
  const isAdmin = checkBasicAuth((await headers()).get("authorization"));
  const s = await getSession();
  if (!isAdmin && !(s?.role === "publisher" && s.id === book.publisher_id)) return { error: "この本の書影を変更する権限がありません。" };
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "画像を選んでください。" };
  try {
    const url = await savePhoto(Buffer.from(await file.arrayBuffer()), `covers/${book.id}`);
    if (book.cover_url) await deletePhoto(book.cover_url);
    must(await db().from("books").update({ cover_url: url }).eq("id", book.id));
    revalidatePath("/", "layout");
    return { url };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
