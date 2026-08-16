"use client";

import { useTransition } from "react";
import { setProfileRole } from "./actions";
import type { Role } from "@/lib/database.types";

export function RoleToggle({ profileId, role }: { profileId: string; role: Role }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={role}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as Role;
        if (next === "admin" && !confirm("이 학생에게 관리자 권한을 부여할까요?")) return;
        startTransition(async () => { await setProfileRole(profileId, next); });
      }}
      className="input !min-h-9 !py-0 text-sm"
    >
      <option value="student">학생</option>
      <option value="admin">관리자</option>
    </select>
  );
}
