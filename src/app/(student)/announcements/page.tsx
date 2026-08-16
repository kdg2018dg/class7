import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { Card, Pill } from "@/components/Card";
import type { Announcement } from "@/lib/database.types";

export default async function AnnouncementsPage() {
  const supabase = await createClient();
  const { data } = (await supabase
    .from("announcements")
    .select("*")
    .order("is_important", { ascending: false })
    .order("published_at", { ascending: false })) as { data: Announcement[] | null };

  const announcements = data ?? [];

  return (
    <div>
      <PageHeader title="공지사항" compact />
      <div className="flex flex-col gap-3 px-5 pb-6">
        {announcements.length === 0 && (
          <Card className="p-6 text-center text-sm text-[var(--color-ink-soft)]">
            아직 공지사항이 없어요.
          </Card>
        )}
        {announcements.map((a) => (
          <Card key={a.id} className="p-4">
            <div className="mb-1 flex items-center gap-2">
              {a.is_important && <Pill tone="rose">중요</Pill>}
              <p className="text-sm font-bold">{a.title}</p>
            </div>
            <p className="whitespace-pre-line text-sm text-[var(--color-ink-soft)]">{a.content}</p>
            <p className="mt-2 text-[11px] text-[var(--color-ink-soft)]">
              {new Date(a.published_at).toLocaleDateString("ko-KR")}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
