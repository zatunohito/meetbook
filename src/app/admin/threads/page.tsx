import Link from "next/link";
import { db, must } from "@/lib/db";
import { StatusBadge } from "@/components/thread";
import { PageHeader, formatDate } from "@/components/ui";
import type { Thread } from "@/lib/types";

export const metadata = { title: "相談" };

export default async function AdminThreads() {
  const threads = must(
    await db().from("threads").select("*, store:stores(name), book:books(title), messages(count)").order("last_message_at", { ascending: false }).limit(300),
  ) as (Thread & { store: { name: string } | null; book: { title: string } | null; messages: { count: number }[] })[];
  return (
    <>
      <PageHeader title="相談" lead="全書店の相談状況です（閲覧のみ）。返信・ステータス変更は各書店の受信箱から行います。読者の個人情報は保持していません。" />
      <div className="overflow-x-auto rounded-2xl bg-raised shadow-card"><table className="w-full min-w-[640px] text-left text-sm [&_td]:px-4 [&_th]:px-4">
        <thead className="border-b border-rule text-xs text-muted">
          <tr><th className="py-2">件名</th><th>書店</th><th>本</th><th>件数</th><th>最終</th><th>状態</th></tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {threads.map((t) => (
            <tr key={t.thread_id}>
              <td className="py-3"><Link href={`/admin/threads/${t.thread_id}`} className="underline underline-offset-4">{t.subject}</Link></td>
              <td>{t.store?.name}</td>
              <td>{t.book?.title ?? "—"}</td>
              <td>{t.messages[0]?.count ?? 0}</td>
              <td className="text-muted">{formatDate(t.last_message_at, true)}</td>
              <td><StatusBadge status={t.status} /></td>
            </tr>
          ))}
        </tbody>
      </table></div>
      {threads.length === 0 && <p className="mt-6 text-sm text-muted">相談はまだありません。</p>}
    </>
  );
}
