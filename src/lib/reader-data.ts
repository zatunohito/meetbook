import "server-only";
import { redirect } from "next/navigation";
import { requireRole } from "./session";
import { getMatchContext, getReader, listBooksWithContext } from "./queries";

/** 読者画面で共通に使う：読者・全書籍・マッチング文脈 */
export async function loadReaderContext() {
  const { id } = await requireRole("reader");
  const [reader, books] = await Promise.all([getReader(id), listBooksWithContext()]);
  if (!reader) redirect("/welcome");
  const ctx = await getMatchContext(id, books);
  return { reader, books, ctx };
}
