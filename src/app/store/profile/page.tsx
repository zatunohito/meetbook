import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { getStore } from "@/lib/queries";
import { updateOwnStore } from "@/app/actions/store";
import { StoreForm } from "@/components/admin-forms";
import { PageHeader, Section } from "@/components/ui";
import { PhotoManager } from "@/components/photo-manager";
import { Camera, Store as StoreIcon } from "lucide-react";

export const metadata: Metadata = { title: "店舗情報" };

export default async function StoreProfilePage() {
  const { id } = await requireRole("store");
  const store = await getStore(id);
  if (!store) notFound();
  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Profile"
        title="店舗情報"
        lead={
          <>
            ここで入力した内容が、読者向けの
            {store.is_published ? <Link href={`/stores/${store.slug}`} className="underline underline-offset-4">店舗ページ</Link> : "店舗ページ"}
            と相性スコアに反映されます。店員メッセージは、ご本人の言葉を話し手の名前と一緒に載せてください。店名・地域の変更は MEET BOOK 運営までご連絡ください。
          </>
        }
      />
      <Section eyebrow="Photos" title="写真" icon={Camera}>
        <PhotoManager target={{ kind: "store", id: store.id }} initialUrls={store.photo_urls} initialCredit={store.photo_credit} label={store.name} />
      </Section>
      <Section eyebrow="Profile" title="お店の情報" icon={StoreIcon}>
        <StoreForm store={store} save={updateOwnStore} mode="store" />
      </Section>
    </div>
  );
}
