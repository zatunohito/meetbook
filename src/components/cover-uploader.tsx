"use client";

import { useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { uploadCover } from "@/app/actions/photos";
import { BookCover } from "./book-cover";

/** ブラウザ側で長辺 1200px の JPEG にしてから送る */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("画像の変換に失敗しました"))), "image/jpeg", 0.88));
}

export function CoverUploader({ bookId, title, author, initialUrl }: { bookId: string; title: string; author?: string | null; initialUrl: string | null }) {
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", await shrink(file), "cover.jpg");
      const res = await uploadCover(bookId, form);
      if (res.error) setError(res.error);
      if (res.url) setUrl(res.url);
    } catch {
      setError("この画像は読み込めませんでした（JPEG・PNG・WebP を選んでください）。");
    }
    setBusy(false);
  }

  return (
    <div className="flex items-start gap-4 rounded-2xl bg-raised p-4 shadow-card">
      <div className="w-24 shrink-0">
        <BookCover title={title} author={author} url={url} />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-bold">書影（表紙画像）</p>
        <p className="text-xs text-muted">出版社が権利を持つ表紙画像、または掲載の許可を得た画像を登録してください。</p>
        <label className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-rule bg-raised px-5 py-2.5 text-sm font-bold hover:border-accent hover:text-accent ${busy ? "pointer-events-none opacity-60" : ""}`}>
          {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <ImagePlus aria-hidden className="size-4" />}
          {url ? "書影を差し替える" : "書影をアップロード"}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      </div>
    </div>
  );
}
