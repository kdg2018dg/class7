"use client";

import { useRef, useState, useTransition } from "react";
import { createAnnouncement } from "./actions";

export function NewAnnouncementForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      ref={formRef}
      action={(formData) =>
        startTransition(async () => {
          const res = await createAnnouncement(formData);
          if (res.error) setError(res.error);
          else {
            setError(null);
            formRef.current?.reset();
          }
        })
      }
      className="flex flex-col gap-2.5"
    >
      <input name="title" placeholder="제목" required className="input !min-h-10 text-sm" />
      <textarea name="content" placeholder="내용" required className="input text-sm" rows={5} />
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="is_important" className="h-4 w-4" />
        중요 공지로 표시
      </label>
      {error && <p className="text-xs font-medium text-[var(--color-rose)]">{error}</p>}
      <button disabled={pending} className="btn-primary !min-h-10 text-sm">
        {pending ? "게시 중..." : "공지 게시"}
      </button>
    </form>
  );
}
