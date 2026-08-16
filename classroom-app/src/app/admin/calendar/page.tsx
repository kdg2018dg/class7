import { createClient } from "@/lib/supabase/server";
import { formatDateKorean } from "@/lib/time";
import { Card, Pill } from "@/components/Card";
import type { CalendarEvent } from "@/lib/database.types";
import { NewEventForm } from "./NewEventForm";
import { DeleteEventButton } from "./DeleteEventButton";

const CATEGORY_LABEL: Record<string, string> = {
  exam: "시험",
  assessment: "수행평가",
  homework: "숙제",
  supplies: "준비물",
  mock_exam: "모의고사",
  school_event: "학교 행사",
  other: "기타",
};

export default async function AdminCalendarPage() {
  const supabase = await createClient();
  const { data } = (await supabase
    .from("calendar_events")
    .select("*")
    .order("event_date", { ascending: true })) as { data: CalendarEvent[] | null };

  const events = data ?? [];

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold">캘린더 관리</h1>
      <div className="grid gap-4 md:grid-cols-[320px_1fr]">
        <Card className="p-4">
          <p className="mb-3 text-sm font-bold">일정 추가</p>
          <NewEventForm />
        </Card>

        <div className="flex flex-col gap-2">
          {events.length === 0 && (
            <Card className="p-8 text-center text-sm text-[var(--color-ink-soft)]">등록된 일정이 없어요.</Card>
          )}
          {events.map((ev) => (
            <Card key={ev.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Pill tone={ev.priority === "high" ? "rose" : "muted"}>
                    {CATEGORY_LABEL[ev.category] ?? ev.category}
                  </Pill>
                  <p className="truncate text-sm font-semibold">{ev.title}</p>
                </div>
                <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">
                  {formatDateKorean(ev.event_date)}
                  {ev.subject ? ` · ${ev.subject}` : ""}
                </p>
              </div>
              <DeleteEventButton id={ev.id} />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
