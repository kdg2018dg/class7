import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getWeeklyRankings, getPreviousWeekClassTotal } from "@/lib/queries";
import { formatMinutes, todayKST, formatDateKorean } from "@/lib/time";
import { Card, Pill } from "@/components/Card";
import { Logo7 } from "@/components/Logo7";
import type { CalendarEvent, Announcement } from "@/lib/database.types";

const CATEGORY_LABEL: Record<string, string> = {
  exam: "시험",
  assessment: "수행평가",
  homework: "숙제",
  supplies: "준비물",
  mock_exam: "모의고사",
  school_event: "학교 행사",
  other: "기타",
};

export default async function HomePage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const today = todayKST();

  const [{ data: todayEvents }, { data: announcements }, myWeek, { rows, classTotal, weekStart, weekEnd }, prevClassTotal] =
    await Promise.all([
      supabase
        .from("calendar_events")
        .select("*")
        .eq("event_date", today)
        .order("priority", { ascending: true }) as unknown as Promise<{ data: CalendarEvent[] | null }>,
      supabase
        .from("announcements")
        .select("*")
        .order("is_important", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(3) as unknown as Promise<{ data: Announcement[] | null }>,
      getMyWeekMinutes(supabase, profile.id),
      getWeeklyRankings(supabase),
      getPreviousWeekClassTotal(supabase),
    ]);

  const myRank = rows.find((r) => r.user_id === profile.id);
  const growthPct =
    prevClassTotal > 0 ? Math.round(((classTotal - prevClassTotal) / prevClassTotal) * 100) : null;

  return (
    <div className="flex flex-col gap-4 px-5 pb-6 pt-6">
      <header className="flex items-center gap-3">
        <Logo7 size={22} />
        <div>
          <h1 className="text-lg font-bold tracking-tight">7반 학급 운영센터</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">
            {profile.name}님, 오늘도 같이 성장하는 7반 · {formatDateKorean(today)}
          </p>
        </div>
      </header>

      <Link
        href="/study"
        className="btn-primary flex items-center justify-center gap-2 text-base"
      >
        + 공부시간 인증
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-xs font-medium text-[var(--color-ink-soft)]">이번 주 내 공부시간</p>
          <p className="stat-figure mt-1 text-2xl font-extrabold">{formatMinutes(myWeek)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-[var(--color-ink-soft)]">현재 순위</p>
          <p className="stat-figure mt-1 text-2xl font-extrabold">
            {myRank ? `${myRank.rank}위` : "-"}
            <span className="text-sm font-medium text-[var(--color-ink-soft)]"> / {rows.length}명</span>
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-[var(--color-ink-soft)]">이번 주 우리 반 총 공부시간</p>
          {growthPct !== null && (
            <Pill tone={growthPct >= 0 ? "mint" : "muted"}>
              {growthPct >= 0 ? `지난주 대비 +${growthPct}%` : `지난주 대비 ${growthPct}%`}
            </Pill>
          )}
        </div>
        <p className="stat-figure mt-1 text-2xl font-extrabold">{formatMinutes(classTotal)}</p>
        <p className="mt-1 text-xs text-[var(--color-ink-soft)]">같이 성장하고 있어요.</p>
      </Card>

      <section>
        <SectionTitle title="오늘의 일정" href="/calendar" />
        <Card className="divide-y divide-[var(--color-line)]">
          {!todayEvents?.length ? (
            <EmptyRow text="오늘은 등록된 일정이 없어요." />
          ) : (
            todayEvents.map((ev) => (
              <div key={ev.id} className="flex items-center gap-3 px-4 py-3">
                <Pill tone={ev.priority === "high" ? "rose" : "muted"}>
                  {CATEGORY_LABEL[ev.category] ?? ev.category}
                </Pill>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{ev.title}</p>
                  {ev.subject && <p className="text-xs text-[var(--color-ink-soft)]">{ev.subject}</p>}
                </div>
              </div>
            ))
          )}
        </Card>
      </section>

      <section>
        <SectionTitle title="공지사항" href="/announcements" />
        <Card className="divide-y divide-[var(--color-line)]">
          {!announcements?.length ? (
            <EmptyRow text="아직 공지사항이 없어요." />
          ) : (
            announcements.map((a) => (
              <div key={a.id} className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {a.is_important && <Pill tone="rose">중요</Pill>}
                  <p className="truncate text-sm font-semibold">{a.title}</p>
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-[var(--color-ink-soft)]">{a.content}</p>
              </div>
            ))
          )}
        </Card>
      </section>

      <p className="pt-1 text-center text-[11px] text-[var(--color-ink-soft)]">
        {weekStart} ~ {weekEnd} 기준 · Asia/Seoul
      </p>
    </div>
  );
}

async function getMyWeekMinutes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { getWeekRange } = await import("@/lib/time");
  const { start, end } = getWeekRange();
  const { data } = await supabase
    .from("study_sessions")
    .select("duration_minutes")
    .eq("user_id", userId)
    .eq("status", "approved")
    .gte("study_date", start)
    .lte("study_date", end);

  return (data ?? []).reduce((sum: number, r: { duration_minutes: number }) => sum + r.duration_minutes, 0);
}

function SectionTitle({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-2 flex items-center justify-between px-1">
      <h2 className="text-sm font-bold">{title}</h2>
      <Link href={href} className="text-xs font-semibold text-[var(--color-brand)]">
        더보기
      </Link>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="px-4 py-6 text-center text-sm text-[var(--color-ink-soft)]">{text}</p>;
}
