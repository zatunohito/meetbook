import type { Metadata } from "next";
import Link from "next/link";
import { getBookWithContext, getStore, listStores } from "@/lib/queries";
import { requireRole } from "@/lib/session";
import { ConsultForm } from "@/components/consult-form";
import { BookCover } from "@/components/book-cover";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "書店に相談する" };

export default async function ConsultPage({ searchParams }: PageProps<"/consult">) {
  await requireRole("reader");
  const sp = await searchParams;
  const bookId = typeof sp.book === "string" ? sp.book : null;
  const storeId = typeof sp.store === "string" ? sp.store : null;
  const [book, stores, store] = await Promise.all([
    bookId ? getBookWithContext(bookId) : null,
    listStores(),
    storeId ? getStore(storeId) : null,
  ]);
  const has = new Set(book?.stores.map((s) => s.id) ?? []);

  return (
    <div className="max-w-2xl">
      <PageHeader
        eyebrow="Consult"
        title={book ? "この本について書店に相談する" : "書店に相談する"}
        lead="在庫の確認、取り寄せ、似た本の相談など、気軽に書店へ問いかけてみてください。"
      />
      {book && (
        <Link href={`/books/${book.id}`} className="mb-8 flex items-center gap-4 rounded-2xl bg-raised shadow-card p-4">
          <BookCover title={book.title} author={book.author} url={book.cover_url} size="sm" />
          <div>
            <p className="font-display">{book.title}</p>
            <p className="text-xs text-muted">{book.author}</p>
            {book.consultation_note && <p className="mt-1 text-xs text-ink-soft">出版社より：{book.consultation_note}</p>}
          </div>
        </Link>
      )}
      <ConsultForm
        bookId={book?.id ?? null}
        bookTitle={book?.title ?? null}
        stores={stores.map((s) => ({ id: s.id, name: s.name, hasBook: has.has(s.id) }))}
        defaultStoreId={store?.is_published ? store.id : null}
      />
    </div>
  );
}
