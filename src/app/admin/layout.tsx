import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Logo7 } from "@/components/Logo7";
import { LogoutButton } from "@/components/LogoutButton";

const NAV = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/study-sessions", label: "공부 인증" },
  { href: "/admin/calendar", label: "캘린더" },
  { href: "/admin/announcements", label: "공지사항" },
  { href: "/admin/requests", label: "물품 신청" },
  { href: "/admin/students", label: "학생 관리" },
  { href: "/admin/settings", label: "설정" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-1 border-b border-[var(--color-line)] bg-[var(--color-surface)] p-4 md:w-56 md:border-b-0 md:border-r">
        <div className="mb-3 flex items-center gap-2 px-1">
          <Logo7 size={18} />
          <div>
            <p className="text-sm font-bold">관리자</p>
            <p className="text-xs text-[var(--color-ink-soft)]">{profile.name}</p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-3 hidden md:block">
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 bg-[var(--color-canvas)] p-5">{children}</main>
    </div>
  );
}
