"use client";

import { useActionState } from "react";
import type { Publisher } from "@/lib/types";
import { GENRES } from "@/lib/taxonomy";
import { updateOwnPublisher } from "@/app/actions/publisher";
import { Field, FormMessage } from "./book-form";
import { SubmitButton } from "./submit-button";
import { btn } from "./ui";

export function PublisherInfoForm({ publisher }: { publisher: Publisher }) {
  const [state, action] = useActionState(updateOwnPublisher, undefined);
  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="所在地" htmlFor="location">
          <input id="location" name="location" maxLength={100} defaultValue={publisher.location ?? ""} className="field" />
        </Field>
        <Field label="Webサイト" htmlFor="website_url">
          <input id="website_url" name="website_url" type="url" defaultValue={publisher.website_url ?? ""} className="field" />
        </Field>
      </div>
      <Field label="紹介文" htmlFor="description">
        <textarea id="description" name="description" rows={5} maxLength={3000} defaultValue={publisher.description ?? ""} className="field" />
      </Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="大切にしていること" htmlFor="mission">
          <input id="mission" name="mission" maxLength={300} defaultValue={publisher.mission ?? ""} className="field" />
        </Field>
        <Field label="求めている書店・届け先" htmlFor="seeking">
          <input id="seeking" name="seeking" maxLength={300} defaultValue={publisher.seeking ?? ""} className="field" />
        </Field>
      </div>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">得意ジャンル</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {GENRES.map((g) => (
            <label key={g.key} className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" name="genres" value={g.key} defaultChecked={publisher.genres.includes(g.key)} className="accent-[var(--accent)]" />
              {g.label}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="タグ" hint="改行またはカンマ区切り" htmlFor="tags">
        <textarea id="tags" name="tags" rows={2} defaultValue={publisher.tags.join("\n")} className="field" />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="consultation_enabled" defaultChecked={publisher.consultation_enabled} className="accent-[var(--accent)]" />
        書店からの相談（取り寄せ・イベント等）を受け付ける
      </label>
      <Field label="書店向けの案内" hint="相談・注文の窓口や条件など" htmlFor="consultation_note">
        <textarea id="consultation_note" name="consultation_note" rows={3} maxLength={1000} defaultValue={publisher.consultation_note ?? ""} className="field" />
      </Field>
      <FormMessage state={state} />
      <SubmitButton className={btn.primary} pendingText="保存しています…">出版社情報を保存</SubmitButton>
    </form>
  );
}
