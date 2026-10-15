import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { getReader } from "@/lib/queries";
import { Logo } from "@/components/logo";
import { ProfileForm } from "@/components/profile-form";

export const metadata: Metadata = { title: "はじめに" };

export default async function Onboarding() {
  const { id } = await requireRole("reader");
  const reader = await getReader(id);
  if (!reader) redirect("/welcome");
  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-16 md:px-6">
      <div className="py-6">
        <Logo href="/welcome" />
      </div>
      <p className="mb-10 text-sm text-ink-soft">
        あなたのことを少しだけ教えてください。回答はプロフィールに保存され、いつでも変更できます。
      </p>
      <ProfileForm reader={reader} mode="onboarding" />
    </main>
  );
}
