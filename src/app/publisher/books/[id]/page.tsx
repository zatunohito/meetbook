import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { isUuid } from "@/lib/queries";
import { saveOwnBook, lookupIsbn } from "@/app/actions/publisher";
import { BookForm } from "@/components/book-form";
import { CoverUploader } from "@/components/cover-uploader";
import { Notice, PageHeader } from "@/components/ui";
import type { Book } from "@/lib/types";

export const metadata: Metadata = { title: "刊行本の編集" };

export default async function EditPublisherBook({ params, searchParams }: PageProps<"/publisher/books/[id]">) {
  const { id: pubId } = await requireRole("publisher");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!isUuid(id)) notFound();
  const { data: book } = await db().from("books").select("*").eq("id", id).eq("publisher_id", pubId).maybeSingle<Book>();
  if (!book) notFound();
  return (
    <>
      <PageHeader eyebrow="Edit" title={book.title} />
      {sp.created && <div className="mb-6"><Notice>登録しました。</Notice></div>}
      <div className="mb-8">
        <CoverUploader bookId={book.id} title={book.title} author={book.author} initialUrl={book.cover_url} />
      </div>
      <BookForm book={book} save={saveOwnBook.bind(null, book.id)} lookup={lookupIsbn} />
    </>
  );
}
