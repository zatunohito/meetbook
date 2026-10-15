import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// アカウント認証なしの試走用セッション。役割と対象IDを署名付き Cookie に保持する。
export type Session =
  | { role: "reader"; id: string }
  | { role: "store"; id: string }
  | { role: "publisher"; id: string };

const COOKIE = "mb_session";
const MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Cookie の署名鍵。SESSION_SECRET があればそれを使い、無ければ service_role キーから導出する
 * （Vercel の Supabase 連携だけで動くようにするため）。
 */
function secret() {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  const base = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) throw new Error("SESSION_SECRET または SUPABASE_SERVICE_ROLE_KEY が未設定です");
  return createHmac("sha256", base).update("meetbook-session-v1").digest("hex");
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function encode(s: Session) {
  const payload = Buffer.from(JSON.stringify(s)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode(raw: string | undefined): Session | null {
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const s = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (["reader", "store", "publisher"].includes(s?.role) && typeof s?.id === "string") return s;
  } catch {}
  return null;
}

export async function getSession() {
  return decode((await cookies()).get(COOKIE)?.value);
}

export async function setSession(s: Session) {
  (await cookies()).set(COOKIE, encode(s), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function requireRole<R extends Session["role"]>(role: R) {
  const s = await getSession();
  if (!s || s.role !== role) redirect("/welcome");
  return s as Extract<Session, { role: R }>;
}
