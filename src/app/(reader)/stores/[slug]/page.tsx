import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BookMarked, CalendarDays, Flag, MapPin, MessageSquareText, MessagesSquare, Navigation, Store as StoreIcon } from "lucide-react";
import { requireRole } from "@/lib/session";
import { getReader, getStoreBySlug, isFollowing, listStoreBooks, listUpcomingEvents } from "@/lib/queries";
import { storeCompatibility } from "@/lib/match";
import { atmosphereLabel, genreLabel, styleLabel } from "@/lib/taxonomy";
import { toggleFollow } from "@/app/actions/reader";
import { FollowButton } from "@/components/meet-button";
import { BookTile } from "@/components/book-card";
import { CompatScore } from "@/components/store-card";
import { Gallery } from "@/components/gallery";
import { Empty, Section, Tag, btn, formatDate } from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/stores/[slug]">): Promise<Metadata> {
  const store = await getStoreBySlug((await params).slug);
  return { title: store?.name ?? "本屋" };
}

export default async function StorePage({ params }: PageProps<"/stores/[slug]">) {
  const { id } = await requireRole("reader");
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) notFound();
  const [reader, books, events, following] = await Promise.all([
    getReader(id),
    listStoreBooks(store.id),
    listUpcomingEvents({ storeId: store.id }, 6),
    isFollowing(id, "store", store.id),
  ]);
  if (!reader) redirect("/welcome");
  const compat = storeCompatibility(reader, store);
  const weekly = books.filter((b) => b.is_weekly_pick && b.book?.is_published);
  const mapQuery = encodeURIComponent([store.name, store.address].filter(Boolean).join(" "));
  const tags = [
    ...store.specialty_genres.map(genreLabel),
    ...store.atmosphere_tags.map(atmosphereLabel),
    ...store.style_tags.map(styleLabel),
  ];

  return (
    <>
      <div className="pt-4 md:pt-8">
        <Gallery urls={store.photo_urls} name={store.name} credit={store.photo_credit} meta={store.photo_meta} />
      </div>
      <header className="pb-4 pt-6 md:pt-8">
        <p className="eyebrow mb-3">{store.area ?? "Bookstore"}</p>
        <div className="flex items-start justify-between gap-6">
          <h1 className="font-display font-bold text-2xl leading-snug md:text-3xl">{store.name}</h1>
          <CompatScore compat={compat} large />
        </div>
        {compat.reasons.length > 0 && (
          <ul className="mt-4 space-y-1 rounded-xl bg-accent-wash/60 px-4 py-3 text-sm text-ink-soft">
            {compat.reasons.map((r) => <li key={r}>{r}</li>)}
          </ul>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <FollowButton action={toggleFollow.bind(null, "store", store.id)} following={following} label="MEET（つながる）" />
          <a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noreferrer" className={btn.secondary}>
            <Navigation aria-hidden className="size-4" /> 行ってみる
          </a>
          <Link href={`/consult?store=${store.id}`} className={btn.secondary}>
            <MessageSquareText aria-hidden className="size-4" /> 相談する
          </Link>
        </div>
      </header>


      <Section eyebrow="About" title="紹介" icon={StoreIcon}>
        {store.description ? (
          <p className="max-w-prose whitespace-pre-line text-sm leading-loose text-ink-soft md:text-base">{store.description}</p>
        ) : (
          <Empty title="紹介文は準備中です" />
        )}
        {tags.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{tags.map((t) => <Tag key={t} tone="accent">{t}</Tag>)}</div>}
        {store.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{store.tags.map((t) => <Tag key={t}>{t}</Tag>)}</div>}
        {store.features.length > 0 && <p className="mt-3 text-sm text-ink-soft">{store.features.join(" ・ ")}</p>}
      </Section>

      {store.staff_message && (
        <Section eyebrow="From the staff" title="店員さんから" icon={MessagesSquare}>
          <figure className="max-w-prose">
            <blockquote className="whitespace-pre-line rounded-2xl rounded-tl-md bg-raised p-5 leading-loose shadow-card">{store.staff_message}</blockquote>
            {store.staff_name && <figcaption className="mt-3 pl-2 text-sm font-bold text-ink-soft">— {store.staff_name}</figcaption>}
          </figure>
        </Section>
      )}

      {weekly.length > 0 && (
        <Section eyebrow="This week" title="今週の本" icon={BookMarked}>
          <div className="-mx-4 flex gap-5 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
            {weekly.map((b) => <BookTile key={b.book!.id} book={b.book!} note={b.staff_comment} />)}
          </div>
        </Section>
      )}

      {events.length > 0 && (
        <Section eyebrow="Events" title="イベント" icon={CalendarDays}>
          <ul className="divide-y divide-rule overflow-hidden rounded-2xl bg-raised shadow-card [&>li]:px-4 md:[&>li]:px-5">
            {events.map((e) => (
              <li key={e.id} className="py-4">
                <p className="text-xs text-muted">{formatDate(e.starts_at, true)}</p>
                <p className="mt-1 font-display">{e.url ? <a href={e.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">{e.title}</a> : e.title}</p>
                {e.description && <p className="mt-1 text-sm text-ink-soft">{e.description}</p>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section eyebrow="Access" title="アクセス" icon={MapPin}>
        <dl className="grid max-w-prose grid-cols-[6rem_1fr] gap-y-2 text-sm">
          <dt className="text-muted">住所</dt><dd>{store.address ?? "未登録"}</dd>
          {store.phone && (<><dt className="text-muted">電話</dt><dd><a href={`tel:${store.phone.replace(/[^0-9+]/g, "")}`} className="underline underline-offset-4">{store.phone}</a></dd></>)}
          <dt className="text-muted">営業時間</dt><dd className="whitespace-pre-line">{store.opening_hours ?? "未登録"}</dd>
          <dt className="text-muted">アクセス</dt><dd className="whitespace-pre-line">{store.access ?? "未登録"}</dd>
          {store.website_url && (<><dt className="text-muted">Web</dt><dd><a href={store.website_url} target="_blank" rel="noreferrer" className="break-all underline underline-offset-4">{store.website_url}</a></dd></>)}
        </dl>
      </Section>

      {store.visit_mission && (
        <Section eyebrow="Mission" title="来店ミッション" icon={Flag}>
          <p className="max-w-prose rounded-2xl bg-sun/20 p-5 font-display font-bold leading-loose text-ink">{store.visit_mission}</p>
        </Section>
      )}
    </>
  );
}
