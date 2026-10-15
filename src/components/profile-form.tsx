"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { ADVENTURE_LEVELS, ATMOSPHERES, GENRES, REGIONS, STYLES, type Option } from "@/lib/taxonomy";
import type { Reader } from "@/lib/types";
import { saveProfile } from "@/app/actions/reader";
import { SubmitButton } from "./submit-button";
import { btn } from "./ui";

type Step = { no: number; title: string; hint?: string; body: React.ReactNode };

function Choices({ name, options, selected, max }: { name: string; options: Option[]; selected: string[]; max?: number }) {
  const [picked, setPicked] = useState<string[]>(selected);
  return (
    <fieldset>
      <legend className="sr-only">{name}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = picked.includes(o.key);
          const disabled = !on && max !== undefined && picked.length >= max;
          return (
            <label
              key={o.key}
              className={`cursor-pointer select-none rounded-full border px-3 py-2 text-sm transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${
                on ? "border-ink bg-ink text-paper" : "border-rule bg-raised text-ink hover:border-ink"
              } ${disabled ? "opacity-40" : ""}`}
            >
              <input
                type="checkbox"
                name={name}
                value={o.key}
                checked={on}
                disabled={disabled}
                onChange={() => setPicked((p) => (on ? p.filter((k) => k !== o.key) : [...p, o.key]))}
                className="sr-only"
              />
              {on && <Check aria-hidden className="mr-1 inline size-3.5" />}
              {o.label}
            </label>
          );
        })}
      </div>
      {max && <p className="mt-2 text-xs text-muted">最大{max}つまで（{picked.length}/{max}）</p>}
    </fieldset>
  );
}

