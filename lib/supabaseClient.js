import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// URL/키가 없으면(로컬에서 아직 설정 전) 명확한 에러를 내서 원인을 바로 알 수 있게 함
if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "Supabase 환경변수가 설정되지 않았습니다. .env.local에 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY를 추가해주세요."
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseKey || "");
