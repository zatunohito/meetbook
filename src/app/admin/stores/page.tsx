import Link from "next/link";
import { db, must } from "@/lib/db";
import { PageHeader, Tag, btn } from "@/components/ui";
import type { Store } from "@/lib/types";

export const metadata = { title: "書店" };

export default async function AdminStores() {
  const stores = must(await db().from("stores").select("*").order("name")) as Store[];
  const filled = (s: Store) => [s.address, s.description, s.region, s.specialty_genres.length, s.atmosphere_tags.length].filter(Boolean).length;
  return (
    <>
      <PageHeader title="書店" />
      <Link href="/admin/stores/new" className={`${btn.primary} mb-6`}>書店を追加</Link>
      <div className="overflow-x-auto rounded-2xl bg-raised shadow-card"><table className="w-full min-w-[640px] text-left text-sm [&_td]:px-4 [&_th]:px-4">
        <thead className="border-b border-rule text-xs text-muted">
          <tr><th className="py-2">店名</th><th>エリア</th><th>情報の充足</th><th>写真</th><th>状態</th></tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {stores.map((s) => (
            <tr key={s.id}>
              <td className="py-3"><Link href={`/admin/stores/${s.id}`} className="underline underline-offset-4">{s.name}</Link></td>
              <td>{s.area ?? "—"}</td>
              <td className="text-muted">{filled(s)}/5</td>
              <td>{s.photo_urls.length >= 5 ? s.photo_urls.length : <Tag tone="accent">{s.photo_urls.length}枚</Tag>}</td>
              <td>{s.is_published ? <Tag tone="accent">公開</Tag> : <Tag>非公開</Tag>}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </>
  );
}
