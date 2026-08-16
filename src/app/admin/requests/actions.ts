"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ItemRequestStatus } from "@/lib/database.types";

export async function updateRequestStatus(id: string, status: ItemRequestStatus) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: before } = await supabase.from("item_requests").select("status").eq("id", id).single();
  const { error } = await supabase.from("item_requests").update({ status }).eq("id", id);

  if (!error) {
    await supabase.from("audit_logs").insert({
      actor_id: admin.id,
      action: "update_item_request_status",
      target_type: "item_requests",
      target_id: id,
      old_value: before,
      new_value: { status },
    });
  }

  revalidatePath("/admin/requests");
  revalidatePath("/requests");
  return { error: error?.message ?? null };
}
