'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  ResponsiveContainer, ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { supabase } from '../../lib/supabase';

/* ─────────────────── Types ─────────────────── */
type Brand = 'innerpium' | 'aquarc';

interface BrandSaleRow {
  id: number;
  brand: Brand;
  date: string;
  storefarm: number | null;
  cafe24: number | null;
  etc: number | null;
  total_sales: number | null;
  main_product_sales: number | null;
  purchase_count: number | null;
  main_product_qty: number | null;
  event: number | null;
  budget_setting: number | null;
  marketing_total: number | null;
  inflow_24: number | null;
  inflow_n: number | null;
  inflow_cost: number | null;       // auto: marketing_total / (inflow_24 + inflow_n)
  conversion_rate: number | null;   // auto: purchase_count / inflow_24 * 100
  signup: number | null;
  wishlist: number | null;
  kakao: number | null;
  insta: number | null;
  insta_total: number | null;
  created_at?: string;
}

/* ─────────────────── Column Definitions ─────────────────── */
interface ColDef {
  field: keyof BrandSaleRow;
  label: string;
  bold?: boolean;
  auto?: boolean;   // auto-calculated, read-only
  noEdit?: boolean; // not inline-editable
}

const INNERPIUM_COLS: ColDef[] = [
  { field: 'date',               label: '날짜',         noEdit: true },
  { field: 'storefarm',          label: '스토어팜' },
  { field: 'cafe24',             label: '카페24' },
  { field: 'etc',                label: '기타' },
  { field: 'total_sales',        label: '총매출',        bold: true, auto: true },
  { field: 'main_product_sales', label: '유산균매출' },
  { field: 'purchase_count',     label: '구매건' },
  { field: 'main_product_qty',   label: '유산균수량' },
  { field: 'event',              label: 'EVENT' },
  { field: 'budget_setting',     label: '설정금액' },
  { field: 'marketing_total',    label: '마케팅총금액비용' },
  { field: 'inflow_24',          label: '유입(24)' },
  { field: 'inflow_n',           label: '유입(N)' },
  { field: 'inflow_cost',        label: '유입비용',      auto: true },
  { field: 'conversion_rate',    label: '전환률',        auto: true },
  { field: 'signup',             label: '회원가입' },
  { field: 'wishlist',           label: '찜' },
  { field: 'kakao',              label: '카카오' },
  { field: 'insta',              label: '인스타' },
  { field: 'insta_total',        label: '인스타총' },
];

const AQUACRC_COLS: ColDef[] = [
  { field: 'date',               label: '날짜',          noEdit: true },
  { field: 'storefarm',          label: '스토어팜' },
  { field: 'cafe24',             label: '카페24' },
  { field: 'etc',                label: '기타' },
  { field: 'total_sales',        label: '총매출',         bold: true, auto: true },
  { field: 'main_product_sales', label: '클렌저매출' },
  { field: 'purchase_count',     label: '구매건' },
  { field: 'main_product_qty',   label: '클렌저수량' },
  { field: 'event',              label: 'EVENT' },
  { field: 'budget_setting',     label: '설정금액' },
  { field: 'marketing_total',    label: '마케팅총금액비용' },
  { field: 'inflow_24',          label: '유입(24)' },
  { field: 'inflow_n',           label: '유입(N)' },
  { field: 'inflow_cost',        label: '유입비용',       auto: true },
  { field: 'conversion_rate',    label: '전환률',         auto: true },
  { field: 'signup',             label: '회원가입' },
  { field: 'wishlist',           label: '찜' },
  { field: 'kakao',              label: '카카오' },
  { field: 'insta',              label: '인스타' },
  { field: 'insta_total',        label: '인스타총' },
];

