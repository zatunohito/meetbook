"use server";

import { redirect } from "next/navigation";
import { db, must } from "@/lib/db";
import { clearSession, getSession, setSession } from "@/lib/session";
import { getPublisher, getReader, getStore } from "@/lib/queries";
import { str } from "@/lib/form";

export async function startAsReader() {
  const current = await getSession();
  // セッションが残っていても、読者データが消えている場合は新しく作り直す
  if (current?.role === "reader" && (await getReader(current.id))) redirect("/home");
  const reader = must(await db().from("readers").insert({}).select("id").single()) as { id: string };
  await setSession({ role: "reader", id: reader.id });
  redirect("/onboarding");
}

export async function startAsStore(form: FormData) {
  const store = await getStore(str(form, "store_id") ?? "");
  if (!store) redirect("/welcome?error=store");
  await setSession({ role: "store", id: store.id });
  redirect("/store");
}

export async function startAsPublisher(form: FormData) {
  const pub = await getPublisher(str(form, "publisher_id") ?? "");
  if (!pub) redirect("/welcome?error=publisher");
  await setSession({ role: "publisher", id: pub.id });
  redirect("/publisher");
}

export async function signOut() {
  await clearSession();
  redirect("/welcome");
}
