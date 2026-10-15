import type { Metadata } from "next";
import { saveOwnBook, lookupIsbn } from "@/app/actions/publisher";
import { BookForm } from "@/components/book-form";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "刊行本を登録" };

export default function NewPublisherBook() {
  return (
    <>
      <PageHeader eyebrow="New book" title="刊行本を登録" />
      <BookForm save={saveOwnBook.bind(null, null)} lookup={lookupIsbn} submitLabel="登録する" />
    </>
  );
}
