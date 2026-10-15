import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/session";
import { db, must } from "@/lib/db";
import { saveOwnEvent } from "@/app/actions/store";
import { EventForm } from "@/components/admin-forms";
import { PageHeader, Tag, formatDate } from "@/components/ui";
import type { EventRow } from "@/lib/types";

export const metadata: Metadata = { title: "イベント" };

export default async function StoreEventsPage({ searchParams }: PageProps<"/store/events">) {
  const { id } = await requireRole("store");
  const sp = await searchParams;
  const events = must(await db().from("events").select("*").eq("store_id", id).order("starts_at", { ascending: false }).limit(100)) as EventRow[];
  const editing = events.find((e) => e.id === sp.edit);
  return (
    <>
      <PageHeader eyebrow="Events" title="イベント" lead="読書会やトークなどを登録すると、店舗ページと読者のホームに表示されます。中止したイベントは「公開する」を外してください。" />
      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 font-display font-bold text-lg">{editing ? "イベントを編集" : "イベントを追加"}</h2>
          {editing && <Link href="/store/events" className="mb-4 inline-block text-sm underline underline-offset-4">新規追加に戻る</Link>}
          <EventForm key={editing?.id ?? "new"} event={editing} save={saveOwnEvent.bind(null, editing?.id ?? null)} />
        </section>
        <section>
          <h2 className="mb-4 font-display font-bold text-lg">登録済み</h2>
          <ul className="divide-y divide-rule overflow-hidden rounded-2xl bg-raised shadow-card [&>li]:px-4 md:[&>li]:px-5 text-sm">
            {events.map((e) => (
              <li key={e.id} className="py-3">
                <p className="text-xs text-muted">{formatDate(e.starts_at, true)}</p>
                <Link href={`/store/events?edit=${e.id}`} className="underline underline-offset-4">{e.title}</Link>
                {!e.is_published && <span className="ml-2"><Tag>非公開</Tag></span>}
              </li>
            ))}
            {events.length === 0 && <li className="py-3 text-muted">まだありません</li>}
          </ul>
        </section>
      </div>
    </>
  );
}
