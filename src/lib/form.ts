// FormData から値を取り出す小さなヘルパー
export const str = (f: FormData, k: string, max = 2000) => {
  const v = f.get(k);
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  return t === "" ? null : t;
};
export const strs = (f: FormData, k: string) =>
  f.getAll(k).filter((v): v is string => typeof v === "string" && v.trim() !== "").map((v) => v.trim());
export const bool = (f: FormData, k: string) => f.get(k) === "on" || f.get(k) === "true";
/** 改行・カンマ区切りのリスト */
export const list = (f: FormData, k: string) =>
  (str(f, k, 5000) ?? "")
    .split(/[\n,、]+/)
    .map((s) => s.trim())
    .filter(Boolean);
