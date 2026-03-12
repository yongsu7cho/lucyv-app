-- ──────────────────────────────────────────────────────────────
-- calendar_cache: Google Calendar 이벤트 월별 캐시
--   id         : 캐시 키 (예: "calendar-2026-03", UUID for dashboard today-cache)
--   events     : 이벤트 배열 (jsonb)
--   cached_at  : 마지막 저장 시각
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calendar_cache (
  id         TEXT        PRIMARY KEY,
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