/** 初回アンケート（mode="onboarding"）とプロフィール編集（mode="edit"）で共用 */
export function ProfileForm({ reader, mode }: { reader: Reader; mode: "onboarding" | "edit" }) {
  const [step, setStep] = useState(0);

  const steps: Step[] = [
    {
      no: 1,
      title: "どんなテーマに興味がありますか？",
      hint: "いま気になっているものを選んでください。",
      body: (
        <div className="space-y-6">
          {mode === "onboarding" && (
            <div>
              <label htmlFor="display_name" className="mb-2 block text-sm text-ink-soft">ニックネーム（任意）</label>
              <input id="display_name" name="display_name" maxLength={40} defaultValue={reader.display_name ?? ""} className="field max-w-xs" />
            </div>
          )}
          <Choices name="interests" options={GENRES} selected={reader.interests} max={6} />
        </div>
      ),
    },
    {
      no: 2,
      title: "好きな本やジャンルを教えてください",
      body: (
        <div className="space-y-5">
          <div>
            <label htmlFor="favorite_books" className="mb-2 block text-sm text-ink-soft">好きな本・作家（自由記述・任意）</label>
            <textarea id="favorite_books" name="favorite_books" rows={3} maxLength={500} defaultValue={reader.favorite_books ?? ""} className="field" placeholder="例：遠藤周作『沈黙』、須賀敦子のエッセイ" />
          </div>
          <div>
            <p className="mb-2 text-sm text-ink-soft">よく読むジャンル</p>
            <Choices name="favorite_genres" options={GENRES} selected={reader.favorite_genres} max={6} />
          </div>
        </div>
      ),
    },
    {
      no: 3,
      title: "最近、考えていることは？",
      hint: "言葉にしかけていることでも大丈夫です。推薦理由に使われます。",
      body: (
        <textarea name="current_thoughts" rows={4} maxLength={500} defaultValue={reader.current_thoughts ?? ""} className="field" placeholder="例：働き方のこと、祖父母の暮らしていた街のこと" aria-label="最近考えていること" />
      ),
    },
    {
      no: 4,
      title: "まだ読んだことはないけれど、気になるジャンルは？",
      hint: "「偶然の一冊」を選ぶ手がかりになります。",
      body: <Choices name="unexplored_genres" options={GENRES} selected={reader.unexplored_genres} max={6} />,
    },
    {
      no: 5,
      title: "書店ではどう過ごすのが好きですか？",
      body: <Choices name="store_styles" options={STYLES} selected={reader.store_styles} />,
    },
    {
      no: 6,
      title: "どんな雰囲気のお店が好きですか？",
      body: <Choices name="atmospheres" options={ATMOSPHERES} selected={reader.atmospheres} />,
    },
    {
      no: 7,
      title: "新しいジャンルへの挑戦度と、よく行く地域",
      body: (
        <div className="space-y-6">
          <fieldset>
            <legend className="mb-2 text-sm text-ink-soft">挑戦度</legend>
            <div className="space-y-2">
              {ADVENTURE_LEVELS.map((o) => (
                <label key={o.key} className="flex cursor-pointer items-center gap-3 rounded-2xl bg-raised shadow-card px-3 py-2.5 text-sm has-[:checked]:border-ink has-[:checked]:bg-ink/5">
                  <input type="radio" name="adventure_level" value={o.key} defaultChecked={String(reader.adventure_level) === o.key} className="accent-[var(--accent)]" />
                  <span className="w-5 font-display text-accent">{o.key}</span>
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="home_area" className="mb-2 block text-sm text-ink-soft">よく行く地域</label>
            <select id="home_area" name="home_area" defaultValue={reader.home_area ?? ""} className="field">
              <option value="">選択しない</option>
              {REGIONS.map((r) => (
                <option key={r.key} value={r.key}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>
      ),
    },
  ];

  if (mode === "edit") {
    return (
      <form action={saveProfile} className="space-y-10">
        <input type="hidden" name="next" value="profile" />
        <div>
          <label htmlFor="display_name" className="mb-2 block font-display font-bold text-lg">呼び名（任意）</label>
          <input id="display_name" name="display_name" maxLength={40} defaultValue={reader.display_name ?? ""} className="field max-w-sm" />
        </div>
        {steps.map((s) => (
          <section key={s.no} className="border-t border-rule pt-8">
            <p className="eyebrow mb-2">Q{s.no}</p>
            <h2 className="mb-4 font-display font-bold text-lg">{s.title}</h2>
            {s.body}
          </section>
        ))}
        <div className="sticky bottom-20 border-t border-rule bg-paper/95 py-4 backdrop-blur md:bottom-0">
          <SubmitButton className={btn.primary} pendingText="保存しています…">
            保存してマッチングに反映
          </SubmitButton>
        </div>
      </form>
    );
  }

  const last = step === steps.length - 1;
  return (
    <form action={saveProfile}>
      <div className="mb-8 flex gap-1" aria-hidden>
        {steps.map((s, i) => (
          <span key={s.no} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-ink" : "bg-rule"}`} />
        ))}
      </div>
      {/* 回答を保持するため、全ステップを描画したまま表示だけ切り替える */}
      {steps.map((s, i) => (
        <section key={s.no} hidden={i !== step} aria-live="polite">
          <p className="eyebrow mb-3">
            Question {s.no} / {steps.length}
          </p>
          <h1 className="font-display font-bold text-xl leading-relaxed md:text-2xl">{s.title}</h1>
          {s.hint && <p className="mt-2 text-sm text-muted">{s.hint}</p>}
          <div className="mt-8">{s.body}</div>
        </section>
      ))}
      <div className="mt-12 flex items-center justify-between gap-4 border-t border-rule pt-6">
        <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className={btn.ghost}>
          <ArrowLeft aria-hidden className="size-4" /> 戻る
        </button>
        <div className="flex items-center gap-2">
          {!last && (
            <button type="button" onClick={() => setStep((s) => s + 1)} className={btn.ghost}>
              スキップ
            </button>
          )}
          {last ? (
            <SubmitButton className={btn.primary} pendingText="あなたの本棚を準備しています…">
              はじめる <ArrowRight aria-hidden className="size-4" />
            </SubmitButton>
          ) : (
            <button type="button" onClick={() => setStep((s) => s + 1)} className={btn.primary}>
              次へ <ArrowRight aria-hidden className="size-4" />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
