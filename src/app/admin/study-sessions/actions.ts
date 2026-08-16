"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function approveSession(sessionId: string) {
  const admin = await requireAdmin(); // 서버에서 다시 한번 관리자 권한 확인
  const supabase = await createClient();

  const { data: before } = await supabase.from("study_sessions").select("*").eq("id", sessionId).single();

  const { error } = await supabase
    .from("study_sessions")
    .update({ status: "approved", reviewed_by: admin.id, reviewed_at: new Date().toISOString(), rejection_reason: null })
    .eq("id", sessionId);

  if (!error) {
    await supabase.from("audit_logs").insert({
      actor_id: admin.id,
      action: "approve_study_session",
      target_type: "study_sessions",
      target_id: sessionId,
      old_value: before ? { status: before.status } : null,
      new_value: { status: "approved" },
    });
  }

  revalidatePath("/admin/study-sessions");
  revalidatePath("/");
  return { error: error?.message ?? null };
}

export async function rejectSession(sessionId: string, reason: string) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: before } = await supabase.from("study_sessions").select("*").eq("id", sessionId).single();

  const { error } = await supabase
    .from("study_sessions")
    .update({
      status: "rejected",
      rejection_reason: reason,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (!error) {
    await supabase.from("audit_logs").insert({
      actor_id: admin.id,
      action: "reject_study_session",
      target_type: "study_sessions",
      target_id: sessionId,
      old_value: before ? { status: before.status } : null,
      new_value: { status: "rejected", rejection_reason: reason },
    });
  }

  revalidatePath("/admin/study-sessions");
  revalidatePath("/");
  return { error: error?.message ?? null };
}

export async function editSessionDuration(sessionId: string, durationMinutes: number) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  if (durationMinutes <= 0 || durationMinutes > 1440) {
    return { error: "공부시간은 1분 이상 24시간 이하여야 합니다." };
  }

  const { data: before } = await supabase
    .from("study_sessions")
    .select("duration_minutes")
    .eq("id", sessionId)
    .single();

  const { error } = await supabase
    .from("study_sessions")
    .update({ duration_minutes: durationMinutes })
    .eq("id", sessionId);

  if (!error) {
    await supabase.from("audit_logs").insert({
      actor_id: admin.id,
      action: "edit_study_session_duration",
      target_type: "study_sessions",
      target_id: sessionId,
      old_value: before,
      new_value: { duration_minutes: durationMinutes },
    });
  }

  revalidatePath("/admin/study-sessions");
  revalidatePath("/");
  return { error: error?.message ?? null };
}
