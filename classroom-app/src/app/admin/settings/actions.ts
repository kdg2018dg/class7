"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { DisplayNameMode } from "@/lib/database.types";

export async function setRankingDisplayMode(mode: DisplayNameMode) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("profiles").update({ display_name_mode: mode }).eq("role", "student");

  revalidatePath("/admin/settings");
  revalidatePath("/rankings");
  return { error: error?.message ?? null };
}