/* ─────────────────── Helpers ─────────────────── */
const CHART_COLORS: Record<string, string> = {
  스토어팜: '#10b981',
  카페24: '#3b82f6',
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
  if (v >= 1_000_000)   return `₩${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)       return `₩${(v / 1_000).toFixed(0)}K`;
  return `₩${v.toLocaleString('ko-KR')}`;
}

function pctStr(v: number): string {
  return isNaN(v) || !isFinite(v) ? '-' : `${v.toFixed(1)}%`;
}

function fmtDate(s: string): string {
  const d = new Date(s);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function isEmptyRow(r: BrandSaleRow): boolean {
  const noChannels = !r.storefarm && !r.cafe24 && !r.etc;
  const noTotal    = !r.total_sales || r.total_sales === 0;
  return noChannels && noTotal;
}

function dispCell(row: BrandSaleRow, col: ColDef): string {
  const v = row[col.field];
  if (v == null || v === '') return '-';
  if (col.field === 'date') return String(v);
  if (col.field === 'conversion_rate') {
    const n = Number(v);
    return isNaN(n) || !isFinite(n) ? '-' : `${n.toFixed(1)}%`;
  }
  if (col.field === 'inflow_cost') {
    const n = Math.round(Number(v));
    return isNaN(n) ? '-' : n.toLocaleString('ko-KR');
  }
  const n = Number(v);
  return isNaN(n) ? '-' : n.toLocaleString('ko-KR');
}

function calcAutoFields(row: BrandSaleRow): BrandSaleRow {
  const r = { ...row };
  // total_sales = storefarm + cafe24 + etc
  r.total_sales = (r.storefarm || 0) + (r.cafe24 || 0) + (r.etc || 0);
  // inflow_cost = marketing_total / (inflow_24 + inflow_n)  [integer]
  const inflowSum = (r.inflow_24 || 0) + (r.inflow_n || 0);
  r.inflow_cost = inflowSum > 0 ? Math.round((r.marketing_total || 0) / inflowSum) : null;
  // conversion_rate = purchase_count / inflow_24 * 100  [소수점 1자리 %]
  r.conversion_rate = (r.inflow_24 || 0) > 0
    ? Number(((r.purchase_count || 0) / r.inflow_24! * 100).toFixed(1))
    : null;
  return r;
}

/* ─────────────────── Calculator helpers ─────────────────── */
const CALC_ROWS = [
  ['C', '←', '(', ')'],
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', '-'],
  ['0', '.', '+', '='],
];
const CALC_OPS   = new Set(['÷', '×', '-', '+', '(', ')']);
const CALC_FUNCS = new Set(['C', '←', '=']);

/* ─────────────────── Main Component ─────────────────── */
export default function SalesPage() {
  const now = new Date();

  // ── Core ──
  const [tab,     setTab]     = useState<Brand>('innerpium');
  const [rows,    setRows]    = useState<BrandSaleRow[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Inline edit ──
  const [editCell,  setEditCell]  = useState<{ rowId: number; field: keyof BrandSaleRow } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingRows, setSavingRows] = useState<Set<number>>(new Set());
  const inputRef    = useRef<HTMLInputElement>(null);
  const committingRef = useRef(false);

  // ── New row form ──
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [formDate, setFormDate] = useState(todayStr());

  // ── Download filter ──
  const [filterYear,  setFilterYear]  = useState(String(now.getFullYear()));
  const [filterMonth, setFilterMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));

  // ── Memo ──
  const [memo, setMemo] = useState('');
  useEffect(() => { setMemo(localStorage.getItem(`memo-${tab}`) || ''); }, [tab]);

  // ── Calculator ──
  const [calcExpr,       setCalcExpr]       = useState('');
  const [calcResult,     setCalcResult]     = useState('0');
  const [calcShowResult, setCalcShowResult] = useState(false);

  // ── Fetch ──
  const fetchRows = useCallback(async (brand: Brand) => {
    setLoading(true);
    console.log(`[SalesPage] fetchRows — brand: ${brand}`);
    const { data, error } = await supabase
      .from('brand_sales')
      .select('*')
      .eq('brand', brand)
      .order('date', { ascending: false })
      .limit(60);
    console.log('data:', data, 'error:', error);
    const filtered = (data as BrandSaleRow[])?.filter(row =>
      row.storefarm !== null ||
      row.cafe24    !== null ||
      (row.total_sales ?? 0) > 0
    ) ?? [];
    setRows(filtered);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRows(tab); }, [tab, fetchRows]);

  // Focus input when editCell changes
  useEffect(() => { if (editCell) inputRef.current?.focus(); }, [editCell]);

  // ── Derived ──
  const cols        = tab === 'innerpium' ? INNERPIUM_COLS : AQUACRC_COLS;
  const displayRows = rows.slice(0, 30);

  const availableYears = [...new Set(rows.map(r => r.date.slice(0, 4)))].sort().reverse();
  const currentYearStr = String(now.getFullYear());
  if (!availableYears.includes(currentYearStr)) availableYears.unshift(currentYearStr);

  const downloadRows = rows.filter(r => {
    if (filterYear  && !r.date.startsWith(filterYear)) return false;
    if (filterYear && filterMonth && !r.date.startsWith(`${filterYear}-${filterMonth}`)) return false;
    return true;
  });

  // KPI — 이번달
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthRows  = rows.filter(r => r.date.startsWith(currentMonthPrefix));
  const sumMonth   = (f: keyof BrandSaleRow) => monthRows.reduce((s, r) => s + (Number(r[f]) || 0), 0);
  const totalRevenue = sumMonth('total_sales');
  const storeFarm    = sumMonth('storefarm');
  const cafe24Sum    = sumMonth('cafe24');
  const purchases    = sumMonth('purchase_count');
  const marketingSum = sumMonth('marketing_total');
  const convRates    = monthRows.map(r => Number(r.conversion_rate)).filter(v => v > 0);
  const avgConv      = convRates.length > 0 ? convRates.reduce((a, b) => a + b) / convRates.length : 0;
  const kpiSub       = `${now.getMonth() + 1}월 (${monthRows.length}일)`;

  // Chart
  const barKeys   = ['스토어팜', '카페24', '기타'];
  const chartData = [...displayRows].sort((a, b) => a.date.localeCompare(b.date)).map(r => ({
    date: fmtDate(r.date),
    스토어팜: r.storefarm ?? 0,
    카페24:   r.cafe24    ?? 0,
    기타:     r.etc       ?? 0,
    총매출:   r.total_sales ?? 0,
  }));

  // ── Inline edit handlers ──
  function startEdit(rowId: number, field: keyof BrandSaleRow) {
    const col = cols.find(c => c.field === field);
    if (!col || col.auto || col.noEdit) return;
    const row = rows.find(r => r.id === rowId);
    if (!row) return;
    const v = row[field];
    setEditCell({ rowId, field });
    setEditValue(v == null ? '' : String(v));
  }

  function commitEdit() {
    if (!editCell || committingRef.current) return;
    committingRef.current = true;
    const { rowId, field } = editCell;
    const value = editValue;
    setEditCell(null);
    setEditValue('');
    doSave(rowId, field, value).finally(() => { committingRef.current = false; });
  }

  function cancelEdit() {
    setEditCell(null);
    setEditValue('');
  }

  async function doSave(rowId: number, field: keyof BrandSaleRow, value: string) {
    const row = rows.find(r => r.id === rowId);
    if (!row) return;
    const numVal = toNum(value);
    if (numVal === row[field]) return; // no change
    const updated = calcAutoFields({ ...row, [field]: numVal });
    setRows(prev => prev.map(r => r.id === rowId ? updated : r));
    setSavingRows(prev => new Set([...prev, rowId]));
    try {
      await supabase.from('brand_sales').update({
        [field]: numVal,
        total_sales:     updated.total_sales,
        inflow_cost:     updated.inflow_cost,
        conversion_rate: updated.conversion_rate,
      }).eq('id', rowId);
    } finally {
      setSavingRows(prev => { const s = new Set(prev); s.delete(rowId); return s; });
    }
  }

  // ── New row ──
  async function handleCreateRow() {
    if (!formDate) return;
    setSaving(true);
    const { data, error: err } = await supabase
      .from('brand_sales')
      .insert({ brand: tab, date: formDate })
      .select()
      .single();
    if (!err && data) {
      setRows(prev => [data as BrandSaleRow, ...prev]);
      setShowForm(false);
    }
    setSaving(false);
  }

  // ── Delete ──
  async function handleDelete(id: number) {
    if (!confirm('이 행을 삭제하시겠어요?')) return;
    await supabase.from('brand_sales').delete().eq('id', id);
    setRows(prev => prev.filter(r => r.id !== id));
  }

  // ── Excel download ──
  function handleDownload() {
    if (downloadRows.length === 0) return;
    const brandName = tab === 'innerpium' ? '이너피움' : '아쿠아크';
    const period    = filterYear && filterMonth
      ? `${filterYear}_${filterMonth}`
      : filterYear || currentYearStr;
    const filename  = `${brandName}_매출_${period}.xlsx`;
    const headers   = cols.map(c => c.label);
    const dataRows  = downloadRows.map(row =>
      cols.map(c => {
        const v = row[c.field];
        if (v == null) return '';
        if (c.field === 'date')            return String(v);
        if (c.field === 'inflow_cost')     return Math.round(Number(v));
        if (c.field === 'conversion_rate') return Number(v);
        return Number(v);
      })
    );
    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    ws['!cols'] = cols.map(c => ({ wch: c.field === 'date' ? 12 : 14 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, brandName);
    XLSX.writeFile(wb, filename);
  }

  // ── Calculator ──
  function calcPress(btn: string) {
    if (btn === 'C') {
      setCalcExpr(''); setCalcResult('0'); setCalcShowResult(false); return;
    }
    if (btn === '←') {
      if (calcShowResult) { setCalcExpr(''); setCalcResult('0'); setCalcShowResult(false); }
      else { setCalcExpr(p => p.slice(0, -1) || ''); }
      return;
    }
    if (btn === '=') {
      if (!calcExpr) return;
      try {
        const expr = calcExpr.replace(/×/g, '*').replace(/÷/g, '/');
        // eslint-disable-next-line no-new-func
        const res = Function('"use strict"; return (' + expr + ')')() as number;
        setCalcResult(Number(res.toFixed(10)).toString());
        setCalcShowResult(true);
      } catch { setCalcResult('오류'); setCalcShowResult(true); }
      return;
    }
    if (calcShowResult) {
      setCalcExpr(CALC_OPS.has(btn) ? calcResult + btn : btn);
      setCalcShowResult(false);
      return;
    }
    setCalcExpr(p => p + btn);
  }

  const calcDisplay = calcShowResult ? calcResult : (calcExpr || '0');

  // ── Render ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        {/* Brand tabs */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['innerpium', 'aquarc'] as Brand[]).map(t => (
            <button key={t} className={`btn ${tab === t ? 'btn-rose' : 'btn-ghost'}`}
              onClick={() => { setTab(t); setShowForm(false); cancelEdit(); }}>
              {t === 'innerpium' ? '이너피움' : '아쿠아크'}
            </button>
          ))}
        </div>

        {/* Period filter (for download) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <select className="input" style={{ width: 90, fontSize: 12, padding: '4px 8px', height: 32 }}
            value={filterYear} onChange={e => setFilterYear(e.target.value)}>
            <option value="">전체</option>
            {availableYears.map(y => <option key={y} value={y}>{y}년</option>)}
          </select>
          <select className="input" style={{ width: 76, fontSize: 12, padding: '4px 8px', height: 32 }}
            value={filterMonth} onChange={e => setFilterMonth(e.target.value)} disabled={!filterYear}>
            <option value="">전체</option>
            {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
              <option key={m} value={m}>{Number(m)}월</option>
            ))}
          </select>
          {(filterYear || filterMonth) && (
            <button className="btn btn-ghost btn-sm"
              style={{ fontSize: 11, padding: '4px 8px', height: 32 }}
              onClick={() => { setFilterYear(''); setFilterMonth(''); }}>
              전체
            </button>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost" style={{ fontSize: 12 }}
            onClick={handleDownload} disabled={downloadRows.length === 0}>
            ↓ 엑셀 다운로드
          </button>
          <button className="btn btn-rose"
            onClick={() => { setShowForm(v => !v); setFormDate(todayStr()); }}>
            + 오늘 매출 입력
          </button>
        </div>
      </div>

      {/* ── New row form ── */}
      {showForm && (
        <div className="card" style={{ border: '2px solid var(--rose)' }}>
          <div className="card-head" style={{ justifyContent: 'space-between' }}>
            <div className="card-title">+ 새 행 추가 — {tab === 'innerpium' ? '이너피움' : '아쿠아크'}</div>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕</button>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>날짜</label>
                <input type="date" className="input" style={{ width: 160 }}
                  value={formDate} onChange={e => setFormDate(e.target.value)} />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text3)' }}>
                행 추가 후 셀을 클릭해서 데이터를 입력하세요
              </p>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" onClick={() => setShowForm(false)}>취소</button>
                <button className="btn btn-rose" onClick={handleCreateRow} disabled={saving}>
                  {saving ? '추가 중…' : '행 추가'}
                </button>
              </div>
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
          <button className="btn btn-rose" style={{ marginTop: 12 }}
            onClick={() => { setShowForm(true); setFormDate(todayStr()); }}>
            + 첫 번째 매출 입력
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

          {/* ── Left: main content ── */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <KpiCard label="이번달 총매출" value={money(totalRevenue)} sub={kpiSub} accent="var(--rose2)" />
              <KpiCard label="스토어팜"      value={money(storeFarm)}    sub={kpiSub} />
              <KpiCard label="카페24"        value={money(cafe24Sum)}    sub={kpiSub} />
              <KpiCard label="구매건"        value={`${purchases.toLocaleString('ko-KR')}건`} sub={kpiSub} />
              <KpiCard label="마케팅 비용"   value={money(marketingSum)} sub={kpiSub} />
              <KpiCard label="평균 전환률"   value={pctStr(avgConv)}     sub={kpiSub} />
            </div>

            {/* Chart */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">▦ 일별 매출 현황</div>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>최근 30일 · 스택바: 채널별 · 라인: 총매출</span>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={chartData} margin={{ top: 4, right: 48, bottom: 0, left: 8 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="bar" tick={{ fontSize: 10, fill: 'var(--text3)' }} axisLine={false} tickLine={false}
                      tickFormatter={v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v)} />
                    <YAxis yAxisId="line" orientation="right" tick={{ fontSize: 10, fill: 'var(--text3)' }} axisLine={false} tickLine={false}
                      tickFormatter={v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v)} />
                    <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(v: any) => [`₩${Number(v ?? 0).toLocaleString('ko-KR')}`, undefined]} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    {barKeys.map((k, i) => (
                      <Bar key={k} yAxisId="bar" dataKey={k} stackId="s"
                        fill={CHART_COLORS[k] ?? '#888'}
                        radius={i === barKeys.length - 1 ? [2, 2, 0, 0] : undefined} />
                    ))}
                    <Line yAxisId="line" type="monotone" dataKey="총매출" stroke={CHART_COLORS['총매출']} strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Inline-edit Table */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">▤ 일별 데이터</div>
                <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono',monospace" }}>
                  최근 {displayRows.length}행 · 셀 클릭으로 수정
                  {savingRows.size > 0 && (
                    <span style={{ color: 'var(--rose2)', marginLeft: 8 }}>저장 중…</span>
                  )}
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
                            color: c.auto ? 'var(--text3)' : c.bold ? 'var(--rose2)' : 'var(--text2)',
                            fontWeight: c.bold ? 700 : 600, fontSize: 10,
                            position: 'sticky', top: 0,
                          }}>
                            {c.label}{c.auto ? <span style={{ opacity: 0.5 }}> *</span> : ''}
                          </th>
                        ))}
                        <th style={{
                          padding: '8px 10px', background: 'var(--surface2)',
                          borderBottom: '2px solid var(--border)', fontSize: 10,
                          color: 'var(--text3)', position: 'sticky', top: 0,
                        }}>작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayRows.map((row, ri) => {
                        const isSaving = savingRows.has(row.id);
                        return (
                          <tr key={row.id} style={{
                            background: ri % 2 === 0 ? 'var(--surface)' : 'var(--surface2)',
                            borderTop: '1px solid var(--border)',
                            opacity: isSaving ? 0.65 : 1,
                            transition: 'opacity 0.2s',
                          }}>
                            {cols.map(c => {
                              const isEditing = editCell?.rowId === row.id && editCell?.field === c.field;
                              const canEdit   = !c.auto && !c.noEdit;
                              const v         = dispCell(row, c);
                              return (
                                <td key={String(c.field)}
                                  onClick={() => canEdit && startEdit(row.id, c.field)}
                                  style={{
                                    padding: isEditing ? 0 : '7px 10px',
                                    textAlign: c.field === 'date' ? 'left' : 'right',
                                    fontWeight: c.bold ? 700 : 400,
                                    color: c.auto
                                      ? 'var(--text3)'
                                      : c.bold
                                      ? 'var(--text)'
                                      : v === '-' ? 'var(--text3)' : 'var(--text)',
                                    fontFamily: c.field === 'date' ? undefined : "'DM Mono', monospace",
                                    cursor: canEdit ? 'text' : 'default',
                                    background: isEditing ? 'rgba(244,63,94,0.06)' : undefined,
                                    minWidth: isEditing ? 80 : undefined,
                                  }}>
                                  {isEditing ? (
                                    <input
                                      ref={inputRef}
                                      type="number"
                                      value={editValue}
                                      onChange={e => setEditValue(e.target.value)}
                                      onBlur={commitEdit}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter')  { e.preventDefault(); commitEdit(); }
                                        if (e.key === 'Escape') cancelEdit();
                                      }}
                                      style={{
                                        width: '100%', padding: '7px 10px',
                                        background: 'transparent', border: 'none', outline: 'none',
                                        textAlign: 'right', fontSize: 11, color: 'var(--text)',
                                        fontFamily: "'DM Mono', monospace",
                                      }}
                                    />
                                  ) : v}
                                </td>
                              );
                            })}
                            <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                              <button className="btn btn-ghost btn-sm"
                                style={{ fontSize: 10, padding: '2px 8px', color: 'var(--rose2)' }}
                                onClick={() => handleDelete(row.id)}>
                                삭제
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: side panel ── */}
          <div style={{ width: 248, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 16 }}>

            {/* Memo */}
            <div className="card">
              <div className="card-head">
                <div className="card-title" style={{ fontSize: 12 }}>✎ 메모</div>
                <span style={{ fontSize: 10, color: 'var(--text3)' }}>자동 저장</span>
              </div>
              <div className="card-body" style={{ padding: '8px 10px' }}>
                <textarea
                  value={memo}
                  onChange={e => {
                    const v = e.target.value;
                    setMemo(v);
                    localStorage.setItem(`memo-${tab}`, v);
                  }}
                  placeholder="자유롭게 메모하세요…"
                  style={{
                    width: '100%', height: 148,
                    background: 'transparent', border: 'none', outline: 'none',
                    resize: 'vertical', fontSize: 12, color: 'var(--text)',
                    fontFamily: 'inherit', lineHeight: 1.65,
                  }}
                />
              </div>
            </div>

            {/* Calculator */}
            <div className="card">
              <div className="card-head">
                <div className="card-title" style={{ fontSize: 12 }}>⊞ 계산기</div>
              </div>
              <div className="card-body" style={{ padding: '8px 10px' }}>
                {/* Display */}
                <div style={{
                  background: 'var(--surface2)', borderRadius: 8,
                  padding: '8px 12px', marginBottom: 6,
                  textAlign: 'right', fontSize: 20, fontWeight: 700,
                  fontFamily: "'DM Mono', monospace", color: 'var(--text)',
                  minHeight: 44, wordBreak: 'break-all', lineHeight: 1.2,
                }}>
                  {calcDisplay}
                </div>
                {/* Expression hint */}
                {!calcShowResult && calcExpr && (
                  <div style={{
                    textAlign: 'right', fontSize: 10, color: 'var(--text3)',
                    marginBottom: 6, fontFamily: "'DM Mono', monospace",
                    overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {calcExpr}
                  </div>
                )}
                {/* Buttons */}
                {CALC_ROWS.map((btnRow, ri) => (
                  <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 4 }}>
                    {btnRow.map(btn => (
                      <button key={btn} onClick={() => calcPress(btn)} style={{
                        padding: '10px 0', borderRadius: 6, border: 'none',
                        cursor: 'pointer', fontSize: 13,
                        fontWeight: CALC_FUNCS.has(btn) || CALC_OPS.has(btn) ? 600 : 400,
                        fontFamily: "'DM Mono', monospace",
                        background: btn === '='
                          ? 'var(--rose2)'
                          : CALC_OPS.has(btn)
                          ? 'var(--surface2)'
                          : CALC_FUNCS.has(btn)
                          ? 'var(--surface2)'
                          : 'var(--surface)',
                        color: btn === '='
                          ? '#fff'
                          : btn === 'C'
                          ? 'var(--rose2)'
                          : CALC_OPS.has(btn)
                          ? 'var(--rose2)'
                          : 'var(--text)',
                      }}>
                        {btn}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
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
