import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { Card, Pill } from "@/components/Card";
import { formatDateKorean, todayKST } from "@/lib/time";
import type { CalendarEvent } from "@/lib/database.types";

const CATEGORY_LABEL: Record<string, string> = {
  exam: "시험",
  assessment: "수행평가",
  homework: "숙제",
  supplies: "준비물",
  mock_exam: "모의고사",
  school_event: "학교 행사",
  other: "기타",
};

function monthRange(monthStr: string) {
  const [y, m] = monthStr.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const last = new Date(Date.UTC(y, m, 0));
  return {
    firstDay: first.toISOString().slice(0, 10),
    lastDay: last.toISOString().slice(0, 10),
    daysInMonth: last.getUTCDate(),
    startWeekday: first.getUTCDay(), // 0 = Sun
    y,
    m,
  };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const currentMonth = month || todayKST().slice(0, 7);
  const { firstDay, lastDay, daysInMonth, startWeekday, y, m } = monthRange(currentMonth);

  const supabase = await createClient();
  const { data } = (await supabase
    .from("calendar_events")
    .select("*")
    .gte("event_date", firstDay)
    .lte("event_date", lastDay)
    .order("event_date", { ascending: true })) as { data: CalendarEvent[] | null };

  const events = data ?? [];
  const byDate = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    if (!byDate.has(ev.event_date)) byDate.set(ev.event_date, []);
    byDate.get(ev.event_date)!.push(ev);
  }

  const prevMonth = shiftMonth(currentMonth, -1);
  const nextMonth = shiftMonth(currentMonth, 1);
  const today = todayKST();

  return (
    <div>
      <PageHeader title="학급 캘린더" compact />

      <div className="px-5 pb-6">
        {/* 월 이동 */}
        <div className="mb-3 flex items-center justify-between">
          <Link href={`/calendar?month=${prevMonth}`} className="btn-ghost px-4">‹ 이전</Link>
          <p className="text-sm font-bold">{y}년 {m}월</p>
          <Link href={`/calendar?month=${nextMonth}`} className="btn-ghost px-4">다음 ›</Link>
        </div>

        {/* PC: 월간 그리드 */}
        <Card className="mb-5 hidden overflow-hidden p-3 md:block">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[var(--color-ink-soft)]">
            {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startWeekday }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dateStr = `${currentMonth}-${String(i + 1).padStart(2, "0")}`;
              const dayEvents = byDate.get(dateStr) ?? [];
              const isToday = dateStr === today;
              return (
                <div
                  key={dateStr}
                  className="min-h-20 rounded-lg border border-[var(--color-line)] p-1.5"
                  style={isToday ? { borderColor: "var(--color-brand)", borderWidth: 2 } : undefined}
                >
                  <p className="text-xs font-semibold">{i + 1}</p>
                  <div className="mt-1 flex flex-col gap-0.5">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <span
                        key={ev.id}
                        className="truncate rounded px-1 py-0.5 text-[10px] font-medium"
                        style={{
                          background: ev.priority === "high" ? "#fbe9e9" : "var(--color-brand-soft)",
                          color: ev.priority === "high" ? "var(--color-rose)" : "var(--color-brand)",
                        }}
                      >
                        {ev.title}
                      </span>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[10px] text-[var(--color-ink-soft)]">+{dayEvents.length - 2}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 모바일: 날짜별 리스트 */}
        <div className="flex flex-col gap-3 md:hidden">
          {[...byDate.entries()].length === 0 && (
            <Card className="p-6 text-center text-sm text-[var(--color-ink-soft)]">
              이번 달 등록된 일정이 없어요.
            </Card>
          )}
          {[...byDate.entries()].map(([date, dayEvents]) => (
            <Card key={date} className="p-4">
              <p className="mb-2 text-sm font-bold">{formatDateKorean(date)}</p>
              <ul className="flex flex-col gap-2">
                {dayEvents.map((ev) => (
                  <li key={ev.id} className="flex items-start gap-2">
                    <Pill tone={ev.priority === "high" ? "rose" : "muted"}>
                      {CATEGORY_LABEL[ev.category] ?? ev.category}
                    </Pill>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{ev.title}</p>
                      {ev.description && (
                        <p className="text-xs text-[var(--color-ink-soft)]">{ev.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        {/* PC: 이달 일정 목록도 함께 (월간 그리드 아래) */}
        <div className="mt-5 hidden flex-col gap-2 md:flex">
          {[...byDate.entries()].map(([date, dayEvents]) => (
            <Card key={date} className="p-3">
              <p className="mb-1 text-xs font-bold text-[var(--color-ink-soft)]">{formatDateKorean(date)}</p>
              <div className="flex flex-wrap gap-2">
                {dayEvents.map((ev) => (
                  <span key={ev.id} className="text-sm font-medium">
                    {ev.title}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function shiftMonth(monthStr: string, delta: number) {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
