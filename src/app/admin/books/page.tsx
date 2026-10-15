import Link from "next/link";
import { db, must } from "@/lib/db";
import { PageHeader, Tag, btn } from "@/components/ui";
import type { Book } from "@/lib/types";

export const metadata = { title: "書籍" };

type Row = Book & { publisher: { name: string } | null; store_books: { count: number }[]; book_reviews: { count: number }[] };

export default async function AdminBooks({ searchParams }: PageProps<"/admin/books">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  let query = db().from("books").select("*, publisher:publishers(name), store_books(count), book_reviews(count)").order("created_at", { ascending: false }).limit(200);
  // PostgREST の or() 構文を壊す文字は取り除く
  const safe = q.replace(/[,()*%\\]/g, "");
  if (safe) query = query.or(`title.ilike.*${safe}*,author.ilike.*${safe}*,isbn.ilike.*${safe}*`);
  const books = must(await query) as Row[];
  return (
    <>
      <PageHeader title="書籍" />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href="/admin/books/new" className={btn.primary}>書籍を追加（ISBN取り込み可）</Link>
        <form className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="書名・著者・ISBN" className="field w-56" aria-label="検索" />
          <button className={btn.secondary}>検索</button>
        </form>
      </div>
      <div className="overflow-x-auto rounded-2xl bg-raised shadow-card"><table className="w-full min-w-[640px] text-left text-sm [&_td]:px-4 [&_th]:px-4">
        <thead className="border-b border-rule text-xs text-muted">
          <tr><th className="py-2">書名</th><th>著者</th><th>出版社</th><th>取扱店</th><th>感想</th><th>状態</th></tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {books.map((b) => (
            <tr key={b.id}>
              <td className="py-3"><Link href={`/admin/books/${b.id}`} className="underline underline-offset-4">{b.title}</Link></td>
              <td>{b.author ?? "—"}</td>
              <td>{b.publisher?.name ?? b.publisher_name ?? "—"}</td>
              <td>{b.store_books[0]?.count ?? 0}</td>
              <td>{b.book_reviews[0]?.count ?? 0}</td>
              <td>{b.is_published ? <Tag tone="accent">公開</Tag> : <Tag>非公開</Tag>}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
      {books.length === 0 && <p className="mt-6 text-sm text-muted">書籍はまだ登録されていません。</p>}
    </>
  );
}
