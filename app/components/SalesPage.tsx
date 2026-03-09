'use client';
import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  ResponsiveContainer, ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

/* ── Types ── */
type SaleRow = Record<string, string | number | null>;
interface SalesStore { innerpium: SaleRow[]; aquacr: SaleRow[]; uploadedAt: string; }
interface ColDef { key: string; label: string; bold?: boolean; eventCount?: boolean; }

/* ── Column Definitions ── */
const INNERPIUM_COLS: ColDef[] = [
  { key: '날짜', label: '날짜' },
  { key: '스토어팜', label: '스토어팜' },
  { key: '카페24', label: '카페24' },
  { key: '기타', label: '기타' },
  { key: '총매출', label: '총매출', bold: true },
  { key: '유산균매출', label: '유산균매출' },
  { key: '구매건', label: '구매건' },
  { key: '유산균수량', label: '유산균수량' },
  { key: 'EVENT', label: 'EVENT', eventCount: true },
  { key: '설정금액', label: '설정금액' },
  { key: '마케팅총금액비용', label: '마케팅총금액비용' },
  { key: '유입(24)', label: '유입(24)' },
  { key: '유입(N)', label: '유입(N)' },
  { key: '유입비용', label: '유입비용' },
  { key: '전환률', label: '전환률' },
  { key: '회원가입', label: '회원가입' },
  { key: '찜', label: '찜' },
  { key: '카카오', label: '카카오' },
  { key: '인스타', label: '인스타' },
  { key: '인스타총', label: '인스타총' },
];

const AQUACR_COLS: ColDef[] = [
  { key: '날짜', label: '날짜' },
  { key: '스토어팜', label: '스토어팜' },
  { key: '카페24', label: '카페24' },
  { key: '신세계V', label: '신세계V' },
  { key: '기타(더블유)', label: '기타(더블유)' },
  { key: '총매출', label: '총매출', bold: true },
  { key: '클렌저매출', label: '클렌저매출' },
  { key: '구매건', label: '구매건' },
  { key: '클렌저수량', label: '클렌저수량' },
  { key: 'EVENT', label: 'EVENT', eventCount: true },
  { key: '설정금액', label: '설정금액' },
  { key: '마케팅총금액비용', label: '마케팅총금액비용' },
  { key: '유입(24)', label: '유입(24)' },
  { key: '유입(N)', label: '유입(N)' },
  { key: '유입비용', label: '유입비용' },
  { key: '전환률', label: '전환률' },
  { key: '회원가입', label: '회원가입' },
  { key: '찜', label: '찜' },
  { key: '카카오', label: '카카오' },
  { key: '인스타', label: '인스타' },
  { key: '인스타총', label: '인스타총' },
];

const EXCLUDED = new Set(['구매제품', '인스타그램']);
const LS_KEY = 'sales_page_v1';

const CHART_COLORS: Record<string, string> = {
  스토어팜: '#10b981',
  카페24: '#3b82f6',
  신세계V: '#8b5cf6',
  '기타(더블유)': '#94a3b8',
  기타: '#94a3b8',
  총매출: '#f43f5e',
};

/* ── Helpers ── */
function toNum(v: string | number | null | undefined): number {
  if (v == null || v === '' || v === '-') return 0;
  const s = String(v).replace(/[,₩\s]/g, '');
  const n = Number(s);
  return isNaN(n) ? 0 : n;
}

