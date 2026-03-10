'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { dk } from '../constants';

// ── Google Calendar event shape (from API) ──────────────────────────────────
interface GCalEvent {
  id: string;
  summary?: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end:   { dateTime?: string; date?: string };
  colorId?: string;
  calendarColor?:   string;
  calendarSummary?: string;
  calendarId?:      string;
  isPrimary?: boolean;
}

type GCalMap = Record<string, GCalEvent[]>;

interface EventFormState {
  calendarId:  string;
  summary:     string;
  description: string;
  date:        string;
  allDay:      boolean;
  startTime:   string;
  endTime:     string;
}

type CalendarSource = { id: string; summary: string; color?: string };

const GCOLOR: Record<string, string> = {
  '1': '#7986CB', '2': '#33B679', '3': '#8E24AA', '4': '#E67C73',
  '5': '#F6BF26', '6': '#F4511E', '7': '#039BE5', '8': '#9E9E9E',
  '9': '#3F51B5', '10': '#0B8043', '11': '#D50000',
};

const DEFAULT_EVENT_COLOR = '#e8a0a8';

function eventColor(ev: GCalEvent): string {
  if (ev.colorId) return GCOLOR[ev.colorId] ?? DEFAULT_EVENT_COLOR;
  if (ev.calendarColor) return ev.calendarColor;
  return DEFAULT_EVENT_COLOR;
}

function eventDate(ev: GCalEvent): string {
  return (ev.start.dateTime ?? ev.start.date ?? '').slice(0, 10);
}

