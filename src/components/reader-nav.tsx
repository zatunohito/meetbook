"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, House, Library, Waypoints, UserRound } from "lucide-react";

const ITEMS = [
  { href: "/home", label: "ホーム", icon: House },
  { href: "/meet", label: "MEET", icon: Compass },
  { href: "/stores", label: "本屋", icon: Library },
  { href: "/connections", label: "つながり", icon: Waypoints },
  { href: "/profile", label: "プロフィール", icon: UserRound },
];

function useActive() {
  const path = usePathname();
  return (href: string) => path === href || path.startsWith(`${href}/`);
}

/** PC・タブレット：ヘッダー内のナビ */
export function ReaderNav({ unread }: { unread: number }) {
  const active = useActive();
  return (
      <nav aria-label="メイン" className="hidden md:block">
        <ul className="flex gap-1 text-sm">
          {ITEMS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={active(href) ? "page" : undefined}
                className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-bold transition ${
                  active(href) ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
                }`}
              >
                <Icon aria-hidden className="size-4" strokeWidth={2} />
                {label}
                {href === "/connections" && unread > 0 && <Badge n={unread} />}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
  );
}

/**
 * モバイル：画面下部のタブバー。
 * backdrop-filter を持つヘッダーの中に置くと fixed の基準がヘッダーになるため、ヘッダーの外に置くこと。
 */
export function ReaderTabBar({ unread }: { unread: number }) {
  const active = useActive();
  return (
      <nav
        aria-label="メイン"
        className="fixed inset-x-3 bottom-3 z-20 mb-[env(safe-area-inset-bottom)] rounded-2xl bg-[#111]/95 text-white shadow-[0_12px_40px_rgb(0_0_0/0.35)] ring-1 ring-white/10 backdrop-blur md:hidden"
      >
        <ul className="grid grid-cols-5">
          {ITEMS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={active(href) ? "page" : undefined}
                className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold ${active(href) ? "text-white" : "text-white/50"}`}
              >
                <span className={`flex h-7 w-12 items-center justify-center rounded-full transition ${active(href) ? "bg-white/15 text-[#ff7a45]" : ""}`}>
                  <Icon aria-hidden className="size-5" strokeWidth={active(href) ? 2.25 : 1.75} />
                </span>
                {label}
                {href === "/connections" && unread > 0 && <Badge n={unread} floating />}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
  );
}

function Badge({ n, floating }: { n: number; floating?: boolean }) {
  return (
    <span
      aria-label={`未読${n}件`}
      className={`inline-flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] leading-4 text-accent-ink ${floating ? "absolute left-1/2 top-1 ml-2" : "ml-0.5"}`}
    >
      {n}
    </span>
  );
}
