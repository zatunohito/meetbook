import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, MapPin, MessageSquareText, Network, Quote, Star } from "lucide-react";
import { loadReaderContext } from "@/lib/reader-data";
import { getBookWithContext, listExplicitRelations, listReviews } from "@/lib/queries";
import { genreLabel } from "@/lib/taxonomy";
import { recommendBooks } from "@/lib/match";
import { BookCover } from "@/components/book-cover";
import { publisherName } from "@/components/book-card";
import { MeetButton } from "@/components/meet-button";
import { Empty, Reasons, Section, Tag, btn, formatDate } from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/books/[id]">): Promise<Metadata> {
  const book = await getBookWithContext((await params).id);
  return { title: book?.title ?? "本" };
}

export default async function BookPage({ params }: PageProps<"/books/[id]">) {
  const { id } = await params;
  const [{ reader, books, ctx }, book] = await Promise.all([loadReaderContext(), getBookWithContext(id)]);
  if (!book || !book.is_published) notFound();
  const [reviews, explicit] = await Promise.all([listReviews(book.id), listExplicitRelations(book.id)]);

  const pub = publisherName(book);
  const reasons = recommendBooks(reader, [book], { ...ctx, meetBookIds: new Set() })[0]?.reasons ?? [];

  // 関係性マップ：登録済みの関係＋同じ著者・出版社・書店から自動導出（実データのみ）
  const others = books.filter((b) => b.id !== book.id);
  const storeIds = new Set(book.stores.map((s) => s.id));
  const sameAuthor = book.author ? others.filter((b) => b.author === book.author).slice(0, 4) : [];
  const samePublisher = book.publisher_id ? others.filter((b) => b.publisher_id === book.publisher_id && !sameAuthor.includes(b)).slice(0, 4) : [];
  const sameStore = others
    .filter((b) => !sameAuthor.includes(b) && !samePublisher.includes(b) && b.stores.some((s) => storeIds.has(s.id)) && b.genres.some((g) => book.genres.includes(g)))
    .slice(0, 4);
  const relationGroups = [
    { label: "編集部・書店がつないだ本", items: explicit.filter((r) => r.related).map((r) => ({ id: r.related!.id, title: r.related!.title, note: r.note })) },
    { label: `同じ著者（${book.author}）`, items: sameAuthor.map((b) => ({ id: b.id, title: b.title, note: null })) },
    { label: `同じ出版社（${pub}）`, items: samePublisher.map((b) => ({ id: b.id, title: b.title, note: null })) },
    { label: "同じ書店の棚に並ぶ、近いテーマの本", items: sameStore.map((b) => ({ id: b.id, title: b.title, note: b.stores.find((s) => storeIds.has(s.id))?.name ?? null })) },
  ].filter((g) => g.items.length);

  return (
    <>
      <article className="grid gap-8 pb-10 pt-10 md:grid-cols-[auto_1fr] md:gap-12 md:pt-14">
        <div className="mx-auto md:mx-0">
          <BookCover title={book.title} author={book.author} url={book.cover_url} size="lg" />
        </div>
        <div className="space-y-5">
          <div>
            <h1 className="font-display font-bold text-2xl leading-snug md:text-3xl">{book.title}</h1>
            <p className="mt-2 text-ink-soft">{book.author ?? "著者未登録"}</p>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm text-muted">
              <dt>出版社</dt>
              <dd>{book.publisher ? <Link href={`/publishers/${book.publisher.slug}`} className="underline underline-offset-4">{pub}</Link> : (pub ?? "未登録")}</dd>
              {book.published_on && (<><dt>刊行</dt><dd>{book.published_on.slice(0, 7).replace("-", "年")}月</dd></>)}
              {book.isbn && (<><dt>ISBN</dt><dd>{book.isbn}</dd></>)}
            </dl>
            {book.genres.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {book.genres.map((g) => <Tag key={g}>{genreLabel(g)}</Tag>)}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <MeetButton bookId={book.id} met={ctx.meetBookIds.has(book.id)} />
            <Link href={`/consult?book=${book.id}`} className={btn.secondary}>
              <MessageSquareText aria-hidden className="size-4" /> この本について書店に相談する
            </Link>
          </div>
          <Reasons items={reasons} label="あなたとの接点" />
          {book.description && <p className="whitespace-pre-line text-sm leading-loose text-ink-soft md:text-base">{book.description}</p>}
          {book.target_readers && (
            <p className="text-sm text-ink-soft"><span className="eyebrow mr-2">想定読者</span>{book.target_readers}</p>
          )}
          {book.data_source !== "manual" && (
            <p className="text-xs text-muted">
              書誌情報の出典：
              {book.data_source.includes("ndl") ? (
                book.source_url ? <a href={book.source_url} target="_blank" rel="noreferrer" className="underline underline-offset-4">国立国会図書館サーチ</a> : "国立国会図書館サーチ"
              ) : null}
              {book.data_source.includes("ndl") && book.data_source.includes("openbd") && "・"}
              {book.data_source.includes("openbd") && "openBD"}
            </p>
          )}
        </div>
      </article>

      <Section eyebrow="Where to find" title="取扱書店" icon={MapPin}>
        {book.stores.length ? (
          <ul className="divide-y divide-rule overflow-hidden rounded-2xl bg-raised shadow-card [&>li]:px-4 md:[&>li]:px-5">
            {book.stores.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <Link href={`/stores/${s.slug}`} className="font-display underline-offset-4 hover:underline">{s.name}</Link>
                  {s.is_weekly_pick && <span className="ml-2 inline-flex items-center gap-1 text-xs text-accent"><Star aria-hidden className="size-3" />今週の本</span>}
                </div>
                <Link href={`/consult?book=${book.id}&store=${s.id}`} className={btn.ghost}>
                  <MessageSquareText aria-hidden className="size-4" /> この店に相談
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty icon={MapPin} title="取扱書店はまだ登録されていません">
            在庫の確認や取り寄せは、書店に相談できます。
          </Empty>
        )}
      </Section>

      <Section eyebrow="Voices" title="感想" icon={Quote}>
        {reviews.length ? (
          <div className="space-y-6">
            {reviews.map((r) => (
              <figure key={r.id} className="border-l-2 border-rule pl-4">
                <blockquote className="whitespace-pre-line font-display font-bold text-sm leading-loose md:text-base">{r.body}</blockquote>
                <figcaption className="mt-2 text-xs text-muted">
                  — {r.author_label}
                  {r.source && `（${r.source}）`} ・ {formatDate(r.created_at)}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <Empty icon={Quote} title="まだ感想は届いていません" />
        )}
      </Section>

      <Section eyebrow="Relations" title="関係性マップ" icon={Network}>
        {relationGroups.length ? (
          <div className="relative">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-ink"><BookOpen aria-hidden className="size-5" /></span>
              <span className="font-display">{book.title}</span>
            </div>
            <div className="grid gap-6 border-l border-accent/40 pl-6 md:grid-cols-2">
              {relationGroups.map((g) => (
                <div key={g.label} className="relative">
                  <span aria-hidden className="absolute -left-6 top-3 h-px w-5 bg-accent/40" />
                  <p className="eyebrow mb-2 normal-case tracking-normal">{g.label}</p>
                  <ul className="space-y-1.5">
                    {g.items.map((it) => (
                      <li key={it.id} className="text-sm">
                        <Link href={`/books/${it.id}`} className="font-display underline-offset-4 hover:underline">{it.title}</Link>
                        {it.note && <span className="ml-2 text-xs text-muted">{it.note}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Empty icon={Network} title="つながる本はまだ見つかっていません">
            同じ著者・出版社の本や、同じ書店に並ぶ本が登録されると、ここに広がっていきます。
          </Empty>
        )}
      </Section>
    </>
  );
}
