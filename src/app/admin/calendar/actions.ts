"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createEvent(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("calendar_events").insert({
    title: String(formData.get("title") || ""),
    description: String(formData.get("description") || "") || null,
    event_date: String(formData.get("event_date") || ""),
    start_time: String(formData.get("start_time") || "") || null,
    end_time: String(formData.get("end_time") || "") || null,
    category: String(formData.get("category") || "other"),
    subject: String(formData.get("subject") || "") || null,
    priority: String(formData.get("priority") || "normal"),
    created_by: admin.id,
  });

  revalidatePath("/admin/calendar");
  revalidatePath("/calendar");
  revalidatePath("/");
  return { error: error?.message ?? null };
}

export async function deleteEvent(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);

  revalidatePath("/admin/calendar");
  revalidatePath("/calendar");
  revalidatePath("/");
  return { error: error?.message ?? null };
}
