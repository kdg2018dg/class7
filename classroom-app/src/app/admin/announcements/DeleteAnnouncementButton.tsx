"use client";

import { useTransition } from "react";
import { deleteAnnouncement } from "./actions";

export function DeleteAnnouncementButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirm("이 공지를 삭제할까요?")) startTransition(async () => { await deleteAnnouncement(id); });
      }}
      className="btn-ghost !min-h-9 shrink-0 px-3 text-xs text-[var(--color-rose)]"
    >
      삭제
    </button>
  );
}
