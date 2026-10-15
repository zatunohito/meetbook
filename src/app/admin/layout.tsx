import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { isDbConfigured } from "@/lib/db";
import { SetupRequired } from "@/components/setup-required";

export const metadata: Metadata = { title: { default: "管理画面", template: "%s ｜ 管理画面" }, robots: { index: false } };

const NAV = [
  { href: "/admin", label: "概要" },
  { href: "/admin/stores", label: "書店" },
  { href: "/admin/publishers", label: "出版社" },
  { href: "/admin/books", label: "書籍" },
  { href: "/admin/events", label: "イベント" },
  { href: "/admin/announcements", label: "お知らせ" },
  { href: "/admin/threads", label: "相談" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  if (!isDbConfigured()) return <SetupRequired />;
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-rule bg-ink text-paper">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 md:px-8">
          <span className="font-display tracking-[0.2em]">MEET BOOK <span className="text-xs tracking-normal opacity-70">管理</span></span>
          <nav className="flex flex-wrap gap-4 text-sm">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="opacity-80 hover:opacity-100">{n.label}</Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 md:px-8">{children}</main>
    </div>
  );
}
