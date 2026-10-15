import type { Metadata } from "next";
import Link from "next/link";
import { BookMarked, CalendarDays, Dices, Library, Megaphone, PenLine, Sparkles } from "lucide-react";
import { loadReaderContext } from "@/lib/reader-data";
import { dailySeed, pickSerendipity, recommendBooks, storeCompatibility } from "@/lib/match";
import { listAnnouncements, listPublishers, listStores, listUpcomingEvents } from "@/lib/queries";
import { BookTile, MeetCard } from "@/components/book-card";
import { BookCover } from "@/components/book-cover";
import { MeetButton } from "@/components/meet-button";
import { StoreCard } from "@/components/store-card";
import { Empty, Section, formatDate, todayInTokyo } from "@/components/ui";

export const metadata: Metadata = { title: "ホーム" };

export default async function Home() {
  const { reader, books, ctx } = await loadReaderContext();
  const [stores, events, announcements, publishers] = await Promise.all([
    listStores(),
    listUpcomingEvents(undefined, 4),
    listAnnouncements(3),
    listPublishers(),
  ]);

  const today = todayInTokyo();
  const seed = dailySeed(reader.id, today);
  const recs = recommendBooks(reader, books, ctx);
  // 今日のMEET：上位3冊から日替わりで1冊
  const todays = recs.length ? recs[seed % Math.min(3, recs.length)] : null;
  const others = recs.filter((r) => r !== todays).slice(0, 6);
  const serendipity = pickSerendipity(reader, books, ctx, seed);
  const storeRanks = stores
    .map((s) => ({ store: s, compat: storeCompatibility(reader, s) }))
    .filter((x) => x.compat.score !== null)
    .sort((a, b) => b.compat.score! - a.compat.score!)
    .slice(0, 3);
  const localPicks = books
    .filter((b) => b.publisher)
    .sort((a, b) => (b.published_on ?? b.created_at).localeCompare(a.published_on ?? a.created_at))
    .slice(0, 8);

  return (
    <>
      <header className="relative -mx-4 mt-0 overflow-hidden bg-[#111] px-5 pb-8 pt-8 text-white md:mx-0 md:mt-8 md:rounded-2xl md:px-10 md:py-12">
        <div className="grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-center md:gap-12">
          <div>
            <p className="font-latin text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
              {today.replaceAll("-", ".")} <span className="text-[#ff7a45]">●</span> Nagasaki
            </p>
            <h1 className="mt-4 font-display text-[28px] font-black leading-[1.3] tracking-tight md:text-5xl md:leading-[1.2]">
              {reader.display_name ? `${reader.display_name}さん、` : "こんにちは。"}
              <br />
              まだ知らない一冊に
              <br />
              出会いませんか？
            </h1>
            <dl className="mt-6 flex gap-6 font-latin text-white/60">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-widest">Books</dt>
                <dd className="text-2xl font-bold text-white">{books.length}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-widest">Stores</dt>
                <dd className="text-2xl font-bold text-white">{stores.length}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-widest">Publishers</dt>
                <dd className="text-2xl font-bold text-white">{publishers.length}</dd>
              </div>
            </dl>
          </div>

          {todays ? (
            <div className="rounded-xl bg-white/[0.06] p-4 ring-1 ring-white/10 md:p-5">
              <p className="font-latin text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ff7a45]">Today&apos;s MEET</p>
              <div className="mt-3 flex gap-4">
                <Link href={`/books/${todays.book.id}`} className="w-24 shrink-0 md:w-28">
                  <BookCover title={todays.book.title} author={todays.book.author} url={todays.book.cover_url} />
                </Link>
                <div className="min-w-0">
                  <Link href={`/books/${todays.book.id}`} className="line-clamp-3 font-display text-base font-bold leading-snug hover:underline md:text-lg">
                    {todays.book.title}
                  </Link>
                  <p className="mt-1 line-clamp-1 text-xs text-white/60">{[todays.book.author, todays.book.publisher?.name].filter(Boolean).join(" ／ ")}</p>
                  <p className="mt-3 line-clamp-2 border-l-2 border-[#ff7a45] pl-3 text-xs leading-relaxed text-white/80">{todays.reasons[0]}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <Link href="/meet" className="font-latin text-sm font-semibold text-white/70 hover:text-white">
                  More MEET →
                </Link>
                <MeetButton bookId={todays.book.id} met={false} />
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-white/[0.06] p-5 text-sm text-white/70 ring-1 ring-white/10">
              {books.length ? "プロフィールで興味のあるテーマを増やすと、出会える本が広がります。" : "書店・出版社から本の情報が届きしだい、ここに今日の一冊が表示されます。"}
            </div>
          )}
        </div>
      </header>

      {others.length > 0 && (
        <Section eyebrow="For you" title="あなたへのおすすめ" icon={Sparkles}>
          <div className="shelf -mx-4 flex gap-4 overflow-x-auto px-4 pb-3 pt-1 md:mx-0 md:px-0">
            {others.map((r) => (
              <BookTile key={r.book.id} book={r.book} note={r.reasons[0]} />
            ))}
          </div>
        </Section>
      )}

      <Section eyebrow="Serendipity" title="偶然の一冊" icon={Dices}>
        {serendipity ? (
          <MeetCard book={serendipity.book} reasons={[serendipity.why]} reasonLabel="なぜこの本なのか" met={false} />
        ) : (
          <Empty icon={Dices} title="偶然の一冊はまだ見つかっていません">
            普段とは違うジャンルの本が登録されると、あなたの好みとの接点を添えてここに届きます。挑戦度や「気になるジャンル」を変えると候補が広がります。
          </Empty>
        )}
      </Section>

      <Section eyebrow="Bookstores" title="相性のいい本屋" icon={Library} action={{ href: "/stores", label: "すべての本屋" }}>
        {storeRanks.length ? (
          <div className="grid gap-5 md:grid-cols-3">
            {storeRanks.map(({ store, compat }) => (
              <StoreCard key={store.id} store={store} compat={compat} />
            ))}
          </div>
        ) : (
          <Empty icon={Library} title="相性を計算できる本屋がまだありません">
            各書店の得意ジャンルや雰囲気が登録されると、アンケートとの相性が表示されます。
            <Link href="/stores" className="mt-2 block underline underline-offset-4">本屋の一覧を見る</Link>
          </Empty>
        )}
      </Section>

      <Section eyebrow="News & Events" title="お知らせ・イベント" icon={CalendarDays}>
        {announcements.length + events.length === 0 ? (
          <Empty icon={Megaphone} title="現在お知らせはありません" />
        ) : (
          <ul className="divide-y divide-rule overflow-hidden rounded-2xl bg-raised shadow-card [&>li]:px-4 md:[&>li]:px-5">
            {announcements.map((a) => (
              <li key={a.id} className="flex gap-4 py-4">
                <span className="w-24 shrink-0 text-xs text-muted">{formatDate(a.published_at)}</span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm">
                    <Megaphone aria-hidden className="size-3.5 text-accent" />
                    {a.url ? <a href={a.url} className="underline-offset-4 hover:underline" target="_blank" rel="noreferrer">{a.title}</a> : a.title}
                  </p>
                  {a.body && <p className="mt-1 line-clamp-2 text-xs text-ink-soft">{a.body}</p>}
                </div>
              </li>
            ))}
            {events.map((e) => (
              <li key={e.id} className="flex gap-4 py-4">
                <span className="w-24 shrink-0 text-xs text-muted">{formatDate(e.starts_at)}</span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm">
                    <CalendarDays aria-hidden className="size-3.5 text-accent" />
                    {e.title}
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {e.store ? <Link href={`/stores/${e.store.slug}`} className="underline underline-offset-4">{e.store.name}</Link> : e.publisher?.name}
                    {e.place && ` ／ ${e.place}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section eyebrow="Local Publishers" title="地域出版社の注目作" icon={BookMarked}>
        {localPicks.length ? (
          <div className="shelf -mx-4 flex gap-4 overflow-x-auto px-4 pb-3 pt-1 md:mx-0 md:px-0">
            {localPicks.map((b) => (
              <BookTile key={b.id} book={b} note={b.publisher?.name} />
            ))}
          </div>
        ) : (
          <Empty icon={BookMarked} title="地域出版社の刊行本はまだ登録されていません">
            長崎の出版社が刊行本を登録すると、ここで紹介されます。
          </Empty>
        )}
      </Section>

      <Section eyebrow="Publishers" title="長崎の出版社" icon={PenLine}>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {publishers.map((p) => (
            <li key={p.id}>
              <Link href={`/publishers/${p.slug}`} className="flex h-full items-center gap-3 rounded-2xl bg-raised p-3 shadow-card transition hover:-translate-y-0.5">
                {p.photo_urls[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photo_urls[0]} alt="" loading="lazy" className="size-16 shrink-0 rounded-xl object-cover" />
                ) : (
                  <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-accent-wash text-accent">
                    <PenLine aria-hidden className="size-6" />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block font-display font-bold">{p.name}</span>
                  <span className="mt-0.5 line-clamp-2 block text-xs text-muted">{p.mission ?? p.location ?? "　"}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
