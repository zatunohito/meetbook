import { adminLookupIsbn, saveBook } from "@/app/actions/admin";
import { listPublishers } from "@/lib/queries";
import { BookForm } from "@/components/book-form";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "書籍を追加" };

export default async function NewBook() {
  const publishers = await listPublishers();
  return (
    <div className="max-w-3xl">
      <PageHeader title="書籍を追加" />
      <BookForm save={saveBook.bind(null, null)} lookup={adminLookupIsbn} publishers={publishers} submitLabel="登録する" />
    </div>
  );
}
