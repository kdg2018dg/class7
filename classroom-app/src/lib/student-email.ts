// Supabase Auth 는 이메일 기반이므로, 학번을 내부 전용 이메일로 매핑해서 사용한다.
// 학생/관리자는 이 값을 직접 볼 일이 없고 항상 "학번"으로만 로그인한다.
const EMAIL_DOMAIN = "class7.internal";

export function studentNumberToEmail(studentNumber: string): string {
  return `${studentNumber.trim()}@${EMAIL_DOMAIN}`;
}
