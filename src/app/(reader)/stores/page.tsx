import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { getReader, listStores } from "@/lib/queries";
import { storeCompatibility } from "@/lib/match";
import { StoreCard } from "@/components/store-card";
import { PageHeader } from "@/components/ui";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "本屋" };

export default async function StoresPage() {
  const { id } = await requireRole("reader");
  const [reader, stores] = await Promise.all([getReader(id), listStores()]);
  if (!reader) redirect("/welcome");
  const ranked = stores
    .map((s) => ({ store: s, compat: storeCompatibility(reader, s) }))
    .sort((a, b) => (b.compat.score ?? -1) - (a.compat.score ?? -1) || a.store.name.localeCompare(b.store.name, "ja"));

  return (
    <>
      <PageHeader
        eyebrow="Bookstores"
        title="長崎の本屋"
        lead="相性スコアは、あなたのアンケート回答と各店の登録情報（得意ジャンル・雰囲気・過ごし方・地域）から算出した目安です。"
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ranked.map(({ store, compat }) => (
          <StoreCard key={store.id} store={store} compat={compat} />
        ))}
      </div>
    </>
  );
}
