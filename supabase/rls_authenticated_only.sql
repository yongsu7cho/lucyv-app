-- ─────────────────────────────────────────────────────────────
-- RLS: 로그인한 사용자(authenticated)만 접근 가능하도록 전 테이블 잠금
--
-- 실행 순서:
--   1. 앱에 AuthGate(Supabase Auth 로그인)가 배포된 뒤에 실행
--   2. Supabase 대시보드 → SQL Editor → 이 파일 전체 붙여넣고 Run
--   3. Authentication → Providers → Email → "Allow new users to sign up" OFF
--   4. Authentication → Users → "Add user" 로 직원 계정 생성 (Auto Confirm 체크)
--
-- 실행 후 Security Advisor 의 RLS Disabled / Policy Always True 경고가 사라짐.
-- ─────────────────────────────────────────────────────────────

-- 테이블 목록 (새 테이블 추가 시 여기에 이름만 추가)
do $$
declare
  t text;
  tables text[] := array[
    'influencers',
    'projects',
    'calendar_events',
    'settlements',
    'team_members',
    'memos',
    'brand_sales',
    'calendar_cache',
    'personal_notes',
    'notices',
    'file_folders',
    'settlement_projects',
    'settlement_daily',
    'settlement_influencers'
  ];
begin
  foreach t in array tables loop
    -- 테이블이 없으면 건너뜀 (환경마다 존재 여부가 다를 수 있음)
    if to_regclass('public.' || t) is null then
      raise notice 'skip: public.% does not exist', t;
      continue;
    end if;

    execute format('alter table public.%I enable row level security', t);

    -- 기존 "누구나 허용" 정책 제거 (대소문자 변형 모두)
    execute format('drop policy if exists "Allow all" on public.%I', t);
    execute format('drop policy if exists "allow all" on public.%I', t);
    execute format('drop policy if exists "authenticated_all" on public.%I', t);

    -- 로그인한 사용자만 read/write
    execute format(
      'create policy "authenticated_all" on public.%I
         for all to authenticated
         using (true) with check (true)',
      t
    );

    raise notice 'locked: public.%', t;
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────
-- Storage: 'files' 버킷도 로그인 사용자만 접근
-- ─────────────────────────────────────────────────────────────
drop policy if exists "files_authenticated_select" on storage.objects;
drop policy if exists "files_authenticated_insert" on storage.objects;
drop policy if exists "files_authenticated_update" on storage.objects;
drop policy if exists "files_authenticated_delete" on storage.objects;

create policy "files_authenticated_select" on storage.objects
  for select to authenticated using (bucket_id = 'files');
create policy "files_authenticated_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'files');
create policy "files_authenticated_update" on storage.objects
  for update to authenticated using (bucket_id = 'files') with check (bucket_id = 'files');
create policy "files_authenticated_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'files');

-- 참고: 'files' 버킷이 Public 으로 설정돼 있다면 Storage → files → Settings 에서
-- Public bucket 을 OFF 로 바꿔야 URL 직접 접근이 막힘.
-- (OFF 로 바꾸면 getPublicUrl 대신 createSignedUrl 을 써야 파일이 열림 — FilePage 확인 필요)
