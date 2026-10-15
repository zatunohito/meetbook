import type { Metadata } from "next";
import Link from "next/link";
import { Star } from "lucide-react";
import { requireRole } from "@/lib/session";
import { db, must } from "@/lib/db";
import { listStoreBooks } from "@/lib/queries";
import { addOwnStoreBook, confirmStock, removeOwnStoreBook, setWeeklyPick } from "@/app/actions/store";
import { InlineForm } from "@/components/admin-forms";
import { Field } from "@/components/book-form";
import { BookCover } from "@/components/book-cover";
import { SubmitButton } from "@/components/submit-button";
import { Empty, PageHeader, Tag, btn, formatDate } from "@/components/ui";
import type { Book } from "@/lib/types";

export const metadata: Metadata = { title: "本・今週の本" };

export default async function StoreBooksPage() {
  const { id } = await requireRole("store");
  const [stock, books] = await Promise.all([
    listStoreBooks(id),
    db().from("books").select("id, title, author").eq("is_published", true).order("title").limit(2000),
  ]);
  const all = must(books) as Pick<Book, "id" | "title" | "author">[];
  const have = new Set(stock.map((s) => s.book?.id));
  const addable = all.filter((b) => !have.has(b.id));

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Books"
        title="取扱の本・今週の本"
        lead="店頭にある本を登録すると、読者の「取扱書店」に表示され、おすすめの根拠になります。「今週の本」は店舗ページで紹介されます。"
      />
      {stock.length ? (
        <ul className="divide-y divide-rule overflow-hidden rounded-2xl bg-raised shadow-card [&>li]:px-4 md:[&>li]:px-5">
          {stock.filter((s) => s.book).map((s) => (
            <li key={s.book!.id} className="flex flex-wrap items-center gap-4 py-4">
              <BookCover title={s.book!.title} author={s.book!.author} url={s.book!.cover_url} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="font-display">
                  {s.book!.title}
                  {s.is_weekly_pick && <span className="ml-2 align-middle"><Tag tone="accent">今週の本</Tag></span>}
                </p>
                <p className="text-xs text-muted">在庫確認 {formatDate(s.verified_at)}{s.staff_comment && ` ・ ${s.staff_comment}`}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                <form action={setWeeklyPick.bind(null, s.book!.id, !s.is_weekly_pick)}>
                  <SubmitButton className={btn.ghost}><Star aria-hidden className="size-4" />{s.is_weekly_pick ? "今週の本から外す" : "今週の本にする"}</SubmitButton>
                </form>
                <form action={confirmStock.bind(null, s.book!.id)}>
                  <SubmitButton className={btn.ghost}>在庫を確認した</SubmitButton>
                </form>
                <form action={removeOwnStoreBook.bind(null, s.book!.id)}>
                  <SubmitButton className={btn.ghost}>取扱をやめる</SubmitButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty title="取扱の本はまだ登録されていません" />
      )}

      <section className="mt-10">
        <h2 className="mb-4 font-display font-bold text-lg">取扱の本を追加</h2>
        {addable.length ? (
          <InlineForm save={addOwnStoreBook} submitLabel="登録する">
            <Field label="本" htmlFor="book_id">
              <select id="book_id" name="book_id" required defaultValue="" className="field">
                <option value="" disabled>選択</option>
                {addable.map((b) => <option key={b.id} value={b.id}>{b.title}{b.author ? `（${b.author}）` : ""}</option>)}
              </select>
            </Field>
            <Field label="ひとことコメント（任意）" hint="今週の本などに表示されます" htmlFor="staff_comment">
              <input id="staff_comment" name="staff_comment" maxLength={500} className="field" />
            </Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_weekly_pick" className="accent-[var(--accent)]" />今週の本にする</label>
          </InlineForm>
        ) : (
          <p className="text-sm text-muted">登録できる本がありません。</p>
        )}
        <p className="mt-3 text-xs text-muted">
          一覧にない本は、MEET BOOK 運営または出版社が登録すると選べるようになります。<Link href="/store" className="underline underline-offset-4">受信箱へ戻る</Link>
        </p>
      </section>
    </div>
  );
}
