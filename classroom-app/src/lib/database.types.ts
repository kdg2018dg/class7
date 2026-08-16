// 이 파일은 supabase/schema.sql 과 수동으로 맞춰서 관리합니다.
// 실제 프로젝트를 연결한 뒤에는 `npx supabase gen types typescript` 로 자동 생성본으로
// 교체하는 것을 권장합니다.

export type Role = "student" | "admin";
export type SessionStatus = "pending" | "approved" | "rejected";
export type EventCategory =
  | "exam"
  | "assessment"
  | "homework"
  | "supplies"
  | "mock_exam"
  | "school_event"
  | "other";
export type Priority = "high" | "normal" | "low";
export type ItemRequestStatus =
  | "received"
  | "reviewing"
  | "planned"
  | "purchased"
  | "on_hold"
  | "rejected";
export type DisplayNameMode = "realname" | "masked" | "student_number" | "nickname";

export interface Profile {
  id: string;
  student_number: string;
  name: string;
  role: Role;
  display_name_mode: DisplayNameMode;
  nickname: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  study_date: string;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number;
  memo: string | null;
  image_path: string;
  status: SessionStatus;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  category: EventCategory;
  subject: string | null;
  priority: Priority;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  is_important: boolean;
  published_at: string;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItemRequest {
  id: string;
  author_id: string;
  item_name: string;
  reason: string;
  estimated_price: number | null;
  status: ItemRequestStatus;
  created_at: string;
  updated_at: string;
}

export interface RosterEntry {
  student_number: string;
  name: string;
  claimed: boolean;
  created_at: string;
}
