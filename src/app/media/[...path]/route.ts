import { readFile } from "node:fs/promises";
import path from "node:path";
import { sniffImage } from "@/lib/storage";

// ローカルプレビュー用：LOCAL_UPLOAD_DIR に保存した写真を配信する（本番は Supabase Storage の URL を直接使う）
export async function GET(_: Request, ctx: RouteContext<"/media/[...path]">) {
  const dir = process.env.LOCAL_UPLOAD_DIR;
  if (!dir) return new Response("Not found", { status: 404 });
  const { path: parts } = await ctx.params;
  const root = path.resolve(dir);
  const file = path.resolve(root, ...parts);
  if (!file.startsWith(root + path.sep)) return new Response("Not found", { status: 404 });
  try {
    const buf = await readFile(file);
    const kind = sniffImage(buf);
    if (!kind) return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(buf), {
      headers: { "Content-Type": kind.type, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
