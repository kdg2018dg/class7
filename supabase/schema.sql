-- ============================================================================
-- 7반 학급 운영센터 — Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에 이 파일 전체를 붙여넣고 실행하세요.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. roster (명단) : 관리자가 미리 등록해두는 "가입 가능한 학번 목록"
--    학생은 이 명단에 있는 학번으로만 회원가입할 수 있다 (임의 가입 방지).
-- ----------------------------------------------------------------------------
create table if not exists public.roster (
  student_number text primary key,
  name text not null,
  claimed boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. profiles : auth.users 1:1 확장 테이블. role 로 학생/관리자를 구분한다.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  student_number text unique not null,
  name text not null,
  role text not null default 'student' check (role in ('student', 'admin')),
  display_name_mode text not null default 'realname'
    check (display_name_mode in ('realname', 'masked', 'student_number', 'nickname')),
  nickname text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 헬퍼: 현재 로그인한 사용자가 관리자인지 (RLS 정책에서 재사용)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- 3. study_sessions : 공부시간 인증
-- ----------------------------------------------------------------------------
create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  study_date date not null,
  start_time time,
  end_time time,
  duration_minutes integer not null check (duration_minutes > 0 and duration_minutes <= 1440),
  memo text,
  image_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint no_future_date check (study_date <= (now() at time zone 'Asia/Seoul')::date)
);

create index if not exists idx_study_sessions_user on public.study_sessions(user_id);
create index if not exists idx_study_sessions_date on public.study_sessions(study_date);
create index if not exists idx_study_sessions_status on public.study_sessions(status);

