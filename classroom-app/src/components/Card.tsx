import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-line)] shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </div>
  );
}

export function Pill({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "brand" | "gold" | "mint" | "rose" | "muted";
}) {
  const tones: Record<string, string> = {
    default: "bg-[var(--color-brand-soft)] text-[var(--color-brand)]",
    brand: "bg-[var(--color-brand)] text-[var(--color-brand-ink)]",
    gold: "bg-[#fef3e0] text-[#a85f00]",
    mint: "bg-[#e3f6ee] text-[var(--color-mint)]",
    rose: "bg-[#fbe9e9] text-[var(--color-rose)]",
    muted: "bg-[#eef0f5] text-[var(--color-ink-soft)]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-[var(--radius-pill)] px-3 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
