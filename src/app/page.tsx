import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isDbConfigured } from "@/lib/db";
import { getSession } from "@/lib/session";
import { SetupRequired } from "@/components/setup-required";

export default async function Root() {
  await connection(); // 環境変数・DB を毎リクエスト参照する
  if (!isDbConfigured()) return <SetupRequired />;
  const s = await getSession();
  if (!s) redirect("/welcome");
  redirect(s.role === "reader" ? "/home" : s.role === "store" ? "/store" : "/publisher");
}
