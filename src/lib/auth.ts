import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/database.types";

/**
 * 로그인 여부와 관계없이 현재 사용자의 프로필을 가져온다.
 * 로그인하지 않았으면 null.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile ?? null;
}

/**
 * 로그인이 필요한 페이지/라우트에서 사용. 로그인 안 되어 있으면 /login 으로 리다이렉트.
 */
export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

/**
 * 관리자 전용 페이지/라우트에서 사용.
 * 이것이 실제 서버 측 authorization 이다 — 프론트엔드에서 버튼만 숨기는 방식이 아니라
 * 여기서 role 을 확인하지 못하면 어떤 데이터도 내려주지 않는다.
 */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") {
    redirect("/");
  }
  return profile;
}
