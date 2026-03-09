import { BRAND_STYLE, CAT_COL, PROJ_COLOR, PROJ_STAT, INF_STAT_MAP, fmt, dk } from '../constants';
import type { Influencer, Project, CalendarEventMap, Settlement, TeamMember, TabName } from '../types';

interface DashboardProps {
  influencers: Influencer[];
  projects: Project[];
  events: CalendarEventMap;
  settlements: Settlement[];
  members: TeamMember[];
  onInfluencerClick?: (id: number) => void;
}

export default function Dashboard({ influencers, projects, events, settlements, members, onInfluencerClick }: DashboardProps) {
  const today = dk(new Date());
  const activeInfs = influencers.filter(i => i.status === 'active');
  const totalRevenue = settlements.filter(s => s.type === 'in').reduce((a, s) => a + s.amount, 0);
  const totalOut = settlements.filter(s => s.type === 'out').reduce((a, s) => a + s.amount, 0);
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const activeMembers = members.filter(m => m.status === 'a').length;

  // Today's calendar events
  const calEvents = events[today] || [];

  // Influencers whose공구 starts or ends today
  const infEventsToday = influencers.filter(i => i.start === today || i.end === today);

  const monthlyIn = settlements
    .filter(s => {
      const now = new Date();
      return s.type === 'in' && s.date.startsWith(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    })
    .reduce((a, s) => a + s.amount, 0);

  const recentSettlements = settlements.slice(0, 5);

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
          <div className="kpi-label">이번 달 매출</div>
          <div className="kpi-value" style={{ fontSize: monthlyIn > 99999999 ? 22 : undefined }}>
            {fmt(monthlyIn)}
          </div>
          <div className="kpi-sub">원</div>
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

        {/* Today's Events */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">◷ 오늘 일정</div>
          </div>
          <div className="card-body">
            {calEvents.length === 0 && infEventsToday.length === 0 ? (
              <div className="empty" style={{ padding: '20px 0' }}>
                <div className="empty-icon" style={{ fontSize: 24 }}>◷</div>
                <p>오늘 일정이 없어요</p>
              </div>
            ) : (
              <>
                {calEvents.map(ev => (
                  <div key={ev.id} className="recent-row">
                    <div className="r-dot" style={{ background: CAT_COL[ev.cat] || 'var(--rose)' }} />
                    <div className="r-text">{ev.title}</div>
                    <span className="r-meta">{ev.time || '미정'}</span>
                  </div>
                ))}
                {infEventsToday.map(inf => (
                  <div
                    key={`inf-${inf.id}`}
                    className="recent-row"
                    style={{ cursor: onInfluencerClick ? 'pointer' : undefined }}
                    onClick={() => onInfluencerClick?.(inf.id)}
                  >
                    <div className="r-dot" style={{ background: inf.color }} />
                    <div className="r-text" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {inf.name} 공구 {inf.start === today ? '시작' : '종료'}
                    </div>
                    <span className="r-meta">공구</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Settlement Summary */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">₩ 발주·정산 현황</div>
          </div>
          <div className="card-body">
            {settlements.length === 0 ? (
              <div className="empty" style={{ padding: '20px 0' }}>
                <div className="empty-icon" style={{ fontSize: 24 }}>₩</div>
                <p>정산 내역을 추가해보세요</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  <RevenueRow label="총 매출" value={fmt(totalRevenue)} color="var(--success)" />
                  <RevenueRow label="총 지출" value={fmt(totalOut)} color="var(--danger)" />
                  <RevenueRow label="순수익" value={fmt(totalRevenue - totalOut)} color="var(--rose2)" bold />
                </div>
                <div className="sec-ttl" style={{ marginBottom: 8 }}>최근 정산 내역</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {recentSettlements.map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: s.type === 'in' ? 'var(--success)' : 'var(--danger)', display: 'inline-block' }} />
                      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text2)' }}>{s.name}</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", color: s.type === 'in' ? 'var(--success)' : 'var(--danger)', flexShrink: 0 }}>
                        {s.type === 'in' ? '+' : '-'}{fmt(s.amount)}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16 }}>
                  <div className="sec-ttl">브랜드별 매출</div>
                  <BrandRevenueChart settlements={settlements} />
                </div>
              </>
            )}
          </div>
        </div>

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
                const bs = BRAND_STYLE[p.brand] || BRAND_STYLE['기타'];
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

function RevenueRow({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: 'var(--text2)' }}>{label}</span>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: bold ? 700 : 500, color }}>
        {value}
      </span>
    </div>
  );
}

function BrandRevenueChart({ settlements }: { settlements: import('../types').Settlement[] }) {
  const brands = ['이너피움', '아쿠아크', '문화콘텐츠', '공구', '기타'] as const;
  const data = brands.map(brand => ({
    brand,
    total: settlements.filter(s => s.type === 'in' && s.brand === brand).reduce((a, s) => a + s.amount, 0),
  })).filter(d => d.total > 0);

  if (data.length === 0) return null;
  const max = Math.max(...data.map(d => d.total));
  const colors: Record<string, string> = {
    '이너피움': 'var(--mint)',
    '아쿠아크': 'var(--rose)',
    '문화콘텐츠': 'var(--lavender)',
    '공구': 'var(--gold)',
    '기타': 'var(--text3)',
  };

  return (
    <div className="chart-bar-wrap">
      {data.map(d => (
        <div key={d.brand} className="chart-bar-row">
          <div className="chart-bar-label">{d.brand}</div>
          <div className="chart-bar-bg">
            <div
              className="chart-bar-fill"
              style={{ width: `${(d.total / max) * 100}%`, background: colors[d.brand] || 'var(--text3)' }}
            />
          </div>
          <div className="chart-bar-val">{fmt(d.total)}</div>
        </div>
      ))}
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
