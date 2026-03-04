'use client';
import { useState } from 'react';
import { MONTHS_EN, CAT_COL, dk } from '../constants';
import type { CalendarEventMap, CalendarEvent, EventCategory } from '../types';

interface CalendarPageProps {
  events: CalendarEventMap;
  setEvents: (e: CalendarEventMap) => void;
}

// Simulated Google Calendar events (would be real API data in production)
const GCAL_MOCK_EVENTS = [
  { id: 1, title: '이너피움 브랜드 미팅', date: '2026-03-05', time: '10:00', color: '#7ecec4' },
  { id: 2, title: 'SNS 콘텐츠 업로드 마감', date: '2026-03-07', time: '18:00', color: '#e8a0a8' },
  { id: 3, title: '인플루언서 계약 검토', date: '2026-03-10', time: '14:00', color: '#a89ee8' },
  { id: 4, title: '아쿠아크 신제품 촬영', date: '2026-03-12', time: '09:00', color: '#e8a0a8' },
  { id: 5, title: '문화콘텐츠 기획 회의', date: '2026-03-15', time: '13:00', color: '#c9a96e' },
  { id: 6, title: '공구 정산 마감', date: '2026-03-20', time: '17:00', color: '#e8a0a8' },
  { id: 7, title: '팀 월간 회의', date: '2026-03-25', time: '11:00', color: '#70c8e8' },
];

export default function CalendarPage({ events, setEvents }: CalendarPageProps) {
  const [calTab, setCalTab] = useState<'company' | 'google'>('company');
  const [gcalConnected, setGcalConnected] = useState(false);

  return (
    <div className="fade-in">
      {/* Calendar Tabs */}
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
        <GoogleCalendar connected={gcalConnected} onConnect={() => setGcalConnected(true)} onDisconnect={() => setGcalConnected(false)} />
      )}
    </div>
  );
}

