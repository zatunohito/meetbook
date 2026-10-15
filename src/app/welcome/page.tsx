import { connection } from "next/server";
import type { Metadata } from "next";
import { BookOpen, Library, PenLine } from "lucide-react";
import { isDbConfigured } from "@/lib/db";
import { listPublishers, listStores } from "@/lib/queries";
import { startAsPublisher, startAsReader, startAsStore } from "@/app/actions/session";
import { Logo } from "@/components/logo";
import { SubmitButton } from "@/components/submit-button";
import { SetupRequired } from "@/components/setup-required";
import { btn } from "@/components/ui";

export const metadata: Metadata = { title: "はじめる" };

export default async function Welcome({ searchParams }: PageProps<"/welcome">) {
  await connection(); // 環境変数・DB を毎リクエスト参照する
  if (!isDbConfigured()) return <SetupRequired />;
  const [stores, publishers, sp] = await Promise.all([listStores(), listPublishers(), searchParams]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 md:px-8">
      <div className="py-5">
        <Logo href="/welcome" />
      </div>

      <section className="relative overflow-hidden rounded-2xl bg-[#111] px-6 py-14 text-white md:px-14 md:py-24">
        <p className="font-latin text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
          Nagasaki <span className="text-[#ff7a45]">●</span> Book Meeting
        </p>
        <h1 className="mt-6 font-display text-[34px] font-black leading-[1.25] tracking-tight md:text-7xl md:leading-[1.1]">
          本を探すのではなく、
          <br />
          まだ知らない一冊と
          <br className="md:hidden" />
          出会う<span className="text-[#ff7a45]">。</span>
        </h1>
        <p className="mt-8 max-w-xl text-sm leading-relaxed text-white/70 md:text-base">
          本をきっかけに、人・場所・価値観・新しい自分と出会う。MEET BOOK は、長崎の読者と書店と小さな出版社をつなぐ場所です。
        </p>
      </section>

      <section className="py-10 md:py-14">
        <p className="eyebrow mb-2">Get started</p>
        <h2 className="font-display text-2xl font-black tracking-tight md:text-3xl">どの立場で使ってみますか？</h2>
        <p className="mt-2 text-sm text-muted">アカウント登録なしで試せます。あとから切り替えることもできます。</p>
        {sp.error && <p className="mt-4 text-sm text-danger">選択内容を確認してください。</p>}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="flex flex-col rounded-2xl bg-raised p-6 shadow-card transition hover:shadow-[0_0_0_1px_var(--ink)]">
            <span className="flex size-11 items-center justify-center rounded-xl bg-ink text-paper"><BookOpen aria-hidden className="size-5" strokeWidth={2} /></span>
            <h3 className="mt-4 font-display text-lg font-bold">読者</h3>
            <p className="mt-2 flex-1 text-sm text-ink-soft">
              7つの質問に答えると、あなたに合う本と本屋、そして「偶然の一冊」が届きます。
            </p>
            <form action={startAsReader} className="mt-6">
              <SubmitButton className={`${btn.primary} w-full`} pendingText="準備しています…">
                読者としてはじめる
              </SubmitButton>
            </form>
          </div>

          <div className="flex flex-col rounded-2xl bg-raised p-6 shadow-card transition hover:shadow-[0_0_0_1px_var(--ink)]">
            <span className="flex size-11 items-center justify-center rounded-xl bg-ink text-paper"><Library aria-hidden className="size-5" strokeWidth={2} /></span>
            <h3 className="mt-4 font-display text-lg font-bold">書店</h3>
            <p className="mt-2 flex-1 text-sm text-ink-soft">読者から届いた相談に返信し、対応状況を管理します。</p>
            <form action={startAsStore} className="mt-6 space-y-3">
              <label className="sr-only" htmlFor="store_id">書店を選択</label>
              <select id="store_id" name="store_id" required className="field" defaultValue="">
                <option value="" disabled>書店を選択</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <SubmitButton className={`${btn.secondary} w-full`}>書店として入る</SubmitButton>
            </form>
          </div>

          <div className="flex flex-col rounded-2xl bg-raised p-6 shadow-card transition hover:shadow-[0_0_0_1px_var(--ink)]">
            <span className="flex size-11 items-center justify-center rounded-xl bg-ink text-paper"><PenLine aria-hidden className="size-5" strokeWidth={2} /></span>
            <h3 className="mt-4 font-display text-lg font-bold">出版社</h3>
            <p className="mt-2 flex-1 text-sm text-ink-soft">自社の情報と刊行本を登録し、読者と書店に届けます。</p>
            <form action={startAsPublisher} className="mt-6 space-y-3">
              <label className="sr-only" htmlFor="publisher_id">出版社を選択</label>
              <select id="publisher_id" name="publisher_id" required className="field" defaultValue="">
                <option value="" disabled>出版社を選択</option>
                {publishers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <SubmitButton className={`${btn.secondary} w-full`}>出版社として入る</SubmitButton>
            </form>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted">
          ※ 試走版のため、書店・出版社の画面は選択だけで入れます。本番運用では各事業者ごとのログインに置き換えてください。
        </p>
      </section>
    </main>
  );
}
