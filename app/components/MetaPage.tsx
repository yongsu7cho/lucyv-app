'use client';
import { useState } from 'react';
import {
  ResponsiveContainer, ComposedChart, Line, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

/* ── Types ── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MetaAction = { action_type: string; value: string; [k: string]: any };

interface Campaign {
  campaign_name: string;
  status: string;
  budget_remaining?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  ctr?: string;
  cpm?: string;
  frequency?: string;
  spend?: string;
  objective?: string;
  actions?: MetaAction[];
  cost_per_action_type?: MetaAction[];
}

interface DailyRow {
  date_start: string;
  impressions: number;
  clicks: number;
  spend: number;
  ctr?: number | string;
}

type Brand = 'all' | 'innerpium' | 'aquarc';
type Period = 'today' | 'yesterday' | '7d' | '30d';
type SortCol = 'campaign_name' | 'status' | 'impressions' | 'reach' | 'clicks' | 'ctr' | 'cpm' | 'frequency' | 'purchase_count' | 'roas' | 'spend';
type SortDir = 'asc' | 'desc';

const STATUS_ORDER: Record<string, number> = { ACTIVE: 0, PAUSED: 1, ARCHIVED: 2 };

/* ── Helpers ── */

function n(v?: string | number): number { return Number(v ?? 0); }
function money(v: number): string { return `₩${v.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}`; }
function pct(v: number): string { return `${v.toFixed(2)}%`; }
function fmt(v: number): string { return v.toLocaleString('ko-KR'); }

function getPurchaseValue(actions?: MetaAction[]): number {
  if (!actions) return 0;
  const a = actions.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase');
  return a ? Number(a.value ?? 0) : 0;
}

function getPurchaseCount(actions?: MetaAction[]): number {
  if (!actions) return 0;
  const a = actions.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase');
  return a ? Number(a.value ?? 0) : 0;
}

function getCostPerPurchase(cpa?: MetaAction[]): number {
  if (!cpa) return 0;
  const a = cpa.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase');
  return a ? Number(a.value ?? 0) : 0;
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: '활성', PAUSED: '중지', ARCHIVED: '종료',
  DELETED: '삭제됨', CAMPAIGN_PAUSED: '캠페인정지', ADSET_PAUSED: '광고세트정지',
};

const STATUS_STYLE: Record<string, { background: string; color: string }> = {
  ACTIVE:   { background: 'rgba(43,158,148,0.15)',  color: '#2b9e94' },
  PAUSED:   { background: 'rgba(150,150,160,0.15)', color: 'var(--text3)' },
  ARCHIVED: { background: 'rgba(212,89,106,0.15)',  color: '#d4596a' },
};

const BRAND_TABS: { val: Brand; label: string }[] = [
  { val: 'all', label: '전체' },
  { val: 'innerpium', label: '이너피움' },
  { val: 'aquarc', label: '아쿠아크' },
];

const PERIOD_TABS: { val: Period; label: string }[] = [
  { val: 'today', label: '오늘' },
  { val: 'yesterday', label: '어제' },
  { val: '7d', label: '최근 7일' },
  { val: '30d', label: '최근 30일' },
];

/* ── KPI Card ── */
function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="kpi" style={{ paddingTop: 16, paddingBottom: 16 }}>
      <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: "'DM Mono', monospace", letterSpacing: 1, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', fontFamily: "'Cormorant Garamond', serif", letterSpacing: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

/* ── Main Component ── */

export default function MetaPage() {
  const [brand, setBrand] = useState<Brand>('all');
  const [period, setPeriod] = useState<Period>('7d');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [fetched, setFetched] = useState(false);
  const [sortCol, setSortCol] = useState<SortCol | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }

  function getSortValue(c: Campaign, col: SortCol): number | string {
    switch (col) {
      case 'campaign_name': return c.campaign_name ?? '';
      case 'status': return STATUS_ORDER[c.status] ?? 99;
      case 'impressions': return n(c.impressions);
      case 'reach': return n(c.reach);
      case 'clicks': return n(c.clicks);
      case 'ctr': return n(c.ctr);
      case 'cpm': return n(c.cpm);
      case 'frequency': return n(c.frequency);
      case 'purchase_count': return getPurchaseCount(c.actions);
      case 'roas': { const sp = n(c.spend); const pv = getPurchaseValue(c.actions); return sp > 0 && pv > 0 ? pv / sp : 0; }
      case 'spend': return n(c.spend);
    }
  }

  const sortedCampaigns = sortCol === null ? campaigns : [...campaigns].sort((a, b) => {
    const va = getSortValue(a, sortCol);
    const vb = getSortValue(b, sortCol);
    const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/meta/insights?brand=${brand}&period=${period}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'API 오류');
      setCampaigns(data.campaigns ?? []);
      setDaily(data.daily ?? []);
      setFetched(true);
      const camps = data.campaigns ?? [];
      console.log('[MetaPage] campaigns 전체:', camps);
      console.log('[MetaPage] status 목록:', camps.map((c: Campaign) => c.status));
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오기 실패');
    } finally {
      setLoading(false);
    }
  }

  /* KPIs */
  const totalSpend = campaigns.reduce((s, c) => s + n(c.spend), 0);
  const totalImpressions = campaigns.reduce((s, c) => s + n(c.impressions), 0);
  const totalReach = campaigns.reduce((s, c) => s + n(c.reach), 0);
  const totalClicks = campaigns.reduce((s, c) => s + n(c.clicks), 0);
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
  const totalPurchaseValue = campaigns.reduce((s, c) => s + getPurchaseValue(c.actions), 0);
  const roas = totalSpend > 0 ? totalPurchaseValue / totalSpend : 0;

  /* Chart data */
  const chartData = daily.map(d => {
    const clicks = n(d.clicks);
    const spend = Math.round(n(d.spend));
    return {
      date: d.date_start.slice(5), // MM-DD
      '지출(₩)': spend,
      '노출': n(d.impressions),
      '클릭': clicks,
      'CTR(%)': Number(Number(d.ctr ?? 0).toFixed(2)),
      'CPC(₩)': clicks > 0 ? Math.round(n(d.spend) / clicks) : 0,
    };
  });

  return (
    <div className="fade-in" style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {BRAND_TABS.map(t => (
            <button
              key={t.val}
              className={`btn btn-sm ${brand === t.val ? 'btn-rose' : 'btn-ghost'}`}
              onClick={() => setBrand(t.val)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {PERIOD_TABS.map(t => (
            <button
              key={t.val}
              className={`btn btn-sm ${period === t.val ? 'btn-rose' : 'btn-ghost'}`}
              onClick={() => setPeriod(t.val)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          className="btn btn-rose btn-sm"
          onClick={load}
          disabled={loading}
          style={{ marginLeft: 'auto' }}
        >
          {loading ? '불러오는 중...' : '데이터 불러오기'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(212,89,106,0.1)', borderRadius: 10, color: 'var(--rose)', fontSize: 12, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {!fetched && !loading && (
        <div className="empty">
          <div className="empty-icon">◈</div>
          <p>브랜드와 기간을 선택 후 데이터 불러오기를 클릭하세요</p>
        </div>
      )}

      {fetched && (
        <>
          {/* KPI Cards */}
          <div className="meta-kpi-grid">
            <KpiCard label="총 지출" value={money(totalSpend)} />
            <KpiCard label="노출" value={fmt(totalImpressions)} />
            <KpiCard label="도달" value={fmt(totalReach)} />
            <KpiCard label="클릭" value={fmt(totalClicks)} />
            <KpiCard label="CTR" value={pct(avgCtr)} />
            <KpiCard label="CPM" value={money(avgCpm)} />
            <KpiCard label="ROAS" value={roas > 0 ? `${roas.toFixed(2)}x` : '-'} sub={roas > 0 ? `전환매출 ${money(totalPurchaseValue)}` : undefined} />
          </div>

          {/* Daily Chart */}
          {daily.length > 0 && (
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', fontFamily: "'DM Mono', monospace", letterSpacing: 1, marginBottom: 16 }}>
                일별 추이
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={chartData} margin={{ top: 0, right: 60, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text3)' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: 'var(--text3)' }} width={60} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: 'var(--text3)' }} width={55} tickFormatter={v => `₩${(v/1000).toFixed(0)}K`} />
                  <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 10, fill: 'var(--text3)' }} width={40} tickFormatter={v => `${v.toFixed(1)}%`} hide />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: any) => {
                      const v = Number(value ?? 0);
                      const label = String(name ?? '');
                      if (label === '지출(₩)' || label === 'CPC(₩)') return [`₩${v.toLocaleString()}`, label] as [string, string];
                      if (label === 'CTR(%)') return [`${v.toFixed(2)}%`, label] as [string, string];
                      return [v.toLocaleString(), label] as [string, string];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="노출" fill="rgba(43,158,148,0.25)" radius={[3, 3, 0, 0]} />
                  <Bar yAxisId="left" dataKey="클릭" fill="rgba(123,111,212,0.4)" radius={[3, 3, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="지출(₩)" stroke="#d4596a" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="CPC(₩)" stroke="#e8a838" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                  <Line yAxisId="pct" type="monotone" dataKey="CTR(%)" stroke="#7b6fd4" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Campaign Table */}
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>
                캠페인별 성과
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{campaigns.length}개 캠페인</div>
            </div>
            {campaigns.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', fontSize: 12, color: 'var(--text3)' }}>데이터 없음</div>
            ) : (
              <div className="meta-table-wrap" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: 'var(--surface3, var(--surface))' }}>
                      {([
                        { label: '캠페인명', col: 'campaign_name' as SortCol },
                        { label: '상태',    col: 'status' as SortCol },
                        { label: '노출',    col: 'impressions' as SortCol },
                        { label: '도달',    col: 'reach' as SortCol },
                        { label: '클릭',    col: 'clicks' as SortCol },
                        { label: 'CTR',     col: 'ctr' as SortCol },
                        { label: 'CPM',     col: 'cpm' as SortCol },
                        { label: '빈도',    col: 'frequency' as SortCol },
                        { label: '결과수',  col: 'purchase_count' as SortCol },
                        { label: '결과당비용', col: null },
                        { label: 'ROAS',    col: 'roas' as SortCol },
                        { label: '지출',    col: 'spend' as SortCol },
                      ] as { label: string; col: SortCol | null }[]).map(({ label, col }) => (
                        <th
                          key={label}
                          style={{ ...TH, cursor: col ? 'pointer' : 'default', userSelect: 'none' }}
                          onClick={() => col && handleSort(col)}
                        >
                          {label}
                          {col && sortCol === col && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCampaigns.map((c, i) => {
                      const spend = n(c.spend);
                      const purchaseVal = getPurchaseValue(c.actions);
                      const purchaseCnt = getPurchaseCount(c.actions);
                      const cpaVal = getCostPerPurchase(c.cost_per_action_type);
                      const campRoas = spend > 0 && purchaseVal > 0 ? purchaseVal / spend : 0;
                      return (
                        <tr key={i} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)' }}>
                          <td style={{ ...TD, maxWidth: 200, fontWeight: 500 }}>{c.campaign_name}</td>
                          <td style={{ ...TD, fontWeight: 600, ...(STATUS_STYLE[c.status] ?? { color: 'var(--text3)' }) }}>
                            {STATUS_LABEL[c.status] ?? c.status}
                          </td>
                          <td style={TD}>{fmt(n(c.impressions))}</td>
                          <td style={TD}>{fmt(n(c.reach))}</td>
                          <td style={TD}>{fmt(n(c.clicks))}</td>
                          <td style={TD}>{pct(n(c.ctr))}</td>
                          <td style={TD}>{money(n(c.cpm))}</td>
                          <td style={TD}>{n(c.frequency).toFixed(2)}</td>
                          <td style={TD}>{purchaseCnt > 0 ? fmt(purchaseCnt) : '-'}</td>
                          <td style={TD}>{cpaVal > 0 ? money(cpaVal) : '-'}</td>
                          <td style={TD}>{campRoas > 0 ? `${campRoas.toFixed(2)}x` : '-'}</td>
                          <td style={{ ...TD, fontWeight: 600, color: 'var(--rose)' }}>{money(spend)}</td>
                        </tr>
                      );
                    })}
                    {/* Total row */}
                    <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--surface2)', fontWeight: 700 }}>
                      <td style={{ ...TD, fontWeight: 700 }}>합계</td>
                      <td style={TD} />
                      <td style={TD}>{fmt(totalImpressions)}</td>
                      <td style={TD}>{fmt(totalReach)}</td>
                      <td style={TD}>{fmt(totalClicks)}</td>
                      <td style={TD}>{pct(avgCtr)}</td>
                      <td style={TD}>{money(avgCpm)}</td>
                      <td style={TD} />
                      <td style={TD} />
                      <td style={TD} />
                      <td style={TD}>{roas > 0 ? `${roas.toFixed(2)}x` : '-'}</td>
                      <td style={{ ...TD, fontWeight: 700, color: 'var(--rose)' }}>{money(totalSpend)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const TH: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  fontWeight: 700,
  color: 'var(--text2)',
  fontFamily: "'DM Mono', monospace",
  fontSize: 10,
  letterSpacing: 0.5,
  whiteSpace: 'nowrap',
  borderRight: '1px solid var(--border)',
};

const TD: React.CSSProperties = {
  padding: '8px 12px',
  color: 'var(--text)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  borderRight: '1px solid var(--border)',
};
