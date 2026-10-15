import Link from "next/link";
import { saveAnnouncement } from "@/app/actions/admin";
import { db, must } from "@/lib/db";
import { AnnouncementForm } from "@/components/admin-forms";
import { PageHeader, Tag, formatDate } from "@/components/ui";
import type { Announcement } from "@/lib/types";

export const metadata = { title: "お知らせ" };

export default async function AdminAnnouncements({ searchParams }: PageProps<"/admin/announcements">) {
  const sp = await searchParams;
  const items = must(await db().from("announcements").select("*").order("published_at", { ascending: false }).limit(200)) as Announcement[];
  const editing = items.find((a) => a.id === sp.edit);
  return (
    <>
      <PageHeader title="お知らせ" />
      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 font-display font-bold text-lg">{editing ? "お知らせを編集" : "お知らせを追加"}</h2>
          {editing && <Link href="/admin/announcements" className="mb-4 inline-block text-sm underline underline-offset-4">新規追加に戻る</Link>}
          <AnnouncementForm key={editing?.id ?? "new"} item={editing} save={saveAnnouncement.bind(null, editing?.id ?? null)} />
        </section>
        <section>
          <h2 className="mb-4 font-display font-bold text-lg">登録済み</h2>
          <ul className="divide-y divide-rule overflow-hidden rounded-2xl bg-raised shadow-card [&>li]:px-4 md:[&>li]:px-5 text-sm">
            {items.map((a) => (
              <li key={a.id} className="py-3">
                <p className="text-xs text-muted">{formatDate(a.published_at)}</p>
                <Link href={`/admin/announcements?edit=${a.id}`} className="underline underline-offset-4">{a.title}</Link>
                {!a.is_published && <span className="ml-2"><Tag>非公開</Tag></span>}
              </li>
            ))}
            {items.length === 0 && <li className="py-3 text-muted">まだありません</li>}
          </ul>
        </section>
      </div>
    </>
  );
}
