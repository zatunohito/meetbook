import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { getReader, isUnread, listReaderThreads } from "@/lib/queries";
import { Logo } from "@/components/logo";
import { ReaderNav, ReaderTabBar } from "@/components/reader-nav";

export default async function ReaderLayout({ children }: { children: React.ReactNode }) {
  const { id } = await requireRole("reader");
  const [reader, threads] = await Promise.all([getReader(id), listReaderThreads(id)]);
  if (!reader) redirect("/welcome");
  if (!reader.onboarded_at) redirect("/onboarding");
  const unread = threads.filter((t) => isUnread(t, "reader")).length;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-rule bg-paper/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 md:px-8">
          <Logo href="/home" />
          <ReaderNav unread={unread} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-32 md:px-8 md:pb-16">{children}</main>
      <ReaderTabBar unread={unread} />
    </div>
  );
}
