import type { Metadata } from "next";
import Link from "next/link";
import { BookMarked, Library, MessageSquareText, PenLine } from "lucide-react";
import { requireRole } from "@/lib/session";
import { isUnread, listFollows, listMeetBooks, listReaderThreads } from "@/lib/queries";
import { toggleFollow, toggleMeet } from "@/app/actions/reader";
import { BookCover } from "@/components/book-cover";
import { StatusBadge } from "@/components/thread";
import { SubmitButton } from "@/components/submit-button";
import { Empty, PageHeader, btn, formatDate } from "@/components/ui";

export const metadata: Metadata = { title: "つながり" };

const TABS = [
  { key: "books", label: "MEETした本", icon: BookMarked },
  { key: "stores", label: "本屋", icon: Library },
  { key: "publishers", label: "出版社", icon: PenLine },
  { key: "consults", label: "相談", icon: MessageSquareText },
] as const;

function Unlink({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action}>
      <SubmitButton className={btn.ghost} pendingText="…">解除</SubmitButton>
    </form>
  );
}

export default async function ConnectionsPage({ searchParams }: PageProps<"/connections">) {
  const { id } = await requireRole("reader");
  const sp = await searchParams;
  const tab = TABS.find((t) => t.key === sp.tab)?.key ?? "books";
  const [meets, follows, threads] = await Promise.all([listMeetBooks(id), listFollows(id), listReaderThreads(id)]);
  const counts = { books: meets.length, stores: follows.stores.length, publishers: follows.publishers.length, consults: threads.length };

  return (
    <>
      <PageHeader eyebrow="Connections" title="つながり" lead="MEETした本、つながった本屋や出版社、書店への相談をまとめています。" />
      <nav aria-label="つながりの種類" className="shelf -mx-4 mb-6 overflow-x-auto px-4 md:mx-0 md:px-0">
        <ul className="flex gap-2 text-sm">
          {TABS.map((t) => (
            <li key={t.key}>
              <Link
                href={`/connections?tab=${t.key}`}
                aria-current={tab === t.key ? "page" : undefined}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 font-bold transition ${tab === t.key ? "bg-ink text-paper" : "bg-raised text-ink-soft shadow-card hover:text-ink"}`}
              >
                <t.icon aria-hidden className="size-4" strokeWidth={1.5} />
                {t.label}
                <span className={`text-xs ${tab === t.key ? "opacity-70" : "text-muted"}`}>{counts[t.key]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {tab === "books" &&
        (meets.length ? (
          <ul className="divide-y divide-rule overflow-hidden rounded-2xl bg-raised shadow-card [&>li]:px-4 md:[&>li]:px-5">
            {meets.filter((m) => m.book).map(({ book, created_at }) => (
              <li key={book!.id} className="flex items-center gap-4 py-4">
                <BookCover title={book!.title} author={book!.author} url={book!.cover_url} size="sm" />
                <div className="min-w-0 flex-1">
                  <Link href={`/books/${book!.id}`} className="font-display underline-offset-4 hover:underline">{book!.title}</Link>
                  <p className="text-xs text-muted">
                    {[book!.author, book!.publisher?.name ?? book!.publisher_name].filter(Boolean).join(" ／ ")} ・ {formatDate(created_at)}にMEET
                  </p>
                </div>
                <Unlink action={toggleMeet.bind(null, book!.id)} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty icon={BookMarked} title="まだMEETした本はありません">
            <Link href="/meet" className="underline underline-offset-4">MEETで本と出会う</Link>
          </Empty>
        ))}

      {tab === "stores" &&
        (follows.stores.length ? (
          <ul className="divide-y divide-rule overflow-hidden rounded-2xl bg-raised shadow-card [&>li]:px-4 md:[&>li]:px-5">
            {follows.stores.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <Link href={`/stores/${s.slug}`} className="font-display underline-offset-4 hover:underline">{s.name}</Link>
                  {s.area && <p className="text-xs text-muted">{s.area}</p>}
                </div>
                <Unlink action={toggleFollow.bind(null, "store", s.id)} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty icon={Library} title="つながっている本屋はまだありません">
            <Link href="/stores" className="underline underline-offset-4">本屋を見てみる</Link>
          </Empty>
        ))}

      {tab === "publishers" &&
        (follows.publishers.length ? (
          <ul className="divide-y divide-rule overflow-hidden rounded-2xl bg-raised shadow-card [&>li]:px-4 md:[&>li]:px-5">
            {follows.publishers.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <Link href={`/publishers/${p.slug}`} className="font-display underline-offset-4 hover:underline">{p.name}</Link>
                  {p.location && <p className="text-xs text-muted">{p.location}</p>}
                </div>
                <Unlink action={toggleFollow.bind(null, "publisher", p.id)} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty icon={PenLine} title="つながっている出版社はまだありません">本の詳細ページから出版社のページへ進めます。</Empty>
        ))}

      {tab === "consults" &&
        (threads.length ? (
          <ul className="divide-y divide-rule overflow-hidden rounded-2xl bg-raised shadow-card [&>li]:px-4 md:[&>li]:px-5">
            {threads.map((t) => {
              const last = t.messages.at(-1);
              const unread = isUnread(t, "reader");
              return (
                <li key={t.thread_id}>
                  <Link href={`/connections/threads/${t.thread_id}`} className="flex items-start gap-3 py-4 hover:bg-raised">
                    <span aria-hidden className={`mt-2 size-2 shrink-0 rounded-full ${unread ? "bg-accent" : "bg-transparent"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate font-display">{t.subject}</p>
                        <StatusBadge status={t.status} />
                      </div>
                      <p className="text-xs text-muted">{t.store?.name} ・ {formatDate(t.last_message_at, true)}{unread && " ・ 新しい返信があります"}</p>
                      {last && <p className="mt-1 line-clamp-1 text-sm text-ink-soft">{last.sender_role === "store" ? `${t.store?.name}：` : "あなた："}{last.body}</p>}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty icon={MessageSquareText} title="まだ相談はありません">
            <Link href="/consult" className="underline underline-offset-4">書店に相談する</Link>
          </Empty>
        ))}
    </>
  );
}
