import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { requireRole } from "@/lib/session";
import { getReader } from "@/lib/queries";
import { signOut } from "@/app/actions/session";
import { ProfileForm } from "@/components/profile-form";
import { Notice, PageHeader, btn } from "@/components/ui";

export const metadata: Metadata = { title: "プロフィール" };

export default async function ProfilePage({ searchParams }: PageProps<"/profile">) {
  const { id } = await requireRole("reader");
  const [reader, sp] = await Promise.all([getReader(id), searchParams]);
  if (!reader) redirect("/welcome");

  return (
    <div className="max-w-2xl">
      <PageHeader
        eyebrow="Profile"
        title="プロフィール"
        lead="興味や過ごし方を変えると、おすすめ・偶然の一冊・本屋との相性にすぐ反映されます。"
      />
      {sp.saved && <div className="mb-8"><Notice>保存しました。マッチングに反映されています。</Notice></div>}
      <ProfileForm reader={reader} mode="edit" />
      <section className="mt-16 border-t border-rule pt-8">
        <h2 className="font-display font-bold text-lg">この端末からログアウト</h2>
        <p className="mt-2 text-sm text-muted">
          アカウント登録なしの試走版のため、ログアウトするとこの読者データには戻れません。
        </p>
        <form action={signOut} className="mt-4">
          <button type="submit" className={btn.danger}>
            <LogOut aria-hidden className="size-4" /> ログアウトして役割を選び直す
          </button>
        </form>
      </section>
    </div>
  );
}
