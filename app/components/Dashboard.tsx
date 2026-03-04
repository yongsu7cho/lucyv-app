import { BRAND_STYLE, CAT_COL, PROJ_COLOR, fmt, dk } from '../constants';
import type { Influencer, Project, CalendarEventMap, Settlement, TeamMember } from '../types';

interface DashboardProps {
  influencers: Influencer[];
  projects: Project[];
  events: CalendarEventMap;
  settlements: Settlement[];
  members: TeamMember[];
}

export default function Dashboard({ influencers, projects, events, settlements, members }: DashboardProps) {
  const today = dk(new Date());
  const activeInfs = influencers.filter(i => i.status === 'active');
  const totalRevenue = settlements.filter(s => s.type === 'in').reduce((a, s) => a + s.amount, 0);
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const activeMembers = members.filter(m => m.status === 'a').length;
  const todayEvents = events[today] || [];

  const monthlyIn = settlements
    .filter(s => {
      const now = new Date();
      return s.type === 'in' && s.date.startsWith(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    })
    .reduce((a, s) => a + s.amount, 0);

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
              activeInfs.slice(0, 5).map(inf => (
                <div key={inf.id} className="recent-row">
                  <div className="r-dot" style={{ background: inf.color }} />
                  <div className="r-text">
                    {inf.name}{' '}
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>{inf.handle}</span>
                  </div>
                  <span
                    className="r-tag"
                    style={{ ...parseStyle(BRAND_STYLE[inf.brand] || BRAND_STYLE['기타']) }}
                  >
                    {inf.brand}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Today's Events */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">◷ 오늘 일정</div>
          </div>
          <div className="card-body">
            {todayEvents.length === 0 ? (
              <div className="empty" style={{ padding: '20px 0' }}>
                <div className="empty-icon" style={{ fontSize: 24 }}>◷</div>
                <p>오늘 일정이 없어요</p>
              </div>
            ) : (
              todayEvents.map(ev => (
                <div key={ev.id} className="recent-row">
                  <div className="r-dot" style={{ background: CAT_COL[ev.cat] || 'var(--rose)' }} />
                  <div className="r-text">{ev.title}</div>
                  <span className="r-meta">{ev.time || '미정'}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">₩ 매출 현황</div>
          </div>
          <div className="card-body">
            {settlements.length === 0 ? (
              <div className="empty" style={{ padding: '20px 0' }}>
                <div className="empty-icon" style={{ fontSize: 24 }}>₩</div>
                <p>정산 내역을 추가해보세요</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <RevenueRow
                    label="총 매출"
                    value={fmt(settlements.filter(s => s.type === 'in').reduce((a, s) => a + s.amount, 0))}
                    color="var(--success)"
                  />
                  <RevenueRow
                    label="총 지출"
                    value={fmt(settlements.filter(s => s.type === 'out').reduce((a, s) => a + s.amount, 0))}
                    color="var(--danger)"
                  />
                  <RevenueRow
                    label="순수익"
                    value={fmt(totalRevenue - settlements.filter(s => s.type === 'out').reduce((a, s) => a + s.amount, 0))}
                    color="var(--rose2)"
                    bold
                  />
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
                return (
                  <div
                    key={p.id}
                    style={{
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      padding: 14,
                    }}
                  >
                    <span
                      className="brand-tag"
                      style={{ ...parseStyle(bs), marginBottom: 8, display: 'inline-block' }}
                    >
                      {p.brand}
                    </span>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{p.name}</div>
                    <div className="pbar">
                      <div
                        className="pfill"
                        style={{ width: `${p.progress}%`, background: PROJ_COLOR[p.status] }}
                      />
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: "'DM Mono', monospace", marginTop: 4 }}>
                      {p.progress}%
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

// Helper to convert CSS string to style object
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
