import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { studentNumberToEmail } from "@/lib/student-email";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const studentNumber = (body?.studentNumber ?? "").trim();
  const name = (body?.name ?? "").trim();
  const password = body?.password ?? "";

  if (!studentNumber || !name || !password) {
    return NextResponse.json({ error: "학번, 이름, 비밀번호를 모두 입력해주세요." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "비밀번호는 8자 이상이어야 합니다." }, { status: 400 });
  }

  const admin = createServiceRoleClient();

  // 1. 명단(roster)에 등록된 학번인지, 이름이 일치하는지, 이미 가입되지 않았는지 확인
  const { data: rosterEntry, error: rosterError } = await admin
    .from("roster")
    .select("*")
    .eq("student_number", studentNumber)
    .maybeSingle();

  if (rosterError) {
    return NextResponse.json({ error: "명단 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
  if (!rosterEntry) {
    return NextResponse.json(
      { error: "등록된 학번이 아닙니다. 담임/반장에게 확인해주세요." },
      { status: 404 }
    );
  }
  if (rosterEntry.name !== name) {
    return NextResponse.json({ error: "학번과 이름이 일치하지 않습니다." }, { status: 400 });
  }
  if (rosterEntry.claimed) {
    return NextResponse.json(
      { error: "이미 가입된 학번입니다. 로그인해주세요." },
      { status: 409 }
    );
  }

  // 2. Supabase Auth 사용자 생성 (서비스 롤 — 이메일 인증 절차 생략)
  const email = studentNumberToEmail(studentNumber);
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    const msg = createError?.message?.includes("already registered")
      ? "이미 가입된 학번입니다. 로그인해주세요."
      : "계정 생성에 실패했습니다. 잠시 후 다시 시도해주세요.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // 3. profile 생성 (첫 번째 등록 계정을 admin 으로 자동 지정하지 않음 — 관리자는 SQL로 수동 승격)
  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    student_number: studentNumber,
    name,
    role: "student",
  });

  if (profileError) {
    // 롤백: 방금 만든 auth 계정 삭제
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: "프로필 생성에 실패했습니다." }, { status: 500 });
  }

  // 4. roster 를 claimed 처리하여 중복 가입 방지
  await admin.from("roster").update({ claimed: true }).eq("student_number", studentNumber);

  return NextResponse.json({ ok: true, email });
}
