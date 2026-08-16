"use client";

import { useState, useTransition } from "react";
import { approveSession, rejectSession, editSessionDuration } from "./actions";

export function SessionActions({
  sessionId,
  status,
  durationMinutes,
}: {
  sessionId: string;
  status: string;
  durationMinutes: number;
}) {
  const [pending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState(String(durationMinutes));

  return (
    <div className="flex shrink-0 flex-col gap-2 md:w-32">
      {status !== "approved" && (
        <button
          disabled={pending}
          onClick={() => startTransition(async () => { await approveSession(sessionId); })}
          className="btn-primary !min-h-9 text-sm"
        >
          승인
        </button>
      )}
      {status !== "rejected" && (
        <button
          disabled={pending}
          onClick={() => setShowReject((v) => !v)}
          className="btn-ghost !min-h-9 text-sm text-[var(--color-rose)]"
        >
          반려
        </button>
      )}
      <button
        disabled={pending}
        onClick={() => setShowEdit((v) => !v)}
        className="btn-ghost !min-h-9 text-sm"
      >
        수정
      </button>

      {showReject && (
        <div className="flex flex-col gap-1.5">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="반려 사유 입력"
            className="input !min-h-9 !py-0 text-xs"
          />
          <button
            disabled={pending || !reason}
            onClick={() =>
              startTransition(async () => {
                await rejectSession(sessionId, reason);
                setShowReject(false);
              })
            }
            className="btn-ghost !min-h-8 text-xs text-[var(--color-rose)]"
          >
            반려 확정
          </button>
        </div>
      )}

      {showEdit && (
        <div className="flex flex-col gap-1.5">
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="input !min-h-9 !py-0 text-xs"
          />
          <button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await editSessionDuration(sessionId, Number(duration));
                setShowEdit(false);
              })
            }
            className="btn-ghost !min-h-8 text-xs"
          >
            분(min) 저장
          </button>
        </div>
      )}
    </div>
  );
}
