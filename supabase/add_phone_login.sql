-- ---------------------------------------------------------------
-- 전화번호 로그인 기능 추가
-- 이미 schema.sql을 실행하셨다면, 이 파일만 추가로 SQL Editor에서 실행하세요.
-- ---------------------------------------------------------------

-- profiles 테이블에 전화번호 컬럼 추가 (기존 데이터는 null로 유지되어도 안전함)
alter table profiles add column if not exists phone text;

-- 전화번호는 값이 있을 때만 유일해야 함 (null은 여러 개 허용되어야 기존 유저가 안 깨짐)
create unique index if not exists profiles_phone_unique
  on profiles (phone)
  where phone is not null;

-- 전화번호+PIN으로 로그인 시, 그 사람의 닉네임을 찾아주는 함수
create or replace function login_by_phone(input_phone text, input_pin_hash text)
returns text
language sql
security definer
as $$
  select nickname from profiles
  where phone = input_phone and pin_hash = input_pin_hash
  limit 1;
$$;
