import "server-only";
import { bool, list, str, strs } from "./form";
import { normalizeIsbn } from "./openbd";
import { pickKeys } from "./taxonomy";

/** 書籍フォームの共通パース（出版社・管理画面で共用） */
export function parseBookForm(form: FormData) {
  const title = str(form, "title", 200);
  if (!title) throw new Error("書名は必須です");
  const isbnRaw = str(form, "isbn", 20);
  const isbn = isbnRaw ? normalizeIsbn(isbnRaw) : null;
  if (isbnRaw && !isbn) throw new Error("ISBN は10桁または13桁で入力してください");
  const published = str(form, "published_on", 10);
  // 編集画面では書影は専用のアップロード欄で扱うため、フォームに項目が無ければ更新しない
  const hasCover = form.has("cover_url");
  const cover = str(form, "cover_url", 500);
  if (cover && !/^https:\/\//.test(cover)) throw new Error("書影URLは https:// で始まるURLを入力してください");
  return {
    title,
    isbn,
    author: str(form, "author", 200),
    publisher_name: str(form, "publisher_name", 100),
    genres: pickKeys("genre", strs(form, "genres")),
    keywords: list(form, "keywords").slice(0, 20),
    description: str(form, "description", 4000),
    ...(hasCover ? { cover_url: cover } : {}),
    published_on: published && /^\d{4}-\d{2}-\d{2}$/.test(published) ? published : null,
    target_readers: str(form, "target_readers", 1000),
    consultation_note: str(form, "consultation_note", 1000),
    is_published: bool(form, "is_published"),
  };
}
