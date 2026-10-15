import Link from "next/link";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-16">
      <Logo />
      <h1 className="mt-12 font-display font-bold text-2xl">ページが見つかりませんでした</h1>
      <p className="mt-3 text-sm text-ink-soft">お探しの本やお店は、まだ登録されていないか、非公開になっている可能性があります。</p>
      <Link href="/" className="mt-6 inline-block text-sm underline underline-offset-4">トップへ戻る</Link>
    </main>
  );
}
