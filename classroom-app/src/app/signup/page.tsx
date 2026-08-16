"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo7 } from "@/components/Logo7";
import { Card } from "@/components/Card";

export default function SignupPage() {
  const router = useRouter();
  const [studentNumber, setStudentNumber] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError("비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentNumber, name, password }),
    });
    const json = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(json.error ?? "회원가입에 실패했습니다.");
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: json.email,
      password,
    });
    setLoading(false);

    if (signInError) {
      router.push("/login");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo7 size={36} />
          <div>
            <h1 className="text-xl font-bold">회원가입</h1>
            <p className="text-sm text-[var(--color-ink-soft)]">
              명단에 등록된 학번만 가입할 수 있어요
            </p>
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
            <Field label="이름">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="명단에 등록된 이름과 동일하게"
                required
                className="input"
              />
            </Field>
            <Field label="비밀번호">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                className="input"
              />
            </Field>
            <Field label="비밀번호 확인">
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                minLength={8}
                required
                className="input"
              />
            </Field>

            {error && <p className="text-sm font-medium text-[var(--color-rose)]">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary mt-1">
              {loading ? "가입 처리 중..." : "가입하고 시작하기"}
            </button>
          </form>
        </Card>

        <p className="mt-5 text-center text-sm text-[var(--color-ink-soft)]">
          이미 계정이 있나요?{" "}
          <Link href="/login" className="font-semibold text-[var(--color-brand)]">
            로그인
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
