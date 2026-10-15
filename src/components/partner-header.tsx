"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions/session";
import { Logo } from "./logo";

export function PartnerHeader({ label, name, home, links }: { label: string; name: string; home: string; links: { href: string; label: string }[] }) {
  const path = usePathname();
  const active = (href: string) => (href === home ? path === href || path.startsWith(`${home}/threads`) : path.startsWith(href));
  return (
    <header className="sticky top-0 z-20 border-b border-rule bg-paper/85 backdrop-blur">
      <div className="mx-auto w-full max-w-5xl px-4 md:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Logo href={home} />
            <span className="hidden truncate rounded-full border border-rule px-3 py-1 text-xs font-bold text-ink-soft sm:inline">
              {label}：{name}
            </span>
          </div>
          <form action={signOut}>
            <button type="submit" className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-muted hover:bg-raised hover:text-ink">
              <LogOut aria-hidden className="size-4" /> 切り替え
            </button>
          </form>
        </div>
        <p className="truncate pb-2 text-xs font-bold text-ink-soft sm:hidden">
          {label}：{name}
        </p>
        <nav aria-label={`${label}メニュー`} className="shelf -mx-4 flex gap-2 overflow-x-auto px-4 pb-3 md:mx-0 md:px-0">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active(l.href) ? "page" : undefined}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                active(l.href) ? "bg-ink text-paper" : "text-ink-soft hover:bg-ink/5 hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