-- ----------------------------------------------------------------------------
-- 4. calendar_events : 학급 캘린더
-- ----------------------------------------------------------------------------
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date not null,
  start_time time,
  end_time time,
  category text not null check (category in
    ('exam', 'assessment', 'homework', 'supplies', 'mock_exam', 'school_event', 'other')),
  subject text,
  priority text not null default 'normal' check (priority in ('high', 'normal', 'low')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_calendar_events_date on public.calendar_events(event_date);

-- ----------------------------------------------------------------------------
-- 5. announcements : 공지사항
-- ----------------------------------------------------------------------------
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  is_important boolean not null default false,
  published_at timestamptz not null default now(),
  expires_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 6. item_requests : 익명 비치물 신청
--    author_id 는 DB에는 저장하되(악용 방지용), 학생/관리자 화면에는 노출하지 않는다.
-- ----------------------------------------------------------------------------
create table if not exists public.item_requests (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id),
  item_name text not null,
  reason text not null,
  estimated_price integer,
  status text not null default 'received' check (status in
    ('received', 'reviewing', 'planned', 'purchased', 'on_hold', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 7. audit_logs : 관리자 데이터 변경 이력
-- ----------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  target_type text not null,
  target_id text not null,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- updated_at 자동 갱신 트리거
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles','study_sessions','calendar_events','announcements','item_requests']
  loop
    execute format('drop trigger if exists trg_updated_at on public.%I', t);
    execute format('create trigger trg_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- 같은 학생 · 같은 날짜에 겹치는 시간대 인증이 있는지 감지하는 뷰 (관리자 경고용)
create or replace view public.overlapping_sessions as
select a.id as session_id, a.user_id, a.study_date, a.start_time, a.end_time, b.id as conflicts_with
from public.study_sessions a
join public.study_sessions b
  on a.user_id = b.user_id
  and a.study_date = b.study_date
  and a.id <> b.id
  and a.start_time is not null and a.end_time is not null
  and b.start_time is not null and b.end_time is not null
  and a.start_time < b.end_time and b.start_time < a.end_time
  and a.status <> 'rejected' and b.status <> 'rejected';

-- ----------------------------------------------------------------------------
-- 주간 랭킹 함수 (security definer)
-- study_sessions 원본 행은 본인 것만 볼 수 있지만(RLS), 랭킹은 "합산된 숫자"만
-- 모든 로그인 사용자에게 공개해야 하므로 별도 함수로 안전하게 집계해서 내려준다.
-- 사진/메모 등 민감한 개별 인증 데이터는 이 함수에 절대 포함하지 않는다.
-- ----------------------------------------------------------------------------
create or replace function public.weekly_rankings(week_start date, week_end date)
returns table (
  user_id uuid,
  name text,
  student_number text,
  display_name_mode text,
  nickname text,
  total_minutes bigint
)
language sql
security definer
stable
as $$
  select
    p.id as user_id,
    p.name,
    p.student_number,
    p.display_name_mode,
    p.nickname,
    coalesce(sum(s.duration_minutes), 0) as total_minutes
  from public.profiles p
  left join public.study_sessions s
    on s.user_id = p.id
    and s.status = 'approved'
    and s.study_date between week_start and week_end
  where p.role = 'student'
  group by p.id, p.name, p.student_number, p.display_name_mode, p.nickname
  order by total_minutes desc;
$$;

grant execute on function public.weekly_rankings(date, date) to authenticated;

-- ----------------------------------------------------------------------------
-- 익명 물품 신청 공개 목록 (security definer)
-- author_id 를 제외하고 반환하므로, 다른 학생의 신청도 "누가"는 알 수 없고
-- "무엇을 · 몇 번 · 어떤 상태로" 신청했는지만 확인할 수 있다.
-- ----------------------------------------------------------------------------
create or replace function public.item_requests_public()
returns table (
  id uuid,
  item_name text,
  reason text,
  estimated_price integer,
  status text,
  created_at timestamptz
)
language sql
security definer
stable
as $$
  select id, item_name, reason, estimated_price, status, created_at
  from public.item_requests
  order by created_at desc;
$$;

grant execute on function public.item_requests_public() to authenticated;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.roster enable row level security;
alter table public.profiles enable row level security;
alter table public.study_sessions enable row level security;
alter table public.calendar_events enable row level security;
alter table public.announcements enable row level security;
alter table public.item_requests enable row level security;
alter table public.audit_logs enable row level security;

-- roster: 회원가입 시 학번 존재 확인을 위해 익명도 SELECT만 가능 (이름/학번만 노출)
drop policy if exists roster_select on public.roster;
create policy roster_select on public.roster for select using (true);
drop policy if exists roster_admin_write on public.roster;
create policy roster_admin_write on public.roster for all using (public.is_admin()) with check (public.is_admin());

-- profiles
drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin on public.profiles for select
  using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles for insert
  with check (id = auth.uid());
drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());

-- study_sessions: 학생은 본인 것만 CRUD(수정/삭제는 pending 상태만), 관리자는 전체
drop policy if exists study_sessions_select on public.study_sessions;
create policy study_sessions_select on public.study_sessions for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists study_sessions_insert on public.study_sessions;
create policy study_sessions_insert on public.study_sessions for insert
  with check (user_id = auth.uid());
drop policy if exists study_sessions_update_own_pending on public.study_sessions;
create policy study_sessions_update_own_pending on public.study_sessions for update
  using ((user_id = auth.uid() and status = 'pending') or public.is_admin());
drop policy if exists study_sessions_delete on public.study_sessions;
create policy study_sessions_delete on public.study_sessions for delete
  using ((user_id = auth.uid() and status = 'pending') or public.is_admin());

-- calendar_events: 전체 학생 열람, 관리자만 작성/수정/삭제
drop policy if exists calendar_events_select on public.calendar_events;
create policy calendar_events_select on public.calendar_events for select using (true);
drop policy if exists calendar_events_write on public.calendar_events;
create policy calendar_events_write on public.calendar_events for all
  using (public.is_admin()) with check (public.is_admin());

-- announcements: 전체 열람, 관리자만 작성/수정/삭제
drop policy if exists announcements_select on public.announcements;
create policy announcements_select on public.announcements for select using (true);
drop policy if exists announcements_write on public.announcements;
create policy announcements_write on public.announcements for all
  using (public.is_admin()) with check (public.is_admin());

-- item_requests: 본인 글 + 관리자만 select 가능 (익명성 위해 다른 학생은 개별행 접근 불가, 통계는 API에서 집계 제공)
drop policy if exists item_requests_select on public.item_requests;
create policy item_requests_select on public.item_requests for select
  using (author_id = auth.uid() or public.is_admin());
drop policy if exists item_requests_insert on public.item_requests;
create policy item_requests_insert on public.item_requests for insert
  with check (author_id = auth.uid());
drop policy if exists item_requests_update_admin on public.item_requests;
create policy item_requests_update_admin on public.item_requests for update
  using (public.is_admin()) with check (public.is_admin());

-- audit_logs: 관리자만
drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs for select using (public.is_admin());
drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_insert on public.audit_logs for insert with check (public.is_admin());

-- ============================================================================
-- STORAGE: 인증 사진 버킷 (비공개, 서버 서명 URL로만 열람)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('study-photos', 'study-photos', false)
on conflict (id) do nothing;

drop policy if exists study_photos_insert on storage.objects;
create policy study_photos_insert on storage.objects for insert
  with check (
    bucket_id = 'study-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists study_photos_select on storage.objects;
create policy study_photos_select on storage.objects for select
  using (
    bucket_id = 'study-photos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

drop policy if exists study_photos_delete on storage.objects;
create policy study_photos_delete on storage.objects for delete
  using (
    bucket_id = 'study-photos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- ============================================================================
-- 초기 관리자/학생 명단 SEED (학번은 예시 — 실제 값으로 바꿔서 사용)
-- ============================================================================
insert into public.roster (student_number, name) values
  ('20701', '구다혜'),
  ('20702', '김나윤'),
  ('20703', '김도건'),
  ('20704', '김서진'),
  ('20705', '학생5'),
  ('20706', '학생6'),
  ('20707', '학생7'),
  ('20708', '학생8'),
  ('20709', '학생9'),
  ('20710', '학생10'),
  ('20711', '학생11'),
  ('20712', '학생12'),
  ('20713', '학생13'),
  ('20714', '학생14'),
  ('20715', '학생15'),
  ('20716', '학생16'),
  ('20717', '학생17'),
  ('20718', '학생18'),
  ('20719', '학생19'),
  ('20720', '학생20'),
  ('20721', '학생21'),
  ('20722', '학생22'),
  ('20723', '학생23'),
  ('20724', '학생24'),
  ('20725', '학생25'),
  ('20726', '학생26'),
  ('20727', '학생27'),
  ('20728', '학생28'),
  ('20729', '학생29'),
  ('20730', '학생30'),
  ('20731', '학생31'),
  ('20732', '학생32')
on conflict (student_number) do nothing;

-- 주의: role='admin' 지정은 회원가입 후 아래 SQL을 SQL Editor에서 직접 실행해서 부여하세요.
-- update public.profiles set role = 'admin' where student_number = '70101';
