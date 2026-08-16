"use client";

import { useState, useTransition } from "react";
import { setRankingDisplayMode } from "./actions";
import type { DisplayNameMode } from "@/lib/database.types";

const OPTIONS: { value: DisplayNameMode; label: string }[] = [
  { value: "realname", label: "실명" },
  { value: "masked", label: "이름 일부 가림 (김*건)" },
  { value: "student_number", label: "학번" },
  { value: "nickname", label: "닉네임 (없으면 실명)" },
];

export function DisplayModeForm({ currentMode }: { currentMode: DisplayNameMode }) {
  const [mode, setMode] = useState(currentMode);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      {OPTIONS.map((o) => (
        <label key={o.value} className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="mode"
            checked={mode === o.value}
            onChange={() => setMode(o.value)}
            className="h-4 w-4"
          />
          {o.label}
        </label>
      ))}
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await setRankingDisplayMode(mode);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          })
        }
        className="btn-primary !min-h-9 mt-1 text-sm"
      >
        {pending ? "적용 중..." : saved ? "적용됨 ✓" : "전체 학생에 적용"}
      </button>
    </div>
  );
}
