import { createClient } from "@/lib/supabase/server";
import { getWeekRange, formatMinutes, todayKST } from "@/lib/time";
import { Card } from "@/components/Card";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { start, end } = getWeekRange();
  const today = todayKST();

  const [studentCount, weekSessions, weekPendingCount, upcomingEventCount, requestCount] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
      supabase
        .from("study_sessions")
        .select("duration_minutes, status")
        .gte("study_date", start)
        .lte("study_date", end),
      supabase
        .from("study_sessions")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("calendar_events")
        .select("id", { count: "exact", head: true })
        .gte("event_date", today),
      supabase.from("item_requests").select("id", { count: "exact", head: true }),
    ]);

  const weekApproved = (weekSessions.data ?? []).filter((s) => s.status === "approved");
  const totalMinutes = weekApproved.reduce((sum, s) => sum + s.duration_minutes, 0);
  const submissionCount = weekSessions.data?.length ?? 0;

  const stats = [
    { label: "학생 수", value: `${studentCount.count ?? 0}명` },
    { label: "이번 주 총 공부시간", value: formatMinutes(totalMinutes) },
    { label: "이번 주 인증 건수", value: `${submissionCount}건` },
    { label: "승인 대기 인증", value: `${weekPendingCount.count ?? 0}건`, highlight: true },
    { label: "예정된 일정", value: `${upcomingEventCount.count ?? 0}개` },
    { label: "물품 신청", value: `${requestCount.count ?? 0}건` },
  ];

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold">대시보드</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs font-medium text-[var(--color-ink-soft)]">{s.label}</p>
            <p
              className="stat-figure mt-1 text-2xl font-extrabold"
              style={s.highlight ? { color: "var(--color-brand)" } : undefined}
            >
              {s.value}
            </p>
          </Card>
        ))}
      </div>
      <p className="mt-4 text-xs text-[var(--color-ink-soft)]">
        {start} ~ {end} 기준 (Asia/Seoul)
      </p>
    </div>
  );
}
