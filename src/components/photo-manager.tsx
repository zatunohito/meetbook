"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { movePhoto, removePhoto, setPhotoCredit, uploadPhoto, type PhotoTarget } from "@/app/actions/photos";
import { btn } from "./ui";

const MAX_EDGE = 2000;
const RECOMMENDED = 5;

/** ブラウザ側で長辺 2000px の JPEG に縮小する（向きの補正も含む） */
async function shrink(file: File): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type) && !/\.(jpe?g|png|webp|heic)$/i.test(file.name)) {
    throw new Error(`${file.name}：画像ファイルではありません`);
  }
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => {
    throw new Error(`${file.name}：この形式は読み込めませんでした（JPEG・PNG・WebP を選んでください）`);
  });
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("画像の変換に失敗しました"))), "image/jpeg", 0.85),
  );
}

export function PhotoManager({
  target,
  initialUrls,
  initialCredit,
  label,
}: {
  target: PhotoTarget;
  initialUrls: string[];
  initialCredit: string | null;
  label: string;
}) {
  const [urls, setUrls] = useState(initialUrls);
  const [credit, setCredit] = useState(initialCredit ?? "");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [message, setMessage] = useState<{ tone: "error" | "ok"; text: string } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  async function addFiles(files: FileList | File[]) {
    const list = [...files];
    if (!list.length) return;
    setMessage(null);
    setProgress({ done: 0, total: list.length });
    const errors: string[] = [];
    for (const [i, file] of list.entries()) {
      try {
        const blob = await shrink(file);
        const form = new FormData();
        form.append("file", blob, "photo.jpg");
        const res = await uploadPhoto(target, form);
        if (res.error) errors.push(res.error);
        if (res.urls) setUrls(res.urls);
      } catch (e) {
        errors.push((e as Error).message);
      }
      setProgress({ done: i + 1, total: list.length });
    }
    setProgress(null);
    if (input.current) input.current.value = "";
    setMessage(errors.length ? { tone: "error", text: [...new Set(errors)].join(" ／ ") } : { tone: "ok", text: `${list.length}枚追加しました。` });
  }

  function run(action: () => Promise<{ error?: string; urls?: string[] }>) {
    startTransition(async () => {
      const res = await action();
      if (res.error) setMessage({ tone: "error", text: res.error });
      if (res.urls) setUrls(res.urls);
    });
  }

  const busy = pending || progress !== null;
  const missing = Math.max(0, RECOMMENDED - urls.length);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <p className="text-sm text-ink-soft">
          {label}の写真 <span className="font-display text-lg font-bold text-ink">{urls.length}</span> 枚
          {missing > 0 && <span className="ml-2 rounded-full bg-sun/25 px-2.5 py-0.5 text-xs font-bold">あと{missing}枚あると見栄えがよくなります</span>}
        </p>
        <p className="text-xs text-muted">1枚目がカードやページのトップに使われます</p>
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!busy) addFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
          dragging ? "border-accent bg-accent-wash" : "border-rule bg-raised hover:border-accent"
        } ${busy ? "pointer-events-none opacity-60" : ""}`}
      >
        {progress ? (
          <>
            <Loader2 aria-hidden className="size-7 animate-spin text-accent" />
            <span className="text-sm font-bold">
              アップロード中… {progress.done}/{progress.total}
            </span>
          </>
        ) : (
          <>
            <span className="flex size-12 items-center justify-center rounded-full bg-accent-wash text-accent">
              <ImagePlus aria-hidden className="size-6" />
            </span>
            <span className="text-sm font-bold">写真を選ぶ、またはここにドロップ</span>
            <span className="text-xs text-muted">JPEG・PNG・WebP（複数選択可）。自動で縮小してから送信します</span>
          </>
        )}
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          multiple
          className="sr-only"
          disabled={busy}
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </label>

      {message && (
        <p role={message.tone === "error" ? "alert" : "status"} className={`text-sm ${message.tone === "error" ? "text-danger" : "text-leaf"}`}>
          {message.text}
        </p>
      )}

      {urls.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {urls.map((url, i) => (
            <li key={url} className="group relative overflow-hidden rounded-2xl bg-raised shadow-card">
              <img src={url} alt={`${label}の写真 ${i + 1}`} className="aspect-[4/3] w-full object-cover" loading="lazy" />
              {i === 0 && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-ink">
                  <Star aria-hidden className="size-3" /> トップ
                </span>
              )}
              <div className="flex items-center justify-between gap-1 p-1.5">
                <div className="flex">
                  <button type="button" className={btn.ghost} disabled={busy || i === 0} onClick={() => run(() => movePhoto(target, url, i - 1))} aria-label={`${i + 1}枚目を前へ`}>
                    <ArrowLeft aria-hidden className="size-4" />
                  </button>
                  <button type="button" className={btn.ghost} disabled={busy || i === urls.length - 1} onClick={() => run(() => movePhoto(target, url, i + 1))} aria-label={`${i + 1}枚目を後ろへ`}>
                    <ArrowRight aria-hidden className="size-4" />
                  </button>
                </div>
                {i !== 0 && (
                  <button type="button" className={`${btn.ghost} text-xs`} disabled={busy} onClick={() => run(() => movePhoto(target, url, 0))}>
                    トップに
                  </button>
                )}
                <button
                  type="button"
                  className={`${btn.ghost} hover:!bg-danger/10 hover:!text-danger`}
                  disabled={busy}
                  onClick={() => confirm("この写真を削除しますか？") && run(() => removePhoto(target, url))}
                  aria-label={`${i + 1}枚目を削除`}
                >
                  <Trash2 aria-hidden className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            const res = await setPhotoCredit(target, credit);
            if (!res.error) setMessage({ tone: "ok", text: "写真のクレジットを保存しました。" });
            return res;
          });
        }}
      >
        <label className="flex-1">
          <span className="mb-1.5 block text-sm font-medium">写真のクレジット（任意）</span>
          <input value={credit} onChange={(e) => setCredit(e.target.value)} maxLength={200} placeholder="例：写真提供 ひとやすみ書店" className="field" />
        </label>
        <button type="submit" className={btn.secondary} disabled={busy}>
          保存
        </button>
      </form>
      <p className="text-xs text-muted">掲載の許可を得た写真のみアップロードしてください。人物が写る場合はご本人の了承も必要です。</p>
    </div>
  );
}
