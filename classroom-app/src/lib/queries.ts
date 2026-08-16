import type { SupabaseClient } from "@supabase/supabase-js";
import { getWeekRange, getPreviousWeekRange } from "@/lib/time";
import { displayNameFor } from "@/lib/display-name";
import type { DisplayNameMode } from "@/lib/database.types";

export interface RankingRow {
  user_id: string;
  displayName: string;
  totalMinutes: number;
  rank: number;
}

export async function getWeeklyRankings(
  supabase: SupabaseClient,
  referenceDate?: string
): Promise<{ rows: RankingRow[]; classTotal: number; weekStart: string; weekEnd: string }> {
  const { start, end } = getWeekRange(referenceDate);

  const { data, error } = await supabase.rpc("weekly_rankings", {
    week_start: start,
    week_end: end,
  });

  if (error || !data) return { rows: [], classTotal: 0, weekStart: start, weekEnd: end };

  const rows: RankingRow[] = data.map(
    (r: {
      user_id: string;
      name: string;
      student_number: string;
      display_name_mode: DisplayNameMode;
      nickname: string | null;
      total_minutes: number;
    }, i: number) => ({
      user_id: r.user_id,
      displayName: displayNameFor(
        { name: r.name, student_number: r.student_number, nickname: r.nickname },
        r.display_name_mode
      ),
      totalMinutes: Number(r.total_minutes),
      rank: i + 1,
    })
  );

  const classTotal = rows.reduce((sum, r) => sum + r.totalMinutes, 0);
  return { rows, classTotal, weekStart: start, weekEnd: end };
}

export async function getPreviousWeekClassTotal(
  supabase: SupabaseClient,
  referenceDate?: string
): Promise<number> {
  const { start, end } = getPreviousWeekRange(referenceDate);
  const { data } = await supabase.rpc("weekly_rankings", { week_start: start, week_end: end });
  if (!data) return 0;
  return data.reduce((sum: number, r: { total_minutes: number }) => sum + Number(r.total_minutes), 0);
}
