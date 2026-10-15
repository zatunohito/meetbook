import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-latin text-[17px] font-bold tracking-tight" aria-label="MEET BOOK ホーム">
      <span aria-hidden className="grid size-7 place-items-center rounded-md bg-ink text-[11px] font-bold leading-none text-paper">
        MB
      </span>
      <span>
        MEET BOOK<span className="text-accent">.</span>
      </span>
    </Link>
  );
}
