import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookMarked, Building2, Camera, Plus } from "lucide-react";
import { PhotoManager } from "@/components/photo-manager";
import { requireRole } from "@/lib/session";
import { getPublisher, listBooksByPublisher } from "@/lib/queries";
import { BookCover } from "@/components/book-cover";
import { PublisherInfoForm } from "@/components/publisher-info-form";
import { Empty, PageHeader, Section, Tag, btn } from "@/components/ui";

export const metadata: Metadata = { title: "出版社ダッシュボード" };

export default async function PublisherHome() {
  const { id } = await requireRole("publisher");
  const [pub, books] = await Promise.all([getPublisher(id), listBooksByPublisher(id)]);
  if (!pub) notFound();

  return (
    <>
      <PageHeader eyebrow="Publisher" title={pub.name} lead="自社の情報と刊行本を登録すると、読者のおすすめや「地域出版社の注目作」に表示されます。" />
      <Section eyebrow="Books" title="刊行本" icon={BookMarked} action={{ href: "/publisher/books/new", label: "新しく登録" }}>
        {books.length ? (
          <ul className="divide-y divide-rule overflow-hidden rounded-2xl bg-raised shadow-card [&>li]:px-4 md:[&>li]:px-5">
            {books.map((b) => (
              <li key={b.id}>
                <Link href={`/publisher/books/${b.id}`} className="flex items-center gap-4 py-3 hover:bg-raised">
                  <BookCover title={b.title} url={b.cover_url} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display">{b.title}</p>
                    <p className="text-xs text-muted">{[b.author, b.published_on].filter(Boolean).join(" ・ ")}</p>
                  </div>
                  {!b.is_published && <Tag>非公開</Tag>}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty icon={BookMarked} title="刊行本はまだありません">
            <Link href="/publisher/books/new" className={`${btn.primary} mt-4`}>
              <Plus aria-hidden className="size-4" /> 刊行本を登録する
            </Link>
          </Empty>
        )}
      </Section>
      <Section eyebrow="Photos" title="写真" icon={Camera}>
        <PhotoManager target={{ kind: "publisher", id: pub.id }} initialUrls={pub.photo_urls} initialCredit={pub.photo_credit} label={pub.name} />
      </Section>
      <Section eyebrow="Profile" title="出版社情報" icon={Building2}>
        <PublisherInfoForm publisher={pub} />
      </Section>
    </>
  );
}
