'use client';
import { useState, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import XLSXStyle from 'xlsx-js-style';

type Platform = '카페24' | '스마트스토어' | '쿠팡' | '신세계V' | '무신사';

const PLATFORMS: Platform[] = ['카페24', '스마트스토어', '쿠팡', '신세계V', '무신사'];

const FIXED = {
  보내시는분: '㈜루씨베이전씨',
  보내시는분전화번호: '070-4647-3180',
  보내는사람주소: '전남 담양군 담양읍 에코길 27-18 케이원로직스',
};

const ORDER_COLUMNS = [
  '보내시는분', '보내시는분전화번호', '택배사', '송장번호', '보내는사람우편',
  '보내는사람주소', '받는사람', '받는사람전화번호', '고객주문번호', '받는사람핸드폰',
  '우편', '받는사람주소', '수량', '품목명', '상품코드', '지불조건', '출고번호', '기타', '배송메모',
] as const;

type OrderRow = Record<typeof ORDER_COLUMNS[number], string>;
type RawRow = Record<string, string>;

interface AccumulatedEntry {
  platform: Platform;
  fileName: string;
  rows: OrderRow[];
}

function baseRow(): OrderRow {
  return {
    보내시는분: FIXED.보내시는분,
    보내시는분전화번호: FIXED.보내시는분전화번호,
    택배사: '', 송장번호: '', 보내는사람우편: '',
    보내는사람주소: FIXED.보내는사람주소,
    받는사람: '', 받는사람전화번호: '', 고객주문번호: '', 받는사람핸드폰: '',
    우편: '', 받는사람주소: '', 수량: '', 품목명: '', 상품코드: '',
    지불조건: '', 출고번호: '', 기타: '', 배송메모: '',
  };
}

function g(raw: RawRow, key: string): string {
  return String(raw[key] ?? '').trim();
}

function mapRow(platform: Platform, raw: RawRow): OrderRow {
  const row = baseRow();
  row.기타 = platform;
  if (platform === '카페24') {
    row.받는사람 = g(raw, '수령인');
    row.받는사람전화번호 = g(raw, '수령인 휴대전화');
    row.받는사람핸드폰 = g(raw, '수령인 휴대전화');
    row.우편 = g(raw, '수령인 우편번호');
    row.받는사람주소 = g(raw, '수령인 주소(전체)');
    row.수량 = g(raw, '수량');
    row.품목명 = g(raw, '주문상품명(옵션포함)');
    row.고객주문번호 = g(raw, '주문번호');
    row.배송메모 = g(raw, '배송메시지');
  } else if (platform === '스마트스토어') {
    row.받는사람 = g(raw, '수취인명');
    row.받는사람전화번호 = g(raw, '수취인연락처1');
    row.받는사람핸드폰 = g(raw, '수취인연락처1');
    row.우편 = g(raw, '우편번호');
    row.받는사람주소 = g(raw, '통합배송지');
    row.수량 = g(raw, '수량');
    row.품목명 = g(raw, '옵션정보') || g(raw, '상품명');
    row.고객주문번호 = g(raw, '주문번호');
    row.배송메모 = g(raw, '배송메세지');
  } else if (platform === '쿠팡') {
    row.받는사람 = g(raw, '수취인이름');
    row.받는사람전화번호 = g(raw, '수취인전화번호');
    row.받는사람핸드폰 = g(raw, '수취인전화번호');
    row.우편 = g(raw, '우편번호');
    row.받는사람주소 = g(raw, '수취인 주소');
    row.수량 = g(raw, '구매수(수량)');
    row.품목명 = g(raw, '등록상품명');
    row.고객주문번호 = g(raw, '주문번호');
    row.배송메모 = g(raw, '배송메세지');
  } else if (platform === '신세계V') {
    row.받는사람 = g(raw, '수취인명');
    row.받는사람전화번호 = g(raw, '수취인연락처');
    row.받는사람핸드폰 = g(raw, '수취인연락처');
    row.우편 = g(raw, '수취인우편번호');
    row.받는사람주소 = [g(raw, '수취인기본주소'), g(raw, '수취인상세주소')].filter(Boolean).join(' ');
    row.수량 = g(raw, '수량');
    row.품목명 = g(raw, '상품명');
    row.고객주문번호 = g(raw, '주문번호');
    row.배송메모 = g(raw, '배송메모');
  } else if (platform === '무신사') {
    row.받는사람 = g(raw, '수령자');
    row.받는사람전화번호 = g(raw, '핸드폰');
    row.받는사람핸드폰 = g(raw, '핸드폰');
    row.우편 = g(raw, '우편번호');
    row.받는사람주소 = [g(raw, '주소1(기본주소)'), g(raw, '주소2(상세주소)')].filter(Boolean).join(' ');
    row.수량 = g(raw, '주문수량');
    const prodNo = g(raw, '상품번호');
    const prodName = g(raw, '상품명');
    row.품목명 = prodNo ? `[${prodNo}]${prodName}` : prodName;
    row.고객주문번호 = g(raw, '주문번호');
    row.배송메모 = g(raw, '출고메시지');
  }
  return row;
}

/* ── Parsers ── */

function parseNormal(wb: XLSX.WorkBook): RawRow[] {
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<RawRow>(ws, { defval: '' });
}

function parseSkipFirstRow(wb: XLSX.WorkBook): RawRow[] {
  const ws = wb.Sheets[wb.SheetNames[0]];
  const all = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' });
  if (all.length < 2) return [];
  const headers = (all[1] as unknown[]).map(h => String(h ?? ''));
  return all.slice(2).map(row => {
    const obj: RawRow = {};
    headers.forEach((h, i) => { obj[h] = String((row as unknown[])[i] ?? ''); });
    return obj;
  }).filter(obj => Object.values(obj).some(v => v !== ''));
}

function parseHTMLTable(html: string): RawRow[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const rows = Array.from(doc.querySelectorAll('tr'));
  if (rows.length < 2) return [];
  const headers = Array.from(rows[0].querySelectorAll('th, td')).map(el => el.textContent?.trim() ?? '');
  return rows.slice(1)
    .map(row => {
      const cells = Array.from(row.querySelectorAll('td')).map(el => el.textContent?.trim() ?? '');
      const obj: RawRow = {};
      headers.forEach((h, i) => { obj[h] = cells[i] ?? ''; });
      return obj;
    })
    .filter(obj => Object.values(obj).some(v => v !== ''));
}

/* ── File reading helpers ── */

function readText(file: File, enc = 'UTF-8'): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(e.target?.result as string ?? '');
    r.onerror = rej;
    r.readAsText(file, enc);
  });
}

function readBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(e.target?.result as ArrayBuffer);
    r.onerror = rej;
    r.readAsArrayBuffer(file);
  });
}

/* ── Constants ── */

const ACCEPTS: Record<Platform, string> = {
  '카페24': '.csv',
  '스마트스토어': '.xlsx,.xls',
  '쿠팡': '.xlsx,.xls',
  '신세계V': '.xlsx,.xls',
  '무신사': '.xls',
};

const FILE_HINT: Record<Platform, string> = {
  '카페24': 'CSV',
  '스마트스토어': 'XLSX · XLS (헤더 2행)',
  '쿠팡': 'XLSX · XLS',
  '신세계V': 'XLSX · XLS',
  '무신사': 'XLS (HTML 형식)',
};

const PREVIEW_COLS: typeof ORDER_COLUMNS[number][] = [
  '받는사람', '받는사람전화번호', '우편', '받는사람주소', '수량', '품목명', '고객주문번호', '배송메모',
];

const TH: React.CSSProperties = {
  padding: '10px 12px', textAlign: 'left', fontWeight: 700,
  color: 'var(--text2)', fontFamily: "'DM Mono', monospace",
  fontSize: 10, letterSpacing: 0.5, whiteSpace: 'nowrap',
  borderRight: '1px solid var(--border)',
};
const TD: React.CSSProperties = {
  padding: '8px 12px', color: 'var(--text)', whiteSpace: 'nowrap',
  maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis',
  borderRight: '1px solid var(--border)',
};

/* ── localStorage keys ── */
const LS_ENTRIES = 'order_entries_v1';
const LS_LAST_DL = 'order_last_download_v1';

/* ── Component ── */

