import { Logo7 } from "./Logo7";

export function PageHeader({
  title,
  subtitle,
  compact = false,
}: {
  title: string;
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <header className="flex items-center gap-3 px-5 pt-6 pb-2">
      {!compact && <Logo7 size={22} />}
      <div>
        <h1 className="text-lg font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-[var(--color-ink-soft)]">{subtitle}</p>}
      </div>
    </header>
  );
}
