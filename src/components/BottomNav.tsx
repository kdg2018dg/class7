"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "홈", icon: HomeIcon },
  { href: "/study", label: "공부", icon: BookIcon },
  { href: "/calendar", label: "일정", icon: CalendarIcon },
  { href: "/rankings", label: "순위", icon: TrophyIcon },
  { href: "/more", label: "더보기", icon: MoreIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-line)] bg-[var(--color-surface)]/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="주요 메뉴"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
                style={{ color: active ? "var(--color-brand)" : "var(--color-ink-soft)" }}
              >
                <Icon active={active} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 11.5 12 4l8 7.5" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10v9h12v-9" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function BookIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinejoin="round" />
      <path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 0 0 1.5-1.5v-13Z" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinejoin="round" />
    </svg>
  );
}
function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="5.5" width="16" height="14.5" rx="2.2" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} />
      <path d="M4 10h16M8 3.5v4M16 3.5v4" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" />
    </svg>
  );
}
function TrophyIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinejoin="round" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" />
      <path d="M12 14v3M9 20h6M10 20v-3h4v3" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function MoreIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="5" cy="12" r="1.6" fill="currentColor" opacity={active ? 1 : 0.85} />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" opacity={active ? 1 : 0.85} />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" opacity={active ? 1 : 0.85} />
    </svg>
  );
}