function extractTime(dt: string | undefined): string {
  if (!dt) return '09:00';
  const d = new Date(dt);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function eventTimeKo(ev: GCalEvent): string {
  if (!ev.start.dateTime) return '';
  const d = new Date(ev.start.dateTime);
  const h = d.getHours(), m = d.getMinutes();
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${ampm} ${h12}시` : `${ampm} ${h12}시 ${m}분`;
}

function dateLabelKo(key: string, day: number): string {
  if (!key || day !== 1) return String(day);
  const m = parseInt(key.split('-')[1] ?? '1');
  return `${m}월 1일`;
}

function groupByDate(items: GCalEvent[]): GCalMap {
  const map: GCalMap = {};
  for (const ev of items) {
    const d = eventDate(ev);
    if (!map[d]) map[d] = [];
    map[d].push(ev);
  }
  return map;
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

// ── Main exported component ─────────────────────────────────────────────────
export default function CalendarPage() {
  return (
    <div className="fade-in">
      <GoogleCalendarTab />
    </div>
  );
}

// ── Google Calendar Tab ─────────────────────────────────────────────────────
function GoogleCalendarTab() {
  const now = new Date();

  const [authStatus, setAuthStatus] = useState<{ connected: boolean; email: string | null }>({ connected: false, email: null });
  const [statusLoading, setStatusLoading] = useState(true);
  const [gcalMap,       setGcalMap]       = useState<GCalMap>({});
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError,   setEventsError]   = useState<string | null>(null);
  const [authError,     setAuthError]     = useState<string | null>(null);

  const [calY, setCalY] = useState(now.getFullYear());
  const [calM, setCalM] = useState(now.getMonth());
  const [selDay, setSelDay] = useState(dk(now));

  const [eventModal, setEventModal] = useState<{ mode: 'new' | 'edit'; event?: GCalEvent; date?: string } | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [modalError,  setModalError]  = useState<string | null>(null);

  const calendarList: CalendarSource[] = (() => {
    const seen = new Map<string, CalendarSource>();
    for (const evs of Object.values(gcalMap)) {
      for (const ev of evs) {
        if (ev.calendarId && !seen.has(ev.calendarId)) {
          seen.set(ev.calendarId, { id: ev.calendarId, summary: ev.calendarSummary ?? ev.calendarId, color: ev.calendarColor });
        }
      }
    }
    if (!seen.size) seen.set('primary', { id: 'primary', summary: '내 캘린더' });
    return [...seen.values()];
  })();

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      setAuthStatus({ connected: data.connected, email: data.email ?? null });
    } catch {
      setAuthStatus({ connected: false, email: null });
    } finally {
      setStatusLoading(false);
    }
  }, []);

  const fetchGcalEvents = useCallback(async (y: number, m: number) => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      const timeMin = new Date(y, m, 1).toISOString();
      const timeMax = new Date(y, m + 1, 0, 23, 59, 59).toISOString();
      const res  = await fetch(`/api/calendar/events?timeMin=${timeMin}&timeMax=${timeMax}`);
      const data = await res.json();

      if (res.status === 401) {
        setAuthStatus({ connected: false, email: null });
        setAuthError('인증이 만료되었어요. 다시 연동해주세요.');
        return;
      }
      if (!res.ok) {
        const apiMsg = data?.message ?? '';
        if (apiMsg.toLowerCase().includes('calendar api has not been used') || apiMsg.toLowerCase().includes('disabled')) {
          setEventsError('Google Calendar API가 활성화되어 있지 않아요. Google Cloud Console에서 Calendar API를 활성화해주세요.');
        } else {
          setEventsError(`일정을 불러오지 못했어요. (${apiMsg || res.status})`);
        }
        return;
      }
      setGcalMap(groupByDate((data.items ?? []) as GCalEvent[]));
    } catch {
      setEventsError('일정을 불러오는 데 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gcal = params.get('gcal');
    const err  = params.get('error');
    if (gcal || err) {
      window.history.replaceState({}, '', '/');
      if (err) {
        const errMessages: Record<string, string> = {
          auth_failed:           '구글 로그인이 취소되었거나 실패했어요.',
          missing_credentials:   'GOOGLE_CLIENT_SECRET 환경변수가 설정되지 않았습니다.',
          token_exchange_failed: '구글 서버와 통신에 실패했어요.',
          no_access_token:       '구글 인증은 성공했지만 토큰을 받지 못했어요.',
        };
        setAuthError(errMessages[err] ?? `구글 로그인에 실패했어요. (오류 코드: ${err})`);
      }
    }
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    if (authStatus.connected) fetchGcalEvents(calY, calM);
  }, [authStatus.connected, calY, calM, fetchGcalEvents]);

  function changeMonth(delta: number) {
    let m = calM + delta, y = calY;
    if (m > 11) { m = 0; y++; }
    if (m < 0)  { m = 11; y--; }
    setCalM(m); setCalY(y);
  }

  function handleConnect() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setAuthError('NEXT_PUBLIC_GOOGLE_CLIENT_ID 환경변수가 설정되지 않았습니다.');
      return;
    }
    const params = new URLSearchParams({
      client_id:     clientId,
      redirect_uri:  `${window.location.origin}/api/auth/callback/google`,
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/userinfo.email',
      ].join(' '),
      access_type: 'offline',
      prompt:      'consent',
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async function handleDisconnect() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthStatus({ connected: false, email: null });
    setGcalMap({});
    setAuthError(null);
  }

  async function handleSaveEvent(form: EventFormState) {
    setSubmitting(true);
    setModalError(null);

    const tz  = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const nextDay = (() => {
      const d = new Date(form.date + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      return d.toISOString().slice(0, 10);
    })();

    const start = form.allDay
      ? { date: form.date }
      : { dateTime: `${form.date}T${form.startTime}:00`, timeZone: tz };
    const end = form.allDay
      ? { date: nextDay }
      : { dateTime: `${form.date}T${form.endTime}:00`, timeZone: tz };

    const isEdit = eventModal?.mode === 'edit' && eventModal.event;
    const method = isEdit ? 'PATCH' : 'POST';
    const body   = isEdit
      ? { calendarId: eventModal!.event!.calendarId, eventId: eventModal!.event!.id, summary: form.summary, description: form.description || undefined, start, end }
      : { calendarId: form.calendarId, summary: form.summary, description: form.description || undefined, start, end };

    try {
      const res = await fetch('/api/calendar/events', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setEventModal(null);
        fetchGcalEvents(calY, calM);
      } else {
        const data = await res.json().catch(() => ({}));
        setModalError(
          res.status === 403
            ? '쓰기 권한이 없어요. 연동 해제 후 다시 연동해주세요.'
            : data.error ?? '저장에 실패했어요.'
        );
      }
    } catch {
      setModalError('네트워크 오류가 발생했어요.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteEvent() {
    if (!eventModal?.event) return;
    if (!confirm('이 일정을 삭제하시겠어요?')) return;
    setSubmitting(true);
    setModalError(null);
    try {
      const res = await fetch('/api/calendar/events', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarId: eventModal.event.calendarId, eventId: eventModal.event.id }),
      });
      if (res.ok) {
        setEventModal(null);
        fetchGcalEvents(calY, calM);
      } else {
        const data = await res.json().catch(() => ({}));
        setModalError(
          res.status === 403
            ? '삭제 권한이 없어요. 연동 해제 후 다시 연동해주세요.'
            : data.error ?? '삭제에 실패했어요.'
        );
      }
    } catch {
      setModalError('네트워크 오류가 발생했어요.');
    } finally {
      setSubmitting(false);
    }
  }

  if (statusLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 2, color: 'var(--text3)' }}>
          연결 상태 확인 중...
        </div>
      </div>
    );
  }

  if (!authStatus.connected) {
    return <GoogleConnectUI onConnect={handleConnect} error={authError} />;
  }

  const todayKey = dk(now);
  const first   = new Date(calY, calM, 1).getDay();
  const dim     = new Date(calY, calM + 1, 0).getDate();
  const prevDim = new Date(calY, calM, 0).getDate();

  const days: { key: string; day: number; outside: boolean }[] = [];
  for (let i = 0; i < first; i++) days.push({ key: '', day: prevDim - first + i + 1, outside: true });
  for (let d = 1; d <= dim; d++) {
    const key = `${calY}-${String(calM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ key, day: d, outside: false });
  }
  const rem = (first + dim) % 7;
  if (rem > 0) for (let i = 1; i <= 7 - rem; i++) days.push({ key: '', day: i, outside: true });

  const calSources = Array.from(
    new Map(Object.values(gcalMap).flat().map(ev => [ev.calendarSummary, ev.calendarColor]))
  ).slice(0, 6);

  return (
    <>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Left: Google Calendar */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <GcalConnectedView
            calY={calY} calM={calM} days={days} gcalMap={gcalMap}
            todayKey={todayKey} selDay={selDay} calSources={calSources}
            eventsLoading={eventsLoading} eventsError={eventsError}
            email={authStatus.email}
            onPrev={() => changeMonth(-1)}
            onNext={() => changeMonth(1)}
            onToday={() => { setCalY(now.getFullYear()); setCalM(now.getMonth()); setSelDay(dk(now)); }}
            onDisconnect={handleDisconnect}
            onDayClick={d => setSelDay(d)}
            onSelectEvent={ev => { setModalError(null); setEventModal({ mode: 'edit', event: ev }); }}
            onNewEvent={date => { setModalError(null); setEventModal({ mode: 'new', date }); }}
          />
        </div>

        {/* Right: Personal notes panel */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <PersonalNotesPanel
            selDay={selDay}
            userEmail={authStatus.email ?? 'default'}
          />
        </div>
      </div>

      {eventModal && (
        <EventFormModal
          mode={eventModal.mode}
          initialEvent={eventModal.event}
          initialDate={eventModal.date ?? todayStr()}
          calendarList={calendarList}
          submitting={submitting}
          error={modalError}
          onSave={handleSaveEvent}
          onDelete={eventModal.mode === 'edit' ? handleDeleteEvent : undefined}
          onCancel={() => { setEventModal(null); setModalError(null); }}
        />
      )}
    </>
  );
}

// ── Personal Notes Panel ────────────────────────────────────────────────────
function PersonalNotesPanel({ selDay, userEmail }: { selDay: string; userEmail: string }) {
  const [content,   setContent]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const currentDay = useRef(selDay);

  useEffect(() => {
    currentDay.current = selDay;
    setLoading(true);
    setSaved(false);
    setSaveError(null);
    supabase
      .from('personal_notes')
      .select('content')
      .eq('user_email', userEmail)
      .eq('date', selDay)
      .maybeSingle()
      .then(({ data }) => {
        if (currentDay.current === selDay) {
          setContent(data?.content ?? '');
          setLoading(false);
        }
      });
  }, [selDay, userEmail]);

  async function save(text: string) {
    setSaved(false);
    setSaveError(null);
    const { error } = await supabase
      .from('personal_notes')
      .upsert(
        { user_email: userEmail, date: selDay, content: text, updated_at: new Date().toISOString() },
        { onConflict: 'user_email,date' }
      );
    if (error) setSaveError('저장 실패');
    else setSaved(true);
  }

  const [selY, selMon, selD] = selDay.split('-');

  return (
    <div className="card" style={{ position: 'sticky', top: 16 }}>
      <div className="card-head">
        <div className="card-title" style={{ fontSize: 13 }}>
          📝 {parseInt(selY)}년 {parseInt(selMon)}월 {parseInt(selD)}일
        </div>
        {saved && <span style={{ fontSize: 10, color: 'var(--success)', fontFamily: "'DM Mono', monospace" }}>저장됨 ✓</span>}
        {saveError && <span style={{ fontSize: 10, color: 'var(--danger)' }}>{saveError}</span>}
      </div>
      <div className="card-body">
        {loading ? (
          <div style={{ fontSize: 11, color: 'var(--text3)', padding: '8px 0' }}>불러오는 중...</div>
        ) : (
          <textarea
            className="input"
            value={content}
            onChange={e => { setContent(e.target.value); setSaved(false); }}
            onBlur={e => save(e.target.value)}
            placeholder="이날의 메모를 입력하세요..."
            rows={14}
            style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 12, width: '100%', lineHeight: 1.7 }}
          />
        )}
        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 6 }}>
          포커스 해제 시 자동저장
        </div>
      </div>
    </div>
  );
}

