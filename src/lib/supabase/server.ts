import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";


// Server Components / Route Handlers 에서 사용하는 Supabase 클라이언트.
// 세션은 쿠키에서 읽고, RLS 정책이 실제 권한 검증을 담당한다.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component 에서 호출된 경우 무시 (미들웨어가 세션 갱신을 담당)
          }
        },
      },
    }
  );
}

// 관리자 전용 작업(파일 서명 URL 발급 등)에 사용하는 service-role 클라이언트.
// 절대 클라이언트로 내려보내지 말고 서버 코드에서만 사용한다.
export function createServiceRoleClient() {
  return createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
