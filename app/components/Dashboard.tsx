'use client';
import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { BRAND_STYLE, CAT_COL, PROJ_COLOR, PROJ_STAT, INF_STAT_MAP, fmt, dk } from '../constants';
import type { Influencer, Project, CalendarEventMap, Settlement, TeamMember } from '../types';

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

      {/* Sales Upload Section */}
      <SalesUploadSection />
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

/* ── Sales Upload Section ── */

const LS_SALES = 'dashboard_sales_v1';

interface ColDef { key: string; label: string; bold?: boolean; eventCount?: boolean; }
type SaleRow = Record<string, string | number | null>;
interface SalesStore { innerpium: SaleRow[]; aquacr: SaleRow[]; uploadedAt: string; }

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

// Parse an Excel sheet into SaleRow[], using the given ColDef keys
function parseSheet(sheet: XLSX.WorkSheet, cols: ColDef[]): SaleRow[] {
  const raw: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
  if (raw.length < 2) return [];
  const headers = raw[0].map(h => String(h).trim());
  const colKeys = new Set(cols.map(c => c.key));

  return raw.slice(1).map(row => {
    const obj: SaleRow = {};
    headers.forEach((h, i) => {
      if (colKeys.has(h)) obj[h] = row[i] ?? null;
    });
    return obj;
  });
}

// Parse a date string to Date (supports YYYY-MM-DD, YYYY/MM/DD, MM/DD/YYYY, etc.)
function parseDate(val: string | number | null): Date | null {
  if (!val) return null;
  const s = String(val).trim();
  // Try numeric Excel serial
  const n = Number(s);
  if (!isNaN(n) && n > 10000) {
    const d = new Date(Math.round((n - 25569) * 86400 * 1000));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

// Extract event count from EVENT cell value
function eventCount(val: string | number | null): string {
  if (val === null || val === '') return '-';
  const n = Number(val);
  if (!isNaN(n)) return String(n);
  // count comma-separated non-empty items
  const parts = String(val).split(',').filter(s => s.trim());
  return parts.length > 0 ? String(parts.length) : '-';
}

// Filter to last 28 days & sort descending
function filterSort(rows: SaleRow[]): SaleRow[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 28);
  return rows
    .filter(r => {
      const d = parseDate(r['날짜'] as string);
      return d && d >= cutoff;
    })
    .sort((a, b) => {
      const da = parseDate(a['날짜'] as string);
      const db = parseDate(b['날짜'] as string);
      return (db?.getTime() ?? 0) - (da?.getTime() ?? 0);
    });
}

function cellVal(row: SaleRow, col: ColDef): string {
  const v = row[col.key];
  if (col.eventCount) return eventCount(v as string | number | null);
  if (v === null || v === undefined || v === '') return '-';
  return String(v);
}

function SalesUploadSection() {
  const [data, setData] = useState<SalesStore | null>(null);
  const [tab, setTab] = useState<'innerpium' | 'aquacr'>('innerpium');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_SALES);
      if (saved) setData(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  function handleFile(file: File) {
    file.arrayBuffer().then(buf => {
      const wb = XLSX.read(buf, { type: 'array' });
      // Find sheets by name or index
      const findSheet = (names: string[]) => {
        for (const n of names) {
          const s = wb.Sheets[n];
          if (s) return s;
        }
        return wb.Sheets[wb.SheetNames[0]]; // fallback first sheet
      };
      const innerpiumSheet = findSheet(['이너피움', '이너피움 ', 'Sheet1']);
      const aquacrSheet = findSheet(['아쿠아크', '아쿠아크 ', 'Sheet2']);

      const innerpiumRows = parseSheet(innerpiumSheet ?? wb.Sheets[wb.SheetNames[0]], INNERPIUM_COLS);
      const aquacrRows = wb.SheetNames.length > 1
        ? parseSheet(aquacrSheet ?? wb.Sheets[wb.SheetNames[1]], AQUACR_COLS)
        : [];

      const store: SalesStore = {
        innerpium: innerpiumRows,
        aquacr: aquacrRows,
        uploadedAt: new Date().toISOString(),
      };
      setData(store);
      localStorage.setItem(LS_SALES, JSON.stringify(store));
    });
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const rows = data
    ? filterSort(tab === 'innerpium' ? data.innerpium : data.aquacr)
    : [];
  const cols = tab === 'innerpium' ? INNERPIUM_COLS : AQUACR_COLS;
  const uploadedAt = data?.uploadedAt
    ? new Date(data.uploadedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div style={{ marginTop: 20 }}>
      <div className="card">
        <div className="card-head" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="card-title">▤ 매출 데이터 (최근 28일)</div>
            {/* Brand tabs */}
            <div style={{ display: 'flex', gap: 4 }}>
              {(['innerpium', 'aquacr'] as const).map(t => (
                <button
                  key={t}
                  className={`btn btn-sm ${tab === t ? 'btn-rose' : 'btn-ghost'}`}
                  onClick={() => setTab(t)}
                >
                  {t === 'innerpium' ? '이너피움' : '아쿠아크'}
                </button>
              ))}
            </div>
            {uploadedAt && (
              <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: "'DM Mono',monospace" }}>
                업로드: {uploadedAt}
              </span>
            )}
          </div>
          {/* Upload button */}
          <button
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 11 }}
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

        <div className="card-body" style={{ padding: 0 }}>
          {!data ? (
            /* Drop zone */
            <div
              style={{
                margin: 16,
                border: `2px dashed ${dragging ? 'var(--rose)' : 'var(--border)'}`,
                borderRadius: 12,
                padding: '32px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
              onClick={() => inputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <div style={{ fontSize: 28, marginBottom: 8, color: 'var(--text3)' }}>▤</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>
                이너피움 / 아쿠아크 매출 Excel 업로드
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                .xlsx 파일 · 시트1=이너피움, 시트2=아쿠아크
              </div>
            </div>
          ) : rows.length === 0 ? (
            <div className="empty" style={{ padding: '24px 0' }}>
              <p>최근 28일 데이터가 없어요</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: '0 0 12px 12px' }}>
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
                  {rows.map((row, ri) => (
                    <tr key={ri} style={{ background: ri % 2 === 0 ? 'var(--surface)' : 'var(--surface2)', borderTop: '1px solid var(--border)' }}>
                      {cols.map(c => {
                        const v = cellVal(row, c);
                        return (
                          <td
                            key={c.key}
                            style={{
                              padding: '7px 10px',
                              textAlign: c.key === '날짜' ? 'left' : 'right',
                              fontWeight: c.bold ? 700 : 400,
                              color: c.bold ? 'var(--text)' : v === '-' ? 'var(--text3)' : 'var(--text)',
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
