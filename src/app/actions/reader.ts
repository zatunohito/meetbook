"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, must } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { isKey, pickKeys } from "@/lib/taxonomy";
import { str, strs } from "@/lib/form";
import { isUuid } from "@/lib/queries";

export async function saveProfile(form: FormData) {
  const { id } = await requireRole("reader");
  const level = Number(str(form, "adventure_level"));
  const homeArea = str(form, "home_area");
  const patch = {
    display_name: str(form, "display_name", 40),
    interests: pickKeys("genre", strs(form, "interests")).slice(0, 6),
    favorite_books: str(form, "favorite_books", 500),
    favorite_genres: pickKeys("genre", strs(form, "favorite_genres")).slice(0, 6),
    current_thoughts: str(form, "current_thoughts", 500),
    unexplored_genres: pickKeys("genre", strs(form, "unexplored_genres")).slice(0, 6),
    store_styles: pickKeys("style", strs(form, "store_styles")),
    atmospheres: pickKeys("atmosphere", strs(form, "atmospheres")),
    adventure_level: Number.isInteger(level) && level >= 1 && level <= 5 ? level : 3,
    home_area: isKey("region", homeArea) ? homeArea : null,
    onboarded_at: new Date().toISOString(),
  };
  must(await db().from("readers").update(patch).eq("id", id).select("id").single());
  revalidatePath("/", "layout");
  redirect(str(form, "next") === "profile" ? "/profile?saved=1" : "/home");
}

export async function toggleMeet(bookId: string) {
  const { id } = await requireRole("reader");
  if (!isUuid(bookId)) return;
  const existing = must(
    await db().from("reader_meets").select("book_id").eq("reader_id", id).eq("book_id", bookId).maybeSingle(),
  );
  if (existing) must(await db().from("reader_meets").delete().eq("reader_id", id).eq("book_id", bookId));
  else must(await db().from("reader_meets").insert({ reader_id: id, book_id: bookId }));
  revalidatePath("/", "layout");
}

export async function toggleFollow(type: "store" | "publisher", targetId: string) {
  const { id } = await requireRole("reader");
  if (!isUuid(targetId) || (type !== "store" && type !== "publisher")) return;
  const match = { reader_id: id, target_type: type, target_id: targetId };
  const existing = must(await db().from("reader_follows").select("target_id").match(match).maybeSingle());
  if (existing) must(await db().from("reader_follows").delete().match(match));
  else must(await db().from("reader_follows").insert(match));
  revalidatePath("/", "layout");
}
