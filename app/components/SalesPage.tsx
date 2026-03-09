'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { supabase } from '../../lib/supabase';

/* ─────────────────── Types ─────────────────── */
type Brand = 'innerpium' | 'aquacrc';

interface BrandSaleRow {
  id: number;
  brand: Brand;
  date: string;
  store_farm: number | null;
  cafe24: number | null;
  other: number | null;         // 기타 (이너피움)
  sinsegae_v: number | null;    // 신세계V (아쿠아크)
  other_w: number | null;       // 기타(더블유) (아쿠아크)
  total_revenue: number | null; // 자동계산
  brand_sales: number | null;   // 유산균매출 / 클렌저매출
  purchase_count: number | null;
  brand_qty: number | null;     // 유산균수량 / 클렌저수량
  event: number | null;
  budget: number | null;
  marketing_total: number | null;
  inflow_24: number | null;
  inflow_n: number | null;
  inflow_cost: number | null;
  conversion_rate: number | null;
  signup: number | null;
  wishlist: number | null;
  kakao: number | null;
  insta: number | null;
  insta_total: number | null;
  created_at?: string;
}

type FormState = Omit<BrandSaleRow, 'id' | 'created_at'>;
type FormStrings = Record<keyof FormState, string>;

/* ─────────────────── Column Definitions ─────────────────── */
interface ColDef { field: keyof BrandSaleRow; label: string; bold?: boolean; }

const INNERPIUM_COLS: ColDef[] = [
  { field: 'date', label: '날짜' },
  { field: 'store_farm', label: '스토어팜' },
  { field: 'cafe24', label: '카페24' },
  { field: 'other', label: '기타' },
  { field: 'total_revenue', label: '총매출', bold: true },
  { field: 'brand_sales', label: '유산균매출' },
  { field: 'purchase_count', label: '구매건' },
  { field: 'brand_qty', label: '유산균수량' },
  { field: 'event', label: 'EVENT' },
  { field: 'budget', label: '설정금액' },
  { field: 'marketing_total', label: '마케팅총금액비용' },
  { field: 'inflow_24', label: '유입(24)' },
  { field: 'inflow_n', label: '유입(N)' },
  { field: 'inflow_cost', label: '유입비용' },
  { field: 'conversion_rate', label: '전환률' },
  { field: 'signup', label: '회원가입' },
  { field: 'wishlist', label: '찜' },
  { field: 'kakao', label: '카카오' },
  { field: 'insta', label: '인스타' },
  { field: 'insta_total', label: '인스타총' },
];

const AQUACRC_COLS: ColDef[] = [
  { field: 'date', label: '날짜' },
  { field: 'store_farm', label: '스토어팜' },
  { field: 'cafe24', label: '카페24' },
  { field: 'sinsegae_v', label: '신세계V' },
  { field: 'other_w', label: '기타(더블유)' },
  { field: 'total_revenue', label: '총매출', bold: true },
  { field: 'brand_sales', label: '클렌저매출' },
  { field: 'purchase_count', label: '구매건' },
  { field: 'brand_qty', label: '클렌저수량' },
  { field: 'event', label: 'EVENT' },
  { field: 'budget', label: '설정금액' },
  { field: 'marketing_total', label: '마케팅총금액비용' },
  { field: 'inflow_24', label: '유입(24)' },
  { field: 'inflow_n', label: '유입(N)' },
  { field: 'inflow_cost', label: '유입비용' },
  { field: 'conversion_rate', label: '전환률' },
  { field: 'signup', label: '회원가입' },
  { field: 'wishlist', label: '찜' },
  { field: 'kakao', label: '카카오' },
  { field: 'insta', label: '인스타' },
  { field: 'insta_total', label: '인스타총' },
];

/* ─────────────────── Form Field Groups ─────────────────── */
interface FieldDef { key: keyof FormStrings; label: string; readOnly?: boolean; decimal?: boolean; }
interface FieldGroup { title: string; fields: FieldDef[]; }

