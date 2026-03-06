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
}

type Brand = 'all' | 'innerpium' | 'aquarc';
type Period = 'today' | 'yesterday' | '7d' | '30d';

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
  ACTIVE: '진행 중', PAUSED: '일시정지', ARCHIVED: '보관됨',
  DELETED: '삭제됨', CAMPAIGN_PAUSED: '캠페인정지', ADSET_PAUSED: '광고세트정지',
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
  const chartData = daily.map(d => ({
    date: d.date_start.slice(5), // MM-DD
    '지출(₩)': Math.round(n(d.spend)),
    '노출': n(d.impressions),
    '클릭': n(d.clicks),
  }));

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12, marginBottom: 24 }}>
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
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={chartData} margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text3)' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: 'var(--text3)' }} width={60} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: 'var(--text3)' }} width={50} tickFormatter={v => `₩${(v/1000).toFixed(0)}K`} />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: any) => {
                      const v = Number(value ?? 0);
                      const label = String(name ?? '');
                      if (label === '지출(₩)') return [`₩${v.toLocaleString()}`, label] as [string, string];
                      return [v.toLocaleString(), label] as [string, string];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="노출" fill="rgba(43,158,148,0.25)" radius={[3, 3, 0, 0]} />
                  <Bar yAxisId="left" dataKey="클릭" fill="rgba(123,111,212,0.4)" radius={[3, 3, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="지출(₩)" stroke="#d4596a" strokeWidth={2} dot={false} />
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
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: 'var(--surface3, var(--surface))' }}>
                      {['캠페인명', '상태', '예산잔액', '노출', '도달', '클릭', 'CTR', 'CPM', '빈도', '결과수', '결과당비용', 'ROAS', '지출'].map(h => (
                        <th key={h} style={TH}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c, i) => {
                      const spend = n(c.spend);
                      const purchaseVal = getPurchaseValue(c.actions);
                      const purchaseCnt = getPurchaseCount(c.actions);
                      const cpaVal = getCostPerPurchase(c.cost_per_action_type);
                      const campRoas = spend > 0 && purchaseVal > 0 ? purchaseVal / spend : 0;
                      return (
                        <tr key={i} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)' }}>
                          <td style={{ ...TD, maxWidth: 200, fontWeight: 500 }}>{c.campaign_name}</td>
                          <td style={TD}>
                            <span style={{
                              padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                              background: c.status === 'ACTIVE' ? 'rgba(43,158,148,0.15)' : 'rgba(150,150,160,0.15)',
                              color: c.status === 'ACTIVE' ? '#2b9e94' : 'var(--text3)',
                            }}>
                              {STATUS_LABEL[c.status] ?? c.status}
                            </span>
                          </td>
                          <td style={TD}>{c.budget_remaining ? money(n(c.budget_remaining)) : '-'}</td>
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
