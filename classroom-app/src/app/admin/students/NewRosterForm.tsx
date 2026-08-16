"use client";

import { useRef, useState, useTransition } from "react";
import { addRosterEntry } from "./actions";

export function NewRosterForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      ref={formRef}
      action={(formData) =>
        startTransition(async () => {
          const res = await addRosterEntry(formData);
          if (res.error) setError(res.error);
          else {
            setError(null);
            formRef.current?.reset();
          }
        })
      }
      className="flex gap-2"
    >
      <input name="student_number" placeholder="학번" required className="input !min-h-10 text-sm" />
      <input name="name" placeholder="이름" required className="input !min-h-10 text-sm" />
      <button disabled={pending} className="btn-primary !min-h-10 shrink-0 px-4 text-sm">
        추가
      </button>
      {error && <p className="text-xs font-medium text-[var(--color-rose)]">{error}</p>}
    </form>
  );
}
