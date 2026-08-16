import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getWeeklyRankings } from "@/lib/queries";
import { formatMinutes } from "@/lib/time";
import { Card, Pill } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";

const MEDAL = ["🥇", "🥈", "🥉"];

export default async function RankingsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { rows, classTotal, weekStart, weekEnd } = await getWeeklyRankings(supabase);

  return (
    <div>
      <PageHeader title="이번 주 공부시간 TOP" subtitle={`${weekStart} ~ ${weekEnd}`} compact />

      <div className="px-5 pb-6">
        <Card className="mb-4 p-4">
          <p className="text-xs font-medium text-[var(--color-ink-soft)]">이번 주 우리 반 총 공부시간</p>
          <p className="stat-figure mt-1 text-2xl font-extrabold">{formatMinutes(classTotal)}</p>
        </Card>

        <Card className="divide-y divide-[var(--color-line)]">
          {rows.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-[var(--color-ink-soft)]">
              아직 승인된 공부시간이 없어요.
            </p>
          )}
          {rows.map((r) => {
            const isMe = r.user_id === profile.id;
            return (
              <div
                key={r.user_id}
                className="flex items-center gap-3 px-4 py-3"
                style={isMe ? { background: "var(--color-brand-soft)" } : undefined}
              >
                <span className="w-7 text-center text-sm font-bold text-[var(--color-ink-soft)]">
                  {r.rank <= 3 ? MEDAL[r.rank - 1] : r.rank}
                </span>
                <p className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {r.displayName}
                  {isMe && <Pill tone="brand">나</Pill>}
                </p>
                <p className="stat-figure text-sm font-bold">{formatMinutes(r.totalMinutes)}</p>
              </div>
            );
          })}
        </Card>

        <p className="mt-4 px-1 text-center text-xs text-[var(--color-ink-soft)]">
          승인된 공부시간만 랭킹에 반영돼요. 우리 함께 성장해요 :)
        </p>
      </div>
    </div>
  );
}