function parseDate(val: string | number | null | undefined): Date | null {
  if (!val) return null;
  const s = String(val).trim();
  const n = Number(s);
  if (!isNaN(n) && n > 10000) {
    const d = new Date(Math.round((n - 25569) * 86400 * 1000));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function fmtDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function money(v: number): string {
  if (v >= 100_000_000) return `₩${(v / 100_000_000).toFixed(1)}억`;
  if (v >= 1_000_000) return `₩${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `₩${(v / 1_000).toFixed(0)}K`;
  return `₩${v.toLocaleString('ko-KR')}`;
}

function pctStr(v: number): string {
  return isNaN(v) || v === 0 ? '-' : `${v.toFixed(2)}%`;
}

function eventCount(val: string | number | null | undefined): string {
  if (val == null || val === '') return '-';
  const n = Number(val);
  if (!isNaN(n)) return String(n);
  const parts = String(val).split(',').filter(s => s.trim());
  return parts.length > 0 ? String(parts.length) : '-';
}

function cellVal(row: SaleRow, col: ColDef): string {
  const v = row[col.key];
  if (col.eventCount) return eventCount(v);
  if (v === null || v === undefined || v === '') return '-';
  return String(v);
}

/* ── Excel Parsing ── */
function parseSheetData(wb: XLSX.WorkBook): { innerpium: SaleRow[]; aquacr: SaleRow[] } {
  // Find sheet containing both brand names, else fallback
  const sheetName =
    wb.SheetNames.find(n => n.includes('이너피움') && n.includes('아쿠아크')) ??
    wb.SheetNames.find(n => n.includes('이너피움')) ??
    wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];

  // raw[0] = title row (skip), raw[1] = header row, raw[2+] = data
  const raw: (string | number | null)[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: null,
  });
  if (raw.length < 2) return { innerpium: [], aquacr: [] };

  const headerRow = (raw[1] ?? []).map(h => String(h ?? '').trim());
  const dataRows = raw.slice(2);

  // 이너피움 starts at column B (index 1), 아쿠아크 starts at column J (index 9)
  function buildRows(startIdx: number, colDefs: ColDef[]): SaleRow[] {
    const headers = headerRow.slice(startIdx);
    const colKeys = new Set(colDefs.map(c => c.key));

    return dataRows
      .map(row => {
        const obj: SaleRow = {};
        headers.forEach((h, i) => {
          if (colKeys.has(h) && !EXCLUDED.has(h)) {
            obj[h] = row[startIdx + i] ?? null;
          }
        });
        return obj;
      })
      .filter(r => {
        const v = r['날짜'];
        return v !== null && v !== undefined && String(v).trim() !== '';
      });
  }

  return {
    innerpium: buildRows(1, INNERPIUM_COLS),
    aquacr: buildRows(9, AQUACR_COLS),
  };
}

/* ── Main Page ── */
export default function SalesPage() {
  const [data, setData] = useState<SalesStore | null>(null);
  const [tab, setTab] = useState<'innerpium' | 'aquacr'>('innerpium');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) setData(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  function handleFile(file: File) {
    file.arrayBuffer().then(buf => {
      const wb = XLSX.read(buf, { type: 'array' });
      const { innerpium, aquacr } = parseSheetData(wb);
      const store: SalesStore = { innerpium, aquacr, uploadedAt: new Date().toISOString() };
      setData(store);
      localStorage.setItem(LS_KEY, JSON.stringify(store));
    });
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const allRows: SaleRow[] = data ? (tab === 'innerpium' ? data.innerpium : data.aquacr) : [];
  const cols = tab === 'innerpium' ? INNERPIUM_COLS : AQUACR_COLS;
  const barKeys = tab === 'innerpium'
    ? ['스토어팜', '카페24', '기타']
    : ['스토어팜', '카페24', '신세계V', '기타(더블유)'];

  // Current month rows for KPI
  const now = new Date();
  const thisMonthRows = allRows.filter(r => {
    const d = parseDate(r['날짜'] as string);
    return d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const kpiRows = thisMonthRows.length > 0 ? thisMonthRows : allRows;

  const totalRevenue = kpiRows.reduce((s, r) => s + toNum(r['총매출']), 0);
  const storeFarm = kpiRows.reduce((s, r) => s + toNum(r['스토어팜']), 0);
  const cafe24 = kpiRows.reduce((s, r) => s + toNum(r['카페24']), 0);
  const purchases = kpiRows.reduce((s, r) => s + toNum(r['구매건']), 0);
  const marketing = kpiRows.reduce((s, r) => s + toNum(r['마케팅총금액비용']), 0);
  const convRates = kpiRows.map(r => toNum(r['전환률'])).filter(v => v > 0);
  const avgConv = convRates.length > 0 ? convRates.reduce((a, b) => a + b, 0) / convRates.length : 0;
  const kpiSub = thisMonthRows.length > 0 ? `${now.getMonth() + 1}월 · ${thisMonthRows.length}일` : '전체';

  // Chart: ascending date order
  const chartData = [...allRows]
    .filter(r => parseDate(r['날짜'] as string) != null)
    .sort((a, b) => (parseDate(a['날짜'] as string)?.getTime() ?? 0) - (parseDate(b['날짜'] as string)?.getTime() ?? 0))
    .map(r => {
      const d = parseDate(r['날짜'] as string);
      const base: Record<string, string | number> = {
        date: d ? fmtDate(d) : String(r['날짜']),
        스토어팜: toNum(r['스토어팜']),
        카페24: toNum(r['카페24']),
        총매출: toNum(r['총매출']),
      };
      if (tab === 'innerpium') {
        base['기타'] = toNum(r['기타']);
      } else {
        base['신세계V'] = toNum(r['신세계V']);
        base['기타(더블유)'] = toNum(r['기타(더블유)']);
      }
      return base;
    });

  // Table: descending date order
  const tableRows = [...allRows]
    .filter(r => parseDate(r['날짜'] as string) != null)
    .sort((a, b) => (parseDate(b['날짜'] as string)?.getTime() ?? 0) - (parseDate(a['날짜'] as string)?.getTime() ?? 0));

  const uploadedAt = data?.uploadedAt
    ? new Date(data.uploadedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header: tabs + upload */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['innerpium', 'aquacr'] as const).map(t => (
            <button
              key={t}
              className={`btn ${tab === t ? 'btn-rose' : 'btn-ghost'}`}
              onClick={() => setTab(t)}
            >
              {t === 'innerpium' ? '이너피움' : '아쿠아크'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {uploadedAt && (
            <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono',monospace" }}>
              업로드 {uploadedAt}
            </span>
          )}
          <button
            className="btn btn-ghost"
            onClick={() => inputRef.current?.click()}
          >
            ↑ Excel 업로드
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
          />
        </div>
      </div>

      {!data ? (
        /* Drop zone */
        <div
          style={{
            border: `2px dashed ${dragging ? 'var(--rose)' : 'var(--border)'}`,
            borderRadius: 16,
            padding: '60px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
            background: 'var(--surface)',
          }}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <div style={{ fontSize: 40, marginBottom: 14, color: 'var(--text3)' }}>📈</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
            이너피움 + 아쿠아크 일일매출 Excel 업로드
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            시트명에 &apos;이너피움+아쿠아크&apos; 포함 · 1행 타이틀 스킵 · 헤더 2행 · .xlsx
          </div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <KpiCard label="이번달 총매출" value={money(totalRevenue)} sub={kpiSub} accent="var(--rose2)" />
            <KpiCard label="스토어팜 합계" value={money(storeFarm)} sub={kpiSub} />
            <KpiCard label="카페24 합계" value={money(cafe24)} sub={kpiSub} />
            <KpiCard label="총 구매건" value={`${purchases.toLocaleString('ko-KR')}건`} sub={kpiSub} />
            <KpiCard label="마케팅 총비용" value={money(marketing)} sub={kpiSub} />
            <KpiCard label="평균 전환률" value={pctStr(avgConv)} sub={kpiSub} />
          </div>

          {/* Chart */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">▦ 일별 매출 현황</div>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                스택바: 채널별 · 라인: 총매출
              </span>
            </div>
            <div className="card-body">
              {chartData.length === 0 ? (
                <div className="empty"><p>차트 데이터 없음</p></div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={chartData} margin={{ top: 4, right: 48, bottom: 0, left: 8 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: 'var(--text3)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="bar"
                      tick={{ fontSize: 10, fill: 'var(--text3)' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={v =>
                        v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M`
                        : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K`
                        : String(v)
                      }
                    />
                    <YAxis
                      yAxisId="line"
                      orientation="right"
                      tick={{ fontSize: 10, fill: 'var(--text3)' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={v =>
                        v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M`
                        : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K`
                        : String(v)
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--surface2)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(v: any) => [`₩${Number(v ?? 0).toLocaleString('ko-KR')}`, undefined]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    {barKeys.map((k, i) => (
                      <Bar
                        key={k}
                        yAxisId="bar"
                        dataKey={k}
                        stackId="s"
                        fill={CHART_COLORS[k] ?? '#888'}
                        radius={i === barKeys.length - 1 ? [2, 2, 0, 0] : undefined}
                      />
                    ))}
                    <Line
                      yAxisId="line"
                      type="monotone"
                      dataKey="총매출"
                      stroke={CHART_COLORS['총매출']}
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Data Table */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">▤ 일별 데이터</div>
              <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono',monospace" }}>
                {tableRows.length}행 · 최신순
              </span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {tableRows.length === 0 ? (
                <div className="empty" style={{ padding: '24px 0' }}><p>데이터 없음</p></div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, whiteSpace: 'nowrap' }}>
                    <thead>
                      <tr>
                        {cols.map(c => (
                          <th
                            key={c.key}
                            style={{
                              padding: '8px 10px',
                              textAlign: 'center',
                              background: 'var(--surface2)',
                              borderBottom: '2px solid var(--border)',
                              color: c.bold ? 'var(--rose2)' : 'var(--text2)',
                              fontWeight: c.bold ? 700 : 600,
                              fontSize: 10,
                              position: 'sticky',
                              top: 0,
                            }}
                          >
                            {c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row, ri) => (
                        <tr
                          key={ri}
                          style={{
                            background: ri % 2 === 0 ? 'var(--surface)' : 'var(--surface2)',
                            borderTop: '1px solid var(--border)',
                          }}
                        >
                          {cols.map(c => {
                            const v = cellVal(row, c);
                            return (
                              <td
                                key={c.key}
                                style={{
                                  padding: '7px 10px',
                                  textAlign: c.key === '날짜' ? 'left' : 'right',
                                  fontWeight: c.bold ? 700 : 400,
                                  color: c.bold
                                    ? 'var(--text)'
                                    : v === '-' ? 'var(--text3)' : 'var(--text)',
                                  fontFamily: c.key === '날짜' ? undefined : "'DM Mono', monospace",
                                }}
                              >
                                {v}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── KPI Card ── */
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
