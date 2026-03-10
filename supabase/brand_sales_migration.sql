-- =============================================
-- brand_sales 테이블 마이그레이션
-- 이너피움 / 아쿠아크 일일 매출 데이터
-- Supabase SQL Editor에서 실행하세요.
-- =============================================

create table if not exists brand_sales (
  id            bigserial primary key,
  brand         text not null check (brand in ('innerpium', 'aquacrc')),
  date          date not null,

  -- 매출 채널
  store_farm    bigint,                     -- 스토어팜
  cafe24        bigint,                     -- 카페24
  other         bigint,                     -- 기타 (이너피움)
  sinsegae_v    bigint,                     -- 신세계V (아쿠아크)
  other_w       bigint,                     -- 기타(더블유) (아쿠아크)
  total_revenue bigint,                     -- 총매출 (자동계산: 채널 합계)

  -- 상세 매출
  brand_sales   bigint,                     -- 유산균매출 (이너피움) / 클렌저매출 (아쿠아크)
  purchase_count integer,                   -- 구매건
  brand_qty     integer,                    -- 유산균수량 / 클렌저수량

  -- 마케팅
  event         integer,                    -- EVENT (광고 갯수)
  budget        bigint,                     -- 설정금액
  marketing_total bigint,                   -- 마케팅 총금액비용

  -- 유입 / 전환
  inflow_24     integer,                    -- 유입(24)
  inflow_n      integer,                    -- 유입(N)
  inflow_cost   bigint,                     -- 유입비용
  conversion_rate numeric(6, 2),            -- 전환률 (%)

  -- 기타 지표
  signup        integer,                    -- 회원가입
  wishlist      integer,                    -- 찜
  kakao         integer,                    -- 카카오
  insta         integer,                    -- 인스타
  insta_total   integer,                    -- 인스타총

  created_at    timestamptz not null default now(),

  -- 동일 브랜드 + 날짜 중복 방지
  unique (brand, date)
);

-- 인덱스
create index if not exists brand_sales_brand_date_idx on brand_sales (brand, date desc);

-- RLS 활성화
alter table brand_sales enable row level security;

-- 전체 접근 허용 정책 (필요에 따라 제한 가능)
create policy "allow all" on brand_sales for all using (true) with check (true);

-- 확인
select 'brand_sales 테이블 생성 완료' as result;
