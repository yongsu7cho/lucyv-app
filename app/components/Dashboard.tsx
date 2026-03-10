'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { BRAND_STYLE, PROJ_COLOR, PROJ_STAT, INF_STAT_MAP, fmt, dk } from '../constants';
import type { Influencer, Project, Settlement, TeamMember } from '../types';

interface DashboardProps {
  influencers: Influencer[];
  projects: Project[];
  settlements: Settlement[];
  members: TeamMember[];
  onInfluencerClick?: (id: number) => void;
}

export default function Dashboard({ influencers, projects, members, onInfluencerClick }: DashboardProps) {
  const activeInfs     = influencers.filter(i => i.status === 'active');
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const activeMembers  = members.filter(m => m.status === 'a').length;

  return (
    <div className="fade-in">
      {/* KPI Grid */}
      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">활성 인플루언서</div>
          <div className="kpi-value">{activeInfs.length}</div>
          <div className="kpi-sub">공구 진행 중</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">진행 프로젝트</div>
          <div className="kpi-value">{activeProjects}</div>
          <div className="kpi-sub">활성 캠페인</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">팀원</div>
          <div className="kpi-value">{activeMembers}</div>
          <div className="kpi-sub">재직 중</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="dash-grid">
        {/* Active Influencers */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">✦ 최근 공구 일정</div>
          </div>
          <div className="card-body">
            {activeInfs.length === 0 ? (
              <div className="empty" style={{ padding: '20px 0' }}>
                <div className="empty-icon" style={{ fontSize: 24 }}>✦</div>
                <p>진행 중인 공구가 없어요</p>
              </div>
            ) : (
              activeInfs.slice(0, 5).map(inf => {
                const st = INF_STAT_MAP[inf.status];
                return (
                  <div
                    key={inf.id}
                    className="recent-row"
                    style={{ cursor: onInfluencerClick ? 'pointer' : undefined, flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}
                    onClick={() => onInfluencerClick?.(inf.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                      <div className="r-dot" style={{ background: inf.color, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{inf.name}</span>
                        {inf.handle && <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 5 }}>{inf.handle}</span>}
                      </div>
                      <span className={`inf-status ${st.cls}`} style={{ fontSize: 9, padding: '2px 6px', flexShrink: 0 }}>
                        <div className="sdot" />{st.lbl}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 18, width: '100%', flexWrap: 'wrap' }}>
                      {inf.brand && (
                        <span className="brand-tag" style={{ ...parseStyle(BRAND_STYLE[inf.brand] || BRAND_STYLE['기타']), fontSize: 10 }}>
                          {inf.brand}
                        </span>
                      )}
                      {(inf.start || inf.end) && (
                        <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>
                          {inf.start || '?'} ~ {inf.end || '?'}
                        </span>
                      )}
                      {inf.notes && (
                        <span style={{ fontSize: 10, color: 'var(--text3)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {inf.notes}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Today's Google Calendar Events */}
        <TodayEventsCard />

        {/* Notice Board */}
        <NoticeCard />

        {/* Projects */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">◉ 브랜드 프로젝트 현황</div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {projects.length === 0 ? (
              <div className="empty" style={{ padding: '20px 0' }}>
                <div className="empty-icon" style={{ fontSize: 24 }}>◉</div>
                <p>프로젝트가 없어요</p>
              </div>
            ) : (
              projects.slice(0, 4).map(p => {
                const bs   = BRAND_STYLE[p.brand] || BRAND_STYLE['기타'];
                const stat = PROJ_STAT[p.status];
                const doneActions = p.actions.filter(a => a.done).length;
                return (
                  <div
                    key={p.id}
                    style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span className="brand-tag" style={{ ...parseStyle(bs) }}>{p.brand}</span>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: `${PROJ_COLOR[p.status]}18`, color: PROJ_COLOR[p.status], fontWeight: 600 }}>
                        {stat?.lbl ?? p.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{p.name}</div>
                    {p.notes && (
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.notes}
                      </div>
                    )}
                    <div className="pbar" style={{ marginBottom: 4 }}>
                      <div className="pfill" style={{ width: `${p.progress}%`, background: PROJ_COLOR[p.status] }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>
                      <span>{p.progress}%</span>
                      {p.actions.length > 0 && <span>액션 {doneActions}/{p.actions.length}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Today's Google Calendar Events ─────────────────────────────────────────
interface GCalEventItem {
  id: string;
  summary?: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end:   { dateTime?: string; date?: string };
  calendarColor?: string;
}

function eventTimeStr(ev: GCalEventItem): string {
  if (!ev.start.dateTime) return '하루 종일';
  const d = new Date(ev.start.dateTime);
  const h = d.getHours(), m = d.getMinutes();
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${ampm} ${h12}시` : `${ampm} ${h12}시 ${m}분`;
}

function TodayEventsCard() {
  const [events,  setEvents]  = useState<GCalEventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [gcalConnected, setGcalConnected] = useState<boolean | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // Check auth status first
      const statusRes = await fetch('/api/auth/status');
      const status = await statusRes.json();
      if (!status.connected) {
        setGcalConnected(false);
        setLoading(false);
        return;
      }
      setGcalConnected(true);

      const today = dk(new Date());
      const timeMin = `${today}T00:00:00.000Z`;
      const timeMax = `${today}T23:59:59.999Z`;
      // Use local timezone bounds
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

      const res = await fetch(`/api/calendar/events?timeMin=${encodeURIComponent(startOfDay)}&timeMax=${encodeURIComponent(endOfDay)}`);
      if (res.status === 401) { setGcalConnected(false); setLoading(false); return; }
      if (!res.ok) { setError('일정을 불러오지 못했어요.'); setLoading(false); return; }

      const data = await res.json();
      const todayStr = dk(new Date());
      const items: GCalEventItem[] = (data.items ?? []).filter((ev: GCalEventItem) => {
        const d = (ev.start.dateTime ?? ev.start.date ?? '').slice(0, 10);
        return d === todayStr;
      });
      items.sort((a, b) =>
        (a.start.dateTime ?? a.start.date ?? '').localeCompare(b.start.dateTime ?? b.start.date ?? '')
      );
      setEvents(items);
    } catch {
      setError('네트워크 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="card">
      <div className="card-head" style={{ justifyContent: 'space-between' }}>
        <div className="card-title">◷ 오늘 일정</div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={load}
          disabled={loading}
          style={{ fontSize: 11, padding: '2px 8px' }}
        >
          {loading ? '...' : '↻'}
        </button>
      </div>
      <div className="card-body">
        {gcalConnected === false ? (
          <div className="empty" style={{ padding: '20px 0' }}>
            <div className="empty-icon" style={{ fontSize: 20 }}>📅</div>
            <p style={{ fontSize: 11 }}>구글 캘린더 미연동</p>
          </div>
        ) : loading ? (
          <div style={{ fontSize: 11, color: 'var(--text3)', padding: '12px 0' }}>불러오는 중...</div>
        ) : error ? (
          <div style={{ fontSize: 11, color: 'var(--danger)', padding: '8px 0' }}>{error}</div>
        ) : events.length === 0 ? (
          <div className="empty" style={{ padding: '20px 0' }}>
            <div className="empty-icon" style={{ fontSize: 24 }}>◷</div>
            <p>오늘 일정이 없습니다</p>
          </div>
        ) : (
          events.map(ev => (
            <div key={ev.id} className="recent-row" style={{ alignItems: 'flex-start', gap: 8 }}>
              <div
                style={{ width: 8, height: 8, borderRadius: '50%', background: ev.calendarColor ?? '#e8a0a8', flexShrink: 0, marginTop: 4 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ev.summary ?? '(제목 없음)'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>
                  {eventTimeStr(ev)}
                </div>
                {ev.description && (
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.description}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Notice Board ────────────────────────────────────────────────────────────
function NoticeCard() {
  const [content,   setContent]   = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [saved,     setSaved]     = useState(false);
  const [loading,   setLoading]   = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    supabase
      .from('notices')
      .select('content, updated_at')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        setContent(data?.content ?? '');
        setUpdatedAt(data?.updated_at ?? null);
        setLoading(false);
      });
  }, []);

  async function save(text: string) {
    setSaved(false);
    const { data } = await supabase
      .from('notices')
      .upsert({ id: 1, content: text, updated_at: new Date().toISOString() })
      .select('updated_at')
      .single();
    if (data) setUpdatedAt(data.updated_at);
    setSaved(true);
  }

  function handleChange(text: string) {
    setContent(text);
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(text), 1500);
  }

  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="card">
      <div className="card-head" style={{ justifyContent: 'space-between' }}>
        <div className="card-title">📌 공지사항</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {saved && <span style={{ fontSize: 10, color: 'var(--success)', fontFamily: "'DM Mono', monospace" }}>저장됨 ✓</span>}
          {updatedLabel && <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>{updatedLabel}</span>}
        </div>
      </div>
      <div className="card-body">
        {loading ? (
          <div style={{ fontSize: 11, color: 'var(--text3)', padding: '8px 0' }}>불러오는 중...</div>
        ) : (
          <textarea
            className="input"
            value={content}
            onChange={e => handleChange(e.target.value)}
            onBlur={e => {
              if (saveTimer.current) clearTimeout(saveTimer.current);
              save(e.target.value);
            }}
            placeholder="공지사항을 입력하세요..."
            rows={5}
            style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 13, width: '100%', lineHeight: 1.7 }}
          />
        )}
      </div>
    </div>
  );
}

function parseStyle(css: string): React.CSSProperties {
  const result: Record<string, string> = {};
  css.split(';').forEach(rule => {
    const [prop, val] = rule.split(':');
    if (prop && val) {
      const camel = prop.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      result[camel] = val.trim();
    }
  });
  return result as React.CSSProperties;
}
