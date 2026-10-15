import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";

async function count(table: string, status?: string) {
  let q = db().from(table).select("*", { count: "exact", head: true });
  if (status) q = q.eq("status", status);
  const { count: c } = await q;
  return c ?? 0;
}

export default async function AdminHome() {
  const [stores, publishers, books, stock, reviews, events, readers, open] = await Promise.all([
    count("stores"),
    count("publishers"),
    count("books"),
    count("store_books"),
    count("book_reviews"),
    count("events"),
    count("readers"),
    count("threads", "open"),
  ]);
  const cards = [
    { label: "書店", n: stores, href: "/admin/stores" },
    { label: "出版社", n: publishers, href: "/admin/publishers" },
    { label: "書籍", n: books, href: "/admin/books" },
    { label: "在庫の紐付け", n: stock, href: "/admin/books" },
    { label: "感想", n: reviews, href: "/admin/books" },
    { label: "イベント", n: events, href: "/admin/events" },
    { label: "読者", n: readers, href: "/admin" },
    { label: "未対応の相談", n: open, href: "/admin/threads" },
  ];
  return (
    <>
      <PageHeader title="概要" lead="書店・出版社・書籍・イベント・相談を一元管理します。データは物理削除せず、公開／非公開で管理します。" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-2xl bg-raised p-5 shadow-card hover:-translate-y-0.5 transition">
            <p className="eyebrow">{c.label}</p>
            <p className="mt-2 font-display font-bold text-3xl">{c.n}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
