import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/Card";
import { DisplayModeForm } from "./DisplayModeForm";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: sample } = await supabase.from("profiles").select("display_name_mode").eq("role", "student").limit(1);
  const currentMode = sample?.[0]?.display_name_mode ?? "realname";

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold">시스템 설정</h1>

      <div className="flex flex-col gap-4 md:max-w-md">
        <Card className="p-4">
          <p className="mb-1 text-sm font-bold">랭킹 이름 공개 방식</p>
          <p className="mb-3 text-xs text-[var(--color-ink-soft)]">
            전체 학생에게 일괄 적용됩니다.
          </p>
          <DisplayModeForm currentMode={currentMode} />
        </Card>

        <Card className="p-4">
          <p className="mb-3 text-sm font-bold">데이터 내보내기 (CSV)</p>
          <div className="flex flex-col gap-2">
            <a href="/api/admin/export?type=study-sessions" className="btn-ghost text-center text-sm">
              공부시간 데이터
            </a>
            <a href="/api/admin/export?type=rankings" className="btn-ghost text-center text-sm">
              학생별 주간 순위
            </a>
            <a href="/api/admin/export?type=item-requests" className="btn-ghost text-center text-sm">
              물품 신청 데이터
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
