import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getWeeklyRankings } from "@/lib/queries";

// GET /api/rankings?week=YYYY-MM-DD  (해당 날짜가 속한 주의 랭킹, 기본값: 이번 주)
export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const week = searchParams.get("week") ?? undefined;

  const supabase = await createClient();
  const result = await getWeeklyRankings(supabase, week);

  return NextResponse.json(result);
}
