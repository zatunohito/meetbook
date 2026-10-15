import type { ThreadStatus } from "./types";

// サーバー・クライアントの両方から使うため、"use client" のファイルではなくここに置く
export const STATUS_LABEL: Record<ThreadStatus, string> = {
  open: "未対応",
  in_progress: "対応中",
  resolved: "対応済み",
};
