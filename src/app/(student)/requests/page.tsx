"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, Pill } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";

interface PublicRequest {
  id: string;
  item_name: string;
  reason: string;
  estimated_price: number | null;
  status: string;
  created_at: string;
}

const STATUS_LABEL: Record<string, { text: string; tone: "gold" | "mint" | "rose" | "muted" | "brand" }> = {
  received: { text: "접수", tone: "muted" },
  reviewing: { text: "검토 중", tone: "gold" },
  planned: { text: "구매 예정", tone: "brand" },
  purchased: { text: "구매 완료", tone: "mint" },
  on_hold: { text: "보류", tone: "muted" },
  rejected: { text: "반려", tone: "rose" },
};

export default function RequestsPage() {
  const [itemName, setItemName] = useState("");
  const [reason, setReason] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, { count: number; status: string }>>({});
  const [loadingStats, setLoadingStats] = useState(true);

  async function loadStats() {
    const supabase = createClient();
    const { data } = await supabase.rpc("item_requests_public");
    const grouped: Record<string, { count: number; status: string }> = {};
    ((data ?? []) as PublicRequest[]).forEach((r) => {
      if (!grouped[r.item_name]) grouped[r.item_name] = { count: 0, status: r.status };
      grouped[r.item_name].count += 1;
    });
    setStats(grouped);
    setLoadingStats(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 시 1회 데이터 로드
    void loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSubmitting(false);
      setMessage("로그인이 만료되었습니다. 다시 로그인해주세요.");
      return;
    }

    const { error } = await supabase.from("item_requests").insert({
      author_id: user.id,
      item_name: itemName,
      reason,
      estimated_price: price ? Number(price) : null,
    });

    setSubmitting(false);
    if (error) {
      setMessage("신청을 제출하지 못했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setItemName("");
    setReason("");
    setPrice("");
    setMessage("익명으로 신청이 접수되었어요. 감사합니다!");
    loadStats();
  }

  return (
    <div>
      <PageHeader title="비치물 신청" subtitle="신청자 이름은 다른 학생/관리자 화면에 공개되지 않아요" compact />

      <div className="flex flex-col gap-5 px-5 pb-6">
        <Card className="p-4">
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              필요한 물품
              <input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="예: 물티슈"
                required
                className="input"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              왜 필요한가요?
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="input"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              예상 가격 (선택)
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="원 단위"
                className="input"
              />
            </label>

            {message && <p className="text-sm font-medium text-[var(--color-brand)]">{message}</p>}

            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "제출 중..." : "익명으로 신청하기"}
            </button>
          </form>
        </Card>

        <section>
          <h2 className="mb-2 px-1 text-sm font-bold">우리 반 신청 현황</h2>
          <Card className="divide-y divide-[var(--color-line)]">
            {loadingStats && (
              <p className="px-4 py-6 text-center text-sm text-[var(--color-ink-soft)]">불러오는 중...</p>
            )}
            {!loadingStats && Object.keys(stats).length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-[var(--color-ink-soft)]">
                아직 신청된 물품이 없어요.
              </p>
            )}
            {Object.entries(stats).map(([name, { count, status }]) => (
              <div key={name} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-xs text-[var(--color-ink-soft)]">요청 {count}회</p>
                </div>
                <Pill tone={STATUS_LABEL[status]?.tone ?? "muted"}>{STATUS_LABEL[status]?.text ?? status}</Pill>
              </div>
            ))}
          </Card>
        </section>
      </div>
    </div>
  );
}