// ── Connect UI ──────────────────────────────────────────────────────────────
function GoogleConnectUI({ onConnect, error }: { onConnect: () => void; error: string | null }) {
  const credentialsReady = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {error && (
        <div style={{ padding: '10px 16px', background: 'rgba(232,112,112,0.08)', border: '1px solid rgba(232,112,112,0.2)', borderRadius: 10, fontSize: 12, color: 'var(--danger)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span>⚠</span><span>{error}</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text3)', paddingLeft: 20 }}>
            Google Cloud Console → OAuth 2.0 → 승인된 리디렉션 URI에&nbsp;
            <code style={{ fontFamily: "'DM Mono', monospace" }}>
              {typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/callback/google
            </code>
            &nbsp;이 등록되어 있는지 확인하세요.
          </div>
        </div>
      )}

      <div className="gcal-connect-box">
        <div className="gcal-icon">📝</div>
        <div className="gcal-connect-title">구글 캘린더 + 개인 메모</div>
        <div className="gcal-connect-desc">
          구글 계정으로 로그인하면 내 구글 캘린더의 일정을 확인하고, 날짜별 개인 메모를 작성할 수 있습니다.
        </div>

        {credentialsReady ? (
          <>
            <div className="gcal-steps">
              <div className="gcal-step"><div className="gcal-step-num">1</div><div>아래 버튼을 클릭해 구글 계정으로 로그인하세요</div></div>
              <div className="gcal-step"><div className="gcal-step-num">2</div><div>캘린더 접근 권한을 허용하세요 <span style={{ color: 'var(--text3)' }}>(읽기/쓰기)</span></div></div>
              <div className="gcal-step"><div className="gcal-step-num">3</div><div>연동 후 날짜를 클릭하면 개인 메모를 작성할 수 있습니다</div></div>
            </div>
            <button className="btn btn-google" onClick={onConnect}
              style={{ width: '100%', justifyContent: 'center', padding: '11px 16px', fontSize: 13, gap: 10 }}>
              <GoogleIcon />Google 계정으로 연동하기
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'left' }}>
            <div style={{ padding: '12px 16px', background: 'rgba(232,112,112,0.06)', border: '1px solid rgba(232,112,112,0.2)', borderRadius: 10, marginBottom: 16, fontSize: 12, color: 'var(--danger)' }}>
              ⚠ 환경변수가 설정되지 않았습니다.
            </div>
            <div className="gcal-steps">
              <div className="gcal-step"><div className="gcal-step-num">1</div><div><a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rose2)' }}>Google Cloud Console</a>에서 <strong>Google Calendar API</strong> 활성화</div></div>
              <div className="gcal-step"><div className="gcal-step-num">2</div><div>OAuth 2.0 클라이언트 ID 생성, 리디렉션 URI:&nbsp;
                <code style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--rose2)' }}>
                  {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/auth/callback/google
                </code>
              </div></div>
              <div className="gcal-step"><div className="gcal-step-num">3</div><div>
                <code style={{ fontFamily: "'DM Mono', monospace", fontSize: 10 }}>.env.local</code> 파일:
                <pre style={{ marginTop: 8, padding: '8px 12px', background: 'var(--surface3)', borderRadius: 6, fontSize: 10, fontFamily: "'DM Mono', monospace", color: 'var(--text2)', overflowX: 'auto', lineHeight: 1.8 }}>
{`NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx`}
                </pre>
              </div></div>
            </div>
            <button className="btn btn-ghost" disabled
              style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 12, marginTop: 8, opacity: 0.5, cursor: 'not-allowed' }}>
              <GoogleIcon />Google 계정으로 연동하기 (환경변수 설정 필요)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── GcalConnectedView ───────────────────────────────────────────────────────