const INNERPIUM_GROUPS: FieldGroup[] = [
  {
    title: '매출 채널',
    fields: [
      { key: 'store_farm', label: '스토어팜' },
      { key: 'cafe24', label: '카페24' },
      { key: 'other', label: '기타' },
      { key: 'total_revenue', label: '총매출', readOnly: true },
    ],
  },
  {
    title: '상세 매출',
    fields: [
      { key: 'brand_sales', label: '유산균매출' },
      { key: 'purchase_count', label: '구매건' },
      { key: 'brand_qty', label: '유산균수량' },
    ],
  },
  {
    title: '마케팅',
    fields: [
      { key: 'event', label: 'EVENT (광고수)' },
      { key: 'budget', label: '설정금액' },
      { key: 'marketing_total', label: '마케팅총금액비용' },
    ],
  },
  {
    title: '유입 / 전환',
    fields: [
      { key: 'inflow_24', label: '유입(24)' },
      { key: 'inflow_n', label: '유입(N)' },
      { key: 'inflow_cost', label: '유입비용' },
      { key: 'conversion_rate', label: '전환률 (%)', decimal: true },
    ],
  },
  {
    title: '기타 지표',
    fields: [
      { key: 'signup', label: '회원가입' },
      { key: 'wishlist', label: '찜' },
      { key: 'kakao', label: '카카오' },
      { key: 'insta', label: '인스타' },
      { key: 'insta_total', label: '인스타총' },
    ],
  },
];

const AQUACRC_GROUPS: FieldGroup[] = [
  {
    title: '매출 채널',
    fields: [
      { key: 'store_farm', label: '스토어팜' },
      { key: 'cafe24', label: '카페24' },
      { key: 'sinsegae_v', label: '신세계V' },
      { key: 'other_w', label: '기타(더블유)' },
      { key: 'total_revenue', label: '총매출', readOnly: true },
    ],
  },
  {
    title: '상세 매출',
    fields: [
      { key: 'brand_sales', label: '클렌저매출' },
      { key: 'purchase_count', label: '구매건' },
      { key: 'brand_qty', label: '클렌저수량' },
    ],
  },
  {
    title: '마케팅',
    fields: [
      { key: 'event', label: 'EVENT (광고수)' },
      { key: 'budget', label: '설정금액' },
      { key: 'marketing_total', label: '마케팅총금액비용' },
    ],
  },
  {
    title: '유입 / 전환',
    fields: [
      { key: 'inflow_24', label: '유입(24)' },
      { key: 'inflow_n', label: '유입(N)' },
      { key: 'inflow_cost', label: '유입비용' },
      { key: 'conversion_rate', label: '전환률 (%)', decimal: true },
    ],
  },
  {
    title: '기타 지표',
    fields: [
      { key: 'signup', label: '회원가입' },
      { key: 'wishlist', label: '찜' },
      { key: 'kakao', label: '카카오' },
      { key: 'insta', label: '인스타' },
      { key: 'insta_total', label: '인스타총' },
    ],
  },
];

