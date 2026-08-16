"use client";

import { useTransition } from "react";
import { removeRosterEntry } from "./actions";

export function RemoveRosterButton({ studentNumber }: { studentNumber: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await removeRosterEntry(studentNumber); })}
      className="text-xs font-semibold text-[var(--color-ink-soft)]"
    >
      삭제
    </button>
  );
}
