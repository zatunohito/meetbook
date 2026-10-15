"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import type { PhotoMeta } from "@/lib/types";

/**
 * 写真ギャラリー。
 * モバイル：横スワイプのカルーセル／PC：大1枚＋小4枚のモザイク。タップで拡大表示（左右キー・Escで操作）。
 */
export function Gallery({ urls, name, credit, meta = {} }: { urls: string[]; name: string; credit?: string | null; meta?: PhotoMeta }) {
  const [open, setOpen] = useState<number | null>(null);
  const [slide, setSlide] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  if (urls.length === 0) {
    return (
      <div className="flex aspect-[16/7] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-rule text-muted md:aspect-[16/5]">
        <Camera aria-hidden className="size-9" strokeWidth={1.5} />
        <p className="text-sm font-bold">写真はまだありません</p>
      </div>
    );
  }

  const alt = (i: number) => meta[urls[i]]?.caption ? `${meta[urls[i]].caption}（${i + 1}／${urls.length}）` : `${name}の写真 ${i + 1}／${urls.length}`;
  const attributed = urls.filter((u) => meta[u]?.author || meta[u]?.source);
  const tiles = urls.slice(0, 5);
  const rest = urls.length - tiles.length;

  return (
    <div>
      {/* モバイル：カルーセル */}
      <div className="relative md:hidden">
        <div
          ref={track}
          className="shelf -mx-4 flex gap-3 overflow-x-auto px-4"
          onScroll={(e) => {
            const el = e.currentTarget;
            const w = el.firstElementChild?.clientWidth ?? 1;
            setSlide(Math.round(el.scrollLeft / (w + 12)));
          }}
        >
          {urls.map((u, i) => (
            <button key={u} type="button" onClick={() => setOpen(i)} className="w-[86%] shrink-0 sm:w-[64%]" aria-label={`${alt(i)}を拡大`}>
              <img src={u} alt={alt(i)} loading={i === 0 ? "eager" : "lazy"} className="aspect-[4/3] w-full rounded-2xl object-cover shadow-card" />
            </button>
          ))}
        </div>
        {urls.length > 1 && (
          <div className="mt-3 flex items-center justify-center gap-1.5" aria-hidden>
            {urls.map((u, i) => (
              <span key={u} className={`h-1.5 rounded-full transition-all ${i === slide ? "w-5 bg-ink" : "w-1.5 bg-rule"}`} />
            ))}
          </div>
        )}
      </div>

      {/* PC：モザイク */}
      <div className={`hidden gap-2 overflow-hidden rounded-2xl md:grid ${mosaicGrid(tiles.length)}`}>
        {tiles.map((u, i) => (
          <button
            key={u}
            type="button"
            onClick={() => setOpen(i)}
            className={`group relative overflow-hidden bg-raised ${i === 0 && tiles.length >= 3 ? "col-span-2 row-span-2" : ""}`}
            aria-label={`${alt(i)}を拡大`}
          >
            <img src={u} alt={alt(i)} loading={i === 0 ? "eager" : "lazy"} className="size-full object-cover transition duration-300 group-hover:scale-[1.03]" />
            {i === tiles.length - 1 && rest > 0 && (
              <span className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/45 text-sm font-bold text-white">
                <Images aria-hidden className="size-4" /> ほか{rest}枚
              </span>
            )}
          </button>
        ))}
      </div>
      {credit && <p className="mt-2 text-xs text-muted">{credit}</p>}
      {attributed.length > 0 && (
        <details className="mt-1 text-xs text-muted">
          <summary className="cursor-pointer select-none hover:text-ink">写真の出典・ライセンス</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            {attributed.map((u) => (
              <li key={u}>
                {meta[u].caption && `${meta[u].caption} — `}
                撮影：{meta[u].author ?? "不明"}
                {meta[u].license && ` ／ ${meta[u].license}`}
                {meta[u].source && (
                  <>
                    {" ／ "}
                    <a href={meta[u].source} target="_blank" rel="noreferrer" className="underline underline-offset-2">出典</a>
                  </>
                )}
              </li>
            ))}
          </ol>
        </details>
      )}

      {open !== null && <Lightbox urls={urls} index={open} name={name} credit={credit} meta={meta} onClose={() => setOpen(null)} onIndex={setOpen} />}
    </div>
  );
}

function mosaicGrid(n: number) {
  if (n === 1) return "h-[440px] grid-cols-1";
  if (n === 2) return "h-[380px] grid-cols-2";
  if (n === 3) return "h-[420px] grid-cols-3 grid-rows-2";
  if (n === 4) return "h-[440px] grid-cols-4 grid-rows-2 [&>*:last-child]:col-span-2";
  return "h-[440px] grid-cols-4 grid-rows-2";
}

function Lightbox({
  urls,
  index,
  name,
  credit,
  meta,
  onClose,
  onIndex,
}: {
  urls: string[];
  index: number;
  name: string;
  credit?: string | null;
  meta: PhotoMeta;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const go = useCallback((d: number) => onIndex((index + d + urls.length) % urls.length), [index, onIndex, urls.length]);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [go, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${name}の写真`}
      className="fixed inset-0 z-50 flex flex-col bg-black/90 text-white"
      onClick={onClose}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <div className="flex items-center justify-between p-4 text-sm" onClick={(e) => e.stopPropagation()}>
        <span className="font-bold">
          {index + 1} / {urls.length}
        </span>
        <button ref={closeBtn} type="button" onClick={onClose} className="rounded-full p-2 hover:bg-white/10" aria-label="閉じる">
          <X aria-hidden className="size-6" />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 md:px-16">
        <img src={urls[index]} alt={`${name}の写真 ${index + 1}／${urls.length}`} className="max-h-full max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
        {urls.length > 1 && (
          <>
            <button type="button" onClick={(e) => (e.stopPropagation(), go(-1))} className="absolute left-2 hidden rounded-full bg-white/10 p-3 hover:bg-white/20 md:block" aria-label="前の写真">
              <ChevronLeft aria-hidden className="size-6" />
            </button>
            <button type="button" onClick={(e) => (e.stopPropagation(), go(1))} className="absolute right-2 hidden rounded-full bg-white/10 p-3 hover:bg-white/20 md:block" aria-label="次の写真">
              <ChevronRight aria-hidden className="size-6" />
            </button>
          </>
        )}
      </div>
      <div className="p-4 text-center text-xs text-white/70" onClick={(e) => e.stopPropagation()}>
        {meta[urls[index]] ? (
          <>
            <p className="text-sm font-bold text-white">{meta[urls[index]].caption ?? name}</p>
            <p className="mt-1">
              撮影：{meta[urls[index]].author ?? "不明"}
              {meta[urls[index]].license && ` ／ ${meta[urls[index]].license}`}
              {meta[urls[index]].source && (
                <>
                  {" ／ "}
                  <a href={meta[urls[index]].source} target="_blank" rel="noreferrer" className="underline">出典（Wikimedia Commons）</a>
                </>
              )}
            </p>
          </>
        ) : (
          credit ?? name
        )}
      </div>
    </div>
  );
}
