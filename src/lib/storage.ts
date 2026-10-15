import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "./db";

// 写真の保存先。LOCAL_UPLOAD_DIR があればローカルのディスク（/media/... で配信）、なければ Supabase Storage の公開バケット。
const BUCKET = "photos";
const localDir = () => process.env.LOCAL_UPLOAD_DIR;

export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

/** ファイル先頭のバイト列から画像形式を判定する（拡張子や Content-Type は信用しない） */
export function sniffImage(buf: Buffer): { ext: string; type: string } | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: "png", type: "image/png" };
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return { ext: "webp", type: "image/webp" };
  return null;
}

let bucketReady = false;
async function ensureBucket() {
  if (bucketReady) return;
  const { data } = await db().storage.getBucket(BUCKET);
  if (!data) {
    const { error } = await db().storage.createBucket(BUCKET, { public: true, fileSizeLimit: MAX_PHOTO_BYTES, allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"] });
    if (error && !/already exists/i.test(error.message)) throw new Error(error.message);
  }
  bucketReady = true;
}

/** 保存して公開URLを返す。prefix は "stores/<id>" のような保存先 */
export async function savePhoto(buf: Buffer, prefix: string) {
  const kind = sniffImage(buf);
  if (!kind) throw new Error("JPEG・PNG・WebP の画像を選んでください。");
  if (buf.length > MAX_PHOTO_BYTES) throw new Error("画像が大きすぎます（8MBまで）。");
  const key = `${prefix}/${randomUUID()}.${kind.ext}`;

  const dir = localDir();
  if (dir) {
    const file = path.join(dir, key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, buf);
    return `/media/${key}`;
  }
  await ensureBucket();
  const { error } = await db().storage.from(BUCKET).upload(key, buf, { contentType: kind.type, upsert: false });
  if (error) throw new Error(error.message);
  return db().storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
}

/** 自分たちが保存した写真なら実体も削除する（外部URLは参照を外すだけ） */
export async function deletePhoto(url: string) {
  const dir = localDir();
  if (dir && url.startsWith("/media/")) {
    const file = path.resolve(dir, url.slice("/media/".length));
    if (file.startsWith(path.resolve(dir) + path.sep)) await unlink(file).catch(() => {});
    return;
  }
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i >= 0 && process.env.SUPABASE_URL && url.startsWith(process.env.SUPABASE_URL)) {
    await db().storage.from(BUCKET).remove([url.slice(i + marker.length)]);
  }
}
