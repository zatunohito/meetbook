import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookMarked, CalendarDays } from "lucide-react";
import { requireRole } from "@/lib/session";
import { getPublisherBySlug, isFollowing, listBooksByPublisher, listUpcomingEvents } from "@/lib/queries";
import { toggleFollow } from "@/app/actions/reader";
import { FollowButton } from "@/components/meet-button";
import { BookTile } from "@/components/book-card";
import { Empty, Section, Tag, formatDate } from "@/components/ui";
import { genreLabel } from "@/lib/taxonomy";
import { Gallery } from "@/components/gallery";

export async function generateMetadata({ params }: PageProps<"/publishers/[slug]">): Promise<Metadata> {
  const p = await getPublisherBySlug((await params).slug);
  return { title: p?.name ?? "出版社" };
}

export default async function PublisherPage({ params }: PageProps<"/publishers/[slug]">) {
  const { id } = await requireRole("reader");
  const pub = await getPublisherBySlug((await params).slug);
  if (!pub) notFound();
  const [books, events, following] = await Promise.all([
    listBooksByPublisher(pub.id),
    listUpcomingEvents({ publisherId: pub.id }, 5),
    isFollowing(id, "publisher", pub.id),
  ]);
  const published = books.filter((b) => b.is_published);

  return (
    <>
      <div className="pt-4 md:pt-8">
        <Gallery urls={pub.photo_urls} name={pub.name} credit={pub.photo_credit} meta={pub.photo_meta} />
      </div>
      <header className="pb-4 pt-6 md:pt-8">
        <p className="eyebrow mb-3">{pub.location ?? "Publisher"}</p>
        <h1 className="font-display font-bold text-2xl md:text-3xl">{pub.name}</h1>
        {pub.description && <p className="mt-4 max-w-prose whitespace-pre-line text-sm leading-loose text-ink-soft">{pub.description}</p>}
        {(pub.genres.length > 0 || pub.tags.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {pub.genres.map((g) => <Tag key={g} tone="accent">{genreLabel(g)}</Tag>)}
            {pub.tags.map((t) => <Tag key={t}>{t}</Tag>)}
          </div>
        )}
        {(pub.mission || pub.seeking) && (
          <dl className="mt-6 grid max-w-prose gap-4 border-y border-rule py-5 text-sm sm:grid-cols-2">
            {pub.mission && (<div><dt className="eyebrow mb-1">大切にしていること</dt><dd className="font-display">{pub.mission}</dd></div>)}
            {pub.seeking && (<div><dt className="eyebrow mb-1">出会いたい書店</dt><dd className="font-display">{pub.seeking}</dd></div>)}
          </dl>
        )}
        {pub.website_url && <a href={pub.website_url} target="_blank" rel="noreferrer" className="mt-2 inline-block break-all text-sm underline underline-offset-4">{pub.website_url}</a>}
        <div className="mt-6">
          <FollowButton action={toggleFollow.bind(null, "publisher", pub.id)} following={following} label="MEET（つながる）" />
        </div>
      </header>
      <Section eyebrow="Books" title="刊行本" icon={BookMarked}>
        {published.length ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-5">
            {published.map((b) => <BookTile key={b.id} book={b} />)}
          </div>
        ) : (
          <Empty icon={BookMarked} title="刊行本はまだ登録されていません" />
        )}
      </Section>
      {events.length > 0 && (
        <Section eyebrow="Events" title="イベント" icon={CalendarDays}>
          <ul className="divide-y divide-rule overflow-hidden rounded-2xl bg-raised shadow-card [&>li]:px-4 md:[&>li]:px-5">
            {events.map((e) => (
              <li key={e.id} className="py-4">
                <p className="text-xs text-muted">{formatDate(e.starts_at, true)}</p>
                <p className="mt-1 font-display">{e.title}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
