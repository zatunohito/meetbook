import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { getStore } from "@/lib/queries";
import { PartnerHeader } from "@/components/partner-header";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const { id } = await requireRole("store");
  const store = await getStore(id);
  if (!store) redirect("/welcome");
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <PartnerHeader
        label="書店"
        name={store.name}
        home="/store"
        links={[
          { href: "/store", label: "受信箱" },
          { href: "/store/profile", label: "店舗情報" },
          { href: "/store/books", label: "本・今週の本" },
          { href: "/store/events", label: "イベント" },
        ]}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 md:px-8">{children}</main>
    </div>
  );
}
