'use client';
import { useState, useEffect, useCallback } from 'react';
import { MONTHS_EN, CAT_COL, dk } from '../constants';
import type { CalendarEventMap, CalendarEvent, EventCategory } from '../types';

interface CalendarPageProps {
  events: CalendarEventMap;
  setEvents: (e: CalendarEventMap) => void;
}

// Google Calendar event shape (from API)
interface GCalEvent {
  id: string;
  summary?: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  colorId?: string;
  calendarColor?: string;
  calendarSummary?: string;
  isPrimary?: boolean;
}

type GCalMap = Record<string, GCalEvent[]>;

// Google's colorId → hex (official palette)
const GCOLOR: Record<string, string> = {
  '1': '#7986CB', '2': '#33B679', '3': '#8E24AA', '4': '#E67C73',
  '5': '#F6BF26', '6': '#F4511E', '7': '#039BE5', '8': '#9E9E9E',
  '9': '#3F51B5', '10': '#0B8043', '11': '#D50000',
};

function eventColor(ev: GCalEvent): string {
  if (ev.colorId) return GCOLOR[ev.colorId] ?? 'var(--rose)';
  if (ev.calendarColor) return ev.calendarColor;
  return 'var(--rose)';
}

function eventDate(ev: GCalEvent): string {
  return (ev.start.dateTime ?? ev.start.date ?? '').slice(0, 10);
}

