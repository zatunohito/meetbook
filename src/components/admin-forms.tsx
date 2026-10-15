"use client";

import { useActionState } from "react";
import { ATMOSPHERES, GENRES, REGIONS, STYLES, type Option } from "@/lib/taxonomy";
import type { Announcement, EventRow, Publisher, Store } from "@/lib/types";
import { Field, FormMessage } from "./book-form";
import { SubmitButton } from "./submit-button";
import { btn } from "./ui";

type FormState = { error?: string; ok?: string } | undefined;
type Action = (s: FormState, f: FormData) => Promise<FormState>;

function Checks({ name, options, selected, legend }: { name: string; options: Option[]; selected: string[]; legend: string }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {options.map((o) => (
          <label key={o.key} className="flex items-center gap-1.5 text-sm">
            <input type="checkbox" name={name} value={o.key} defaultChecked={selected.includes(o.key)} className="accent-[var(--accent)]" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Published({ value }: { value?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name="is_published" defaultChecked={value ?? true} className="accent-[var(--accent)]" />
      公開する（オフにすると読者画面に表示されません。データは残ります）
    </label>
  );
}

/** datetime-local 用に JST の "YYYY-MM-DDTHH:mm" へ */
function toLocal(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000);
  return d.toISOString().slice(0, 16);
}

/** mode="store" は書店自身の編集画面用：店名・地域・公開設定・管理者メモ・出典は表示しない */
export function StoreForm({ store, save, mode = "admin" }: { store?: Store; save: Action; mode?: "admin" | "store" }) {
  const [state, action] = useActionState(save, undefined);
  const s = store;
  const admin = mode === "admin";
  return (
    <form action={action} className="space-y-5">
      {admin && (
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="店名（必須）" htmlFor="name"><input id="name" name="name" required defaultValue={s?.name} className="field" /></Field>
        <Field label="スラッグ（必須・URL用）" hint="半角英小文字・数字・ハイフン" htmlFor="slug"><input id="slug" name="slug" required pattern="[a-z0-9][a-z0-9\-]{1,60}" defaultValue={s?.slug} className="field" /></Field>
        <Field label="エリア（表示用）" htmlFor="area"><input id="area" name="area" defaultValue={s?.area ?? ""} className="field" /></Field>
        <Field label="地域（マッチング用）" htmlFor="region">
          <select id="region" name="region" defaultValue={s?.region ?? ""} className="field">
            <option value="">未設定</option>
            {REGIONS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </Field>
      </div>
      )}
      <div className="grid gap-5 md:grid-cols-[1fr_12rem]">
        <Field label="住所" htmlFor="address"><input id="address" name="address" defaultValue={s?.address ?? ""} className="field" /></Field>
        <Field label="電話番号" htmlFor="phone"><input id="phone" name="phone" type="tel" defaultValue={s?.phone ?? ""} className="field" /></Field>
      </div>
      <Field label="紹介" htmlFor="description"><textarea id="description" name="description" rows={5} defaultValue={s?.description ?? ""} className="field" /></Field>
      <Field label="特徴" hint="改行区切り（例：喫茶併設、古書も扱う）" htmlFor="features"><textarea id="features" name="features" rows={3} defaultValue={s?.features.join("\n")} className="field" /></Field>
      <Checks name="specialty_genres" legend="得意ジャンル" options={GENRES} selected={s?.specialty_genres ?? []} />
      <Checks name="atmosphere_tags" legend="店の雰囲気" options={ATMOSPHERES} selected={s?.atmosphere_tags ?? []} />
      <Checks name="style_tags" legend="合う過ごし方" options={STYLES} selected={s?.style_tags ?? []} />
      <Field label="タグ（表示用）" hint="改行区切り（例：レトロな街、居心地）" htmlFor="tags"><textarea id="tags" name="tags" rows={2} defaultValue={s?.tags.join("\n")} className="field" /></Field>
      <div className="grid gap-5 md:grid-cols-[12rem_1fr]">
        <Field label="話し手" hint="例：城下さん（店主）" htmlFor="staff_name"><input id="staff_name" name="staff_name" defaultValue={s?.staff_name ?? ""} className="field" /></Field>
        <Field label="店員メッセージ" hint="ご本人に確認した言葉のみ" htmlFor="staff_message"><textarea id="staff_message" name="staff_message" rows={4} defaultValue={s?.staff_message ?? ""} className="field" /></Field>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="営業時間" htmlFor="opening_hours"><textarea id="opening_hours" name="opening_hours" rows={2} defaultValue={s?.opening_hours ?? ""} className="field" /></Field>
        <Field label="アクセス" htmlFor="access"><textarea id="access" name="access" rows={2} defaultValue={s?.access ?? ""} className="field" /></Field>
      </div>
      <Field label="Webサイト" htmlFor="website_url"><input id="website_url" name="website_url" type="url" defaultValue={s?.website_url ?? ""} className="field" /></Field>
      <Field label="来店ミッション" hint="例：店主おすすめの棚から、表紙で一冊選んでみてください" htmlFor="visit_mission"><textarea id="visit_mission" name="visit_mission" rows={2} defaultValue={s?.visit_mission ?? ""} className="field" /></Field>
      {admin && (
        <>
          <Field label="情報の出典URL（読者には表示されません）" hint="改行区切り" htmlFor="sources"><textarea id="sources" name="sources" rows={2} defaultValue={s?.sources.join("\n")} className="field" /></Field>
          <Field label="管理者メモ（読者には表示されません）" htmlFor="admin_note"><textarea id="admin_note" name="admin_note" rows={2} defaultValue={s?.admin_note ?? ""} className="field" /></Field>
          <Published value={s?.is_published} />
        </>
      )}
      <FormMessage state={state} />
      <SubmitButton className={btn.primary} pendingText="保存しています…">保存する</SubmitButton>
    </form>
  );
}

export function PublisherForm({ publisher, save }: { publisher?: Publisher; save: Action }) {
  const [state, action] = useActionState(save, undefined);
  const p = publisher;
  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="出版社名（必須）" htmlFor="name"><input id="name" name="name" required defaultValue={p?.name} className="field" /></Field>
        <Field label="スラッグ（必須・URL用）" htmlFor="slug"><input id="slug" name="slug" required pattern="[a-z0-9][a-z0-9\-]{1,60}" defaultValue={p?.slug} className="field" /></Field>
        <Field label="所在地" htmlFor="location"><input id="location" name="location" defaultValue={p?.location ?? ""} className="field" /></Field>
        <Field label="Webサイト" htmlFor="website_url"><input id="website_url" name="website_url" type="url" defaultValue={p?.website_url ?? ""} className="field" /></Field>
      </div>
      <Field label="紹介文" htmlFor="description"><textarea id="description" name="description" rows={4} defaultValue={p?.description ?? ""} className="field" /></Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="大切にしていること" htmlFor="mission"><input id="mission" name="mission" defaultValue={p?.mission ?? ""} className="field" /></Field>
        <Field label="求めている書店・届け先" htmlFor="seeking"><input id="seeking" name="seeking" defaultValue={p?.seeking ?? ""} className="field" /></Field>
      </div>
      <Checks name="genres" legend="得意ジャンル" options={GENRES} selected={p?.genres ?? []} />
      <Field label="タグ（表示用）" hint="改行区切り" htmlFor="pub-tags"><textarea id="pub-tags" name="tags" rows={2} defaultValue={p?.tags.join("\n")} className="field" /></Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="consultation_enabled" defaultChecked={p?.consultation_enabled} className="accent-[var(--accent)]" />
        書店からの相談を受け付ける
      </label>
      <Field label="書店向けの案内" htmlFor="consultation_note"><textarea id="consultation_note" name="consultation_note" rows={2} defaultValue={p?.consultation_note ?? ""} className="field" /></Field>
      <Field label="管理者メモ（読者には表示されません）" htmlFor="pub-note"><textarea id="pub-note" name="admin_note" rows={2} defaultValue={p?.admin_note ?? ""} className="field" /></Field>
      <Published value={p?.is_published} />
      <FormMessage state={state} />
      <SubmitButton className={btn.primary} pendingText="保存しています…">保存する</SubmitButton>
    </form>
  );
}

export function EventForm({ event, save, stores, publishers }: { event?: EventRow; save: Action; stores?: { id: string; name: string }[]; publishers?: { id: string; name: string }[] }) {
  const [state, action] = useActionState(save, undefined);
  const e = event;
  return (
    <form action={action} className="space-y-5">
      <Field label="タイトル（必須）" htmlFor="ev-title"><input id="ev-title" name="title" required defaultValue={e?.title} className="field" /></Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="開始日時（必須・日本時間）" htmlFor="starts_at"><input id="starts_at" name="starts_at" type="datetime-local" required defaultValue={toLocal(e?.starts_at)} className="field" /></Field>
        <Field label="終了日時" htmlFor="ends_at"><input id="ends_at" name="ends_at" type="datetime-local" defaultValue={toLocal(e?.ends_at)} className="field" /></Field>
        {stores && publishers && (
          <>
        <Field label="主催書店" htmlFor="ev-store">
          <select id="ev-store" name="store_id" defaultValue={e?.store_id ?? ""} className="field">
            <option value="">なし</option>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="主催出版社" htmlFor="ev-pub">
          <select id="ev-pub" name="publisher_id" defaultValue={e?.publisher_id ?? ""} className="field">
            <option value="">なし</option>
            {publishers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
          </>
        )}
        <Field label="場所" htmlFor="place"><input id="place" name="place" defaultValue={e?.place ?? ""} className="field" /></Field>
        <Field label="詳細URL" htmlFor="ev-url"><input id="ev-url" name="url" type="url" defaultValue={e?.url ?? ""} className="field" /></Field>
      </div>
      <Field label="説明" htmlFor="ev-desc"><textarea id="ev-desc" name="description" rows={3} defaultValue={e?.description ?? ""} className="field" /></Field>
      <Published value={e?.is_published} />
      <FormMessage state={state} />
      <SubmitButton className={btn.primary} pendingText="保存しています…">{e ? "更新する" : "追加する"}</SubmitButton>
    </form>
  );
}

export function AnnouncementForm({ item, save }: { item?: Announcement; save: Action }) {
  const [state, action] = useActionState(save, undefined);
  return (
    <form action={action} className="space-y-5">
      <Field label="タイトル（必須）" htmlFor="an-title"><input id="an-title" name="title" required defaultValue={item?.title} className="field" /></Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="掲載日時（日本時間）" hint="空欄なら現在時刻" htmlFor="published_at"><input id="published_at" name="published_at" type="datetime-local" defaultValue={toLocal(item?.published_at)} className="field" /></Field>
        <Field label="リンクURL" htmlFor="an-url"><input id="an-url" name="url" type="url" defaultValue={item?.url ?? ""} className="field" /></Field>
      </div>
      <Field label="本文" htmlFor="an-body"><textarea id="an-body" name="body" rows={3} defaultValue={item?.body ?? ""} className="field" /></Field>
      <Published value={item?.is_published} />
      <FormMessage state={state} />
      <SubmitButton className={btn.primary} pendingText="保存しています…">{item ? "更新する" : "追加する"}</SubmitButton>
    </form>
  );
}

/** 小さな追加フォーム（在庫・感想・関係性） */
export function InlineForm({ save, children, submitLabel }: { save: Action; children: React.ReactNode; submitLabel: string }) {
  const [state, action] = useActionState(save, undefined);
  return (
    <form action={action} className="space-y-3 rounded-2xl bg-raised shadow-card p-4">
      {children}
      <FormMessage state={state} />
      <SubmitButton className={btn.secondary} pendingText="保存しています…">{submitLabel}</SubmitButton>
    </form>
  );
}
