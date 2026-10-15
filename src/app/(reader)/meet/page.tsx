import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";
import { loadReaderContext } from "@/lib/reader-data";
import { recommendBooks } from "@/lib/match";
import { MeetCard } from "@/components/book-card";
import { Empty, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "MEET" };

export default async function MeetPage() {
  const { reader, books, ctx } = await loadReaderContext();
  const recs = recommendBooks(reader, books, ctx).slice(0, 30);

  return (
    <>
      <PageHeader
        eyebrow="MEET"
        title="あなたに出会ってほしい本"
        lead={
          <>
            アンケートの回答と、長崎の書店に実際に並んでいる本をもとに選んでいます。
            「MEET！」した本は <Link href="/connections" className="underline underline-offset-4">つながり</Link> に残ります。
          </>
        }
      />
      {recs.length ? (
        <div className="space-y-5">
          {recs.map((r) => (
            <MeetCard key={r.book.id} book={r.book} reasons={r.reasons} met={ctx.meetBookIds.has(r.book.id)} />
          ))}
        </div>
      ) : (
        <Empty icon={Compass} title={books.length ? "いまはおすすめできる本がありません" : "まだ本が登録されていません"}>
          {books.length ? (
            <>
              MEETしていない本の中に、あなたの回答と重なる本が見つかりませんでした。
              <Link href="/profile" className="mt-2 block underline underline-offset-4">プロフィールを見直す</Link>
            </>
          ) : (
            "書店・出版社から実際の本の情報が届きしだい、ここに表示されます。"
          )}
        </Empty>
      )}
    </>
  );
}
