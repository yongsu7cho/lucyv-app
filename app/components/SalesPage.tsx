'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  ResponsiveContainer, ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, LabelList,
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
  conversion_rate: number | null;   // auto: purchase_count / (inflow_24 + inflow_n) * 100
  signup: number | null;
  wishlist: number | null;
  kakao: number | null;
  insta: number | null;
  insta_total: number | null;
  created_at?: string;
}

interface MonthSummary {
  month: string;
  total_sales: number;
  storefarm: number;
  cafe24: number;
  etc: number;
  marketing_total: number;
  purchase_count: number;
  main_product_qty: number;
  mktRatio: number;
  net_profit: number;
  inflow_24: number;
  inflow_n: number;
  inflow_cost: number;
  conversion_rate: number;
  signup: number;
  wishlist: number;
  kakao: number;
  insta: number;
}

/* ─────────────────── Column Definitions ─────────────────── */
interface ColDef {
  field: keyof BrandSaleRow;
  label: string;
  bold?: boolean;
  auto?: boolean;
  noEdit?: boolean;
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
  카페24:   '#3b82f6',
  기타:     '#94a3b8',
  총매출:   '#f43f5e',
};
const PIE_COLORS = ['#10b981', '#3b82f6', '#94a3b8'];

function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function toNum(s: string): number | null {
  const n = parseFloat(s.replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

/** 전체 숫자 표시 (축약 없음) */
function numFmt(v: number | null): string {
  if (v == null || v === 0) return '0';
  return v.toLocaleString('ko-KR');
}

function wonFmt(v: number | null): string {
  return `₩${numFmt(v)}`;
}

function pctStr(v: number, digits = 1): string {
  return isNaN(v) || !isFinite(v) ? '-' : `${v.toFixed(digits)}%`;
}

function fmtDate(s: string): string {
  const d = new Date(s);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function mktRatioColor(pct: number): string {
  if (pct <= 30) return '#10b981';
  if (pct <= 50) return '#f59e0b';
  return '#f43f5e';
}

function isEmptyRow(r: BrandSaleRow): boolean {
  return !r.storefarm && !r.cafe24 && !r.etc && (!r.total_sales || r.total_sales === 0);
}

function dispCell(row: BrandSaleRow, col: ColDef): string {
  const v = row[col.field];
  if (v == null || v === '') return '-';
  if (col.field === 'date') return String(v);
  if (col.field === 'conversion_rate') {
    const n = Number(v);
    return isNaN(n) || !isFinite(n) ? '-' : `${n.toFixed(2)}%`;
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
  r.total_sales = (r.storefarm || 0) + (r.cafe24 || 0) + (r.etc || 0);
  const inflowSum = (r.inflow_24 || 0) + (r.inflow_n || 0);
  r.inflow_cost     = inflowSum > 0 ? Math.round((r.marketing_total || 0) / inflowSum) : null;
  r.conversion_rate = r.inflow_24
    ? Number(((r.purchase_count || 0) / r.inflow_24 * 100).toFixed(2))
    : null;
  return r;
}

function buildMonthlySummary(rows: BrandSaleRow[]): MonthSummary[] {
  const map = new Map<string, MonthSummary>();
  for (const r of rows) {
    const month = r.date.slice(0, 7);
    if (!map.has(month)) {
      map.set(month, { month, total_sales: 0, storefarm: 0, cafe24: 0, etc: 0, marketing_total: 0, purchase_count: 0, main_product_qty: 0, mktRatio: 0, net_profit: 0, inflow_24: 0, inflow_n: 0, inflow_cost: 0, conversion_rate: 0, signup: 0, wishlist: 0, kakao: 0, insta: 0 });
    }
    const s = map.get(month)!;
    s.total_sales      += r.total_sales      || 0;
    s.storefarm        += r.storefarm        || 0;
    s.cafe24           += r.cafe24           || 0;
    s.etc              += r.etc              || 0;
    s.marketing_total  += r.marketing_total  || 0;
    s.purchase_count   += r.purchase_count   || 0;
    s.main_product_qty += r.main_product_qty || 0;
    s.inflow_24        += r.inflow_24        || 0;
    s.inflow_n         += r.inflow_n         || 0;
    s.signup           += r.signup           || 0;
    s.wishlist         += r.wishlist         || 0;
    s.kakao            += r.kakao            || 0;
    s.insta            += r.insta            || 0;
  }
  const result = [...map.values()].sort((a, b) => b.month.localeCompare(a.month));
  for (const s of result) {
    s.mktRatio       = s.total_sales > 0 ? s.marketing_total / s.total_sales * 100 : 0;
    s.net_profit     = s.total_sales - s.marketing_total - (s.purchase_count * 4500) - (s.main_product_qty * 11495);
    const totalInflow = s.inflow_24 + s.inflow_n;
    s.inflow_cost    = totalInflow > 0 ? Math.round(s.marketing_total / totalInflow) : 0;
    s.conversion_rate = s.inflow_24 > 0 ? Number((s.purchase_count / s.inflow_24 * 100).toFixed(2)) : 0;
  }
  return result;
}

/* ─────────────────── Custom Tooltips ─────────────────── */

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

  const [tab,     setTab]     = useState<Brand>('innerpium');
  const [rows,    setRows]    = useState<BrandSaleRow[]>([]);
  const [allRows, setAllRows] = useState<BrandSaleRow[]>([]); // 필터 전 전체 데이터 (마케팅비율 계산용)
  const [loading, setLoading] = useState(true);

  const [editCell,    setEditCell]    = useState<{ rowId: number; field: keyof BrandSaleRow } | null>(null);
  const [editValue,   setEditValue]   = useState('');
  const [savingRows,  setSavingRows]  = useState<Set<number>>(new Set());
  const inputRef      = useRef<HTMLInputElement>(null);
  const committingRef = useRef(false);
  const calcRef       = useRef<HTMLDivElement>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [formDate, setFormDate] = useState(todayStr());

  const [selectedYear,  setSelectedYear]  = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedDay,   setSelectedDay]   = useState('');

  const [dateMode,   setDateMode]   = useState<'month' | 'range'>('month');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd,   setRangeEnd]   = useState('');

  const [memo, setMemo] = useState('');
  useEffect(() => { setMemo(localStorage.getItem(`memo-${tab}`) || ''); }, [tab]);

  const [calcExpr,       setCalcExpr]       = useState('');
  const [calcResult,     setCalcResult]     = useState('0');
  const [calcShowResult, setCalcShowResult] = useState(false);

  // ── Fetch — 전체 데이터 한번에 로드 (limit 없음) ──
  const fetchRows = useCallback(async (brand: Brand) => {
    setLoading(true);
    const { data } = await supabase
      .from('brand_sales')
      .select('*')
      .eq('brand', brand)
      .order('date', { ascending: false });
    const raw      = (data as BrandSaleRow[]) ?? [];
    const filtered = raw.filter(row =>
      row.storefarm !== null ||
      row.cafe24    !== null ||
      (row.total_sales ?? 0) > 0
    );
    setAllRows(raw);     // 마케팅비율 계산: 필터 전 전체 데이터
    setRows(filtered);
    // 가장 최근 데이터 날짜로 자동 설정
    if (filtered.length > 0) {
      const latest = filtered[0].date;
      setSelectedYear(latest.slice(0, 4));
      setSelectedMonth(latest.slice(5, 7));
      setSelectedDay(latest.slice(8, 10));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRows(tab); }, [tab, fetchRows]);
  useEffect(() => { if (editCell) inputRef.current?.focus(); }, [editCell]);

  // ── Derived ──
  const cols = tab === 'innerpium' ? INNERPIUM_COLS : AQUACRC_COLS;

  // 선택 날짜 조합
  const selectedMonthPrefix = selectedYear && selectedMonth ? `${selectedYear}-${selectedMonth}` : '';
  const selectedDayStr      = selectedMonthPrefix && selectedDay ? `${selectedMonthPrefix}-${selectedDay}` : '';

  // 드롭다운 옵션
  const availableYears  = [...new Set(rows.map(r => r.date.slice(0, 4)))].sort().reverse();
  const availableMonths = selectedYear
    ? [...new Set(rows.filter(r => r.date.startsWith(selectedYear)).map(r => r.date.slice(5, 7)))].sort().reverse()
    : [];
  const availableDays = selectedMonthPrefix
    ? [...new Set(rows.filter(r => r.date.startsWith(selectedMonthPrefix)).map(r => r.date.slice(8, 10)))].sort().reverse()
    : [];

  // 연/월 변경 시 하위 선택 자동 갱신
  function handleYearChange(year: string) {
    setSelectedYear(year);
    const months = [...new Set(rows.filter(r => r.date.startsWith(year)).map(r => r.date.slice(5, 7)))].sort().reverse();
    const m = months[0] ?? '';
    setSelectedMonth(m);
    if (m) {
      const days = [...new Set(rows.filter(r => r.date.startsWith(`${year}-${m}`)).map(r => r.date.slice(8, 10)))].sort().reverse();
      setSelectedDay(days[0] ?? '');
    } else { setSelectedDay(''); }
  }
  function handleMonthChange(month: string) {
    setSelectedMonth(month);
    if (selectedYear && month) {
      const days = [...new Set(rows.filter(r => r.date.startsWith(`${selectedYear}-${month}`)).map(r => r.date.slice(8, 10)))].sort().reverse();
      setSelectedDay(days[0] ?? '');
    } else { setSelectedDay(''); }
  }

  // 선택한 월 행 (테이블·차트·KPI 좌)
  const filteredRows = dateMode === 'range'
    ? rows.filter(r => (!rangeStart || r.date >= rangeStart) && (!rangeEnd || r.date <= rangeEnd))
    : selectedMonthPrefix
      ? rows.filter(r => r.date.startsWith(selectedMonthPrefix))
      : rows.slice(0, 30);
  const displayRows  = filteredRows;
  const downloadRows = dateMode === 'range'
    ? rows.filter(r => (!rangeStart || r.date >= rangeStart) && (!rangeEnd || r.date <= rangeEnd))
    : selectedMonthPrefix ? rows.filter(r => r.date.startsWith(selectedMonthPrefix)) : rows;

  // KPI — 선택한 월
  const monthRows    = selectedMonthPrefix ? rows.filter(r => r.date.startsWith(selectedMonthPrefix)) : [];
  const sumMonth     = (f: keyof BrandSaleRow) => monthRows.reduce((s, r) => s + (Number(r[f]) || 0), 0);
  const kpiTotal     = sumMonth('total_sales');
  const kpiStorefarm = sumMonth('storefarm');
  const kpiCafe24    = sumMonth('cafe24');
  const kpiEtc       = sumMonth('etc');
  const kpiPurchases = sumMonth('purchase_count');
  const kpiMarketing = sumMonth('marketing_total');
  const kpiSub       = selectedMonth ? `${Number(selectedMonth)}월 (${monthRows.length}일)` : '-';

  // KPI — 선택한 날짜
  const dayRow      = selectedDayStr ? rows.find(r => r.date === selectedDayStr) : null;
  const dayTotal     = dayRow?.total_sales    ?? null;
  const dayStorefarm = dayRow?.storefarm       ?? null;
  const dayCafe24    = dayRow?.cafe24          ?? null;
  const dayEtc       = dayRow?.etc             ?? null;
  const dayPurchases = dayRow?.purchase_count  ?? null;
  const dayMarketing = dayRow?.marketing_total ?? null;

  // 월별 요약
  const monthlySummary = buildMonthlySummary(rows);

  // 분석: 채널 파이
  const pieChannelTotal = (kpiStorefarm || 0) + (kpiCafe24 || 0) + (kpiEtc || 0);

  // 유입수 + 유입비용 차트 (월별)
  const inflowChartData = [...monthlySummary].reverse().map(s => ({
    month:          s.month.slice(5) + '월',
    '카페24유입':   s.inflow_24,
    '네이버유입':   s.inflow_n,
    '유입비용':     s.inflow_cost,
    'inflow_total': s.inflow_24 + s.inflow_n,
  }));

  // 전환률 차트 (월별)
  const convRateChartData = [...monthlySummary].reverse().map(s => ({
    month:       s.month.slice(5) + '월',
    '전환률(%)': s.conversion_rate,
  }));

  // 회원가입/찜/카카오/인스타 차트 (월별)
  const engagementChartData = [...monthlySummary].reverse().map(s => ({
    month:      s.month.slice(5) + '월',
    '회원가입':  s.signup,
    '찜':        s.wishlist,
    '카카오':    s.kakao,
    '인스타':    s.insta,
    'eng_total': s.signup + s.wishlist + s.kakao + s.insta,
  }));
  const pieData = [
    { name: '스토어팜', value: kpiStorefarm || 0 },
    { name: '카페24',   value: kpiCafe24   || 0 },
    { name: '기타',     value: kpiEtc      || 0 },
  ].filter(d => d.value > 0);

  // 일별 차트
  const barKeys   = ['스토어팜', '카페24', '기타'];
  const chartData = [...displayRows].sort((a, b) => a.date.localeCompare(b.date)).map(r => ({
    date:    fmtDate(r.date),
    스토어팜: r.storefarm    ?? 0,
    카페24:   r.cafe24       ?? 0,
    기타:     r.etc          ?? 0,
    총매출:   r.total_sales  ?? 0,
  }));

  // ── Edit handlers ──
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

  function cancelEdit() { setEditCell(null); setEditValue(''); }

  async function doSave(rowId: number, field: keyof BrandSaleRow, value: string) {
    const row = rows.find(r => r.id === rowId);
    if (!row) return;
    const numVal = toNum(value);
    if (numVal === row[field]) return;
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

  async function handleCreateRow() {
    if (!formDate) return;
    // 날짜 형식 YYYY-MM-DD 보장
    const dateVal = formDate.slice(0, 10);
    setSaving(true);
    const { data, error: err } = await supabase
      .from('brand_sales')
      .upsert({ brand: tab, date: dateVal }, { onConflict: 'brand,date' })
      .select()
      .single();
    if (!err && data) {
      const row = data as BrandSaleRow;
      // 이미 존재하면 업데이트, 없으면 prepend
      setRows(prev => {
        const exists = prev.some(r => r.id === row.id);
        return exists ? prev.map(r => r.id === row.id ? row : r) : [row, ...prev];
      });
      setShowForm(false);
    }
    setSaving(false);
  }

  async function handleDelete(id: number) {
    if (!confirm('이 행을 삭제하시겠어요?')) return;
    await supabase.from('brand_sales').delete().eq('id', id);
    setRows(prev => prev.filter(r => r.id !== id));
  }

  function handleDownload() {
    if (downloadRows.length === 0) return;
    const brandName = tab === 'innerpium' ? '이너피움' : '아쿠아크';
    const period    = selectedYear && selectedMonth ? `${selectedYear}_${selectedMonth}` : selectedYear || String(now.getFullYear());
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

  function calcPress(btn: string) {
    if (btn === 'C') { setCalcExpr(''); setCalcResult('0'); setCalcShowResult(false); return; }
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
    if (calcShowResult) { setCalcExpr(CALC_OPS.has(btn) ? calcResult + btn : btn); setCalcShowResult(false); return; }
    setCalcExpr(p => p + btn);
  }

  function handleCalcKeyDown(e: React.KeyboardEvent) {
    const key = e.key;
    if (key >= '0' && key <= '9')            { e.preventDefault(); calcPress(key); return; }
    if (key === '.')                          { e.preventDefault(); calcPress('.'); return; }
    if (key === '+')                          { e.preventDefault(); calcPress('+'); return; }
    if (key === '-')                          { e.preventDefault(); calcPress('-'); return; }
    if (key === '*')                          { e.preventDefault(); calcPress('×'); return; }
    if (key === '/')                          { e.preventDefault(); calcPress('÷'); return; }
    if (key === '(' || key === ')')           { e.preventDefault(); calcPress(key); return; }
    if (key === 'Enter')                      { e.preventDefault(); calcPress('='); return; }
    if (key === 'Backspace')                  { e.preventDefault(); calcPress('←'); return; }
    if (key === 'Escape' || key === 'Delete') { e.preventDefault(); calcPress('C'); return; }
  }

  const calcDisplay = calcShowResult ? calcResult : (calcExpr || '0');

  // ── Render ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['innerpium', 'aquarc'] as Brand[]).map(t => (
            <button key={t} className={`btn ${tab === t ? 'btn-rose' : 'btn-ghost'}`}
              onClick={() => { setTab(t); setShowForm(false); cancelEdit(); }}>
              {t === 'innerpium' ? '이너피움' : '아쿠아크'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* 월선택 / 기간선택 토글 */}
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
            {(['month', 'range'] as const).map(mode => (
              <button key={mode}
                onClick={() => setDateMode(mode)}
                style={{
                  padding: '4px 10px', fontSize: 11, border: 'none', cursor: 'pointer',
                  background: dateMode === mode ? 'var(--rose)' : 'var(--surface2)',
                  color: dateMode === mode ? '#fff' : 'var(--text2)', fontWeight: 600,
                }}>
                {mode === 'month' ? '월 선택' : '기간 선택'}
              </button>
            ))}
          </div>

          {dateMode === 'month' ? (
            <>
              <select className="input" style={{ width: 88, fontSize: 12, padding: '4px 8px', height: 32 }}
                value={selectedYear} onChange={e => handleYearChange(e.target.value)}>
                <option value="">연도</option>
                {availableYears.map(y => <option key={y} value={y}>{y}년</option>)}
              </select>
              <select className="input" style={{ width: 72, fontSize: 12, padding: '4px 8px', height: 32 }}
                value={selectedMonth} onChange={e => handleMonthChange(e.target.value)} disabled={!selectedYear}>
                <option value="">월</option>
                {availableMonths.map(m => <option key={m} value={m}>{Number(m)}월</option>)}
              </select>
              <select className="input" style={{ width: 66, fontSize: 12, padding: '4px 8px', height: 32 }}
                value={selectedDay} onChange={e => setSelectedDay(e.target.value)} disabled={!selectedMonth}>
                <option value="">일</option>
                {availableDays.map(d => <option key={d} value={d}>{Number(d)}일</option>)}
              </select>
            </>
          ) : (
            <>
              <input type="date" className="input" style={{ width: 140, fontSize: 12, padding: '4px 8px', height: 32 }}
                value={rangeStart} onChange={e => setRangeStart(e.target.value)} />
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>~</span>
              <input type="date" className="input" style={{ width: 140, fontSize: 12, padding: '4px 8px', height: 32 }}
                value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} />
              {(rangeStart || rangeEnd) && (
                <button className="btn btn-ghost btn-sm"
                  style={{ fontSize: 11, padding: '4px 8px', height: 32 }}
                  onClick={() => { setRangeStart(''); setRangeEnd(''); }}>✕</button>
              )}
            </>
          )}
        </div>

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

      {/* New row form */}
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
              <p style={{ fontSize: 12, color: 'var(--text3)' }}>행 추가 후 셀을 클릭해서 데이터를 입력하세요</p>
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

            {/* KPI Cards — 이번달 / 오늘 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {/* 이번달 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--rose2)', letterSpacing: '0.06em', textTransform: 'uppercase', paddingLeft: 2 }}>
                  이번달 ({kpiSub})
                </div>
                {[
                  { label: '총매출',     value: wonFmt(kpiTotal),                    accent: 'var(--rose2)' },
                  { label: '스토어팜',   value: wonFmt(kpiStorefarm) },
                  { label: '카페24',     value: wonFmt(kpiCafe24) },
                  { label: '기타',       value: wonFmt(kpiEtc) },
                  { label: '구매건',     value: `${numFmt(kpiPurchases)}건` },
                  { label: '마케팅비용', value: wonFmt(kpiMarketing) },
                ].map(({ label, value, accent }) => (
                  <MiniKpiRow key={label} label={label} value={value} accent={accent} />
                ))}
              </div>
              {/* 선택한 날짜 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text2)', letterSpacing: '0.06em', textTransform: 'uppercase', paddingLeft: 2 }}>
                  {selectedDayStr || '날짜 미선택'}
                </div>
                {[
                  { label: '총매출',     value: wonFmt(dayTotal),                          accent: dayTotal ? 'var(--rose2)' : undefined },
                  { label: '스토어팜',   value: wonFmt(dayStorefarm) },
                  { label: '카페24',     value: wonFmt(dayCafe24) },
                  { label: '기타',       value: wonFmt(dayEtc) },
                  { label: '구매건',     value: dayPurchases != null ? `${numFmt(dayPurchases)}건` : '₩0' },
                  { label: '마케팅비용', value: wonFmt(dayMarketing) },
                ].map(({ label, value, accent }) => (
                  <MiniKpiRow key={label} label={label} value={value} accent={accent} />
                ))}
              </div>
            </div>

            {/* 일별 매출 차트 */}
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
                      tickFormatter={v => v >= 1_000_000 ? `${(v/1_000_000).toFixed(0)}M` : v >= 1_000 ? `${(v/1_000).toFixed(0)}K` : String(v)} />
                    <YAxis yAxisId="line" orientation="right" tick={{ fontSize: 10, fill: 'var(--text3)' }} axisLine={false} tickLine={false}
                      tickFormatter={v => v >= 1_000_000 ? `${(v/1_000_000).toFixed(0)}M` : v >= 1_000 ? `${(v/1_000).toFixed(0)}K` : String(v)} />
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

            {/* 월별 요약 테이블 — 최근 6개월 */}
            {monthlySummary.length > 0 && (
              <div className="card">
                <div className="card-head">
                  <div className="card-title">▤ 월별 요약</div>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>최근 6개월 · 순이익 = 총매출 - 마케팅 - 구매건×4,500 - 수량×11,495</span>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, whiteSpace: 'nowrap' }}>
                      <thead>
                        <tr>
                          {['월', '총매출', '스토어팜', '카페24', '기타', '마케팅비용', '마케팅비율(%)', ...(tab === 'innerpium' ? ['순이익'] : [])].map(h => (
                            <th key={h} style={{
                              padding: '8px 12px', textAlign: h === '월' ? 'left' : 'right',
                              background: 'var(--surface2)', borderBottom: '2px solid var(--border)',
                              color: 'var(--text2)', fontWeight: 600, fontSize: 10,
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {monthlySummary.slice(0, 6).map((s, i) => (
                          <tr key={s.month} style={{
                            background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)',
                            borderTop: '1px solid var(--border)',
                          }}>
                            <td style={{ padding: '7px 12px', fontWeight: 600, color: 'var(--text)' }}>{s.month}</td>
                            <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--text)', fontFamily: "'DM Mono',monospace" }}>
                              {s.total_sales.toLocaleString('ko-KR')}
                            </td>
                            <td style={{ padding: '7px 12px', textAlign: 'right', color: 'var(--text)', fontFamily: "'DM Mono',monospace" }}>
                              {s.storefarm.toLocaleString('ko-KR')}
                            </td>
                            <td style={{ padding: '7px 12px', textAlign: 'right', color: 'var(--text)', fontFamily: "'DM Mono',monospace" }}>
                              {s.cafe24.toLocaleString('ko-KR')}
                            </td>
                            <td style={{ padding: '7px 12px', textAlign: 'right', color: 'var(--text)', fontFamily: "'DM Mono',monospace" }}>
                              {s.etc.toLocaleString('ko-KR')}
                            </td>
                            <td style={{ padding: '7px 12px', textAlign: 'right', color: 'var(--text)', fontFamily: "'DM Mono',monospace" }}>
                              {s.marketing_total.toLocaleString('ko-KR')}
                            </td>
                            <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 700, fontFamily: "'DM Mono',monospace",
                              color: s.total_sales > 0 ? mktRatioColor(s.mktRatio) : 'var(--text3)' }}>
                              {s.total_sales > 0 ? pctStr(s.mktRatio, 1) : '-'}
                            </td>
                            {tab === 'innerpium' && (
                              <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 700, fontFamily: "'DM Mono',monospace",
                                color: s.net_profit >= 0 ? '#10b981' : '#f43f5e' }}>
                                {s.net_profit.toLocaleString('ko-KR')}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 분석 섹션 */}

            {/* Row 1: 유입수+유입비용 (2/3) + 전환률 (1/3) */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>

              {/* 유입수 + 유입비용 콤보차트 */}
              <div className="card">
                <div className="card-head">
                  <div className="card-title">▦ 유입수 · 유입비용</div>
                  <span style={{ fontSize: 10, color: 'var(--text3)' }}>스택바: 카페24·네이버 유입 / 라인: 유입비용(원)</span>
                </div>
                <div className="card-body" style={{ padding: '8px 10px' }}>
                  <ResponsiveContainer width="100%" height={180}>
                    <ComposedChart data={inflowChartData} margin={{ top: 20, right: 48, bottom: 0, left: 8 }}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="bar" tick={{ fontSize: 9, fill: 'var(--text3)' }} axisLine={false} tickLine={false}
                        tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
                      <YAxis yAxisId="line" orientation="right" tick={{ fontSize: 9, fill: '#f43f5e' }} axisLine={false} tickLine={false}
                        tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
                      <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 10 }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(v: any, name: any) => name === '유입비용' ? [`₩${Number(v??0).toLocaleString('ko-KR')}`, name] : [Number(v??0).toLocaleString('ko-KR'), name]} />
                      <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
                      <Bar yAxisId="bar" dataKey="카페24유입" stackId="s" fill="#3b82f6" radius={[0,0,0,0]} />
                      <Bar yAxisId="bar" dataKey="네이버유입" stackId="s" fill="#10b981" radius={[2,2,0,0]}>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <LabelList dataKey="inflow_total" position="top" style={{ fontSize: 8, fill: 'var(--text2)' }} formatter={(v: any) => v > 0 ? (v >= 1000 ? `${(v/1000).toFixed(1)}K` : String(v)) : ''} />
                      </Bar>
                      <Line yAxisId="line" type="monotone" dataKey="유입비용" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3, fill: '#f43f5e' }}>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <LabelList dataKey="유입비용" position="top" style={{ fontSize: 8, fill: '#f43f5e' }} formatter={(v: any) => v > 0 ? (v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)) : ''} />
                      </Line>
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 전환률 라인차트 */}
              <div className="card">
                <div className="card-head">
                  <div className="card-title">▦ 전환률 추이</div>
                </div>
                <div className="card-body" style={{ padding: '8px 10px' }}>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={convRateChartData} margin={{ top: 20, right: 8, bottom: 0, left: -8 }}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: 'var(--text3)' }} axisLine={false} tickLine={false}
                        tickFormatter={v => `${v}%`} width={34} />
                      <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 10 }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(v: any) => [`${Number(v??0).toFixed(2)}%`, '전환률']} />
                      <Line type="monotone" dataKey="전환률(%)" stroke="#6366f1" strokeWidth={2}
                        dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 5 }}>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <LabelList dataKey="전환률(%)" position="top" style={{ fontSize: 8, fill: '#6366f1' }} formatter={(v: any) => v > 0 ? `${Number(v).toFixed(1)}%` : ''} />
                      </Line>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Row 2: 채널별 비중 (1/3) + 회원가입/찜/카카오/인스타 (2/3) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>

              {/* 채널별 비중 파이차트 (compact) */}
              <div className="card">
                <div className="card-head">
                  <div className="card-title">◉ 채널별 비중</div>
                  <span style={{ fontSize: 10, color: 'var(--text3)' }}>{kpiSub}</span>
                </div>
                <div className="card-body" style={{ padding: '8px 10px' }}>
                  {pieData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={90}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" outerRadius={36} dataKey="value"
                            label={({ percent }: { percent?: number }) =>
                              (percent ?? 0) >= 0.05 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ''
                            }
                            labelLine={false}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            style={{ fontSize: 9 } as any}>
                            {pieData.map((_, idx) => (
                              <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 10 }}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(v: any) => [`₩${Number(v ?? 0).toLocaleString('ko-KR')}`, undefined]} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                        {pieData.map((d, idx) => {
                          const total = pieData.reduce((s, p) => s + p.value, 0);
                          const pct = total > 0 ? ((d.value / total) * 100).toFixed(0) : '0';
                          return (
                            <span key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: 'var(--text3)' }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: PIE_COLORS[idx], display: 'inline-block' }} />
                              {d.name} {pct}%
                            </span>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 11, padding: '24px 0' }}>
                      이번달 데이터 없음
                    </div>
                  )}
                </div>
              </div>

              {/* 회원가입/찜/카카오/인스타 막대그래프 */}
              <div className="card">
                <div className="card-head">
                  <div className="card-title">▦ 월별 유입 지표</div>
                  <span style={{ fontSize: 10, color: 'var(--text3)' }}>회원가입 · 찜 · 카카오 · 인스타</span>
                </div>
                <div className="card-body" style={{ padding: '8px 10px' }}>
                  <ResponsiveContainer width="100%" height={160}>
                    <ComposedChart data={engagementChartData} margin={{ top: 20, right: 8, bottom: 0, left: 8 }}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 10 }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(v: any, name: any) => [Number(v??0).toLocaleString('ko-KR'), name]} />
                      <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
                      <Bar dataKey="회원가입" stackId="e" fill="#6366f1" />
                      <Bar dataKey="찜"      stackId="e" fill="#ec4899" />
                      <Bar dataKey="카카오"  stackId="e" fill="#f59e0b" />
                      <Bar dataKey="인스타"  stackId="e" fill="#8b5cf6" radius={[2,2,0,0]}>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <LabelList dataKey="eng_total" position="top" style={{ fontSize: 8, fill: 'var(--text2)' }} formatter={(v: any) => v > 0 ? String(v) : ''} />
                      </Bar>
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* 일별 데이터 테이블 */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">▤ 일별 데이터</div>
                <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono',monospace" }}>
                  최근 {displayRows.length}행 · 셀 클릭으로 수정
                  {savingRows.size > 0 && <span style={{ color: 'var(--rose2)', marginLeft: 8 }}>저장 중…</span>}
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
                            fontWeight: c.bold ? 700 : 600, fontSize: 10, position: 'sticky', top: 0,
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
                                    color: c.auto ? 'var(--text3)' : c.bold ? 'var(--text)' : v === '-' ? 'var(--text3)' : 'var(--text)',
                                    fontFamily: c.field === 'date' ? undefined : "'DM Mono', monospace",
                                    cursor: canEdit ? 'text' : 'default',
                                    background: isEditing ? 'rgba(244,63,94,0.06)' : undefined,
                                    minWidth: isEditing ? 80 : undefined,
                                  }}>
                                  {isEditing ? (
                                    <input ref={inputRef} type="number" value={editValue}
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
                                      }} />
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
                    {displayRows.length > 1 && (
                      <tfoot>
                        <tr style={{ background: 'rgba(251,191,36,0.10)', borderTop: '2px solid var(--border)' }}>
                          {cols.map(c => {
                            if (c.field === 'date') {
                              return (
                                <td key="avg-date" style={{ padding: '6px 10px', fontWeight: 700, fontSize: 10, color: 'var(--text2)' }}>
                                  평균
                                </td>
                              );
                            }
                            const nums = displayRows.map(r => Number(r[c.field])).filter(n => isFinite(n) && !isNaN(n) && n !== 0);
                            if (nums.length === 0) return <td key={String(c.field)} style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text3)' }}>-</td>;
                            const avg = nums.reduce((s, n) => s + n, 0) / nums.length;
                            const formatted = c.field === 'conversion_rate'
                              ? `${avg.toFixed(2)}%`
                              : Math.round(avg).toLocaleString('ko-KR');
                            return (
                              <td key={String(c.field)} style={{
                                padding: '6px 10px', textAlign: 'right', fontWeight: 600,
                                fontSize: 10, fontFamily: "'DM Mono', monospace",
                                color: c.auto ? 'var(--text3)' : 'var(--text2)',
                              }}>
                                {formatted}
                              </td>
                            );
                          })}
                          <td style={{ padding: '6px 10px' }} />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: side panel (hidden on mobile) ── */}
          <div style={{ width: 248, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 16 }}
            className="sales-side-panel">

            <div className="card">
              <div className="card-head">
                <div className="card-title" style={{ fontSize: 12 }}>✎ 메모</div>
                <span style={{ fontSize: 10, color: 'var(--text3)' }}>자동 저장</span>
              </div>
              <div className="card-body" style={{ padding: '8px 10px' }}>
                <textarea value={memo}
                  onChange={e => { const v = e.target.value; setMemo(v); localStorage.setItem(`memo-${tab}`, v); }}
                  placeholder="자유롭게 메모하세요…"
                  style={{
                    width: '100%', height: 148, background: 'transparent', border: 'none', outline: 'none',
                    resize: 'vertical', fontSize: 12, color: 'var(--text)', fontFamily: 'inherit', lineHeight: 1.65,
                  }} />
              </div>
            </div>

            <div className="card" ref={calcRef} tabIndex={0}
              onClick={() => calcRef.current?.focus()}
              onKeyDown={handleCalcKeyDown}
              style={{ outline: 'none' }}>
              <div className="card-head">
                <div className="card-title" style={{ fontSize: 12 }}>⊞ 계산기</div>
                <span style={{ fontSize: 9, color: 'var(--text3)' }}>클릭 후 키보드 입력 가능</span>
              </div>
              <div className="card-body" style={{ padding: '8px 10px' }}>
                <div style={{
                  background: 'var(--surface2)', borderRadius: 8, padding: '8px 12px', marginBottom: 6,
                  textAlign: 'right', fontSize: 20, fontWeight: 700,
                  fontFamily: "'DM Mono', monospace", color: 'var(--text)',
                  minHeight: 44, wordBreak: 'break-all', lineHeight: 1.2,
                }}>
                  {calcDisplay}
                </div>
                {!calcShowResult && calcExpr && (
                  <div style={{
                    textAlign: 'right', fontSize: 10, color: 'var(--text3)', marginBottom: 6,
                    fontFamily: "'DM Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {calcExpr}
                  </div>
                )}
                {CALC_ROWS.map((btnRow, ri) => (
                  <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 4 }}>
                    {btnRow.map(btn => (
                      <button key={btn} onClick={() => calcPress(btn)} style={{
                        padding: '10px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13,
                        fontWeight: CALC_FUNCS.has(btn) || CALC_OPS.has(btn) ? 600 : 400,
                        fontFamily: "'DM Mono', monospace",
                        background: btn === '=' ? 'var(--rose2)' : CALC_OPS.has(btn) || CALC_FUNCS.has(btn) ? 'var(--surface2)' : 'var(--surface)',
                        color: btn === '=' ? '#fff' : btn === 'C' || CALC_OPS.has(btn) ? 'var(--rose2)' : 'var(--text)',
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
      <div style={{ fontSize: 16, fontWeight: 700, color: accent ?? 'var(--text)', fontFamily: "'DM Mono', monospace", letterSpacing: '-0.02em', wordBreak: 'break-all' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/* ─────────────────── Mini KPI Row ─────────────────── */
function MiniKpiRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="card" style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: accent ?? 'var(--text)', fontFamily: "'DM Mono', monospace" }}>{value}</span>
    </div>
  );
}
