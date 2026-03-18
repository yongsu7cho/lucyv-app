-- ──────────────────────────────────────────────────────────────
-- calendar_cache: Google Calendar 이벤트 캐시
--   id        : UUID PK (자동 생성)
--   key       : 문자열 식별자 (예: "calendar-2026-03", "today-events")
--   events    : 이벤트 배열 (jsonb)
--   cached_at : 마지막 저장 시각
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calendar_cache (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key        TEXT        UNIQUE NOT NULL,
  events     JSONB       NOT NULL DEFAULT '[]'::jsonb,
  cached_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE calendar_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON calendar_cache FOR ALL USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE calendar_cache;

-- ──────────────────────────────────────────────────────────────
-- personal_notes: 날짜별 개인 메모
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS personal_notes (
  id          BIGSERIAL   PRIMARY KEY,
  user_email  TEXT        NOT NULL,
  date        DATE        NOT NULL,
  content     TEXT        NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_email, date)
);

ALTER TABLE personal_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON personal_notes FOR ALL USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────
-- notices: 대시보드 공지사항
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notices (
  id          BIGSERIAL   PRIMARY KEY,
  content     TEXT        NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON notices FOR ALL USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────
-- file_folders: 파일함 폴더 메타데이터
--   id         : UUID PK
--   name       : 폴더 이름
--   password   : 비밀번호 (null이면 잠금 없음)
--   created_at : 생성 시각
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS file_folders (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  password   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE file_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON file_folders FOR ALL USING (true) WITH CHECK (true);

-- Supabase Storage 버킷 "files" 는 대시보드에서 수동 생성 필요:
-- Storage → New bucket → Name: "files" → Public: false
