/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Camera, Library, MapPin } from "lucide-react";
import { genreLabel } from "@/lib/taxonomy";
import type { Compatibility } from "@/lib/match";
import type { Store } from "@/lib/types";
import { Tag } from "./ui";

export function StoreCard({ store, compat }: { store: Store; compat: Compatibility }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-raised shadow-card">
      <Link href={`/stores/${store.slug}`} className="relative block">
        {store.photo_urls[0] ? (
          <img src={store.photo_urls[0]} alt={store.photo_meta?.[store.photo_urls[0]]?.caption ?? `${store.name}の写真`} loading="lazy" className="aspect-[16/9] w-full object-cover" />
        ) : (
          <div className="flex aspect-[16/9] w-full items-center justify-center bg-ink/5 text-muted">
            <Library aria-hidden className="size-10" strokeWidth={1.5} />
            <span className="sr-only">写真未登録</span>
          </div>
        )}
        <CompatBadge compat={compat} />
        {store.photo_urls[0] && store.photo_meta?.[store.photo_urls[0]]?.caption && (
          <span className="absolute bottom-3 left-3 max-w-[70%] truncate rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white">
            {store.photo_meta[store.photo_urls[0]].caption}
          </span>
        )}
        {store.photo_urls.length > 1 && (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-bold text-white">
            <Camera aria-hidden className="size-3.5" /> {store.photo_urls.length}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div>
          <h3 className="font-display text-lg font-bold leading-snug tracking-tight">
            <Link href={`/stores/${store.slug}`} className="hover:text-accent">
              {store.name}
            </Link>
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
            <MapPin aria-hidden className="size-3.5" />
            {store.area ?? "エリア未登録"}
          </p>
        </div>
        {store.features.length > 0 && <p className="line-clamp-2 text-sm text-ink-soft">{store.features.join(" ・ ")}</p>}
        {store.specialty_genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {store.specialty_genres.map((g) => (
              <Tag key={g} tone="leaf">{genreLabel(g)}</Tag>
            ))}
          </div>
        )}
        {compat.reasons.length > 0 && (
          <ul className="mt-auto space-y-1 border-t border-rule pt-3 text-xs text-ink-soft">
            {compat.reasons.slice(0, 3).map((r) => (
              <li key={r} className="flex gap-2">
                <span aria-hidden className="mt-[9px] h-px w-2 shrink-0 bg-accent" />
                {r}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

function CompatBadge({ compat }: { compat: Compatibility }) {
  if (compat.score === null) return null;
  return (
    <span
      title="アンケート回答と店舗情報から算出した目安です"
      className="absolute right-3 top-3 rounded-full bg-[#111]/85 px-3 py-1 font-latin text-xs font-semibold text-white backdrop-blur"
    >
      MATCH <span className="text-sm font-bold text-[#ff7a45]">{compat.score}%</span>
    </span>
  );
}

export function CompatScore({ compat, large }: { compat: Compatibility; large?: boolean }) {
  if (compat.score === null) {
    return <p className="shrink-0 rounded-full border border-rule px-3 py-1 text-xs text-muted">相性は情報登録待ち</p>;
  }
  return (
    <div
      className="flex shrink-0 flex-col items-end justify-center"
      title="アンケート回答と店舗情報から算出した目安です"
    >
      <p className="eyebrow">Match</p>
      <p className={`font-latin font-bold leading-none tracking-tight text-accent ${large ? "text-5xl" : "text-3xl"}`}>
        {compat.score}
        <span className="text-base text-muted">%</span>
      </p>
    </div>
  );
}
