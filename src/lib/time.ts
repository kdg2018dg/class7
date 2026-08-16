/**
 * study_date 는 DB에 순수 DATE(연-월-일)로 저장되므로, 학생이 고른 날짜와
 * 화면에 보여주는 날짜가 항상 동일하다 (타임존 변환으로 하루가 밀리는 문제 없음).
 * "오늘"과 "이번 주"를 계산할 때만 Asia/Seoul 기준 wall-clock 시각이 필요하다.
 */

const KST_TZ = "Asia/Seoul";

/** 현재 Asia/Seoul 기준 'YYYY-MM-DD' 문자열 */
export function todayKST(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: KST_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** 'YYYY-MM-DD' 문자열을 UTC 정오 기준 Date 로 파싱 (달력 계산용, TZ 영향 없음) */
function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** 주어진 날짜가 속한 주(월요일~일요일)의 시작/끝 날짜 문자열을 반환 */
export function getWeekRange(referenceDateStr: string = todayKST()): {
  start: string;
  end: string;
} {
  const ref = parseDateOnly(referenceDateStr);
  const dayOfWeek = ref.getUTCDay(); // 0=일 ... 6=토
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(ref);
  monday.setUTCDate(ref.getUTCDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return { start: formatDateOnly(monday), end: formatDateOnly(sunday) };
}

export function getPreviousWeekRange(referenceDateStr: string = todayKST()) {
  const { start } = getWeekRange(referenceDateStr);
  const prevRef = parseDateOnly(start);
  prevRef.setUTCDate(prevRef.getUTCDate() - 1); // 지난주 일요일
  return getWeekRange(formatDateOnly(prevRef));
}

/** 분(minutes) -> "3시간 20분" 형태로 표시 */
export function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

/** 'YYYY-MM-DD' -> "8월 17일 (월)" */
export function formatDateKorean(dateStr: string): string {
  const date = parseDateOnly(dateStr);
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}
