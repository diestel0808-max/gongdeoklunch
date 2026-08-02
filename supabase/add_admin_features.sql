-- ---------------------------------------------------------------
-- 관리자 기능 추가: 카테고리 수정 + 식당 숨김/삭제 + 후기 삭제
-- schema.sql, add_phone_login.sql 실행 후 이 파일을 추가로 SQL Editor에서 실행하세요.
-- ---------------------------------------------------------------

-- 식당 카테고리를 관리자가 직접 덮어쓸 수 있는 테이블
create table if not exists category_overrides (
  restaurant_id text primary key,
  category text not null,
  updated_at timestamptz default now()
);

-- 카카오 API로 자동 수집된 식당은 우리 DB에 없어서 직접 삭제가 불가능하므로,
-- "숨김" 처리해서 목록에서 안 보이게 하는 방식으로 관리합니다.
create table if not exists hidden_restaurants (
  restaurant_id text primary key,
  reason text,
  created_at timestamptz default now()
);

alter table category_overrides enable row level security;
alter table hidden_restaurants enable row level security;

create policy "category_overrides: 조회 전체 허용" on category_overrides for select using (true);
create policy "category_overrides: 생성 전체 허용" on category_overrides for insert with check (true);
create policy "category_overrides: 수정 전체 허용" on category_overrides for update using (true) with check (true);

create policy "hidden_restaurants: 조회 전체 허용" on hidden_restaurants for select using (true);
create policy "hidden_restaurants: 생성 전체 허용" on hidden_restaurants for insert with check (true);
create policy "hidden_restaurants: 삭제 전체 허용" on hidden_restaurants for delete using (true);

-- 사용자가 직접 등록한 식당(custom_restaurants)은 관리자가 진짜로 삭제할 수 있어야 함
create policy "custom_restaurants: 삭제 전체 허용" on custom_restaurants for delete using (true);

-- 부적절한 후기를 관리자가 삭제할 수 있어야 함 (지금까지는 삭제 정책이 없어서 막혀있었음)
create policy "reviews: 삭제 전체 허용" on reviews for delete using (true);