interface GcalConnectedViewProps {
  calY: number; calM: number;
  days: { key: string; day: number; outside: boolean }[];
  gcalMap: GCalMap;
  todayKey: string;
  selDay: string;
  calSources: [string | undefined, string | undefined][];
  eventsLoading: boolean;
  eventsError: string | null;
  email: string | null;
  onPrev:        () => void;
  onNext:        () => void;
  onToday:       () => void;
  onDisconnect:  () => void;
  onDayClick:    (date: string) => void;
  onSelectEvent: (ev: GCalEvent) => void;
  onNewEvent:    (date: string)  => void;
}

function GcalConnectedView({
  calY, calM, days, gcalMap, todayKey, selDay, calSources,
  eventsLoading, eventsError, email,
  onPrev, onNext, onToday, onDisconnect,
  onDayClick, onSelectEvent, onNewEvent,
}: GcalConnectedViewProps) {
  const today = todayStr();

  return (
    <div className="gcal-white">
      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--success)', fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>
            구글 캘린더 연동됨
          </span>
          {email && <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>· {email}</span>}
          {eventsLoading && <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>· 동기화 중...</span>}
        </div>
        <button className="btn btn-danger btn-sm" onClick={onDisconnect}>연동 해제</button>
      </div>

      {/* Legend */}
      {calSources.length > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          {calSources.map(([name, color]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color ?? DEFAULT_EVENT_COLOR, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'var(--text2)' }}>{name}</span>
            </div>
          ))}
        </div>
      )}

      {eventsError && (
        <div style={{ marginBottom: 12, padding: '8px 14px', background: 'rgba(232,112,112,0.08)', border: '1px solid rgba(232,112,112,0.2)', borderRadius: 8, fontSize: 12, color: 'var(--danger)' }}>
          {eventsError}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="cal-nav-btn" onClick={onPrev}>‹</button>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, letterSpacing: 0.5, color: '#111' }}>
            {calY}년 {calM + 1}월
          </div>
          <button className="cal-nav-btn" onClick={onNext}>›</button>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={onToday}>오늘</button>
          <button className="btn btn-rose btn-sm" onClick={() => onNewEvent(today)}>+ 일정 추가</button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="gcal-white-grid">
        {['일','월','화','수','목','금','토'].map((d, i) => (
          <div key={d} className="gcal-white-dname" style={{ color: i === 0 ? '#d32f2f' : i === 6 ? '#1565c0' : '#555' }}>
            {d}
          </div>
        ))}

        {days.map((d, idx) => {
          const isToday = d.key === todayKey;
          const isSel   = d.key === selDay && !d.outside;
          const dayEvs  = d.key
            ? (gcalMap[d.key] ?? []).slice().sort((a, b) =>
                (a.start.dateTime ?? a.start.date ?? '').localeCompare(b.start.dateTime ?? b.start.date ?? '')
              )
            : [];
          const MAX_SHOWN = 3;
          const shown    = dayEvs.slice(0, MAX_SHOWN);
          const overflow = dayEvs.length - MAX_SHOWN;

          return (
            <div
              key={idx}
              className={['gcal-white-day', d.outside ? 'om' : '', isSel ? 'sel' : ''].filter(Boolean).join(' ')}
              onClick={() => { if (!d.outside && d.key) onDayClick(d.key); }}
              style={{ cursor: d.outside ? 'default' : 'pointer' }}
            >
              <div className={['gcal-white-num', isToday ? 'today' : ''].filter(Boolean).join(' ')}>
                {dateLabelKo(d.key, d.day)}
              </div>

              {shown.map(ev => {
                const color   = eventColor(ev);
                const timeStr = eventTimeKo(ev);
                return (
                  <div
                    key={ev.id}
                    className="gcal-white-ev"
                    title={`${timeStr} ${ev.summary ?? ''}`}
                    onClick={e => { e.stopPropagation(); onSelectEvent(ev); }}
                    style={{ cursor: 'pointer' }}
                  >
                    <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 1 }} />
                    <span className="gcal-white-ev-text">
                      {timeStr && <span style={{ color: '#555', marginRight: 2 }}>{timeStr}</span>}
                      {ev.summary ?? '(제목 없음)'}
                    </span>
                  </div>
                );
              })}
              {overflow > 0 && <div className="gcal-white-more">+{overflow}개 더보기</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Event Form Modal ────────────────────────────────────────────────────────
interface EventFormModalProps {
  mode:          'new' | 'edit';
  initialEvent?: GCalEvent;
  initialDate:   string;
  calendarList:  CalendarSource[];
  submitting:    boolean;
  error:         string | null;
  onSave:   (form: EventFormState) => void;
  onDelete?: () => void;
  onCancel:  () => void;
}

function EventFormModal({
  mode, initialEvent, initialDate, calendarList,
  submitting, error, onSave, onDelete, onCancel,
}: EventFormModalProps) {
  const isAllDay = !initialEvent?.start.dateTime;

  const [form, setForm] = useState<EventFormState>({
    calendarId:  initialEvent?.calendarId  ?? calendarList[0]?.id ?? 'primary',
    summary:     initialEvent?.summary     ?? '',
    description: initialEvent?.description ?? '',
    date:        initialEvent ? eventDate(initialEvent) : initialDate,
    allDay:      initialEvent ? isAllDay : false,
    startTime:   initialEvent ? extractTime(initialEvent.start.dateTime) : '09:00',
    endTime:     initialEvent ? extractTime(initialEvent.end?.dateTime)  : '10:00',
  });

  const set = <K extends keyof EventFormState>(k: K, v: EventFormState[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="card" style={{ width: 420, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="card-head" style={{ justifyContent: 'space-between' }}>
          <div className="card-title">{mode === 'new' ? '+ 새 일정' : '✎ 일정 수정'}</div>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>✕</button>
        </div>

        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'new' && calendarList.length > 1 && (
            <div>
              <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>캘린더</label>
              <select className="input" value={form.calendarId} onChange={e => set('calendarId', e.target.value)}>
                {calendarList.map(c => <option key={c.id} value={c.id}>{c.summary}</option>)}
              </select>
            </div>
          )}

          <div>
            <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>제목 *</label>
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <input className="input" placeholder="일정 제목" value={form.summary}
              onChange={e => set('summary', e.target.value)}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter' && form.summary.trim()) onSave(form); }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>날짜</label>
            <input type="date" className="input" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12 }}>
            <input type="checkbox" checked={form.allDay} onChange={e => set('allDay', e.target.checked)} />
            하루 종일
          </label>

          {!form.allDay && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>시작 시간</label>
                <input type="time" className="input" value={form.startTime} onChange={e => set('startTime', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>종료 시간</label>
                <input type="time" className="input" value={form.endTime} onChange={e => set('endTime', e.target.value)} />
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>설명</label>
            <textarea className="input" placeholder="설명 (선택)" rows={3}
              value={form.description} onChange={e => set('description', e.target.value)}
              style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }}
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: 'var(--danger)', padding: '8px 12px', background: 'rgba(232,112,112,0.08)', borderRadius: 8 }}>
              ⚠ {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <div>
              {mode === 'edit' && onDelete && (
                <button className="btn btn-danger btn-sm" onClick={onDelete} disabled={submitting}>
                  삭제
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={onCancel} disabled={submitting}>취소</button>
              <button className="btn btn-rose" onClick={() => onSave(form)}
                disabled={submitting || !form.summary.trim()}>
                {submitting ? '저장 중…' : mode === 'new' ? '추가' : '저장'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Google Icon ─────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
