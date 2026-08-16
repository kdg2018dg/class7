"use client";

import { useTransition } from "react";
import { updateRequestStatus } from "./actions";
import type { ItemRequestStatus } from "@/lib/database.types";

const OPTIONS: { value: ItemRequestStatus; label: string }[] = [
  { value: "received", label: "접수" },
  { value: "reviewing", label: "검토 중" },
  { value: "planned", label: "구매 예정" },
  { value: "purchased", label: "구매 완료" },
  { value: "on_hold", label: "보류" },
  { value: "rejected", label: "반려" },
];

export function StatusSelect({ id, status }: { id: string; status: ItemRequestStatus }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) => startTransition(async () => { await updateRequestStatus(id, e.target.value as ItemRequestStatus); })}
      className="input !min-h-9 !py-0 shrink-0 text-sm md:w-36"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
