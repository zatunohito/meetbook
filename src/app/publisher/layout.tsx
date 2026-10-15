import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { getPublisher } from "@/lib/queries";
import { PartnerHeader } from "@/components/partner-header";

export default async function PublisherLayout({ children }: { children: React.ReactNode }) {
  const { id } = await requireRole("publisher");
  const pub = await getPublisher(id);
  if (!pub) redirect("/welcome");
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <PartnerHeader
        label="出版社"
        name={pub.name}
        home="/publisher"
        links={[
          { href: "/publisher", label: "ダッシュボード" },
          { href: "/publisher/books/new", label: "刊行本を登録" },
        ]}
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 md:px-8">{children}</main>
    </div>
  );
}
