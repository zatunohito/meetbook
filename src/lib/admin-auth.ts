import { timingSafeEqual } from "node:crypto";

// 管理画面は Basic 認証（ADMIN_USER / ADMIN_PASSWORD）。未設定なら管理画面自体を閉じる。
export function adminConfigured() {
  return Boolean(process.env.ADMIN_USER && process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 12);
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkBasicAuth(header: string | null) {
  if (!adminConfigured() || !header?.startsWith("Basic ")) return false;
  const decoded = Buffer.from(header.slice(6), "base64").toString();
  const i = decoded.indexOf(":");
  if (i < 0) return false;
  const ok1 = safeEqual(decoded.slice(0, i), process.env.ADMIN_USER!);
  const ok2 = safeEqual(decoded.slice(i + 1), process.env.ADMIN_PASSWORD!);
  return ok1 && ok2;
}
