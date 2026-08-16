"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { newImagePath, STUDY_PHOTOS_BUCKET } from "@/lib/storage";
import { todayKST } from "@/lib/time";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";

type Mode = "duration" | "range";

interface Entry {
  key: string;
  studyDate: string;
  mode: Mode;
  hours: string;
  minutes: string;
  startTime: string;
  endTime: string;
  memo: string;
  file: File | null;
  previewUrl: string | null;
}

function newEntry(): Entry {
  return {
    key: crypto.randomUUID(),
    studyDate: todayKST(),
    mode: "duration",
    hours: "",
    minutes: "",
    startTime: "",
    endTime: "",
    memo: "",
    file: null,
    previewUrl: null,
  };
}

function computeDuration(entry: Entry): number | null {
  if (entry.mode === "duration") {
    const h = Number(entry.hours || 0);
    const m = Number(entry.minutes || 0);
    const total = h * 60 + m;
    return total > 0 ? total : null;
  }
  if (!entry.startTime || !entry.endTime) return null;
  const [sh, sm] = entry.startTime.split(":").map(Number);
  const [eh, em] = entry.endTime.split(":").map(Number);
  const total = eh * 60 + em - (sh * 60 + sm);
  return total > 0 ? total : null;
}

export default function StudySubmitPage() {
  const [entries, setEntries] = useState<Entry[]>([newEntry()]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function updateEntry(key: string, patch: Partial<Entry>) {
    setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, ...patch } : e)));
  }

  function addEntry() {
    setEntries((prev) => [...prev, newEntry()]);
  }

  function removeEntry(key: string) {
    setEntries((prev) => (prev.length > 1 ? prev.filter((e) => e.key !== key) : prev));
  }

  function onFileChange(key: string, file: File | null) {
    updateEntry(key, {
      file,
      previewUrl: file ? URL.createObjectURL(file) : null,
    });
  }

  async function onSubmit() {
    setResult(null);

    for (const entry of entries) {
      if (!entry.file) {
        setResult({ type: "error", text: "모든 인증에 사진을 첨부해주세요." });
        return;
      }
      if (computeDuration(entry) === null) {
        setResult({ type: "error", text: "공부시간을 확인해주세요 (0분 이하이거나 값이 비어있어요)." });
        return;
      }
    }

    setSubmitting(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSubmitting(false);
      setResult({ type: "error", text: "로그인이 만료되었습니다. 다시 로그인해주세요." });
      return;
    }

    let successCount = 0;
    for (const entry of entries) {
      const duration = computeDuration(entry)!;
      const path = newImagePath(user.id, entry.file!.name);

      const { error: uploadError } = await supabase.storage
        .from(STUDY_PHOTOS_BUCKET)
        .upload(path, entry.file!, { contentType: entry.file!.type });

      if (uploadError) continue;

      const { error: insertError } = await supabase.from("study_sessions").insert({
        user_id: user.id,
        study_date: entry.studyDate,
        start_time: entry.mode === "range" ? entry.startTime : null,
        end_time: entry.mode === "range" ? entry.endTime : null,
        duration_minutes: duration,
        memo: entry.memo || null,
        image_path: path,
        status: "pending",
      });

      if (!insertError) successCount++;
    }

    setSubmitting(false);

    if (successCount === entries.length) {
      setResult({ type: "success", text: `인증 ${successCount}건을 제출했어요. 관리자 승인 후 반영됩니다.` });
      setEntries([newEntry()]);
    } else if (successCount > 0) {
      setResult({ type: "error", text: `${successCount}건만 제출되었어요. 나머지는 잠시 후 다시 시도해주세요.` });
    } else {
      setResult({ type: "error", text: "인증을 제출하지 못했습니다. 잠시 후 다시 시도해주세요." });
    }
  }

  return (
    <div>
      <PageHeader title="공부시간 인증" subtitle="사진과 함께 제출하면 관리자 승인 후 반영돼요" compact />

      <div className="flex flex-col gap-4 px-5 pb-6">
        {entries.map((entry, idx) => (
          <Card key={entry.key} className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold">인증 {idx + 1}</p>
              {entries.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEntry(entry.key)}
                  className="text-xs font-semibold text-[var(--color-ink-soft)]"
                >
                  삭제
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                공부 날짜
                <input
                  type="date"
                  value={entry.studyDate}
                  max={todayKST()}
                  onChange={(e) => updateEntry(entry.key, { studyDate: e.target.value })}
                  className="input"
                />
              </label>

              <div className="flex gap-2">
                <ModeButton
                  active={entry.mode === "duration"}
                  onClick={() => updateEntry(entry.key, { mode: "duration" })}
                >
                  시간 직접 입력
                </ModeButton>
                <ModeButton
                  active={entry.mode === "range"}
                  onClick={() => updateEntry(entry.key, { mode: "range" })}
                >
                  시작~종료 시간
                </ModeButton>
              </div>

              {entry.mode === "duration" ? (
                <div className="flex gap-2">
                  <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium">
                    시간
                    <input
                      type="number"
                      min={0}
                      max={24}
                      inputMode="numeric"
                      value={entry.hours}
                      onChange={(e) => updateEntry(entry.key, { hours: e.target.value })}
                      placeholder="0"
                      className="input"
                    />
                  </label>
                  <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium">
                    분
                    <input
                      type="number"
                      min={0}
                      max={59}
                      inputMode="numeric"
                      value={entry.minutes}
                      onChange={(e) => updateEntry(entry.key, { minutes: e.target.value })}
                      placeholder="0"
                      className="input"
                    />
                  </label>
                </div>
              ) : (
                <div className="flex gap-2">
                  <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium">
                    시작
                    <input
                      type="time"
                      value={entry.startTime}
                      onChange={(e) => updateEntry(entry.key, { startTime: e.target.value })}
                      className="input"
                    />
                  </label>
                  <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium">
                    종료
                    <input
                      type="time"
                      value={entry.endTime}
                      onChange={(e) => updateEntry(entry.key, { endTime: e.target.value })}
                      className="input"
                    />
                  </label>
                </div>
              )}

              <label className="flex flex-col gap-1.5 text-sm font-medium">
                인증 사진 (열품타, 플래너, 독서실 기록 등)
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => onFileChange(entry.key, e.target.files?.[0] ?? null)}
                  className="text-sm"
                />
              </label>
              {entry.previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={entry.previewUrl}
                  alt="인증 사진 미리보기"
                  className="h-40 w-full rounded-2xl object-cover"
                />
              )}

              <label className="flex flex-col gap-1.5 text-sm font-medium">
                메모 (선택)
                <input
                  value={entry.memo}
                  onChange={(e) => updateEntry(entry.key, { memo: e.target.value })}
                  placeholder="예: 수학 오답노트 정리"
                  className="input"
                />
              </label>
            </div>
          </Card>
        ))}

        <button type="button" onClick={addEntry} className="btn-ghost">
          + 인증 추가하기 (몰아서 제출)
        </button>

        {result && (
          <p
            className="text-sm font-semibold"
            style={{ color: result.type === "success" ? "var(--color-mint)" : "var(--color-rose)" }}
          >
            {result.text}
          </p>
        )}

        <button type="button" disabled={submitting} onClick={onSubmit} className="btn-primary">
          {submitting ? "제출 중..." : `인증 ${entries.length}건 제출하기`}
        </button>

        <Link href="/study/history" className="text-center text-sm font-semibold text-[var(--color-brand)]">
          내 인증 기록 보기
        </Link>
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
      style={{
        background: active ? "var(--color-brand)" : "var(--color-brand-soft)",
        color: active ? "var(--color-brand-ink)" : "var(--color-brand)",
      }}
    >
      {children}
    </button>
  );
}
