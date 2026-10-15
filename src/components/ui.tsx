import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export const btn = {
  primary:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-paper transition hover:bg-ink/85 active:scale-[0.98] disabled:opacity-40",
  accent:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-accent-ink transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40",
  secondary:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-rule bg-raised px-5 py-2.5 text-sm font-bold text-ink transition hover:border-ink active:scale-[0.98] disabled:opacity-40",
  ghost:
    "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-ink-soft transition hover:bg-ink/5 hover:text-ink disabled:opacity-40",
  danger:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-danger/40 px-4 py-2 text-sm font-bold text-danger transition hover:bg-danger hover:text-paper",
};

export function PageHeader({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: ReactNode }) {
  return (
    <header className="pb-6 pt-10 md:pb-10 md:pt-14">
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h1 className="font-display text-3xl font-black leading-tight tracking-tight md:text-5xl">{title}</h1>
      {lead && <div className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft md:text-base">{lead}</div>}
    </header>
  );
}

export function Section({
  eyebrow,
  title,
  icon: Icon,
  action,
  children,
}: {
  eyebrow?: string;
  title: string;
  icon?: LucideIcon;
  action?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <section className="py-8 md:py-12">
      <div className="mb-5 flex items-end justify-between gap-4 border-b border-rule pb-3 md:mb-6">
        <div>
          {eyebrow && (
            <p className="eyebrow mb-1.5 flex items-center gap-1.5">
              {Icon && <Icon aria-hidden className="size-3.5 text-accent" strokeWidth={2.25} />}
              {eyebrow}
            </p>
          )}
          <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">{title}</h2>
        </div>
        {action && (
          <Link href={action.href} className="group flex shrink-0 items-center gap-1 font-latin text-sm font-semibold text-ink-soft hover:text-ink">
            {action.label}
            <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function Empty({ icon: Icon, title, children }: { icon?: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-dashed border-rule px-4 py-5 md:px-5">
      {Icon && <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-muted" strokeWidth={1.75} />}
      <div>
        <p className="text-sm font-bold">{title}</p>
        {children && <div className="mt-1 text-sm text-muted">{children}</div>}
      </div>
    </div>
  );
}

export function Tag({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "accent" | "leaf" }) {
  const styles = {
    accent: "border-accent/40 text-accent",
    leaf: "border-rule bg-paper text-ink-soft",
    plain: "border-rule text-muted",
  };
  return <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-5 ${styles[tone]}`}>{children}</span>;
}

export function Reasons({ items, label = "推薦理由" }: { items: string[]; label?: string }) {
  if (!items.length) return null;
  return (
    <div className="border-l-2 border-accent pl-4">
      <p className="eyebrow mb-1.5 !text-accent">{label}</p>
      <ul className="space-y-1 text-sm leading-relaxed text-ink-soft">
        {items.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </div>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-leaf/30 bg-leaf-wash px-4 py-3 text-sm font-medium text-leaf">{children}</p>;
}

export function formatDate(iso: string, withTime = false) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "long",
    day: "numeric",
    weekday: withTime ? undefined : "short",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(d);
}

export function todayInTokyo() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date());
}
