import Link from "next/link";
import { notFound } from "next/navigation";
import { getThread } from "@/lib/queries";
import { StatusBadge } from "@/components/thread";
import { PageHeader, formatDate } from "@/components/ui";

export const metadata = { title: "相談の詳細" };

export default async function AdminThread({ params }: PageProps<"/admin/threads/[id]">) {
  const thread = await getThread((await params).id);
  if (!thread) notFound();
  return (
    <div className="max-w-2xl">
      <Link href="/admin/threads" className="mt-6 inline-block text-sm text-muted underline underline-offset-4">一覧へ</Link>
      <PageHeader title={thread.subject} lead={<><StatusBadge status={thread.status} /> <span className="ml-2">{thread.store?.name}{thread.book && ` ／ 『${thread.book.title}』`}</span></>} />
      <ol className="space-y-4">
        {thread.messages.map((m) => (
          <li key={m.message_id} className="border-l-2 border-rule pl-4">
            <p className="text-xs text-muted">{m.sender_role === "store" ? "書店" : "読者"} ・ {formatDate(m.created_at, true)}</p>
            <p className="whitespace-pre-line text-sm">{m.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
