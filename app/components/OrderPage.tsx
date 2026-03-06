'use client';
import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawRow = Record<string, any>;

function mapRow(platform: Platform, raw: RawRow): OrderRow {
  const get = (key: string) => String(raw[key] ?? '');

  const base: OrderRow = {
    보내시는분: FIXED.보내시는분,
    보내시는분전화번호: FIXED.보내시는분전화번호,
    택배사: '',
    송장번호: '',
    보내는사람우편: '',
    보내는사람주소: FIXED.보내는사람주소,
    받는사람: '',
    받는사람전화번호: '',
    고객주문번호: '',
    받는사람핸드폰: '',
    우편: '',
    받는사람주소: '',
    수량: '',
    품목명: '',
    상품코드: '',
    지불조건: '',
    출고번호: '',
    기타: '',
    배송메모: '',
  };

  if (platform === '카페24') {
    base.받는사람 = get('수령인');
    base.받는사람전화번호 = get('수령인 휴대전화');
    base.받는사람핸드폰 = get('수령인 휴대전화');
    base.우편 = get('수령인 우편번호');
    base.받는사람주소 = get('수령인 주소(전체)');
    base.수량 = get('수량');
    base.품목명 = get('주문상품명');
    base.고객주문번호 = get('주문번호');
    base.배송메모 = get('배송메시지');
  } else if (platform === '쿠팡') {
    base.받는사람 = get('수취인이름');
    base.받는사람전화번호 = get('수취인전화번호');
    base.받는사람핸드폰 = get('수취인전화번호');
    base.우편 = get('우편번호');
    base.받는사람주소 = get('수취인 주소');
    base.수량 = get('구매수(수량)');
    base.품목명 = get('등록상품명');
    base.고객주문번호 = get('주문번호');
    base.배송메모 = get('배송메세지');
  } else if (platform === '신세계V') {
    base.받는사람 = get('수취인명');
    base.받는사람전화번호 = get('수취인연락처');
    base.받는사람핸드폰 = get('수취인연락처');
    base.우편 = get('수취인우편번호');
    const addr = [get('수취인기본주소'), get('수취인상세주소')].filter(Boolean).join(' ');
    base.받는사람주소 = addr;
    base.수량 = get('수량');
    base.품목명 = get('상품명');
    base.고객주문번호 = get('주문번호');
    base.배송메모 = get('배송메모');
  }
  // 스마트스토어, 무신사: 매핑 미정 — raw 데이터 그대로 빈칸
  return base;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sheetToJson(wb: XLSX.WorkBook): RawRow[] {
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: '' });
}

export default function OrderPage() {
  const [platform, setPlatform] = useState<Platform>('카페24');
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  function processFile(file: File) {
    setError('');
    const name = file.name.toLowerCase();
    const isCSV = name.endsWith('.csv');
    const isXLSX = name.endsWith('.xlsx') || name.endsWith('.xls');
    if (!isCSV && !isXLSX) {
      setError('CSV, XLSX, XLS 파일만 업로드 가능합니다.');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = isCSV
          ? XLSX.read(data, { type: 'string', codepage: 949 })
          : XLSX.read(data, { type: 'array' });
        const rawRows = sheetToJson(wb);
        const mapped = rawRows.map(r => mapRow(platform, r));
        setRows(mapped);
      } catch {
        setError('파일을 읽는 중 오류가 발생했습니다.');
      }
    };
    if (isCSV) reader.readAsText(file, 'EUC-KR');
    else reader.readAsArrayBuffer(file);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform]);

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }

  function downloadXLSX() {
    if (rows.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(rows, { header: [...ORDER_COLUMNS] });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '발주서');
    XLSX.writeFile(wb, `발주서_${platform}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  const PREVIEW_COLS: typeof ORDER_COLUMNS[number][] = [
    '받는사람', '받는사람전화번호', '우편', '받는사람주소', '수량', '품목명', '고객주문번호', '배송메모',
  ];

  return (
    <div className="fade-in" style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>발주서 관리</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>
          플랫폼별 주문 파일을 업로드하면 발주서 양식으로 자동 변환됩니다
        </div>
      </div>

      {/* Platform select */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 10, fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>
          플랫폼 선택
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PLATFORMS.map(p => (
            <button
              key={p}
              className={`btn btn-sm ${platform === p ? 'btn-rose' : 'btn-ghost'}`}
              onClick={() => { setPlatform(p); setRows([]); setFileName(''); setError(''); }}
            >
              {p}
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
          padding: '40px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? 'rgba(180,60,90,0.04)' : 'var(--surface2)',
          transition: 'all 0.18s',
          marginBottom: 20,
        }}
      >
        <input
          id="order-file-input"
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: 'none' }}
          onChange={onFileInput}
        />
        <div style={{ fontSize: 28, marginBottom: 10 }}>📂</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
          {fileName || '파일을 드래그하거나 클릭해서 업로드'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>
          CSV · XLSX · XLS 지원 / 현재 플랫폼: {platform}
        </div>
        {error && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--rose)', fontWeight: 600 }}>{error}</div>
        )}
      </div>

      {/* Result */}
      {rows.length > 0 && (
        <>
          {/* Summary + download */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{rows.length}건</span> 변환 완료
              <span style={{ marginLeft: 10, color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>{fileName}</span>
            </div>
            <button className="btn btn-rose btn-sm" onClick={downloadXLSX}>
              ⬇ 발주서 다운로드
            </button>
          </div>

          {/* Preview table */}
          <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: 'var(--surface2)' }}>
                  <th style={TH}>#</th>
                  {PREVIEW_COLS.map(col => (
                    <th key={col} style={TH}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)' }}>
                    <td style={TD}>{i + 1}</td>
                    {PREVIEW_COLS.map(col => (
                      <td key={col} style={TD}>{row[col]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Fixed values notice */}
          <div style={{ marginTop: 14, padding: '12px 16px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)', fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>
            고정값 — 보내시는분: {FIXED.보내시는분} / 전화: {FIXED.보내시는분전화번호} / 주소: {FIXED.보내는사람주소}
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
  maxWidth: 200,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  borderRight: '1px solid var(--border)',
};
