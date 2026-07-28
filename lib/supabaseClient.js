import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// URL/키가 없으면(로컬에서 아직 설정 전) 명확한 경고를 띄우되, 빌드 자체는 깨지지 않도록
// 임시 placeholder를 사용합니다. 실제 배포 환경(Vercel)에는 반드시 진짜 값을 넣어야 동작합니다.
if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "Supabase 환경변수가 설정되지 않았습니다. .env.local / Vercel 환경변수에 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY를 추가해주세요."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseKey || "placeholder-anon-key"
);
