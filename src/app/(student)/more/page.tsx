import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { LogoutButton } from "@/components/LogoutButton";

export default async function MorePage() {
  const profile = await requireProfile();

  return (
    <div>
      <PageHeader title="더보기" compact />
      <div className="flex flex-col gap-4 px-5 pb-6">
        <Card className="p-4">
          <p className="text-sm font-bold">{profile.name}</p>
          <p className="text-xs text-[var(--color-ink-soft)]">학번 {profile.student_number}</p>
        </Card>

        <Card className="divide-y divide-[var(--color-line)]">
          <MenuLink href="/study/history" label="내 인증 기록" />
          <MenuLink href="/requests" label="비치물 신청" />
          <MenuLink href="/announcements" label="공지사항" />
        </Card>

        <LogoutButton />
      </div>
    </div>
  );
}

function MenuLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="block px-4 py-3.5 text-sm font-medium">
      {label}
    </a>
  );
}
