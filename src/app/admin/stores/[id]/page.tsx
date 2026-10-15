import Link from "next/link";
import { notFound } from "next/navigation";
import { saveStore } from "@/app/actions/admin";
import { getStore, listStoreBooks } from "@/lib/queries";
import { StoreForm } from "@/components/admin-forms";
import { Notice, PageHeader } from "@/components/ui";
import { PhotoManager } from "@/components/photo-manager";

export const metadata = { title: "書店の編集" };

export default async function EditStore({ params, searchParams }: PageProps<"/admin/stores/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const store = await getStore(id);
  if (!store) notFound();
  const books = await listStoreBooks(store.id);
  return (
    <div className="max-w-3xl">
      <PageHeader title={store.name} />
      {sp.created && <div className="mb-6"><Notice>追加しました。</Notice></div>}
      <section className="mb-10 rounded-2xl bg-raised p-5 shadow-card">
        <h2 className="mb-4 font-display text-lg font-bold">写真</h2>
        <PhotoManager target={{ kind: "store", id: store.id }} initialUrls={store.photo_urls} initialCredit={store.photo_credit} label={store.name} />
      </section>
      <StoreForm store={store} save={saveStore.bind(null, store.id)} />
      <section className="mt-12 border-t border-rule pt-8">
        <h2 className="font-display font-bold text-lg">取扱書籍（{books.length}）</h2>
        <p className="mt-1 text-xs text-muted">在庫の登録・今週の本の設定は各書籍の編集画面から行います。</p>
        <ul className="mt-4 space-y-1 text-sm">
          {books.filter((b) => b.book).map((b) => (
            <li key={b.book!.id}>
              <Link href={`/admin/books/${b.book!.id}`} className="underline underline-offset-4">{b.book!.title}</Link>
              {b.is_weekly_pick && <span className="ml-2 text-xs text-accent">今週の本</span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
