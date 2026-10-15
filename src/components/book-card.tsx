import Link from "next/link";
import { MapPin } from "lucide-react";
import { genreLabel } from "@/lib/taxonomy";
import type { BookWithContext } from "@/lib/types";
import { BookCover } from "./book-cover";
import { MeetButton } from "./meet-button";
import { Reasons, Tag } from "./ui";

export function publisherName(b: Pick<BookWithContext, "publisher" | "publisher_name">) {
  return b.publisher?.name ?? b.publisher_name ?? null;
}

/** MEETカード：書影・書名・著者・出版社・ジャンル・推薦理由・取扱書店・MEET！ */
export function MeetCard({
  book,
  reasons,
  reasonLabel,
  met,
}: {
  book: BookWithContext;
  reasons: string[];
  reasonLabel?: string;
  met: boolean;
}) {
  const pub = publisherName(book);
  return (
    <article className="rounded-2xl bg-raised p-4 shadow-card sm:p-6">
      <div className="flex gap-4 sm:gap-6">
        <Link href={`/books/${book.id}`} className="w-24 shrink-0 self-start sm:w-32">
          <BookCover title={book.title} author={book.author} url={book.cover_url} />
        </Link>
        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="font-display text-base font-bold leading-snug sm:text-lg">
            <Link href={`/books/${book.id}`} className="line-clamp-3 hover:text-accent">
              {book.title}
            </Link>
          </h3>
          <p className="line-clamp-2 text-xs text-ink-soft sm:text-sm">
            {[book.author, pub].filter(Boolean).join(" ／ ") || "著者・出版社 未登録"}
          </p>
          {book.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {book.genres.map((g) => (
                <Tag key={g} tone="leaf">{genreLabel(g)}</Tag>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 space-y-4">
        <Reasons items={reasons} label={reasonLabel} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex min-w-0 items-center gap-1 text-xs text-muted">
            <MapPin aria-hidden className="size-3.5 shrink-0" />
            <span className="truncate">{book.stores.length ? book.stores.map((s) => s.name).join("・") : "取扱書店は未登録です"}</span>
          </p>
          <MeetButton bookId={book.id} met={met} />
        </div>
      </div>
    </article>
  );
}

export function BookTile({ book, note }: { book: Pick<BookWithContext, "id" | "title" | "author" | "cover_url">; note?: string | null }) {
  return (
    <Link href={`/books/${book.id}`} className="group block w-28 shrink-0 sm:w-32">
      <div className="transition group-hover:-translate-y-1">
        <BookCover title={book.title} author={book.author} url={book.cover_url} />
      </div>
      <p className="mt-2 line-clamp-2 font-display text-sm font-bold leading-snug group-hover:text-accent">{book.title}</p>
      {book.author && <p className="line-clamp-1 text-xs text-muted">{book.author}</p>}
      {note && <p className="mt-1 line-clamp-2 text-xs text-ink-soft">{note}</p>}
    </Link>
  );
}
