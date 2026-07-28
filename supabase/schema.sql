-- ---------------------------------------------------------------
-- 댕턴뭐먹지 DB 스키마
-- Supabase 대시보드 → SQL Editor → New query에 이 파일 전체를 붙여넣고 Run 하세요.
-- ---------------------------------------------------------------

-- 1. 프로필 (닉네임 + PIN)
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  nickname text unique not null,
  pin_hash text not null,
  created_at timestamptz default now()
);

-- 2. 사용자 등록 식당 (카카오 API에 없는 곳을 직접 추가한 것)
create table if not exists custom_restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  address text,
  lat double precision not null,
  lng double precision not null,
  phone text,
  kakao_map_url text,
  distance_meters int,
  walk_minutes int,
  created_at timestamptz default now()
);

-- 3. 후기
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id text not null, -- 카카오 장소 id 또는 custom_restaurants의 id
  nickname text not null,
  waiting text[],
  headcount text[],
  recommended_for text[],
  price_range text,
  price_feel text,
  revisit text,
  menu text,
  comment text,
  likes int default 0,
  liked_by text[] default '{}',
  created_at timestamptz default now()
);

-- 4. 찜(하트)
create table if not exists favorites (
  restaurant_id text not null,
  liker_id text not null,
  created_at timestamptz default now(),
  primary key (restaurant_id, liker_id)
);

-- 5. 신고
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null, -- 'restaurant' | 'review'
  target_id text not null,
  reason text not null,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------
-- RLS(행 단위 보안) 활성화 및 정책
-- 지금은 별도 로그인 시스템이 없는 소규모 사내 도구라서,
-- "조회는 누구나, 작성은 누구나"로 열어두고 수정/삭제만 아래 함수로 제한합니다.
-- ---------------------------------------------------------------
alter table profiles enable row level security;
alter table custom_restaurants enable row level security;
alter table reviews enable row level security;
alter table favorites enable row level security;
alter table reports enable row level security;

create policy "profiles: 조회 전체 허용" on profiles for select using (true);
create policy "profiles: 생성 전체 허용" on profiles for insert with check (true);

create policy "custom_restaurants: 조회 전체 허용" on custom_restaurants for select using (true);
create policy "custom_restaurants: 생성 전체 허용" on custom_restaurants for insert with check (true);

create policy "reviews: 조회 전체 허용" on reviews for select using (true);
create policy "reviews: 생성 전체 허용" on reviews for insert with check (true);
create policy "reviews: 공감수 수정 허용" on reviews for update using (true) with check (true);

create policy "favorites: 조회 전체 허용" on favorites for select using (true);
create policy "favorites: 생성 전체 허용" on favorites for insert with check (true);
create policy "favorites: 삭제 전체 허용" on favorites for delete using (true);

create policy "reports: 생성 전체 허용" on reports for insert with check (true);

-- ---------------------------------------------------------------
-- 닉네임+PIN 인증 함수 (내 후기 수정/삭제할 때 PIN이 맞는지 서버에서 확인)
-- pin_hash는 클라이언트에서 간단 해시(SHA-256)해서 저장/비교합니다.
-- ---------------------------------------------------------------
create or replace function verify_pin(input_nickname text, input_pin_hash text)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from profiles
    where nickname = input_nickname and pin_hash = input_pin_hash
  );
$$;
