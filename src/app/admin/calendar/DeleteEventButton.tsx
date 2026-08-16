"use client";

import { useTransition } from "react";
import { deleteEvent } from "./actions";

export function DeleteEventButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirm("이 일정을 삭제할까요?")) startTransition(async () => { await deleteEvent(id); });
      }}
      className="btn-ghost !min-h-9 shrink-0 px-3 text-xs text-[var(--color-rose)]"
    >
      삭제
    </button>
  );
}
