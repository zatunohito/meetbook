"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { createThread } from "@/app/actions/consult";
import { SubmitButton } from "./submit-button";
import { btn } from "./ui";

type StoreOption = { id: string; name: string; hasBook: boolean };

export function ConsultForm({
  bookId,
  bookTitle,
  stores,
  defaultStoreId,
}: {
  bookId: string | null;
  bookTitle: string | null;
  stores: StoreOption[];
  defaultStoreId: string | null;
}) {
  const [state, action] = useActionState(createThread, undefined);
  const withBook = stores.filter((s) => s.hasBook);
  const without = stores.filter((s) => !s.hasBook);

  return (
    <form action={action} className="space-y-6">
      {bookId && <input type="hidden" name="book_id" value={bookId} />}
      <div>
        <label htmlFor="store_id" className="mb-2 block text-sm font-medium">相談する書店</label>
        <select id="store_id" name="store_id" required defaultValue={defaultStoreId ?? ""} className="field">
          <option value="" disabled>選択してください</option>
          {withBook.length > 0 && (
            <optgroup label="この本の取扱書店">
              {withBook.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </optgroup>
          )}
          <optgroup label={withBook.length ? "そのほかの書店" : "書店"}>
            {without.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </optgroup>
        </select>
      </div>
      <div>
        <label htmlFor="subject" className="mb-2 block text-sm font-medium">件名（任意）</label>
        <input id="subject" name="subject" maxLength={80} className="field" placeholder={bookTitle ? `『${bookTitle}』について` : "例：贈り物の本を探しています"} />
      </div>
      <div>
        <label htmlFor="body" className="mb-2 block text-sm font-medium">相談内容</label>
        <textarea
          id="body"
          name="body"
          required
          minLength={5}
          maxLength={4000}
          rows={7}
          className="field"
          placeholder={bookTitle ? "例：在庫はありますか？ 似た雰囲気の本があれば教えてください。" : "例：最近こういうことを考えていて、合う本を探しています。"}
        />
      </div>
      {state?.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <SubmitButton className={btn.primary} pendingText="送信しています…">
        <Send aria-hidden className="size-4" /> 送信する
      </SubmitButton>
      <p className="text-xs text-muted">送信内容は書店の受信箱に届き、「つながり」の相談履歴からいつでも確認・返信できます。</p>
    </form>
  );
}
