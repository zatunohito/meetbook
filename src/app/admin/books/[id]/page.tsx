import Link from "next/link";
import { notFound } from "next/navigation";
import { addRelation, addReview, adminLookupIsbn, removeRelation, removeStoreBook, saveBook, setReviewPublished, setStoreBook } from "@/app/actions/admin";
import { db, must } from "@/lib/db";
import { isUuid, listExplicitRelations, listStores } from "@/lib/queries";
import { BookForm, Field } from "@/components/book-form";
import { CoverUploader } from "@/components/cover-uploader";
import { InlineForm } from "@/components/admin-forms";
import { SubmitButton } from "@/components/submit-button";
import { Notice, PageHeader, Tag, btn, formatDate } from "@/components/ui";
import type { Book, BookReview, Publisher, StoreBook } from "@/lib/types";

export const metadata = { title: "書籍の編集" };

export default async function EditBook({ params, searchParams }: PageProps<"/admin/books/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!isUuid(id)) notFound();
  const book = must(await db().from("books").select("*").eq("id", id).maybeSingle()) as Book | null;
  if (!book) notFound();
  const [publishers, stores, stock, reviews, relations, allBooks] = await Promise.all([
    must(await db().from("publishers").select("id, name").order("name")) as Pick<Publisher, "id" | "name">[],
    listStores(),
    must(await db().from("store_books").select("*, store:stores(name)").eq("book_id", id)) as (StoreBook & { store: { name: string } | null })[],
    must(await db().from("book_reviews").select("*").eq("book_id", id).order("created_at", { ascending: false })) as BookReview[],
    listExplicitRelations(id),
    must(await db().from("books").select("id, title").neq("id", id).order("title").limit(1000)) as Pick<Book, "id" | "title">[],
  ]);

  return (
    <div className="max-w-3xl">
      <PageHeader title={book.title} lead={<Link href={`/books/${book.id}`} className="underline underline-offset-4">読者画面で見る</Link>} />
      {sp.created && <div className="mb-6"><Notice>登録しました。続けて取扱書店・感想を登録できます。</Notice></div>}
      <div className="mb-8">
        <CoverUploader bookId={book.id} title={book.title} author={book.author} initialUrl={book.cover_url} />
      </div>
      <BookForm book={book} save={saveBook.bind(null, book.id)} lookup={adminLookupIsbn} publishers={publishers} />

      <section className="mt-12 border-t border-rule pt-8">
        <h2 className="font-display font-bold text-lg">取扱書店（実店舗在庫）</h2>
        <p className="mt-1 text-xs text-muted">書店に在庫を確認できたものだけを登録してください。登録日時が「確認日」として残ります。</p>
        <ul className="my-4 divide-y divide-rule overflow-hidden rounded-2xl bg-raised shadow-card [&>li]:px-4 md:[&>li]:px-5 text-sm">
          {stock.map((s) => (
            <li key={s.store_id} className="flex items-center justify-between gap-3 py-3">
              <div>
                {s.store?.name}
                {s.is_weekly_pick && <span className="ml-2"><Tag tone="accent">今週の本</Tag></span>}
                <p className="text-xs text-muted">確認日 {formatDate(s.verified_at)}{s.staff_comment && ` ・ ${s.staff_comment}`}</p>
              </div>
              <form action={removeStoreBook.bind(null, book.id, s.store_id)}>
                <SubmitButton className={btn.ghost}>紐付けを解除</SubmitButton>
              </form>
            </li>
          ))}
          {stock.length === 0 && <li className="py-3 text-muted">未登録</li>}
        </ul>
        <InlineForm save={setStoreBook.bind(null, book.id)} submitLabel="取扱書店を登録・更新">
          <Field label="書店" htmlFor="sb-store">
            <select id="sb-store" name="store_id" required defaultValue="" className="field">
              <option value="" disabled>選択</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="店員コメント（今週の本などに表示）" htmlFor="sb-comment">
            <input id="sb-comment" name="staff_comment" maxLength={500} className="field" />
          </Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_weekly_pick" className="accent-[var(--accent)]" />今週の本に設定</label>
        </InlineForm>
      </section>

      <section className="mt-12 border-t border-rule pt-8">
        <h2 className="font-display font-bold text-lg">感想</h2>
        <p className="mt-1 text-xs text-muted">実際に寄せられた感想のみ、出典とともに登録してください。</p>
        <ul className="my-4 divide-y divide-rule overflow-hidden rounded-2xl bg-raised shadow-card [&>li]:px-4 md:[&>li]:px-5 text-sm">
          {reviews.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 py-3">
              <div className={r.is_published ? "" : "opacity-50"}>
                <p className="whitespace-pre-line">{r.body}</p>
                <p className="mt-1 text-xs text-muted">{r.author_label}（{r.source}）</p>
              </div>
              <form action={setReviewPublished.bind(null, r.id, !r.is_published)}>
                <SubmitButton className={btn.ghost}>{r.is_published ? "非公開にする" : "公開する"}</SubmitButton>
              </form>
            </li>
          ))}
          {reviews.length === 0 && <li className="py-3 text-muted">未登録</li>}
        </ul>
        <InlineForm save={addReview.bind(null, book.id)} submitLabel="感想を登録">
          <Field label="感想" htmlFor="rv-body"><textarea id="rv-body" name="body" rows={3} required className="field" /></Field>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="投稿者の表記" hint="例：好文堂書店 スタッフ、読者（30代）" htmlFor="rv-author"><input id="rv-author" name="author_label" required className="field" /></Field>
            <Field label="出典" hint="例：2026年10月 読書会アンケート" htmlFor="rv-source"><input id="rv-source" name="source" required className="field" /></Field>
          </div>
        </InlineForm>
      </section>

      <section className="mt-12 border-t border-rule pt-8">
        <h2 className="font-display font-bold text-lg">関係性マップ（手動でつなぐ本）</h2>
        <p className="mt-1 text-xs text-muted">同じ著者・出版社・書店の本は自動でつながります。それ以外の関係をここで追加します。</p>
        <ul className="my-4 divide-y divide-rule overflow-hidden rounded-2xl bg-raised shadow-card [&>li]:px-4 md:[&>li]:px-5 text-sm">
          {relations.filter((r) => r.related).map((r) => (
            <li key={r.related!.id} className="flex items-center justify-between gap-3 py-3">
              <span>{r.related!.title}{r.note && <span className="ml-2 text-xs text-muted">{r.note}</span>}</span>
              <form action={removeRelation.bind(null, book.id, r.related!.id)}>
                <SubmitButton className={btn.ghost}>解除</SubmitButton>
              </form>
            </li>
          ))}
          {relations.length === 0 && <li className="py-3 text-muted">未登録</li>}
        </ul>
        <InlineForm save={addRelation.bind(null, book.id)} submitLabel="関係を追加">
          <Field label="つなぐ本" htmlFor="rel-book">
            <select id="rel-book" name="related_book_id" required defaultValue="" className="field">
              <option value="" disabled>選択</option>
              {allBooks.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          </Field>
          <Field label="関係の説明" hint="例：同じ島を舞台にした本" htmlFor="rel-note"><input id="rel-note" name="note" maxLength={200} className="field" /></Field>
        </InlineForm>
      </section>
    </div>
  );
}