/* ─────────────────── Helpers ─────────────────── */
const CHART_COLORS: Record<string, string> = {
  스토어팜: '#10b981',
  카페24: '#3b82f6',
  신세계V: '#8b5cf6',
  '기타(더블유)': '#94a3b8',
  기타: '#94a3b8',
  총매출: '#f43f5e',
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function toNum(s: string): number | null {
  const n = parseFloat(s.replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

function money(v: number | null): string {
  if (!v) return '₩0';
  if (v >= 100_000_000) return `₩${(v / 100_000_000).toFixed(1)}억`;
  if (v >= 1_000_000) return `₩${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `₩${(v / 1_000).toFixed(0)}K`;
  return `₩${v.toLocaleString('ko-KR')}`;
}

function pctStr(v: number): string {
  return isNaN(v) || !isFinite(v) ? '-' : `${v.toFixed(2)}%`;
}

function fmtDate(s: string): string {
  const d = new Date(s);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function blankForm(brand: Brand): FormStrings {
  return {
    brand,
    date: todayStr(),
    store_farm: '', cafe24: '', other: '',
    sinsegae_v: '', other_w: '',
    total_revenue: '',
    brand_sales: '', purchase_count: '', brand_qty: '',
    event: '', budget: '', marketing_total: '',
    inflow_24: '', inflow_n: '', inflow_cost: '',
    conversion_rate: '',
    signup: '', wishlist: '', kakao: '', insta: '', insta_total: '',
  };
}

function rowToFormStrings(row: BrandSaleRow): FormStrings {
  const stringify = (v: number | null) => v == null ? '' : String(v);
  return {
    brand: row.brand,
    date: row.date,
    store_farm: stringify(row.store_farm),
    cafe24: stringify(row.cafe24),
    other: stringify(row.other),
    sinsegae_v: stringify(row.sinsegae_v),
    other_w: stringify(row.other_w),
    total_revenue: stringify(row.total_revenue),
    brand_sales: stringify(row.brand_sales),
    purchase_count: stringify(row.purchase_count),
    brand_qty: stringify(row.brand_qty),
    event: stringify(row.event),
    budget: stringify(row.budget),
    marketing_total: stringify(row.marketing_total),
    inflow_24: stringify(row.inflow_24),
    inflow_n: stringify(row.inflow_n),
    inflow_cost: stringify(row.inflow_cost),
    conversion_rate: stringify(row.conversion_rate),
    signup: stringify(row.signup),
    wishlist: stringify(row.wishlist),
    kakao: stringify(row.kakao),
    insta: stringify(row.insta),
    insta_total: stringify(row.insta_total),
  };
}

function calcTotal(f: FormStrings, brand: Brand): string {
  const sf = parseFloat(f.store_farm) || 0;
  const c24 = parseFloat(f.cafe24) || 0;
  if (brand === 'innerpium') {
    const ot = parseFloat(f.other) || 0;
    return String(sf + c24 + ot);
  } else {
    const sv = parseFloat(f.sinsegae_v) || 0;
    const ow = parseFloat(f.other_w) || 0;
    return String(sf + c24 + sv + ow);
  }
}

function formToRow(f: FormStrings, id?: number): Omit<BrandSaleRow, 'created_at'> {
  return {
    ...(id != null ? { id } : {}),
    brand: f.brand as Brand,
    date: f.date,
    store_farm: toNum(f.store_farm),
    cafe24: toNum(f.cafe24),
    other: toNum(f.other),
    sinsegae_v: toNum(f.sinsegae_v),
    other_w: toNum(f.other_w),
    total_revenue: toNum(f.total_revenue),
    brand_sales: toNum(f.brand_sales),
    purchase_count: toNum(f.purchase_count),
    brand_qty: toNum(f.brand_qty),
    event: toNum(f.event),
    budget: toNum(f.budget),
    marketing_total: toNum(f.marketing_total),
    inflow_24: toNum(f.inflow_24),
    inflow_n: toNum(f.inflow_n),
    inflow_cost: toNum(f.inflow_cost),
    conversion_rate: toNum(f.conversion_rate),
    signup: toNum(f.signup),
    wishlist: toNum(f.wishlist),
    kakao: toNum(f.kakao),
    insta: toNum(f.insta),
    insta_total: toNum(f.insta_total),
  } as Omit<BrandSaleRow, 'created_at'>;
}

function dispCell(row: BrandSaleRow, col: ColDef): string {
  const v = row[col.field];
  if (v == null || v === '') return '-';
  if (col.field === 'date') return String(v);
  if (col.field === 'conversion_rate') return `${Number(v).toFixed(2)}%`;
  return Number(v).toLocaleString('ko-KR');
}

/* ─────────────────── Main Component ─────────────────── */
export default function SalesPage() {
  const [tab, setTab] = useState<Brand>('innerpium');
  const [rows, setRows] = useState<BrandSaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormStrings>(blankForm('innerpium'));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRows = useCallback(async (brand: Brand) => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('brand_sales')
      .select('*')
      .eq('brand', brand)
      .order('date', { ascending: false });
    if (!err && data) setRows(data as BrandSaleRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRows(tab);
  }, [tab, fetchRows]);

  // Auto-recalc total_revenue when channel fields change
  function handleFieldChange(key: keyof FormStrings, value: string) {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      const totalKeys = tab === 'innerpium'
        ? ['store_farm', 'cafe24', 'other']
        : ['store_farm', 'cafe24', 'sinsegae_v', 'other_w'];
      if (totalKeys.includes(key as string)) {
        next.total_revenue = calcTotal(next, tab);
      }
      return next;
    });
  }

  function openCreate() {
    setEditId(null);
    setForm(blankForm(tab));
    setError(null);
    setShowForm(true);
  }

  function openEdit(row: BrandSaleRow) {
    setEditId(row.id);
    setForm(rowToFormStrings(row));
    setError(null);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.date) { setError('날짜를 입력해주세요'); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = formToRow(form, editId ?? undefined);
      if (editId != null) {
        const { error: err } = await supabase
          .from('brand_sales')
          .update(payload)
          .eq('id', editId);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('brand_sales')
          .insert(payload);
        if (err) throw err;
      }
      setShowForm(false);
      await fetchRows(tab);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '저장 실패');
    }
    setSaving(false);
  }

  async function handleDelete(id: number) {
    if (!confirm('이 행을 삭제하시겠어요?')) return;
    setDeleting(id);
    await supabase.from('brand_sales').delete().eq('id', id);
    setDeleting(null);
    await fetchRows(tab);
  }

  const cols = tab === 'innerpium' ? INNERPIUM_COLS : AQUACRC_COLS;
  const groups = tab === 'innerpium' ? INNERPIUM_GROUPS : AQUACRC_GROUPS;

  // KPI: current month rows
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthRows = rows.filter(r => r.date.startsWith(ym));
  const kpiRows = monthRows.length > 0 ? monthRows : rows;
  const kpiSub = monthRows.length > 0 ? `${now.getMonth() + 1}월 · ${monthRows.length}일` : `전체 ${rows.length}일`;

  const sumField = (field: keyof BrandSaleRow) =>
    kpiRows.reduce((s, r) => s + (Number(r[field]) || 0), 0);

  const totalRevenue = sumField('total_revenue');
  const storeFarm = sumField('store_farm');
  const cafe24Sum = sumField('cafe24');
  const purchases = sumField('purchase_count');
  const marketingSum = sumField('marketing_total');
  const convRates = kpiRows.map(r => Number(r.conversion_rate)).filter(v => v > 0);
  const avgConv = convRates.length > 0 ? convRates.reduce((a, b) => a + b, 0) / convRates.length : 0;

  // Chart: ascending date
  const barKeys = tab === 'innerpium' ? ['스토어팜', '카페24', '기타'] : ['스토어팜', '카페24', '신세계V', '기타(더블유)'];
  const chartData = [...rows]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => {
      const base: Record<string, string | number> = {
        date: fmtDate(r.date),
        스토어팜: r.store_farm ?? 0,
        카페24: r.cafe24 ?? 0,
        총매출: r.total_revenue ?? 0,
      };
      if (tab === 'innerpium') base['기타'] = r.other ?? 0;
      else { base['신세계V'] = r.sinsegae_v ?? 0; base['기타(더블유)'] = r.other_w ?? 0; }
      return base;
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header: tabs + new button ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['innerpium', 'aquacrc'] as Brand[]).map(t => (
            <button
              key={t}
              className={`btn ${tab === t ? 'btn-rose' : 'btn-ghost'}`}
              onClick={() => { setTab(t); setShowForm(false); }}
            >
              {t === 'innerpium' ? '이너피움' : '아쿠아크'}
            </button>
          ))}
        </div>
        <button className="btn btn-rose" onClick={openCreate}>
          + 오늘 매출 입력
        </button>
      </div>

      {/* ── Entry Form ── */}
      {showForm && (
        <div className="card" style={{ border: '2px solid var(--rose)', position: 'relative' }}>
          <div className="card-head" style={{ justifyContent: 'space-between' }}>
            <div className="card-title">
              {editId != null ? '✎ 매출 수정' : '+ 매출 입력'} — {tab === 'innerpium' ? '이너피움' : '아쿠아크'}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕</button>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', minWidth: 36 }}>날짜</label>
              <input
                type="date"
                className="input"
                style={{ width: 160 }}
                value={form.date}
                onChange={e => handleFieldChange('date', e.target.value)}
              />
            </div>

            {/* Field groups */}
            {groups.map(group => (
              <div key={group.title}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                  {group.title}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                  {group.fields.map(f => (
                    <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{f.label}</label>
                      <input
                        type={f.decimal ? 'number' : 'number'}
                        step={f.decimal ? '0.01' : '1'}
                        className="input"
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 13,
                          background: f.readOnly ? 'var(--surface2)' : undefined,
                          color: f.readOnly ? 'var(--rose2)' : undefined,
                          fontWeight: f.readOnly ? 700 : undefined,
                        }}
                        readOnly={f.readOnly}
                        value={form[f.key]}
                        onChange={e => !f.readOnly && handleFieldChange(f.key, e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {error && (
              <div style={{ fontSize: 12, color: 'var(--rose2)', padding: '8px 12px', background: 'rgba(244,63,94,0.08)', borderRadius: 8 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>취소</button>
              <button className="btn btn-rose" onClick={handleSave} disabled={saving}>
                {saving ? '저장 중…' : editId != null ? '수정 저장' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="empty"><p>불러오는 중…</p></div>
      ) : rows.length === 0 ? (
        <div className="empty" style={{ padding: '48px 0' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📈</div>
          <p>아직 입력된 매출 데이터가 없어요</p>
          <button className="btn btn-rose" style={{ marginTop: 12 }} onClick={openCreate}>
            + 첫 번째 매출 입력
          </button>
        </div>
      ) : (
        <>
          {/* ── KPI Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <KpiCard label="이번달 총매출" value={money(totalRevenue)} sub={kpiSub} accent="var(--rose2)" />
            <KpiCard label="스토어팜 합계" value={money(storeFarm)} sub={kpiSub} />
            <KpiCard label="카페24 합계" value={money(cafe24Sum)} sub={kpiSub} />
            <KpiCard label="총 구매건" value={`${purchases.toLocaleString('ko-KR')}건`} sub={kpiSub} />
            <KpiCard label="마케팅 총비용" value={money(marketingSum)} sub={kpiSub} />
            <KpiCard label="평균 전환률" value={pctStr(avgConv)} sub={kpiSub} />
          </div>

          {/* ── Chart ── */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">▦ 일별 매출 현황</div>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>스택바: 채널별 · 라인: 총매출</span>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={chartData} margin={{ top: 4, right: 48, bottom: 0, left: 8 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
                  <YAxis
                    yAxisId="bar"
                    tick={{ fontSize: 10, fill: 'var(--text3)' }}
                    axisLine={false} tickLine={false}
                    tickFormatter={v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v)}
                  />
                  <YAxis
                    yAxisId="line"
                    orientation="right"
                    tick={{ fontSize: 10, fill: 'var(--text3)' }}
                    axisLine={false} tickLine={false}
                    tickFormatter={v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v)}
                  />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: any) => [`₩${Number(v ?? 0).toLocaleString('ko-KR')}`, undefined]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  {barKeys.map((k, i) => (
                    <Bar key={k} yAxisId="bar" dataKey={k} stackId="s"
                      fill={CHART_COLORS[k] ?? '#888'}
                      radius={i === barKeys.length - 1 ? [2, 2, 0, 0] : undefined}
                    />
                  ))}
                  <Line yAxisId="line" type="monotone" dataKey="총매출" stroke={CHART_COLORS['총매출']} strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Data Table ── */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">▤ 일별 데이터</div>
              <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono',monospace" }}>
                {rows.length}행 · 최신순
              </span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr>
                      {cols.map(c => (
                        <th key={String(c.field)} style={{
                          padding: '8px 10px', textAlign: 'center',
                          background: 'var(--surface2)', borderBottom: '2px solid var(--border)',
                          color: c.bold ? 'var(--rose2)' : 'var(--text2)',
                          fontWeight: c.bold ? 700 : 600, fontSize: 10,
                          position: 'sticky', top: 0,
                        }}>
                          {c.label}
                        </th>
                      ))}
                      <th style={{
                        padding: '8px 10px', background: 'var(--surface2)',
                        borderBottom: '2px solid var(--border)', fontSize: 10,
                        color: 'var(--text3)', position: 'sticky', top: 0,
                      }}>
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, ri) => (
                      <tr key={row.id} style={{
                        background: ri % 2 === 0 ? 'var(--surface)' : 'var(--surface2)',
                        borderTop: '1px solid var(--border)',
                      }}>
                        {cols.map(c => {
                          const v = dispCell(row, c);
                          return (
                            <td key={String(c.field)} style={{
                              padding: '7px 10px',
                              textAlign: c.field === 'date' ? 'left' : 'right',
                              fontWeight: c.bold ? 700 : 400,
                              color: c.bold ? 'var(--text)' : v === '-' ? 'var(--text3)' : 'var(--text)',
                              fontFamily: c.field === 'date' ? undefined : "'DM Mono', monospace",
                            }}>
                              {v}
                            </td>
                          );
                        })}
                        <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ fontSize: 10, padding: '2px 8px' }}
                              onClick={() => openEdit(row)}
                            >
                              수정
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ fontSize: 10, padding: '2px 8px', color: 'var(--rose2)' }}
                              disabled={deleting === row.id}
                              onClick={() => handleDelete(row.id)}
                            >
                              {deleting === row.id ? '…' : '삭제'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────── KPI Card ─────────────────── */
function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: accent ?? 'var(--text)', fontFamily: "'DM Mono', monospace", letterSpacing: '-0.03em' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
