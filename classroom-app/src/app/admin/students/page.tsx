import { createClient } from "@/lib/supabase/server";
import { Card, Pill } from "@/components/Card";
import type { Profile, RosterEntry } from "@/lib/database.types";
import { NewRosterForm } from "./NewRosterForm";
import { RemoveRosterButton } from "./RemoveRosterButton";
import { RoleToggle } from "./RoleToggle";

export default async function AdminStudentsPage() {
  const supabase = await createClient();

  const [{ data: roster }, { data: profiles }] = await Promise.all([
    supabase.from("roster").select("*").order("student_number") as unknown as Promise<{
      data: RosterEntry[] | null;
    }>,
    supabase.from("profiles").select("*").order("student_number") as unknown as Promise<{
      data: Profile[] | null;
    }>,
  ]);

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold">학생 관리</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-bold">가입 명단 (roster)</p>
          <Card className="mb-3 p-4">
            <NewRosterForm />
          </Card>
          <Card className="divide-y divide-[var(--color-line)]">
            {(roster ?? []).map((r) => (
              <div key={r.student_number} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="text-sm font-semibold">{r.name}</p>
                  <p className="text-xs text-[var(--color-ink-soft)]">{r.student_number}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Pill tone={r.claimed ? "mint" : "muted"}>{r.claimed ? "가입완료" : "미가입"}</Pill>
                  {!r.claimed && <RemoveRosterButton studentNumber={r.student_number} />}
                </div>
              </div>
            ))}
          </Card>
        </div>

        <div>
          <p className="mb-2 text-sm font-bold">가입된 계정</p>
          <Card className="divide-y divide-[var(--color-line)]">
            {(profiles ?? []).length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-[var(--color-ink-soft)]">아직 가입한 계정이 없어요.</p>
            )}
            {(profiles ?? []).map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-[var(--color-ink-soft)]">{p.student_number}</p>
                </div>
                <RoleToggle profileId={p.id} role={p.role} />
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
