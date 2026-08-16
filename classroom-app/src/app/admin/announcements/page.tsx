import { createClient } from "@/lib/supabase/server";
import { Card, Pill } from "@/components/Card";
import type { Announcement } from "@/lib/database.types";
import { NewAnnouncementForm } from "./NewAnnouncementForm";
import { DeleteAnnouncementButton } from "./DeleteAnnouncementButton";

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient();
  const { data } = (await supabase
    .from("announcements")
    .select("*")
    .order("published_at", { ascending: false })) as { data: Announcement[] | null };

  const announcements = data ?? [];

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold">공지사항 관리</h1>
      <div className="grid gap-4 md:grid-cols-[320px_1fr]">
        <Card className="p-4">
          <p className="mb-3 text-sm font-bold">공지 작성</p>
          <NewAnnouncementForm />
        </Card>

        <div className="flex flex-col gap-2">
          {announcements.length === 0 && (
            <Card className="p-8 text-center text-sm text-[var(--color-ink-soft)]">
              등록된 공지사항이 없어요.
            </Card>
          )}
          {announcements.map((a) => (
            <Card key={a.id} className="flex items-start justify-between gap-3 p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {a.is_important && <Pill tone="rose">중요</Pill>}
                  <p className="truncate text-sm font-semibold">{a.title}</p>
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-[var(--color-ink-soft)]">{a.content}</p>
              </div>
              <DeleteAnnouncementButton id={a.id} />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
