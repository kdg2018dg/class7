import type { DisplayNameMode, Profile } from "@/lib/database.types";

/** 관리자가 설정한 랭킹 이름 공개 방식에 따라 학생 이름을 변환한다 */
export function displayNameFor(
  profile: Pick<Profile, "name" | "student_number" | "nickname">,
  mode: DisplayNameMode
): string {
  switch (mode) {
    case "realname":
      return profile.name;
    case "masked":
      if (profile.name.length <= 1) return profile.name;
      if (profile.name.length === 2) return `${profile.name[0]}*`;
      return `${profile.name[0]}*${profile.name.slice(-1)}`;
    case "student_number":
      return profile.student_number;
    case "nickname":
      return profile.nickname || profile.name;
    default:
      return profile.name;
  }
}
