# 7반 학급 운영센터 (V1)

고등학교 학급에서 실제로 사용하는 학급 운영 웹앱입니다. 학생이 로그인해서 공부시간을
사진과 함께 인증하면, 관리자가 승인한 기록만 자동으로 합산되어 주간 랭킹에 반영됩니다.
학급 캘린더, 공지사항, 익명 물품 신청 기능도 함께 제공합니다.

- **프론트/백엔드**: Next.js 16 (App Router, TypeScript, Server Actions)
- **DB / 인증 / 파일 저장**: Supabase (Postgres + RLS, Auth, Storage)
- **배포**: Vercel
- **스타일**: Tailwind CSS v4, Pretendard

---

## 1. Supabase 프로젝트 준비

1. https://supabase.com 에서 새 프로젝트를 만듭니다. (Region: Northeast Asia / Seoul 권장)
2. 좌측 메뉴 **SQL Editor** → New query 에서 `supabase/schema.sql` 파일 전체 내용을
   붙여넣고 **Run** 을 눌러 테이블 · RLS 정책 · Storage 버킷을 한 번에 생성합니다.
3. `supabase/schema.sql` 맨 아래의 `insert into public.roster ...` 부분을
   **우리 반 실제 학번/이름 명단으로 수정**한 뒤 실행하세요. (관리자가 될 사람도 포함해서
   일반 학생과 동일하게 명단에 등록합니다.)
4. **Project Settings → API** 메뉴에서 다음 3개 값을 복사해둡니다.
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` 키 → `SUPABASE_SERVICE_ROLE_KEY` (절대 외부에 공개 금지)

## 2. 로컬에서 실행해보기 (선택)

```bash
npm install
cp .env.example .env.local   # 위에서 복사한 값 3개를 채워 넣기
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

## 3. Vercel 배포

1. 이 프로젝트 폴더를 GitHub 저장소로 올립니다.
2. https://vercel.com 에서 **Add New → Project** 로 그 저장소를 가져옵니다.
   (Framework Preset: Next.js 로 자동 인식됩니다.)
3. **Environment Variables** 에 `.env.example` 의 3개 값을 그대로 등록합니다.
4. **Deploy** 를 누르면 몇 분 안에 실제 URL(`https://프로젝트명.vercel.app`)이 발급됩니다.

## 4. 관리자 계정 만들기

관리자도 처음에는 **일반 학생과 동일하게** `/signup` 에서 학번+이름+비밀번호로 가입합니다.
가입이 끝나면 Supabase **SQL Editor** 에서 아래 SQL 한 줄을 실행해 관리자로 승격하세요.

```sql
update public.profiles set role = 'admin' where student_number = '실제 학번';
```

이후에는 로그인한 관리자가 **관리자 → 학생 관리** 화면에서 다른 사람의 권한도 직접
학생 ↔ 관리자로 바꿀 수 있습니다. (배포 전 반드시 관리자 계정 비밀번호를 안전하게
설정/변경해두세요.)

---

## 로그인 방식 안내

학생은 이메일이 아니라 **학번 + 비밀번호**로 로그인합니다. 내부적으로는 학번을
`{학번}@class7.internal` 형태의 전용 이메일로 변환해 Supabase Auth 를 사용하며,
`roster` 테이블에 등록된 학번만 가입할 수 있고 학번당 1계정만 허용됩니다
(중복 가입 시 서버가 차단).

## 주요 기능 (V1 구현 범위)

| 기능 | 학생 | 관리자 |
|---|---|---|
| 공부시간 인증 (사진, 몰아서 여러 건 제출) | 제출 | 승인/반려/시간 수정 |
| 주간 랭킹 (월~일, Asia/Seoul 자동 계산) | 조회 (실명/가림/학번/닉네임 중 관리자가 설정한 방식으로 표시) | 표시 방식 설정 |
| 학급 캘린더 (시험/수행/숙제/준비물 등) | 조회 (PC 월간 그리드 / 모바일 날짜별 리스트) | 추가/삭제 |
| 공지사항 | 조회 | 작성/삭제, 중요 공지 강조 |
| 익명 물품 신청 | 신청 + 익명 통계 조회 | 상태 변경 (익명 유지) |
| 학생/관리자 권한 관리 | - | 명단 등록, 역할 변경 |
| CSV 내보내기 | - | 공부시간 / 랭킹 / 물품신청 |
| 감사 로그 (audit log) | - | 인증 승인·반려·수정, 역할 변경 등 자동 기록 |

**V1 범위 밖 (구조상 확장 가능하도록만 설계)**: 성적 향상 인증, 보상/상품 시스템,
설문조사, 자동 승인 모드, 인앱 알림, 다크모드 UI. 스키마와 코드 구조는 이후에 이
기능들을 추가하기 쉽게 (예: `study_sessions.status`, `audit_logs`, role 확장 등)
설계되어 있습니다.

## 보안 설계 요약

- 모든 테이블에 **Row Level Security** 적용 — 학생은 자기 데이터만, 관리자는 전체
  접근 가능하도록 DB 레벨에서 강제 (프론트엔드 코드가 아니라 Postgres 정책이 실제 방어선).
- 관리자 페이지/서버 액션/API 라우트 진입 시마다 `requireAdmin()` 으로 서버에서
  role 을 다시 확인 — URL을 직접 입력해도 우회 불가.
- 인증 사진은 비공개 Storage 버킷에 저장되고, 본인 또는 관리자만 서명 URL로 열람 가능.
- 익명 물품 신청은 작성자 id 를 DB에는 보관하되(악용 방지), 화면에는 어디에도 노출하지 않음.
- 미래 날짜 인증·음수/24시간 초과 공부시간은 DB 제약조건(check)으로 원천 차단.
- 같은 학생·같은 날짜 시간대 중복은 자동 삭제하지 않고 관리자 화면에 "시간 중복 의심"
  배지로 표시해 관리자가 직접 판단.

## 알려진 제약 / 다음에 할 일

- 관리자가 자기 자신의 권한을 학생으로 낮추는 것을 막는 안전장치는 아직 없습니다
  (관리자가 1명뿐인 반은 주의해서 사용하세요).
- 자동 승인 모드, 성적 향상, 보상 시스템은 스키마상 자리는 마련해두었지만 V1에는
  포함하지 않았습니다.
- 이미지 파일 크기/형식 검증은 브라우저의 accept="image/*" 수준이며, 서버 측
  용량 제한을 더 엄격히 걸고 싶다면 Supabase Storage 버킷 설정에서 최대 파일 크기를
  지정하세요 (Dashboard → Storage → study-photos → Configuration).
