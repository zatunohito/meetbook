import Link from "next/link";
import { saveEvent } from "@/app/actions/admin";
import { db, must } from "@/lib/db";
import { listPublishers, listStores } from "@/lib/queries";
import { EventForm } from "@/components/admin-forms";
import { PageHeader, Tag, formatDate } from "@/components/ui";
import type { EventRow } from "@/lib/types";

export const metadata = { title: "イベント" };

export default async function AdminEvents({ searchParams }: PageProps<"/admin/events">) {
  const sp = await searchParams;
  const [events, stores, publishers] = await Promise.all([
    must(await db().from("events").select("*, store:stores(name), publisher:publishers(name)").order("starts_at", { ascending: false }).limit(200)) as (EventRow & { store: { name: string } | null; publisher: { name: string } | null })[],
    listStores(),
    listPublishers(),
  ]);
  const editing = events.find((e) => e.id === sp.edit);
  return (
    <>
      <PageHeader title="イベント" />
      <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
        <section>
          <h2 className="mb-4 font-display font-bold text-lg">{editing ? "イベントを編集" : "イベントを追加"}</h2>
          {editing && <Link href="/admin/events" className="mb-4 inline-block text-sm underline underline-offset-4">新規追加に戻る</Link>}
          <EventForm key={editing?.id ?? "new"} event={editing} save={saveEvent.bind(null, editing?.id ?? null)} stores={stores} publishers={publishers} />
        </section>
        <section>
          <h2 className="mb-4 font-display font-bold text-lg">登録済み</h2>
          <ul className="divide-y divide-rule overflow-hidden rounded-2xl bg-raised shadow-card [&>li]:px-4 md:[&>li]:px-5 text-sm">
            {events.map((e) => (
              <li key={e.id} className="py-3">
                <p className="text-xs text-muted">{formatDate(e.starts_at, true)} ・ {e.store?.name ?? e.publisher?.name ?? "主催未設定"}</p>
                <Link href={`/admin/events?edit=${e.id}`} className="underline underline-offset-4">{e.title}</Link>
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
