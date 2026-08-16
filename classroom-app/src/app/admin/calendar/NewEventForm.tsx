"use client";

import { useRef, useState, useTransition } from "react";
import { createEvent } from "./actions";

export function NewEventForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      ref={formRef}
      action={(formData) =>
        startTransition(async () => {
          const res = await createEvent(formData);
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
      <input type="date" name="event_date" required className="input !min-h-10 text-sm" />
      <div className="flex gap-2">
        <input type="time" name="start_time" className="input !min-h-10 text-sm" />
        <input type="time" name="end_time" className="input !min-h-10 text-sm" />
      </div>
      <select name="category" className="input !min-h-10 text-sm" defaultValue="other">
        <option value="exam">시험</option>
        <option value="assessment">수행평가</option>
        <option value="homework">숙제</option>
        <option value="supplies">준비물</option>
        <option value="mock_exam">모의고사</option>
        <option value="school_event">학교 행사</option>
        <option value="other">기타</option>
      </select>
      <input name="subject" placeholder="과목 (선택)" className="input !min-h-10 text-sm" />
      <select name="priority" className="input !min-h-10 text-sm" defaultValue="normal">
        <option value="high">중요도: 높음</option>
        <option value="normal">중요도: 보통</option>
        <option value="low">중요도: 낮음</option>
      </select>
      <textarea name="description" placeholder="설명 (선택)" className="input text-sm" />
      {error && <p className="text-xs font-medium text-[var(--color-rose)]">{error}</p>}
      <button disabled={pending} className="btn-primary !min-h-10 text-sm">
        {pending ? "추가 중..." : "일정 추가"}
      </button>
    </form>
  );
}
