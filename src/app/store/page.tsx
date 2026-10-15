import type { Metadata } from "next";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { requireRole } from "@/lib/session";
import { isUnread, listStoreThreads } from "@/lib/queries";
import { StatusBadge } from "@/components/thread";
import { STATUS_LABEL } from "@/lib/status";
import { Empty, PageHeader, formatDate } from "@/components/ui";
import type { ThreadStatus } from "@/lib/types";

export const metadata: Metadata = { title: "受信箱" };

const FILTERS: (ThreadStatus | "all")[] = ["all", "open", "in_progress", "resolved"];

export default async function StoreInbox({ searchParams }: PageProps<"/store">) {
  const { id } = await requireRole("store");
  const sp = await searchParams;
  const status = FILTERS.find((f) => f === sp.status) ?? "all";
  const all = await listStoreThreads(id);
  const threads = status === "all" ? all : all.filter((t) => t.status === status);
  const count = (s: ThreadStatus) => all.filter((t) => t.status === s).length;

  return (
    <>
      <PageHeader eyebrow="Inbox" title="受信箱" lead="読者から届いた相談です。返信すると自動で「対応中」になります。" />
      <nav aria-label="ステータス" className="mb-6 flex flex-wrap gap-2 text-sm">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/store" : `/store?status=${f}`}
            aria-current={status === f ? "page" : undefined}
            className={`rounded-full border px-3 py-1.5 ${status === f ? "border-ink bg-ink text-paper" : "border-rule bg-raised text-ink-soft hover:border-ink-soft"}`}
          >
            {f === "all" ? `すべて ${all.length}` : `${STATUS_LABEL[f]} ${count(f)}`}
          </Link>
        ))}
      </nav>
      {threads.length ? (
        <ul className="divide-y divide-rule overflow-hidden rounded-2xl bg-raised shadow-card [&>li]:px-4 md:[&>li]:px-5">
          {threads.map((t) => {
            const unread = isUnread(t, "store");
            const first = t.messages[0];
            return (
              <li key={t.thread_id}>
                <Link href={`/store/threads/${t.thread_id}`} className="flex items-start gap-3 py-4 hover:bg-raised">
                  <span aria-hidden className={`mt-2 size-2 shrink-0 rounded-full ${unread ? "bg-accent" : "bg-transparent"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className={`truncate font-display ${unread ? "" : "text-ink-soft"}`}>{t.subject}</p>
                      <StatusBadge status={t.status} />
                    </div>
                    <p className="text-xs text-muted">
                      {formatDate(t.last_message_at, true)}
                      {t.book && ` ・ 『${t.book.title}』`}
                      {unread && " ・ 未読"}
                    </p>
                    {first && <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{first.body}</p>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <Empty icon={Inbox} title={status === "all" ? "まだ相談は届いていません" : `「${STATUS_LABEL[status as ThreadStatus]}」の相談はありません`} />
      )}
    </>
  );
}
