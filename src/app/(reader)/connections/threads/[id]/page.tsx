import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/session";
import { getThread, markThreadRead } from "@/lib/queries";
import { Conversation, StatusBadge } from "@/components/thread";
import { Notice } from "@/components/ui";

export const metadata: Metadata = { title: "相談" };

export default async function ReaderThreadPage({ params, searchParams }: PageProps<"/connections/threads/[id]">) {
  const { id: readerId } = await requireRole("reader");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const thread = await getThread(id);
  if (!thread || thread.reader_id !== readerId) notFound();
  await markThreadRead(thread.thread_id, "reader");

  return (
    <div className="max-w-2xl">
      <Link href="/connections?tab=consults" className="mt-6 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft aria-hidden className="size-4" /> 相談履歴
      </Link>
      <header className="pb-8 pt-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display font-bold text-xl leading-snug md:text-2xl">{thread.subject}</h1>
          <StatusBadge status={thread.status} />
        </div>
        <p className="mt-2 text-sm text-muted">
          相談先：{thread.store ? <Link href={`/stores/${thread.store.slug}`} className="underline underline-offset-4">{thread.store.name}</Link> : "—"}
          {thread.book && (
            <>
              {" ／ "}本：<Link href={`/books/${thread.book.id}`} className="underline underline-offset-4">{thread.book.title}</Link>
            </>
          )}
        </p>
      </header>
      {sp.sent && <div className="mb-6"><Notice>相談を送信しました。書店からの返信はここに届きます。</Notice></div>}
      <Conversation threadId={thread.thread_id} messages={thread.messages} viewer="reader" storeName={thread.store?.name ?? "書店"} />
    </div>
  );
}
