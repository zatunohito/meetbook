/* eslint-disable @next/next/no-img-element */
// 書影。画像が未登録の場合は書名を組んだ表紙を表示する（画像を捏造しない）。色は書名から決まる。
const PALETTE = [
  ["#1f2a37", "#f4f1ea"],
  ["#2b3a2f", "#f1efe6"],
  ["#5a1f1b", "#f6eee8"],
  ["#2a2a2a", "#f2f2f2"],
  ["#7a4a12", "#fbf3e4"],
  ["#22344a", "#eef2f7"],
  ["#ea5b25", "#ffffff"],
];

function colorFor(title: string) {
  let h = 0;
  for (const c of title) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function BookCover({
  title,
  author,
  url,
  size = "md",
}: {
  title: string;
  author?: string | null;
  url?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const w = size === "sm" ? "w-12" : size === "lg" ? "w-36 md:w-44" : "w-full";
  const radius = size === "sm" ? "rounded-md" : "rounded-lg";
  if (url) {
    return (
      <img
        src={url}
        alt={`『${title}』の書影`}
        loading="lazy"
        className={`${w} ${radius} aspect-[2/3] shrink-0 bg-raised object-cover shadow-card`}
      />
    );
  }
  const [bg, fg] = colorFor(title);
  const short = title.split(/\s[:：]\s|\s:\s/)[0];
  return (
    <div
      role="img"
      aria-label={`『${title}』（書影未登録）`}
      style={{ backgroundColor: bg, color: fg }}
      className={`${w} ${radius} relative aspect-[2/3] shrink-0 overflow-hidden p-2.5 shadow-card flex flex-col justify-between`}
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-white/15" />
      <span className={`font-display font-bold leading-snug tracking-tight ${size === "sm" ? "text-[7px]" : size === "lg" ? "text-lg" : "text-[12px]"} line-clamp-6`}>
        {short}
      </span>
      {size !== "sm" && (
        <span className="space-y-1">
          <span aria-hidden className="block h-px w-6 bg-current opacity-50" />
          {author && <span className="block text-[9px] leading-snug opacity-70 line-clamp-2">{author}</span>}
        </span>
      )}
    </div>
  );
}
