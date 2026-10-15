import Link from "next/link";
import { notFound } from "next/navigation";
import { savePublisher } from "@/app/actions/admin";
import { getPublisher, listBooksByPublisher } from "@/lib/queries";
import { PublisherForm } from "@/components/admin-forms";
import { Notice, PageHeader } from "@/components/ui";
import { PhotoManager } from "@/components/photo-manager";

export const metadata = { title: "出版社の編集" };

export default async function EditPublisher({ params, searchParams }: PageProps<"/admin/publishers/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const pub = await getPublisher(id);
  if (!pub) notFound();
  const books = await listBooksByPublisher(pub.id);
  return (
    <div className="max-w-3xl">
      <PageHeader title={pub.name} />
      {sp.created && <div className="mb-6"><Notice>追加しました。</Notice></div>}
      <section className="mb-10 rounded-2xl bg-raised p-5 shadow-card">
        <h2 className="mb-4 font-display text-lg font-bold">写真</h2>
        <PhotoManager target={{ kind: "publisher", id: pub.id }} initialUrls={pub.photo_urls} initialCredit={pub.photo_credit} label={pub.name} />
      </section>
      <PublisherForm publisher={pub} save={savePublisher.bind(null, pub.id)} />
      <section className="mt-12 border-t border-rule pt-8">
        <h2 className="font-display font-bold text-lg">刊行本（{books.length}）</h2>
        <ul className="mt-4 space-y-1 text-sm">
          {books.map((b) => <li key={b.id}><Link href={`/admin/books/${b.id}`} className="underline underline-offset-4">{b.title}</Link></li>)}
        </ul>
      </section>
    </div>
  );
}