function eventTime(ev: GCalEvent): string {
  if (!ev.start.dateTime) return '하루 종일';
  const d = new Date(ev.start.dateTime);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
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

// ────────────────────────────────────────────
export default function CalendarPage({ events, setEvents }: CalendarPageProps) {
  const [calTab, setCalTab] = useState<'company' | 'google'>('company');

  // Switch to Google tab when OAuth redirects back
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('gcal') === 'connected' || p.has('error')) {
      setCalTab('google');
    }
  }, []);

  return (
    <div className="fade-in">
      <div className="cal-tabs">
        <div
          className={`cal-tab${calTab === 'company' ? ' active' : ''}`}
          onClick={() => setCalTab('company')}
        >
          ◷ 회사 일정
        </div>
        <div
          className={`cal-tab${calTab === 'google' ? ' active' : ''}`}
          onClick={() => setCalTab('google')}
        >
          ⊕ 구글 캘린더
        </div>
      </div>

      {calTab === 'company' ? (
        <CompanyCalendar events={events} setEvents={setEvents} />
      ) : (
        <GoogleCalendarTab />
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// COMPANY CALENDAR (unchanged logic)
// ────────────────────────────────────────────
function CompanyCalendar({
  events,
  setEvents,
}: {
  events: CalendarEventMap;
  setEvents: (e: CalendarEventMap) => void;
}) {
  const now = new Date();
  const [calY, setCalY] = useState(now.getFullYear());
  const [calM, setCalM] = useState(now.getMonth());
  const [selDay, setSelDay] = useState(dk(now));
  const [evTitle, setEvTitle] = useState('');
  const [evTime, setEvTime] = useState('');
  const [evCat, setEvCat] = useState<EventCategory>('공구');

  function changeMonth(delta: number) {
    let m = calM + delta;
    let y = calY;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setCalM(m); setCalY(y);
  }

  function addEvent() {
    if (!evTitle.trim()) return;
    const ev: CalendarEvent = { id: Date.now(), title: evTitle, time: evTime, cat: evCat };
    setEvents({ ...events, [selDay]: [...(events[selDay] ?? []), ev] });
    setEvTitle(''); setEvTime('');
  }

  function deleteEvent(key: string, id: number) {
    setEvents({ ...events, [key]: (events[key] ?? []).filter(e => e.id !== id) });
  }

  const first = new Date(calY, calM, 1).getDay();
  const dim = new Date(calY, calM + 1, 0).getDate();
  const prevDim = new Date(calY, calM, 0).getDate();
  const todayKey = dk(now);

  const days: { key: string; day: number; outside: boolean }[] = [];
  for (let i = 0; i < first; i++) days.push({ key: '', day: prevDim - first + i + 1, outside: true });
  for (let d = 1; d <= dim; d++) {
    const key = `${calY}-${String(calM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ key, day: d, outside: false });
  }
  const rem = (first + dim) % 7;
  if (rem > 0) for (let i = 1; i <= 7 - rem; i++) days.push({ key: '', day: i, outside: true });

  const selEvs = (events[selDay] ?? []).slice().sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
  const [selY, selMon, selD] = selDay.split('-');

  return (
    <div className="cal-wrap">
      <div>
        <div className="cal-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="cal-nav-btn" onClick={() => changeMonth(-1)}>‹</button>
            <div className="cal-mo">{MONTHS_EN[calM]} {calY}</div>
            <button className="cal-nav-btn" onClick={() => changeMonth(1)}>›</button>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => { setCalY(now.getFullYear()); setCalM(now.getMonth()); setSelDay(dk(now)); }}>
            오늘
          </button>
        </div>
        <div className="cal-dnames">
          {['SUN','MON','TUE','WED','THU','FRI','SAT'].map((d, i) => (
            <div key={d} className="cal-dname" style={{ color: i === 0 ? 'var(--rose)' : i === 6 ? 'var(--lavender)' : undefined }}>{d}</div>
          ))}
        </div>
        <div className="cal-days-grid">
          {days.map((d, idx) => {
            const isToday = d.key === todayKey;
            const isSel = d.key === selDay && !isToday;
            const hasEv = !!d.key && (events[d.key] ?? []).length > 0;
            const cls = ['cday', d.outside ? 'om' : '', isToday ? 'today' : '', isSel ? 'sel' : '', hasEv ? 'hev' : ''].filter(Boolean).join(' ');
            return (
              <div key={idx} className={cls} onClick={() => { if (!d.outside && d.key) setSelDay(d.key); }}>
                {d.day}
              </div>
            );
          })}
        </div>
      </div>

      <div className="ev-panel">
        <div className="ev-date-lbl">{parseInt(selY)}년 {parseInt(selMon)}월 {parseInt(selD)}일</div>
        <div className="ev-form">
          <input className="input" placeholder="일정 제목" value={evTitle}
            onChange={e => setEvTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addEvent(); }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input className="input" type="time" value={evTime} onChange={e => setEvTime(e.target.value)} />
            <select className="input" value={evCat} onChange={e => setEvCat(e.target.value as EventCategory)}>
              <option value="공구">공구</option>
              <option value="캠페인">캠페인</option>
              <option value="전시">전시</option>
              <option value="미팅">미팅</option>
              <option value="기타">기타</option>
            </select>
          </div>
          <button className="btn btn-rose" onClick={addEvent} style={{ width: '100%' }}>+ 일정 추가</button>
        </div>
        {selEvs.length === 0 ? (
          <div className="empty" style={{ padding: '24px 0' }}>
            <div className="empty-icon" style={{ fontSize: 24 }}>◷</div>
            <p>일정이 없어요</p>
          </div>
        ) : (
          selEvs.map(ev => (
            <div key={ev.id} className="ev-item" style={{ borderLeftColor: CAT_COL[ev.cat] ?? 'var(--rose)' }}>
              <div>
                <div className="ev-time">
                  {ev.time || '시간 미정'} · <span style={{ color: CAT_COL[ev.cat] ?? 'var(--rose)' }}>{ev.cat}</span>
                </div>
                <div className="ev-title">{ev.title}</div>
              </div>
              <button className="xbtn inline" onClick={() => deleteEvent(selDay, ev.id)}>✕</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// GOOGLE CALENDAR TAB
// ────────────────────────────────────────────
function GoogleCalendarTab() {
  const [authStatus, setAuthStatus] = useState<{ connected: boolean; email: string | null }>({
    connected: false, email: null,
  });
  const [statusLoading, setStatusLoading] = useState(true);
  const [gcalMap, setGcalMap] = useState<GCalMap>({});
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const now = new Date();
  const [calY, setCalY] = useState(now.getFullYear());
  const [calM, setCalM] = useState(now.getMonth());
  const [selDay, setSelDay] = useState(dk(now));

  // ── Check auth status ──
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

  // ── Fetch Google Calendar events ──
  const fetchEvents = useCallback(async (y: number, m: number) => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      const timeMin = new Date(y, m, 1).toISOString();
      const timeMax = new Date(y, m + 1, 0, 23, 59, 59).toISOString();
      const res = await fetch(`/api/calendar/events?timeMin=${timeMin}&timeMax=${timeMax}`);

      if (res.status === 401) {
        setAuthStatus({ connected: false, email: null });
        setAuthError('인증이 만료되었어요. 다시 연동해주세요.');
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        // Calendar API 오류 (403 = API 미활성화, 기타)
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

  // On mount: check OAuth redirect + auth status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gcal = params.get('gcal');
    const err = params.get('error');

    if (gcal || err) {
      window.history.replaceState({}, '', '/');
      if (err) {
        const errMessages: Record<string, string> = {
          auth_failed: '구글 로그인이 취소되었거나 실패했어요. 다시 시도해주세요.',
          missing_credentials:
            'GOOGLE_CLIENT_SECRET 환경변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.',
          token_exchange_failed:
            '구글 서버와 통신에 실패했어요. 네트워크를 확인 후 다시 시도해주세요.',
          no_access_token:
            '구글 인증은 성공했지만 토큰을 받지 못했어요. Client ID/Secret이 올바른지 확인해주세요.',
        };
        setAuthError(errMessages[err] ?? `구글 로그인에 실패했어요. (오류 코드: ${err})`);
      }
    }

    checkStatus();
  }, [checkStatus]);

  // Fetch events when connected or month changes
  useEffect(() => {
    if (authStatus.connected) fetchEvents(calY, calM);
  }, [authStatus.connected, calY, calM, fetchEvents]);

  function changeMonth(delta: number) {
    let m = calM + delta;
    let y = calY;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setCalM(m); setCalY(y);
  }

  function handleConnect() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setAuthError(
        'NEXT_PUBLIC_GOOGLE_CLIENT_ID 환경변수가 설정되지 않았습니다. ' +
        '.env.local 파일을 확인해주세요.'
      );
      return;
    }

    const redirectUri = `${window.location.origin}/api/auth/callback/google`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
      ].join(' '),
      access_type: 'offline',
      prompt: 'consent',
    });

    window.location.href =
      `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async function handleDisconnect() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthStatus({ connected: false, email: null });
    setGcalMap({});
    setAuthError(null);
  }

  // ── Loading state ──
  if (statusLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 2, color: 'var(--text3)' }}>
          연결 상태 확인 중...
        </div>
      </div>
    );
  }

  // ── Not connected ──
  if (!authStatus.connected) {
    return <GoogleConnectUI onConnect={handleConnect} error={authError} />;
  }

  // ── Calendar days ──
  const todayKey = dk(now);
  const first = new Date(calY, calM, 1).getDay();
  const dim = new Date(calY, calM + 1, 0).getDate();
  const prevDim = new Date(calY, calM, 0).getDate();

  const days: { key: string; day: number; outside: boolean }[] = [];
  for (let i = 0; i < first; i++) days.push({ key: '', day: prevDim - first + i + 1, outside: true });
  for (let d = 1; d <= dim; d++) {
    const key = `${calY}-${String(calM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ key, day: d, outside: false });
  }
  const rem = (first + dim) % 7;
  if (rem > 0) for (let i = 1; i <= 7 - rem; i++) days.push({ key: '', day: i, outside: true });

  const selEvs = (gcalMap[selDay] ?? []).slice().sort((a, b) =>
    (a.start.dateTime ?? a.start.date ?? '').localeCompare(b.start.dateTime ?? b.start.date ?? '')
  );
  const [selY, selMon, selD] = selDay.split('-');

  // Collect unique calendar sources for legend
  const calSources = Array.from(
    new Map(
      Object.values(gcalMap).flat().map(ev => [ev.calendarSummary, ev.calendarColor])
    )
  ).slice(0, 6);

  return (
    <div>
      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--success)', fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>
            구글 캘린더 연동됨
          </span>
          {authStatus.email && (
            <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>
              · {authStatus.email}
            </span>
          )}
          {eventsLoading && (
            <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>
              · 동기화 중...
            </span>
          )}
        </div>
        <button className="btn btn-danger btn-sm" onClick={handleDisconnect}>연동 해제</button>
      </div>

      {/* Calendar legend */}
      {calSources.length > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          {calSources.map(([name, color]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: color ?? 'var(--rose)', flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>{name}</span>
            </div>
          ))}
        </div>
      )}

      {eventsError && (
        <div style={{ marginBottom: 14, padding: '8px 14px', background: 'rgba(232,112,112,0.08)', border: '1px solid rgba(232,112,112,0.2)', borderRadius: 8, fontSize: 12, color: 'var(--danger)' }}>
          {eventsError}
        </div>
      )}

      {/* Calendar grid + event panel */}
      <div className="cal-wrap">
        <div>
          <div className="cal-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button className="cal-nav-btn" onClick={() => changeMonth(-1)}>‹</button>
              <div className="cal-mo">{MONTHS_EN[calM]} {calY}</div>
              <button className="cal-nav-btn" onClick={() => changeMonth(1)}>›</button>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setCalY(now.getFullYear()); setCalM(now.getMonth()); setSelDay(dk(now)); }}>
              오늘
            </button>
          </div>
          <div className="cal-dnames">
            {['SUN','MON','TUE','WED','THU','FRI','SAT'].map((d, i) => (
              <div key={d} className="cal-dname" style={{ color: i === 0 ? 'var(--rose)' : i === 6 ? 'var(--lavender)' : undefined }}>{d}</div>
            ))}
          </div>
          <div className="cal-days-grid">
            {days.map((d, idx) => {
              const isToday = d.key === todayKey;
              const isSel = d.key === selDay && !isToday;
              const evCount = d.key ? (gcalMap[d.key] ?? []).length : 0;
              const cls = ['cday', d.outside ? 'om' : '', isToday ? 'today' : '', isSel ? 'sel' : '', evCount > 0 ? 'hev' : ''].filter(Boolean).join(' ');
              return (
                <div
                  key={idx}
                  className={cls}
                  onClick={() => { if (!d.outside && d.key) setSelDay(d.key); }}
                  title={evCount > 0 ? `${evCount}개 일정` : undefined}
                >
                  {d.day}
                </div>
              );
            })}
          </div>
        </div>

        {/* Event panel for selected day */}
        <div className="ev-panel">
          <div className="ev-date-lbl">{parseInt(selY)}년 {parseInt(selMon)}월 {parseInt(selD)}일</div>
          {selEvs.length === 0 ? (
            <div className="empty" style={{ padding: '24px 0' }}>
              <div className="empty-icon" style={{ fontSize: 24 }}>📅</div>
              <p style={{ fontSize: 12 }}>구글 일정이 없어요</p>
            </div>
          ) : (
            selEvs.map(ev => {
              const color = eventColor(ev);
              return (
                <div key={ev.id} className="ev-item" style={{ borderLeftColor: color }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ev-time" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{eventTime(ev)}</span>
                      {ev.calendarSummary && !ev.isPrimary && (
                        <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: `${color}22`, color, fontFamily: "'DM Mono', monospace" }}>
                          {ev.calendarSummary}
                        </span>
                      )}
                    </div>
                    <div className="ev-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ev.summary ?? '(제목 없음)'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// CONNECT UI
// ────────────────────────────────────────────
function GoogleConnectUI({ onConnect, error }: { onConnect: () => void; error: string | null }) {
  // NEXT_PUBLIC_ vars are inlined at build time — undefined means not configured
  const credentialsReady = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {error && (
        <div style={{ padding: '10px 16px', background: 'rgba(232,112,112,0.08)', border: '1px solid rgba(232,112,112,0.2)', borderRadius: 10, fontSize: 12, color: 'var(--danger)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span>⚠</span>
            <span>{error}</span>
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
        <div className="gcal-icon">📅</div>
        <div className="gcal-connect-title">구글 캘린더 연동</div>
        <div className="gcal-connect-desc">
          구글 계정으로 로그인하면 내 구글 캘린더의 모든 일정을 자동으로 불러옵니다.
          읽기 전용으로 연동되며 데이터는 안전하게 처리됩니다.
        </div>

        {credentialsReady ? (
          /* ── Credentials configured: show real OAuth button ── */
          <>
            <div className="gcal-steps">
              <div className="gcal-step">
                <div className="gcal-step-num">1</div>
                <div>아래 버튼을 클릭해 구글 계정으로 로그인하세요</div>
              </div>
              <div className="gcal-step">
                <div className="gcal-step-num">2</div>
                <div>캘린더 접근 권한을 허용하세요 <span style={{ color: 'var(--text3)' }}>(읽기 전용)</span></div>
              </div>
              <div className="gcal-step">
                <div className="gcal-step-num">3</div>
                <div>연동 완료 후 구글 캘린더의 일정이 자동으로 표시됩니다</div>
              </div>
            </div>

            <button
              className="btn btn-google"
              onClick={onConnect}
              style={{ width: '100%', justifyContent: 'center', padding: '11px 16px', fontSize: 13, gap: 10 }}
            >
              <GoogleIcon />
              Google 계정으로 연동하기
            </button>
          </>
        ) : (
          /* ── Credentials missing: setup guide ── */
          <div style={{ textAlign: 'left' }}>
            <div style={{ padding: '12px 16px', background: 'rgba(232,112,112,0.06)', border: '1px solid rgba(232,112,112,0.2)', borderRadius: 10, marginBottom: 16, fontSize: 12, color: 'var(--danger)' }}>
              ⚠ 환경변수가 설정되지 않았습니다. 아래 단계를 따라 설정해주세요.
            </div>

            <div className="gcal-steps">
              <div className="gcal-step">
                <div className="gcal-step-num">1</div>
                <div>
                  <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--rose2)' }}>Google Cloud Console</a>에서
                  프로젝트 생성 후 <strong>Google Calendar API</strong> 활성화
                </div>
              </div>
              <div className="gcal-step">
                <div className="gcal-step-num">2</div>
                <div>
                  &ldquo;사용자 인증 정보&rdquo; → &ldquo;OAuth 2.0 클라이언트 ID&rdquo; 생성<br />
                  리디렉션 URI:&nbsp;
                  <code style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--rose2)' }}>
                    {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}
                    /api/auth/callback/google
                  </code>
                </div>
              </div>
              <div className="gcal-step">
                <div className="gcal-step-num">3</div>
                <div>
                  프로젝트 루트에 <code style={{ fontFamily: "'DM Mono', monospace", fontSize: 10 }}>.env.local</code> 파일 생성:
                  <pre style={{ marginTop: 8, padding: '8px 12px', background: 'var(--surface3)', borderRadius: 6, fontSize: 10, fontFamily: "'DM Mono', monospace", color: 'var(--text2)', overflowX: 'auto', lineHeight: 1.8 }}>
{`NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx`}
                  </pre>
                </div>
              </div>
              <div className="gcal-step">
                <div className="gcal-step-num">4</div>
                <div>
                  <code style={{ fontFamily: "'DM Mono', monospace", fontSize: 10 }}>npm run dev</code> 재시작 후 이 페이지를 새로 고침하세요
                </div>
              </div>
            </div>

            <button
              className="btn btn-ghost"
              onClick={onConnect}
              style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 12, marginTop: 8, opacity: 0.5, cursor: 'not-allowed' }}
              disabled
            >
              <GoogleIcon />
              Google 계정으로 연동하기 (환경변수 설정 필요)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

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
