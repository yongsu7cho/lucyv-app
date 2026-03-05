-- =============================================
-- 루씨 에이전시 앱 - Supabase 데이터베이스 스키마
-- Supabase SQL Editor에서 전체 실행하세요.
-- =============================================

-- ── 인플루언서/공구 ──
create table if not exists influencers (
  id bigint primary key,
  name text not null default '',
  handle text not null default '',
  followers text not null default '',
  count integer not null default 0,
  tags text[] not null default '{}',
  brand text not null default '기타',
  start_date text not null default '',
  end_date text not null default '',
  status text not null default 'active',
  color text not null default '#e8a0a8',
  created_at timestamptz not null default now()
);

alter table influencers enable row level security;
drop policy if exists "Allow all" on influencers;
create policy "Allow all" on influencers for all using (true) with check (true);

-- ── 프로젝트/캠페인 ──
create table if not exists projects (
  id bigint primary key,
  name text not null default '',
  brand text not null default '기타',
  description text not null default '',
  start_date text not null default '',
  due_date text not null default '',
  progress integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

alter table projects enable row level security;
drop policy if exists "Allow all" on projects;
create policy "Allow all" on projects for all using (true) with check (true);

-- ── 회사 일정 (캘린더) ──
create table if not exists calendar_events (
  id bigint primary key,
  date_key text not null,
  title text not null default '',
  time text not null default '',
  cat text not null default '기타',
  created_at timestamptz not null default now()
);

alter table calendar_events enable row level security;
drop policy if exists "Allow all" on calendar_events;
create policy "Allow all" on calendar_events for all using (true) with check (true);

-- ── 정산/매출 ──
create table if not exists settlements (
  id bigint primary key,
  name text not null default '',
  date text not null default '',
  type text not null default 'in',
  amount bigint not null default 0,
  brand text not null default '기타',
  memo text not null default '',
  created_at timestamptz not null default now()
);

alter table settlements enable row level security;
drop policy if exists "Allow all" on settlements;
create policy "Allow all" on settlements for all using (true) with check (true);

-- ── 팀원 관리 ──
create table if not exists team_members (
  id bigint primary key,
  name text not null default '',
  role text not null default '',
  email text not null default '',
  phone text not null default '',
  tags text[] not null default '{}',
  status text not null default 'a',
  color text not null default '#e8a0a8',
  created_at timestamptz not null default now()
);

alter table team_members enable row level security;
drop policy if exists "Allow all" on team_members;
create policy "Allow all" on team_members for all using (true) with check (true);

-- ── 메모장 ──
create table if not exists memos (
  id bigint primary key,
  title text not null default '새 메모',
  content text not null default '',
  color text not null default '#E8A0A8',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table memos enable row level security;
drop policy if exists "Allow all" on memos;
create policy "Allow all" on memos for all using (true) with check (true);

-- ── 실시간(Real-time) 활성화 ──
-- Supabase 대시보드 > Database > Replication에서 활성화하거나 아래 SQL 실행:
alter publication supabase_realtime add table influencers;
alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table calendar_events;
alter publication supabase_realtime add table settlements;
alter publication supabase_realtime add table team_members;
alter publication supabase_realtime add table memos;
