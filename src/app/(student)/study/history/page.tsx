import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSignedImageUrl } from "@/lib/storage";
import { formatMinutes, formatDateKorean } from "@/lib/time";
import { Card, Pill } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import type { StudySession } from "@/lib/database.types";

const STATUS_LABEL: Record<string, { text: string; tone: "gold" | "mint" | "rose" }> = {
  pending: { text: "승인 대기", tone: "gold" },
  approved: { text: "승인됨", tone: "mint" },
  rejected: { text: "반려됨", tone: "rose" },
};

export default async function StudyHistoryPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data } = (await supabase
    .from("study_sessions")
    .select("*")
    .eq("user_id", profile.id)
    .order("study_date", { ascending: false })
    .order("created_at", { ascending: false })) as { data: StudySession[] | null };

  const sessions = data ?? [];
  const withUrls = await Promise.all(
    sessions.map(async (s) => ({ ...s, imageUrl: await getSignedImageUrl(supabase, s.image_path) }))
  );

  return (
    <div>
      <PageHeader title="내 인증 기록" compact />
      <div className="flex flex-col gap-3 px-5 pb-6">
        {withUrls.length === 0 && (
          <Card className="p-6 text-center text-sm text-[var(--color-ink-soft)]">
            아직 제출한 인증이 없어요. 첫 공부시간을 인증해보세요!
          </Card>
        )}
        {withUrls.map((s) => (
          <Card key={s.id} className="flex gap-3 p-3">
            {s.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.imageUrl} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">{formatDateKorean(s.study_date)}</p>
                <Pill tone={STATUS_LABEL[s.status].tone}>{STATUS_LABEL[s.status].text}</Pill>
              </div>
              <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">{formatMinutes(s.duration_minutes)}</p>
              {s.memo && <p className="mt-0.5 truncate text-xs text-[var(--color-ink-soft)]">{s.memo}</p>}
              {s.status === "rejected" && s.rejection_reason && (
                <p className="mt-1 text-xs font-medium text-[var(--color-rose)]">사유: {s.rejection_reason}</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
