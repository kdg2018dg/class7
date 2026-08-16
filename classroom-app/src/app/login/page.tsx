"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { studentNumberToEmail } from "@/lib/student-email";
import { Logo7 } from "@/components/Logo7";
import { Card } from "@/components/Card";

export default function LoginPage() {
  const router = useRouter();
  const [studentNumber, setStudentNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: studentNumberToEmail(studentNumber),
      password,
    });

    setLoading(false);
    if (signInError) {
      setError("학번 또는 비밀번호가 올바르지 않습니다.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo7 size={36} />
          <div>
            <h1 className="text-xl font-bold">7반 학급 운영센터</h1>
            <p className="text-sm text-[var(--color-ink-soft)]">오늘도 같이 성장하는 7반</p>
          </div>
        </div>

        <Card className="p-6">
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Field label="학번">
              <input
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                inputMode="numeric"
                placeholder="예: 70102"
                required
                className="input"
              />
            </Field>
            <Field label="비밀번호">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input"
              />
            </Field>

            {error && <p className="text-sm font-medium text-[var(--color-rose)]">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary mt-1">
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>
        </Card>

        <p className="mt-5 text-center text-sm text-[var(--color-ink-soft)]">
          처음이신가요?{" "}
          <Link href="/signup" className="font-semibold text-[var(--color-brand)]">
            학번으로 회원가입
          </Link>
        </p>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}
