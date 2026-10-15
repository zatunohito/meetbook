"use client";

import { useActionState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { postMessage } from "@/app/actions/consult";
import type { ThreadStatus } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/status";
import { SubmitButton } from "./submit-button";
import { btn } from "./ui";

export function StatusBadge({ status }: { status: ThreadStatus }) {
  const tone =
    status === "open" ? "bg-accent-wash text-accent" : status === "in_progress" ? "bg-sun/25 text-ink" : "bg-leaf-wash text-leaf";
  return <span className={`inline-block shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${tone}`}>{STATUS_LABEL[status]}</span>;
}

type Msg = { message_id: string; body: string; sender_role: "reader" | "store"; created_at: string };

const fmt = (iso: string) =>
  new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

export function Conversation({
  threadId,
  messages,
  viewer,
  storeName,
}: {
  threadId: string;
  messages: Msg[];
  viewer: "reader" | "store";
  storeName: string;
}) {
  const [state, action] = useActionState(postMessage.bind(null, threadId), undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state && !state.error) formRef.current?.reset();
  }, [state]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <div>
      <ol className="space-y-5" aria-label="メッセージ">
        {messages.map((m) => {
          const mine = m.sender_role === viewer;
          const who = m.sender_role === "store" ? storeName : viewer === "reader" ? "あなた" : "読者";
          return (
            <li key={m.message_id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] md:max-w-[70%] ${mine ? "text-right" : ""}`}>
                <p className="mb-1 text-xs text-muted">
                  {who} ・ {fmt(m.created_at)}
                </p>
                <p
                  className={`whitespace-pre-line px-4 py-3 text-left text-sm leading-relaxed ${
                    mine ? "rounded-2xl rounded-br-md bg-accent text-accent-ink" : "rounded-2xl rounded-bl-md bg-raised shadow-card"
                  }`}
                >
                  {m.body}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      <div ref={endRef} />
      <form ref={formRef} action={action} className="mt-8 space-y-3 rounded-2xl bg-raised p-4 shadow-card">
        <label htmlFor="reply" className="text-sm font-medium">
          {viewer === "store" ? "返信を入力" : "メッセージを送る"}
        </label>
        <textarea id="reply" name="body" required maxLength={4000} rows={4} className="field" />
        {state?.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
        <SubmitButton className={btn.primary} pendingText="送信しています…">
          <Send aria-hidden className="size-4" /> 送信
        </SubmitButton>
      </form>
    </div>
  );
}
