import { createClient } from "@/lib/supabase/server";
import { getSignedImageUrl } from "@/lib/storage";
import { formatMinutes, formatDateKorean } from "@/lib/time";
import { Card, Pill } from "@/components/Card";
import type { StudySession, Profile } from "@/lib/database.types";
import { SessionActions } from "./SessionActions";

type SessionWithProfile = StudySession & { profiles: Pick<Profile, "name" | "student_number"> | null };

export default async function AdminStudySessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; student?: string }>;
}) {
  const { status, student } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("study_sessions")
    .select("*, profiles!study_sessions_user_id_fkey(name, student_number)")
    .order("created_at", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status);
  if (student) query = query.ilike("profiles.name", `%${student}%`);

  const { data } = (await query) as { data: SessionWithProfile[] | null };
  const sessions = data ?? [];

  const withUrls = await Promise.all(
    sessions.map(async (s) => ({ ...s, imageUrl: await getSignedImageUrl(supabase, s.image_path) }))
  );

  // 겹치는 시간대 경고용
  const { data: overlaps } = await supabase.from("overlapping_sessions").select("session_id");
  const overlapIds = new Set((overlaps ?? []).map((o) => o.session_id));

  const pendingCount = sessions.filter((s) => s.status === "pending").length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-bold">공부 인증 관리 · 승인 대기 {pendingCount}건</h1>
        <form className="flex gap-2">
          <select name="status" defaultValue={status ?? "pending"} className="input !min-h-9 !py-0 text-sm">
            <option value="all">전체 상태</option>
            <option value="pending">승인 대기</option>
            <option value="approved">승인됨</option>
            <option value="rejected">반려됨</option>
          </select>
          <input
            name="student"
            defaultValue={student ?? ""}
            placeholder="학생 이름 검색"
            className="input !min-h-9 !py-0 text-sm"
          />
          <button className="btn-ghost !min-h-9 px-3 text-sm">검색</button>
        </form>
      </div>

      <div className="flex flex-col gap-3">
        {withUrls.length === 0 && (
          <Card className="p-8 text-center text-sm text-[var(--color-ink-soft)]">해당 조건의 인증이 없어요.</Card>
        )}
        {withUrls.map((s) => (
          <Card key={s.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-start">
            {s.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={s.imageUrl}
                alt="인증 사진"
                className="h-32 w-full shrink-0 rounded-xl object-cover md:h-24 md:w-24"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold">{s.profiles?.name ?? "알 수 없음"}</p>
                <span className="text-xs text-[var(--color-ink-soft)]">{s.profiles?.student_number}</span>
                <StatusPill status={s.status} />
                {overlapIds.has(s.id) && <Pill tone="rose">시간 중복 의심</Pill>}
              </div>
              <p className="mt-1 text-sm">
                {formatDateKorean(s.study_date)} · {formatMinutes(s.duration_minutes)}
                {s.start_time && s.end_time && ` (${s.start_time.slice(0, 5)}~${s.end_time.slice(0, 5)})`}
              </p>
              {s.memo && <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">{s.memo}</p>}
              {s.status === "rejected" && s.rejection_reason && (
                <p className="mt-1 text-xs font-medium text-[var(--color-rose)]">반려 사유: {s.rejection_reason}</p>
              )}
            </div>
            <SessionActions sessionId={s.id} status={s.status} durationMinutes={s.duration_minutes} />
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === "approved") return <Pill tone="mint">승인됨</Pill>;
  if (status === "rejected") return <Pill tone="rose">반려됨</Pill>;
  return <Pill tone="gold">승인 대기</Pill>;
}
