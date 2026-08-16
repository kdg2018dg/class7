"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createAnnouncement(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("announcements").insert({
    title: String(formData.get("title") || ""),
    content: String(formData.get("content") || ""),
    is_important: formData.get("is_important") === "on",
    created_by: admin.id,
  });

  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
  revalidatePath("/");
  return { error: error?.message ?? null };
}

export async function deleteAnnouncement(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("announcements").delete().eq("id", id);

  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
  revalidatePath("/");
  return { error: error?.message ?? null };
}
