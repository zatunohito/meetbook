import Link from "next/link";
import { db, must } from "@/lib/db";
import { PageHeader, Tag, btn } from "@/components/ui";
import type { Publisher } from "@/lib/types";

export const metadata = { title: "出版社" };

export default async function AdminPublishers() {
  const pubs = must(await db().from("publishers").select("*, books(count)").order("name")) as (Publisher & { books: { count: number }[] })[];
  return (
    <>
      <PageHeader title="出版社" />
      <Link href="/admin/publishers/new" className={`${btn.primary} mb-6`}>出版社を追加</Link>
      <div className="overflow-x-auto rounded-2xl bg-raised shadow-card"><table className="w-full min-w-[640px] text-left text-sm [&_td]:px-4 [&_th]:px-4">
        <thead className="border-b border-rule text-xs text-muted">
          <tr><th className="py-2">出版社名</th><th>所在地</th><th>刊行本</th><th>写真</th><th>状態</th></tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {pubs.map((p) => (
            <tr key={p.id}>
              <td className="py-3"><Link href={`/admin/publishers/${p.id}`} className="underline underline-offset-4">{p.name}</Link></td>
              <td>{p.location ?? "—"}</td>
              <td>{p.books[0]?.count ?? 0}</td>
              <td>{p.photo_urls.length >= 5 ? p.photo_urls.length : <Tag tone="accent">{p.photo_urls.length}枚</Tag>}</td>
              <td>{p.is_published ? <Tag tone="accent">公開</Tag> : <Tag>非公開</Tag>}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </>
  );
}
