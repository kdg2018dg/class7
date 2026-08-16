"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function addRosterEntry(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const studentNumber = String(formData.get("student_number") || "").trim();
  const name = String(formData.get("name") || "").trim();

  if (!studentNumber || !name) return { error: "학번과 이름을 입력해주세요." };

  const { error } = await supabase.from("roster").insert({ student_number: studentNumber, name });

  revalidatePath("/admin/students");
  return { error: error?.message ?? null };
}

export async function removeRosterEntry(studentNumber: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("roster").delete().eq("student_number", studentNumber);

  revalidatePath("/admin/students");
  return { error: error?.message ?? null };
}

export async function setProfileRole(profileId: string, role: "student" | "admin") {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("profiles").update({ role }).eq("id", profileId);

  if (!error) {
    await supabase.from("audit_logs").insert({
      actor_id: admin.id,
      action: "set_profile_role",
      target_type: "profiles",
      target_id: profileId,
      new_value: { role },
    });
  }

  revalidatePath("/admin/students");
  return { error: error?.message ?? null };
}
