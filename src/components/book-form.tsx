"use client";

import { useActionState, useState } from "react";
import { Search } from "lucide-react";
import { GENRES } from "@/lib/taxonomy";
import type { Book } from "@/lib/types";
import { SubmitButton } from "./submit-button";
import { btn } from "./ui";

type FormState = { error?: string; ok?: string } | undefined;
type LookupState = { error?: string; info?: { isbn: string; title: string; author: string | null; publisher: string | null; published_on: string | null; cover_url: string | null; description: string | null } } | undefined;

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (state?.error) return <p role="alert" className="text-sm text-danger">{state.error}</p>;
  if (state?.ok) return <p role="status" className="text-sm text-accent">{state.ok}</p>;
  return null;
}

/**
 * 書籍登録フォーム。ISBN 検索で openBD の書誌を下書きとして流し込み、確認してから保存する。
 * publishers を渡すと出版社の選択欄を表示（管理画面用）。
 */
export function BookForm({
  book,
  save,
  lookup,
  publishers,
  submitLabel = "保存する",
}: {
  book?: Partial<Book>;
  save: (state: FormState, form: FormData) => Promise<FormState>;
  lookup: (state: LookupState, form: FormData) => Promise<LookupState>;
  publishers?: { id: string; name: string }[];
  submitLabel?: string;
}) {
  const [state, action] = useActionState(save, undefined);
  const [found, lookupAction] = useActionState(lookup, undefined);
  const [isbn, setIsbn] = useState(book?.isbn ?? "");
  const info = found?.info;
  // 取り込み結果があればそれを初期値にしてフォームを作り直す
  const d = {
    ...book,
    ...(info && {
      isbn: info.isbn,
      title: info.title,
      author: info.author,
      published_on: info.published_on,
      cover_url: info.cover_url,
      description: info.description,
      publisher_name: info.publisher,
    }),
  };
  const matchedPublisher = info?.publisher ? publishers?.find((p) => p.name === info.publisher)?.id : undefined;

  return (
    <div className="space-y-8">
      <form action={lookupAction} className="rounded-2xl bg-raised shadow-card p-4">
        <Field label="ISBN から書誌を取り込む" hint="openBD の公開書誌データを下書きとして入力します。内容を確認してから保存してください。" htmlFor="lookup-isbn">
          <div className="flex gap-2">
            <input id="lookup-isbn" name="isbn" value={isbn} onChange={(e) => setIsbn(e.target.value)} inputMode="numeric" placeholder="978…" className="field" />
            <SubmitButton className={btn.secondary} pendingText="検索中…">
              <Search aria-hidden className="size-4" /> 取り込み
            </SubmitButton>
          </div>
        </Field>
        {found?.error && <p role="alert" className="mt-2 text-sm text-danger">{found.error}</p>}
        {info && <p role="status" className="mt-2 text-sm text-accent">『{info.title}』の書誌を下のフォームに入力しました。</p>}
      </form>

      <form key={info?.isbn ?? "base"} action={action} className="space-y-5">
        {info && <input type="hidden" name="data_source" value="openbd" />}
        {!info && book?.data_source && <input type="hidden" name="data_source" value={book.data_source} />}
        <Field label="書名（必須）" htmlFor="title">
          <input id="title" name="title" required maxLength={200} defaultValue={d.title ?? ""} className="field" />
        </Field>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="著者" htmlFor="author">
            <input id="author" name="author" maxLength={200} defaultValue={d.author ?? ""} className="field" />
          </Field>
          <Field label="ISBN" htmlFor="isbn">
            <input id="isbn" name="isbn" maxLength={20} defaultValue={d.isbn ?? ""} inputMode="numeric" className="field" />
          </Field>
        </div>
        {publishers && (
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="出版社（長崎の出版社）" htmlFor="publisher_id">
              <select id="publisher_id" name="publisher_id" defaultValue={matchedPublisher ?? d.publisher_id ?? ""} className="field">
                <option value="">登録外の出版社</option>
                {publishers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="出版社名（登録外の場合）" htmlFor="publisher_name">
              <input id="publisher_name" name="publisher_name" maxLength={100} defaultValue={d.publisher_name ?? ""} className="field" />
            </Field>
          </div>
        )}
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="刊行日" htmlFor="published_on">
            <input id="published_on" name="published_on" type="date" defaultValue={d.published_on ?? ""} className="field" />
          </Field>
          {!book?.id && (
            <Field label="書影URL" hint="https:// で始まる画像URL" htmlFor="cover_url">
              <input id="cover_url" name="cover_url" type="url" defaultValue={d.cover_url ?? ""} className="field" />
            </Field>
          )}
        </div>
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">ジャンル（マッチングに使用）</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {GENRES.map((g) => (
              <label key={g.key} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" name="genres" value={g.key} defaultChecked={d.genres?.includes(g.key)} className="accent-[var(--accent)]" />
                {g.label}
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="キーワード" hint="改行またはカンマ区切り。読者の「最近考えていること」との照合に使います。" htmlFor="keywords">
          <textarea id="keywords" name="keywords" rows={2} defaultValue={d.keywords?.join("\n") ?? ""} className="field" />
        </Field>
        <Field label="内容紹介" htmlFor="description">
          <textarea id="description" name="description" rows={6} maxLength={4000} defaultValue={d.description ?? ""} className="field" />
        </Field>
        <Field label="想定読者" htmlFor="target_readers">
          <textarea id="target_readers" name="target_readers" rows={2} maxLength={1000} defaultValue={d.target_readers ?? ""} className="field" />
        </Field>
        <Field label="書店向け相談設定" hint="書店や読者が相談するときに表示されるメモ（取り寄せ方法、注文窓口など）" htmlFor="consultation_note">
          <textarea id="consultation_note" name="consultation_note" rows={2} maxLength={1000} defaultValue={d.consultation_note ?? ""} className="field" />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_published" defaultChecked={d.is_published ?? true} className="accent-[var(--accent)]" />
          公開する
        </label>
        <FormMessage state={state} />
        <SubmitButton className={btn.primary} pendingText="保存しています…">{submitLabel}</SubmitButton>
      </form>
    </div>
  );
}