export default function OrderPage() {
  const [platform, setPlatform] = useState<Platform>('카페24');
  const [entries, setEntries] = useState<AccumulatedEntry[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastDownload, setLastDownload] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_ENTRIES);
      if (saved) setEntries(JSON.parse(saved) as AccumulatedEntry[]);
      const dl = localStorage.getItem(LS_LAST_DL);
      if (dl) setLastDownload(dl);
    } catch { /* ignore corrupt data */ }
  }, []);

  // Persist entries to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(LS_ENTRIES, JSON.stringify(entries));
    } catch { /* storage full */ }
  }, [entries]);

  const allRows = entries.flatMap(e => e.rows);

  // Count per platform (summed across possibly multiple uploads of same platform)
  const countByPlatform = PLATFORMS.reduce<Record<Platform, number>>((acc, p) => {
    acc[p] = entries.filter(e => e.platform === p).reduce((s, e) => s + e.rows.length, 0);
    return acc;
  }, {} as Record<Platform, number>);

  async function processFile(file: File) {
    setError('');
    setLoading(true);
    const name = file.name.toLowerCase();
    const isCSV = name.endsWith('.csv');
    const isXLS = name.endsWith('.xls');
    const isXLSX = name.endsWith('.xlsx');
    if (!isCSV && !isXLS && !isXLSX) {
      setError('CSV, XLSX, XLS 파일만 업로드 가능합니다.');
      setLoading(false);
      return;
    }
    try {
      let rawRows: RawRow[] = [];
      if (platform === '무신사') {
        const text = await readText(file, 'UTF-8');
        rawRows = parseHTMLTable(text);
        if (rawRows.length === 0) {
          const text2 = await readText(file, 'EUC-KR');
          rawRows = parseHTMLTable(text2);
        }
      } else if (platform === '카페24' && isCSV) {
        const text = await readText(file, 'EUC-KR');
        const wb = XLSX.read(text, { type: 'string' });
        rawRows = parseNormal(wb);
      } else if (platform === '스마트스토어') {
        const buf = await readBuffer(file);
        const wb = XLSX.read(buf, { type: 'array' });
        rawRows = parseSkipFirstRow(wb);
      } else {
        const buf = await readBuffer(file);
        const wb = XLSX.read(buf, { type: 'array' });
        rawRows = parseNormal(wb);
      }
      if (rawRows.length === 0) {
        setError('데이터를 읽을 수 없습니다. 파일 형식을 확인해주세요.');
      } else {
        const mapped = rawRows.map(r => mapRow(platform, r));
        setEntries(prev => [...prev, { platform, fileName: file.name, rows: mapped }]);
      }
    } catch {
      setError('파일을 읽는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [platform]); // eslint-disable-line react-hooks/exhaustive-deps

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }

  // Columns that get yellow (FFFF00) header background — matches the original template
  const YELLOW_HEADERS = new Set([
    '보내시는분', '보내시는분전화번호', '보내는사람주소',
    '받는사람', '받는사람전화번호', '받는사람핸드폰',
    '우편', '받는사람주소', '수량', '품목명', '배송메모',
  ]);

  function downloadAll() {
    if (allRows.length === 0) return;
    const headers = [...ORDER_COLUMNS] as string[];
    const dataRows = entries.flatMap(e => e.rows.map(r => headers.map(h => r[h as typeof ORDER_COLUMNS[number]] ?? '')));

    // Build AOA (array-of-arrays): header row + data rows
    const aoa = [headers, ...dataRows];
    const ws = XLSXStyle.utils.aoa_to_sheet(aoa);

    // Apply yellow fill to designated header cells
    headers.forEach((h, colIdx) => {
      const cellAddr = XLSXStyle.utils.encode_cell({ r: 0, c: colIdx });
      const cell = ws[cellAddr];
      if (!cell) return;
      cell.s = YELLOW_HEADERS.has(h)
        ? { fill: { patternType: 'solid', fgColor: { rgb: 'FFFF00' } }, font: { bold: true } }
        : { font: { bold: true } };
    });

    const wb = XLSXStyle.utils.book_new();
    XLSXStyle.utils.book_append_sheet(wb, ws, '발주서');
    XLSXStyle.writeFile(wb, `발주서_전체_${new Date().toISOString().slice(0, 10)}.xlsx`);

    const ts = new Date().toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    setLastDownload(ts);
    localStorage.setItem(LS_LAST_DL, ts);
  }

  function removeEntry(idx: number) {
    setEntries(prev => prev.filter((_, i) => i !== idx));
  }

  const activePlatforms = PLATFORMS.filter(p => countByPlatform[p] > 0);

  return (
    <div className="fade-in" style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Platform summary bar */}
      {allRows.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          padding: '12px 16px', background: 'var(--surface2)',
          border: '1px solid var(--border)', borderRadius: 12, marginBottom: 20,
        }}>
          {activePlatforms.map((p, i) => (
            <span key={p} style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {i > 0 && <span style={{ color: 'var(--border)' }}>/</span>}
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{p}</span>
              {' '}{countByPlatform[p]}건
            </span>
          ))}
          {activePlatforms.length > 0 && (
            <>
              <span style={{ color: 'var(--border)' }}>/</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--rose)' }}>
                총 {allRows.length}건
              </span>
            </>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {lastDownload && (
              <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>
                마지막 다운로드 {lastDownload}
              </span>
            )}
            <button className="btn btn-ghost btn-sm" onClick={() => { setEntries([]); setError(''); localStorage.removeItem(LS_ENTRIES); }}>
              초기화
            </button>
            <button className="btn btn-rose btn-sm" onClick={downloadAll}>
              ⬇ 전체 발주서 다운로드
            </button>
          </div>
        </div>
      )}

      {/* Platform tabs */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 10, fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>
          플랫폼 선택 후 파일 업로드
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PLATFORMS.map(p => (
            <button
              key={p}
              className={`btn btn-sm ${platform === p ? 'btn-rose' : 'btn-ghost'}`}
              onClick={() => { setPlatform(p); setError(''); }}
            >
              {p}
              {countByPlatform[p] > 0 && (
                <span style={{
                  marginLeft: 6, fontSize: 9, fontFamily: "'DM Mono', monospace",
                  background: 'rgba(255,255,255,0.25)', borderRadius: 8, padding: '1px 5px',
                }}>
                  {countByPlatform[p]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => document.getElementById('order-file-input')?.click()}
        style={{
          border: `2px dashed ${dragging ? 'var(--rose)' : 'var(--border)'}`,
          borderRadius: 14,
          padding: '32px 20px',
          textAlign: 'center',
          cursor: loading ? 'wait' : 'pointer',
          background: dragging ? 'rgba(180,60,90,0.04)' : 'var(--surface2)',
          transition: 'all 0.18s',
          marginBottom: 20,
        }}
      >
        <input
          id="order-file-input"
          type="file"
          accept={ACCEPTS[platform]}
          style={{ display: 'none' }}
          onChange={onFileInput}
        />
        <div style={{ fontSize: 24, marginBottom: 8 }}>{loading ? '⏳' : '📂'}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
          {loading ? '파일 처리 중...' : `${platform} 파일 업로드`}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>
          {FILE_HINT[platform]} · 드래그앤드롭 또는 클릭
        </div>
        {error && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--rose)', fontWeight: 600 }}>{error}</div>
        )}
      </div>

      {/* Uploaded entries list */}
      {entries.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
          {entries.map((entry, idx) => (
            <div key={idx} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 14px', background: 'var(--surface2)',
              border: '1px solid var(--border)', borderRadius: 10, fontSize: 12,
            }}>
              <span style={{ fontWeight: 600, color: 'var(--rose)', minWidth: 60 }}>{entry.platform}</span>
              <span style={{ color: 'var(--text3)', fontFamily: "'DM Mono', monospace", flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.fileName}
              </span>
              <span style={{ color: 'var(--text2)', fontWeight: 700, minWidth: 40, textAlign: 'right' }}>
                {entry.rows.length}건
              </span>
              <button
                onClick={() => removeEntry(idx)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 14, padding: '0 4px', flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Preview table */}
      {allRows.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', fontFamily: "'DM Mono', monospace", letterSpacing: 1, marginBottom: 10 }}>
            미리보기 (전체 {allRows.length}건)
          </div>
          <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 14 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: 'var(--surface2)' }}>
                  <th style={TH}>#</th>
                  <th style={TH}>플랫폼</th>
                  {PREVIEW_COLS.map(col => <th key={col} style={TH}>{col}</th>)}
                </tr>
              </thead>
              <tbody>
                {entries.flatMap((entry, ei) =>
                  entry.rows.map((row, ri) => {
                    const globalIdx = entries.slice(0, ei).reduce((s, e) => s + e.rows.length, 0) + ri;
                    return (
                      <tr key={`${ei}-${ri}`} style={{ borderTop: '1px solid var(--border)', background: globalIdx % 2 === 0 ? 'var(--surface)' : 'var(--surface2)' }}>
                        <td style={TD}>{globalIdx + 1}</td>
                        <td style={{ ...TD, fontWeight: 600, color: 'var(--rose)' }}>{entry.platform}</td>
                        {PREVIEW_COLS.map(col => <td key={col} style={TD}>{row[col]}</td>)}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 16px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)', fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>
            고정값 — 보내시는분: {FIXED.보내시는분} · 전화: {FIXED.보내시는분전화번호} · 주소: {FIXED.보내는사람주소}
          </div>
        </>
      )}

      {/* Empty state */}
      {allRows.length === 0 && !loading && (
        <div className="empty" style={{ marginTop: 0 }}>
          <div className="empty-icon">◈</div>
          <p>플랫폼을 선택하고 파일을 업로드하면 데이터가 누적됩니다</p>
        </div>
      )}
    </div>
  );
}