function CompanyCalendar({ events, setEvents }: { events: CalendarEventMap; setEvents: (e: CalendarEventMap) => void }) {
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
    setCalM(m);
    setCalY(y);
  }

  function goToday() {
    setCalY(now.getFullYear());
    setCalM(now.getMonth());
    setSelDay(dk(now));
  }

  function addEvent() {
    if (!evTitle.trim()) return;
    const newEv: CalendarEvent = { id: Date.now(), title: evTitle, time: evTime, cat: evCat };
    const updated = { ...events, [selDay]: [...(events[selDay] || []), newEv] };
    setEvents(updated);
    setEvTitle('');
    setEvTime('');
  }

  function deleteEvent(key: string, id: number) {
    const updated = { ...events, [key]: (events[key] || []).filter(e => e.id !== id) };
    setEvents(updated);
  }

  // Build calendar days
  const first = new Date(calY, calM, 1).getDay();
  const dim = new Date(calY, calM + 1, 0).getDate();
  const prevDim = new Date(calY, calM, 0).getDate();
  const todayKey = dk(now);

  const days: { key: string; day: number; outside: boolean }[] = [];
  for (let i = 0; i < first; i++) {
    days.push({ key: '', day: prevDim - first + i + 1, outside: true });
  }
  for (let d = 1; d <= dim; d++) {
    const key = `${calY}-${String(calM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ key, day: d, outside: false });
  }
  const rem = (first + dim) % 7;
  if (rem > 0) {
    for (let i = 1; i <= 7 - rem; i++) {
      days.push({ key: '', day: i, outside: true });
    }
  }

  const selEvs = (events[selDay] || []).slice().sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const [selY, selMon, selD] = selDay.split('-');

  return (
    <div className="cal-wrap">
      {/* Calendar Grid */}
      <div>
        <div className="cal-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="cal-nav-btn" onClick={() => changeMonth(-1)}>‹</button>
            <div className="cal-mo">{MONTHS_EN[calM]} {calY}</div>
            <button className="cal-nav-btn" onClick={() => changeMonth(1)}>›</button>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={goToday}>오늘</button>
        </div>
        <div className="cal-dnames">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, i) => (
            <div key={d} className="cal-dname" style={{ color: i === 0 ? 'var(--rose)' : i === 6 ? 'var(--lavender)' : undefined }}>
              {d}
            </div>
          ))}
        </div>
        <div className="cal-days-grid">
          {days.map((d, idx) => {
            const isToday = d.key === todayKey;
            const isSel = d.key === selDay && !isToday;
            const hasEvents = d.key && (events[d.key] || []).length > 0;
            const cls = ['cday', d.outside ? 'om' : '', isToday ? 'today' : '', isSel ? 'sel' : '', hasEvents ? 'hev' : '']
              .filter(Boolean).join(' ');
            return (
              <div
                key={idx}
                className={cls}
                onClick={() => { if (!d.outside && d.key) setSelDay(d.key); }}
              >
                {d.day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Panel */}
      <div className="ev-panel">
        <div className="ev-date-lbl">
          {parseInt(selY)}년 {parseInt(selMon)}월 {parseInt(selD)}일
        </div>
        <div className="ev-form">
          <input
            className="input"
            placeholder="일정 제목"
            value={evTitle}
            onChange={e => setEvTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addEvent(); }}
          />
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
            <div key={ev.id} className="ev-item" style={{ borderLeftColor: CAT_COL[ev.cat] || 'var(--rose)' }}>
              <div>
                <div className="ev-time">
                  {ev.time || '시간 미정'} ·{' '}
                  <span style={{ color: CAT_COL[ev.cat] || 'var(--rose)' }}>{ev.cat}</span>
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

function GoogleCalendar({ connected, onConnect, onDisconnect }: {
  connected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const now = new Date();
  const [gcalY, setGcalY] = useState(now.getFullYear());
  const [gcalM, setGcalM] = useState(now.getMonth());

  function changeMonth(delta: number) {
    let m = gcalM + delta;
    let y = gcalY;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setGcalM(m);
    setGcalY(y);
  }

  const monthStr = `${gcalY}-${String(gcalM + 1).padStart(2, '0')}`;
  const monthEvents = GCAL_MOCK_EVENTS.filter(e => e.date.startsWith(monthStr));

  if (!connected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="gcal-info">
          <span style={{ fontSize: 16, flexShrink: 0 }}>📅</span>
          <div>
            구글 캘린더와 연동하면 회사 일정과 구글 캘린더를 한 곳에서 관리할 수 있어요.
            연동 후에는 구글 캘린더의 일정을 자동으로 불러와 표시합니다.
          </div>
        </div>
        <div className="gcal-connect-box">
          <div className="gcal-icon">📅</div>
          <div className="gcal-connect-title">구글 캘린더 연동</div>
          <div className="gcal-connect-desc">
            구글 계정으로 로그인하여 루씨브이에이전시 캘린더를 연동하세요.<br />
            회사 일정과 개인 구글 캘린더를 통합 관리할 수 있습니다.
          </div>
          <div className="gcal-steps">
            <div className="gcal-step">
              <div className="gcal-step-num">1</div>
              <div>아래 &apos;구글 계정으로 연동&apos; 버튼을 클릭하세요</div>
            </div>
            <div className="gcal-step">
              <div className="gcal-step-num">2</div>
              <div>구글 계정을 선택하고 캘린더 접근 권한을 허용하세요</div>
            </div>
            <div className="gcal-step">
              <div className="gcal-step-num">3</div>
              <div>연동이 완료되면 구글 캘린더 일정이 자동으로 표시됩니다</div>
            </div>
            <div className="gcal-step">
              <div className="gcal-step-num">4</div>
              <div>또는 구글 캘린더에서 ICS 파일을 내보내어 직접 가져올 수도 있어요</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-google" onClick={onConnect} style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 13 }}>
              <span style={{ fontSize: 16 }}>G</span>
              구글 계정으로 연동하기
            </button>
            <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
              ICS 파일 가져오기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success)' }} />
          <span style={{ fontSize: 12, color: 'var(--success)', fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>
            구글 캘린더 연동됨
          </span>
          <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>
            · hello@lucyvagency.com
          </span>
        </div>
        <button className="btn btn-danger btn-sm" onClick={onDisconnect}>연동 해제</button>
      </div>

      <div className="cal-wrap">
        {/* Calendar Grid */}
        <div>
          <div className="cal-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button className="cal-nav-btn" onClick={() => changeMonth(-1)}>‹</button>
              <div className="cal-mo">{MONTHS_EN[gcalM]} {gcalY}</div>
              <button className="cal-nav-btn" onClick={() => changeMonth(1)}>›</button>
            </div>
          </div>
          <div className="cal-dnames">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, i) => (
              <div key={d} className="cal-dname" style={{ color: i === 0 ? 'var(--rose)' : i === 6 ? 'var(--lavender)' : undefined }}>
                {d}
              </div>
            ))}
          </div>
          <GCalGrid year={gcalY} month={gcalM} events={GCAL_MOCK_EVENTS} />
        </div>

        {/* Event List */}
        <div>
          <div className="ev-date-lbl" style={{ marginBottom: 14 }}>
            {gcalY}년 {gcalM + 1}월 일정
          </div>
          <div className="gcal-event-list" style={{ padding: 0 }}>
            {monthEvents.length === 0 ? (
              <div className="empty" style={{ padding: '24px 0' }}>
                <div className="empty-icon" style={{ fontSize: 24 }}>📅</div>
                <p>이 달의 구글 일정이 없어요</p>
              </div>
            ) : (
              monthEvents.map(ev => (
                <div key={ev.id} className="gcal-event-item">
                  <div className="gcal-dot" style={{ background: ev.color }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{ev.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>
                      {ev.date} {ev.time && `· ${ev.time}`}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GCalGrid({ year, month, events }: { year: number; month: number; events: typeof GCAL_MOCK_EVENTS }) {
  const now = new Date();
  const first = new Date(year, month, 1).getDay();
  const dim = new Date(year, month + 1, 0).getDate();
  const prevDim = new Date(year, month, 0).getDate();
  const todayKey = dk(now);

  const days: { key: string; day: number; outside: boolean }[] = [];
  for (let i = 0; i < first; i++) {
    days.push({ key: '', day: prevDim - first + i + 1, outside: true });
  }
  for (let d = 1; d <= dim; d++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ key, day: d, outside: false });
  }
  const rem = (first + dim) % 7;
  if (rem > 0) {
    for (let i = 1; i <= 7 - rem; i++) {
      days.push({ key: '', day: i, outside: true });
    }
  }

  return (
    <div className="cal-days-grid">
      {days.map((d, idx) => {
        const isToday = d.key === todayKey;
        const hasEv = d.key && events.some(e => e.date === d.key);
        const cls = ['cday', d.outside ? 'om' : '', isToday ? 'today' : '', hasEv ? 'hev' : '']
          .filter(Boolean).join(' ');
        return (
          <div key={idx} className={cls} style={{ cursor: 'default' }}>
            {d.day}
          </div>
        );
      })}
    </div>
  );
}
