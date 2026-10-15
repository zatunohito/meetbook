import "server-only";
import { headers } from "next/headers";
import { checkBasicAuth } from "./admin-auth";

/** Server Action はどのパスからでも呼べるため、proxy に加えて処理側でも必ず検証する */
export async function requireAdmin() {
  if (!checkBasicAuth((await headers()).get("authorization"))) {
    throw new Error("管理者認証が必要です");
  }
}
