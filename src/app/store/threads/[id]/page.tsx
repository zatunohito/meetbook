import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/session";
import { getThread, markThreadRead } from "@/lib/queries";
import { setThreadStatus } from "@/app/actions/consult";
import { Conversation, StatusBadge } from "@/components/thread";
import { STATUS_LABEL } from "@/lib/status";
import { SubmitButton } from "@/components/submit-button";

import type { ThreadStatus } from "@/lib/types";

export const metadata: Metadata = { title: "相談" };

export default async function StoreThreadPage({ params }: PageProps<"/store/threads/[id]">) {
  const { id: storeId } = await requireRole("store");
  const thread = await getThread((await params).id);
  if (!thread || thread.store_id !== storeId) notFound();
  await markThreadRead(thread.thread_id, "store");

  return (
    <div className="max-w-2xl">
      <Link href="/store" className="mt-6 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft aria-hidden className="size-4" /> 受信箱
      </Link>
      <header className="pb-8 pt-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display font-bold text-xl leading-snug md:text-2xl">{thread.subject}</h1>
          <StatusBadge status={thread.status} />
        </div>
        {thread.book && <p className="mt-2 text-sm text-muted">対象の本：『{thread.book.title}』</p>}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">ステータス変更</span>
          {(["open", "in_progress", "resolved"] as ThreadStatus[]).map((s) => (
            <form key={s} action={setThreadStatus.bind(null, thread.thread_id, s)}>
              <SubmitButton className={`${s === thread.status ? "border-ink bg-ink text-paper" : "border-rule text-ink-soft hover:border-ink-soft"} rounded-full border px-3 py-1 text-xs`}>
                {STATUS_LABEL[s]}
              </SubmitButton>
            </form>
          ))}
        </div>
      </header>
      <Conversation threadId={thread.thread_id} messages={thread.messages} viewer="store" storeName={thread.store?.name ?? "書店"} />
      <p className="mt-6 text-xs text-muted">読者の個人情報は表示されません。返信内容は読者の「つながり」画面に届きます。</p>
    </div>
  );
}
