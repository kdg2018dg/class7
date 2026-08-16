import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getWeeklyRankings } from "@/lib/queries";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return "\uFEFF" + lines.join("\n"); // BOM 포함 (엑셀 한글 깨짐 방지)
}

export async function GET(request: Request) {
  // 서버 측에서 다시 한번 관리자 권한을 확인한다 — API 라우트도 URL만으로 접근 가능하므로 필수.
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const supabase = await createClient();

  let csv = "";
  let filename = "export.csv";

  if (type === "study-sessions") {
    const { data } = await supabase
      .from("study_sessions")
      .select("study_date, duration_minutes, status, memo, created_at, profiles!study_sessions_user_id_fkey(name, student_number)")
      .order("study_date", { ascending: false });

    csv = toCsv(
      (data ?? []).map((r) => {
        const row = r as unknown as {
          study_date: string;
          duration_minutes: number;
          status: string;
          memo: string | null;
          created_at: string;
          profiles: { name: string; student_number: string } | null;
        };
        return {
          학번: row.profiles?.student_number,
          이름: row.profiles?.name,
          날짜: row.study_date,
          공부시간_분: row.duration_minutes,
          상태: row.status,
          메모: row.memo,
          제출시각: row.created_at,
        };
      })
    );
    filename = "study-sessions.csv";
  } else if (type === "rankings") {
    const { rows, weekStart, weekEnd } = await getWeeklyRankings(supabase);
    csv = toCsv(
      rows.map((r) => ({
        순위: r.rank,
        이름: r.displayName,
        공부시간_분: r.totalMinutes,
        주간: `${weekStart}~${weekEnd}`,
      }))
    );
    filename = "rankings.csv";
  } else if (type === "item-requests") {
    const { data } = await supabase
      .from("item_requests")
      .select("*")
      .order("created_at", { ascending: false });

    csv = toCsv(
      (data ?? []).map((r) => ({
        물품명: r.item_name,
        이유: r.reason,
        예상가격: r.estimated_price,
        상태: r.status,
        신청일: r.created_at,
      }))
    );
    filename = "item-requests.csv";
  } else {
    return NextResponse.json({ error: "지원하지 않는 type 입니다." }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
