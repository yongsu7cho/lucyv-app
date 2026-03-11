'use client';
import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import { fmt, dk } from '../constants';

/* ── Types ── */

type SType = 'pay' | 'receive';
type SStatus = 'active' | 'done';

interface SProject {
  id: string;
  name: string;
  brand: string;
  influencer: string;
  type: SType;
  start_date: string;
  end_date: string;
  status: SStatus;
  notes: string;
  created_at: string;
}

interface DailyRow {
  id: string;
  project_id: string;
  date: string;
  sales_amount: number;
  quantity: number;
  memo: string;
}

/* ── Order parsing helpers (from OrderPage) ── */

type Platform = '카페24' | '스마트스토어' | '쿠팡' | '신세계V' | '무신사' | 'W컨셉';
const PLATFORMS: Platform[] = ['카페24', '스마트스토어', '쿠팡', '신세계V', '무신사', 'W컨셉'];
type RawRow = Record<string, string>;

interface OrderEntry { platform: Platform; fileName: string; rows: { name: string; qty: string; orderNo: string }[] }

const ACCEPTS: Record<Platform, string> = {
  '카페24': '.csv', '스마트스토어': '.xlsx,.xls', '쿠팡': '.xlsx,.xls',
  '신세계V': '.xlsx,.xls', '무신사': '.xls', 'W컨셉': '.xlsx,.xls',
};
const FILE_HINT: Record<Platform, string> = {
  '카페24': 'CSV', '스마트스토어': 'XLSX/XLS (헤더 2행)', '쿠팡': 'XLSX/XLS',
  '신세계V': 'XLSX/XLS', '무신사': 'XLS (HTML)', 'W컨셉': 'XLSX/XLS',
};

function g(raw: RawRow, key: string): string { return String(raw[key] ?? '').trim(); }

function extractBracketTag(s: string): string {
  const m = s.match(/^\[([^\]]+)\]/);
  if (!m) return '';
  const c = m[1].trim();
  return /^\d+$/.test(c) ? '' : c;
}

function parseOptionItems(optStr: string): { name: string; qty: number }[] {
  if (!optStr) return [];
  const stripped = optStr.includes(':') ? optStr.split(':').slice(1).join(':').trim() : optStr.trim();
  const parenStart = stripped.indexOf('(');
  let main = stripped, parenContent = '';
  if (parenStart !== -1) {
    const parenEnd = stripped.lastIndexOf(')');
    if (parenEnd > parenStart) {
      main = stripped.slice(0, parenStart).trim();
      parenContent = stripped.slice(parenStart + 1, parenEnd).trim();
      if (parenContent.includes(':')) parenContent = parenContent.split(':').slice(1).join(':').trim();
    }
  }
  function parseParts(text: string): { name: string; qty: number }[] {
    const parts = text.replace(/([개장])\+/g, '$1\x00').split('\x00');
    const out: { name: string; qty: number }[] = [];
    for (const raw2 of parts) {
      const p = raw2.trim();
      if (!p || p.includes('%')) continue;
      const mGae = p.match(/^(.+?)\s+(\d+(?:\+\d+)*)개\s*$/);
      if (mGae) { out.push({ name: mGae[1].trim(), qty: mGae[2].split('+').reduce((s, n) => s + parseInt(n, 10), 0) }); continue; }
      const mJang = p.match(/^(.+?)\s*(\d+)장\s*$/);
      if (mJang) out.push({ name: mJang[1].trim(), qty: parseInt(mJang[2], 10) });
    }
    return out;
  }
  return [...parseParts(main), ...parseParts(parenContent)];
}

function mapOrderRow(platform: Platform, raw: RawRow): { name: string; qty: string; orderNo: string }[] {
  if (platform === '카페24') {
    const full = g(raw, '주문상품명(옵션포함)');
    const orderNo = g(raw, '주문번호');
    const items = parseOptionItems(full);
    if (items.length === 0) return [{ name: full, qty: g(raw, '수량'), orderNo }];
    return items.map(it => ({ name: it.name, qty: String(it.qty), orderNo }));
  } else if (platform === '스마트스토어') {
    const prodName = g(raw, '상품명');
    const tag = extractBracketTag(prodName);
    const orderNo = g(raw, '주문번호');
    const optStr = g(raw, '옵션정보') || prodName;
    const items = parseOptionItems(optStr);
    if (items.length === 0) return [{ name: tag || prodName, qty: g(raw, '수량'), orderNo }];
    return items.map(it => ({ name: it.name, qty: String(it.qty), orderNo }));
  } else if (platform === '쿠팡') {
    return [{ name: g(raw, '등록상품명'), qty: g(raw, '구매수(수량)'), orderNo: g(raw, '주문번호') }];
  } else if (platform === '신세계V') {
    return [{ name: g(raw, '상품명'), qty: g(raw, '수량'), orderNo: g(raw, '주문번호') }];
  } else if (platform === '무신사') {
    const rawProduct = g(raw, '10');
    const prodName = rawProduct.replace(/^\[\d+\]/, '').trim();
    const option = g(raw, '11');
    const name = option && option !== 'NONE' ? `${prodName} / ${option}` : prodName;
    return [{ name, qty: g(raw, '12'), orderNo: g(raw, '0') }];
  } else if (platform === 'W컨셉') {
    return [{ name: g(raw, '옵션1') || g(raw, '상품명'), qty: g(raw, '수량'), orderNo: g(raw, '주문번호') }];
  }
  return [];
}

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
  return rows.slice(1).map(row => {
    const cells = Array.from(row.querySelectorAll('td')).map(el => el.textContent?.trim() ?? '');
    const obj: RawRow = {};
    headers.forEach((h, i) => { obj[h] = cells[i] ?? ''; });
    cells.forEach((v, i) => { obj[String(i)] = v; });
    return obj;
  }).filter(obj => Object.values(obj).some(v => v !== ''));
}

function readText(file: File, enc = 'UTF-8'): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = e => res(e.target?.result as string ?? ''); r.onerror = rej; r.readAsText(file, enc); });
}
function readBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = e => res(e.target?.result as ArrayBuffer); r.onerror = rej; r.readAsArrayBuffer(file); });
}

/* ── Style helpers ── */
const TH: React.CSSProperties = { padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--text2)', fontSize: 10, letterSpacing: 0.5, whiteSpace: 'nowrap', borderRight: '1px solid var(--border)', fontFamily: "'DM Mono', monospace" };
const TD: React.CSSProperties = { padding: '7px 12px', color: 'var(--text)', whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', borderRight: '1px solid var(--border)', fontSize: 11 };

/* ══════════════════════════════════════════════════════
   Main component
══════════════════════════════════════════════════════ */

export default function SettlementPage() {
  const [projects, setProjects] = useState<SProject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => { fetchProjects(); }, []);

  async function fetchProjects() {
    setLoading(true);
    const { data } = await supabase.from('settlement_projects').select('*').order('created_at', { ascending: false });
    if (data) setProjects(data as SProject[]);
    setLoading(false);
  }

  const selected = projects.find(p => p.id === selectedId) ?? null;

  return (
    <div className="fade-in" style={{ display: 'flex', gap: 20, height: 'calc(100vh - 130px)', overflow: 'hidden' }}>
      {/* ── Left: project list ── */}
      <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>정산 프로젝트</span>
          <button className="btn btn-rose btn-sm" onClick={() => setShowNew(true)}>+ 새 프로젝트</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            <p style={{ color: 'var(--text3)', fontSize: 12, textAlign: 'center', padding: 20 }}>불러오는 중...</p>
          ) : projects.length === 0 ? (
            <div className="empty"><div className="empty-icon">₩</div><p>프로젝트를 추가해보세요</p></div>
          ) : projects.map(p => (
            <ProjectCard key={p.id} project={p} selected={p.id === selectedId} onClick={() => setSelectedId(p.id)} />
          ))}
        </div>
      </div>

      {/* ── Right: detail panel ── */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {selected ? (
          <ProjectPanel
            key={selected.id}
            project={selected}
            onClose={() => setSelectedId(null)}
            onUpdate={updated => setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))}
            onDelete={id => { setProjects(prev => prev.filter(p => p.id !== id)); setSelectedId(null); }}
          />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="empty"><div className="empty-icon">◈</div><p>프로젝트를 선택하세요</p></div>
          </div>
        )}
      </div>

      {/* ── New project modal ── */}
      {showNew && (
        <NewProjectModal
          onClose={() => setShowNew(false)}
          onCreate={p => { setProjects(prev => [p, ...prev]); setSelectedId(p.id); setShowNew(false); }}
        />
      )}
    </div>
  );
}

/* ── ProjectCard ── */

function ProjectCard({ project: p, selected, onClick }: { project: SProject; selected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 14px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
        background: selected ? 'rgba(180,60,90,0.08)' : 'var(--surface2)',
        border: `1px solid ${selected ? 'var(--rose)' : 'var(--border)'}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', lineHeight: 1.3, flex: 1 }}>{p.name || '(제목 없음)'}</div>
        <span style={{
          fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 8, flexShrink: 0,
          background: p.type === 'pay' ? 'rgba(220,50,80,0.12)' : 'rgba(40,160,100,0.12)',
          color: p.type === 'pay' ? 'var(--danger)' : 'var(--success)',
        }}>
          {p.type === 'pay' ? '지급' : '수취'}
        </span>
      </div>
      {p.brand && <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2 }}>{p.brand}</div>}
      {p.influencer && <div style={{ fontSize: 11, color: 'var(--text3)' }}>👤 {p.influencer}</div>}
      {(p.start_date || p.end_date) && (
        <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: "'DM Mono',monospace", marginTop: 4 }}>
          {p.start_date || '—'} ~ {p.end_date || '—'}
        </div>
      )}
      <div style={{ marginTop: 6 }}>
        <span style={{
          fontSize: 9, padding: '2px 7px', borderRadius: 8, fontWeight: 700,
          background: p.status === 'active' ? 'rgba(43,158,148,.12)' : 'rgba(150,150,160,.1)',
          color: p.status === 'active' ? '#2b9e94' : 'var(--text3)',
        }}>
          {p.status === 'active' ? '진행중' : '완료'}
        </span>
      </div>
    </div>
  );
}

/* ── NewProjectModal ── */

const EMPTY_FORM = { name: '', brand: '', influencer: '', type: 'pay' as SType, start_date: '', end_date: '', status: 'active' as SStatus };

function NewProjectModal({ onClose, onCreate }: { onClose: () => void; onCreate: (p: SProject) => void }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function upd<K extends keyof typeof EMPTY_FORM>(k: K, v: (typeof EMPTY_FORM)[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function handleCreate() {
    if (!form.name.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.from('settlement_projects').insert({
      name: form.name, brand: form.brand, influencer: form.influencer,
      type: form.type, start_date: form.start_date || null, end_date: form.end_date || null,
      status: form.status, notes: '',
    }).select().single();
    if (!error && data) onCreate(data as SProject);
    setSaving(false);
  }

  return (
    <>
      <div className="dp-backdrop" onClick={onClose} />
      <div className="modal" style={{ zIndex: 1100 }}>
        <div className="modal-title">새 정산 프로젝트</div>
        <FormRow label="프로젝트명 *">
          <input className="input" placeholder="예: 이너피움 3월 공구" value={form.name} onChange={e => upd('name', e.target.value)} />
        </FormRow>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <FormRow label="브랜드">
            <input className="input" placeholder="이너피움" value={form.brand} onChange={e => upd('brand', e.target.value)} />
          </FormRow>
          <FormRow label="인플루언서">
            <input className="input" placeholder="인플루언서명" value={form.influencer} onChange={e => upd('influencer', e.target.value)} />
          </FormRow>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <FormRow label="구분">
            <select className="input" value={form.type} onChange={e => upd('type', e.target.value as SType)}>
              <option value="pay">지급</option>
              <option value="receive">수취</option>
            </select>
          </FormRow>
          <FormRow label="상태">
            <select className="input" value={form.status} onChange={e => upd('status', e.target.value as SStatus)}>
              <option value="active">진행중</option>
              <option value="done">완료</option>
            </select>
          </FormRow>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <FormRow label="시작일">
            <input className="input" type="date" value={form.start_date} onChange={e => upd('start_date', e.target.value)} />
          </FormRow>
          <FormRow label="종료일">
            <input className="input" type="date" value={form.end_date} onChange={e => upd('end_date', e.target.value)} />
          </FormRow>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>취소</button>
          <button className="btn btn-rose" onClick={handleCreate} disabled={saving || !form.name.trim()}>
            {saving ? '생성 중...' : '생성'}
          </button>
        </div>
      </div>
    </>
  );
}

/* ── ProjectPanel ── */

type TabKey = '기본정보' | '발주서' | '매출' | '정산서';
const TABS: TabKey[] = ['기본정보', '발주서', '매출', '정산서'];

function ProjectPanel({ project, onClose, onUpdate, onDelete }: {
  project: SProject;
  onClose: () => void;
  onUpdate: (p: SProject) => void;
  onDelete: (id: string) => void;
}) {
  const [tab, setTab] = useState<TabKey>('기본정보');
  const [orderEntries, setOrderEntries] = useState<OrderEntry[]>([]);
  const [dailyRows, setDailyRows] = useState<DailyRow[]>([]);

  useEffect(() => {
    supabase.from('settlement_daily').select('*').eq('project_id', project.id).order('date').then(({ data }) => {
      if (data) setDailyRows(data as DailyRow[]);
    });
  }, [project.id]);

  const totalOrders = orderEntries.reduce((s, e) => s + e.rows.length, 0);
  const totalQty = orderEntries.reduce((s, e) => s + e.rows.reduce((q, r) => q + (parseInt(r.qty) || 0), 0), 0);
  const totalSales = dailyRows.reduce((s, r) => s + r.sales_amount, 0);
  const totalSalesQty = dailyRows.reduce((s, r) => s + r.quantity, 0);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{project.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
            {project.brand && <span>{project.brand} · </span>}
            {project.influencer && <span>{project.influencer} · </span>}
            <span style={{ color: project.type === 'pay' ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>
              {project.type === 'pay' ? '지급' : '수취'}
            </span>
          </div>
        </div>
        <button className="dp-close-btn" onClick={onClose}>✕</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 18px', fontSize: 12, fontWeight: tab === t ? 700 : 500,
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: tab === t ? '2px solid var(--rose)' : '2px solid transparent',
              color: tab === t ? 'var(--rose)' : 'var(--text2)',
              transition: 'all 0.15s',
            }}
          >{t}</button>
        ))}
      </div>

      {/* Tab body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {tab === '기본정보' && (
          <BasicInfoTab project={project} onUpdate={onUpdate} onDelete={onDelete} />
        )}
        {tab === '발주서' && (
          <OrderTab entries={orderEntries} setEntries={setOrderEntries} totalOrders={totalOrders} totalQty={totalQty} />
        )}
        {tab === '매출' && (
          <SalesTab projectId={project.id} rows={dailyRows} setRows={setDailyRows} />
        )}
        {tab === '정산서' && (
          <SettlementTab
            project={project}
            totalOrders={totalOrders}
            totalQty={totalQty}
            dailyRows={dailyRows}
            totalSales={totalSales}
            totalSalesQty={totalSalesQty}
          />
        )}
      </div>
    </div>
  );
}

/* ── BasicInfoTab ── */

function BasicInfoTab({ project, onUpdate, onDelete }: {
  project: SProject;
  onUpdate: (p: SProject) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState(project);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(project); }, [project]);

  function upd<K extends keyof SProject>(k: K, v: SProject[K]) {
    setDraft(prev => ({ ...prev, [k]: v }));
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase.from('settlement_projects').update({
      name: draft.name, brand: draft.brand, influencer: draft.influencer,
      type: draft.type, start_date: draft.start_date || null, end_date: draft.end_date || null,
      status: draft.status, notes: draft.notes,
    }).eq('id', project.id);
    if (!error) onUpdate(draft);
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`"${project.name}" 프로젝트를 삭제할까요? 매출 데이터도 함께 삭제됩니다.`)) return;
    await supabase.from('settlement_projects').delete().eq('id', project.id);
    onDelete(project.id);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 520 }}>
      <FormRow label="프로젝트명">
        <input className="input" value={draft.name} onChange={e => upd('name', e.target.value)} />
      </FormRow>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <FormRow label="브랜드">
          <input className="input" value={draft.brand} onChange={e => upd('brand', e.target.value)} />
        </FormRow>
        <FormRow label="인플루언서">
          <input className="input" value={draft.influencer} onChange={e => upd('influencer', e.target.value)} />
        </FormRow>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <FormRow label="구분 (지급/수취)">
          <select className="input" value={draft.type} onChange={e => upd('type', e.target.value as SType)}>
            <option value="pay">지급</option>
            <option value="receive">수취</option>
          </select>
        </FormRow>
        <FormRow label="상태">
          <select className="input" value={draft.status} onChange={e => upd('status', e.target.value as SStatus)}>
            <option value="active">진행중</option>
            <option value="done">완료</option>
          </select>
        </FormRow>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <FormRow label="시작일">
          <input className="input" type="date" value={draft.start_date ?? ''} onChange={e => upd('start_date', e.target.value)} />
        </FormRow>
        <FormRow label="종료일">
          <input className="input" type="date" value={draft.end_date ?? ''} onChange={e => upd('end_date', e.target.value)} />
        </FormRow>
      </div>
      <FormRow label="메모 / 노트">
        <textarea className="dp-notes" style={{ minHeight: 100 }} value={draft.notes} onChange={e => upd('notes', e.target.value)} />
      </FormRow>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button className="btn btn-rose" onClick={handleSave} disabled={saving}>{saving ? '저장 중...' : '저장'}</button>
        <button className="btn btn-ghost" style={{ marginLeft: 'auto', color: 'var(--danger)' }} onClick={handleDelete}>삭제</button>
      </div>
    </div>
  );
}

/* ── OrderTab ── */

function OrderTab({ entries, setEntries, totalOrders, totalQty }: {
  entries: OrderEntry[];
  setEntries: (e: OrderEntry[]) => void;
  totalOrders: number;
  totalQty: number;
}) {
  const [platform, setPlatform] = useState<Platform>('카페24');
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function processFile(file: File) {
    setError(''); setLoading(true);
    const name = file.name.toLowerCase();
    try {
      let rawRows: RawRow[] = [];
      if (platform === '무신사') {
        const text = await readText(file, 'UTF-8');
        rawRows = parseHTMLTable(text);
        if (rawRows.length === 0) rawRows = parseHTMLTable(await readText(file, 'EUC-KR'));
      } else if (platform === '카페24' && name.endsWith('.csv')) {
        const wb = XLSX.read(await readText(file, 'EUC-KR'), { type: 'string' });
        rawRows = parseNormal(wb);
      } else if (platform === '스마트스토어') {
        rawRows = parseSkipFirstRow(XLSX.read(await readBuffer(file), { type: 'array' }));
      } else {
        rawRows = parseNormal(XLSX.read(await readBuffer(file), { type: 'array' }));
      }
      if (rawRows.length === 0) { setError('데이터를 읽을 수 없습니다.'); }
      else {
        const rows = rawRows.flatMap(r => mapOrderRow(platform, r));
        setEntries([...entries, { platform, fileName: file.name, rows }]);
      }
    } catch { setError('파일을 읽는 중 오류가 발생했습니다.'); }
    finally { setLoading(false); }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [platform, entries]); // eslint-disable-line

  return (
    <div>
      {/* Summary bar */}
      {entries.length > 0 && (
        <div style={{ display: 'flex', gap: 16, padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 12 }}>총 주문건수 <strong style={{ color: 'var(--rose)' }}>{fmt(totalOrders)}건</strong></span>
          <span style={{ fontSize: 12 }}>총 수량 <strong style={{ color: 'var(--rose)' }}>{fmt(totalQty)}개</strong></span>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setEntries([])}>초기화</button>
        </div>
      )}

      {/* Platform tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {PLATFORMS.map(p => (
          <button key={p} className={`btn btn-sm ${platform === p ? 'btn-rose' : 'btn-ghost'}`}
            onClick={() => { setPlatform(p); setError(''); }}>{p}</button>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => document.getElementById('settle-order-file')?.click()}
        style={{
          border: `2px dashed ${dragging ? 'var(--rose)' : 'var(--border)'}`, borderRadius: 12, padding: '24px 16px',
          textAlign: 'center', cursor: 'pointer', background: dragging ? 'rgba(180,60,90,0.04)' : 'var(--surface2)',
          marginBottom: 14, transition: 'all 0.18s',
        }}
      >
        <input id="settle-order-file" type="file" accept={ACCEPTS[platform]} style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ''; }} />
        <div style={{ fontSize: 20, marginBottom: 6 }}>{loading ? '⏳' : '📂'}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{loading ? '처리 중...' : `${platform} 파일 업로드`}</div>
        <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: "'DM Mono',monospace" }}>{FILE_HINT[platform]} · 드래그 또는 클릭</div>
        {error && <div style={{ marginTop: 8, fontSize: 11, color: 'var(--rose)', fontWeight: 600 }}>{error}</div>}
      </div>

      {/* Entries */}
      {entries.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
          {entries.map((entry, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }}>
              <span style={{ fontWeight: 700, color: 'var(--rose)', minWidth: 60 }}>{entry.platform}</span>
              <span style={{ color: 'var(--text3)', fontFamily: "'DM Mono',monospace", flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.fileName}</span>
              <span style={{ color: 'var(--text2)', fontWeight: 700, minWidth: 40, textAlign: 'right' }}>{entry.rows.length}건</span>
              <button onClick={() => setEntries(entries.filter((_, i) => i !== idx))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 13, padding: '0 4px' }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Preview table */}
      {entries.length > 0 && (
        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                <th style={TH}>#</th>
                <th style={TH}>플랫폼</th>
                <th style={TH}>상품명</th>
                <th style={TH}>수량</th>
                <th style={TH}>주문번호</th>
              </tr>
            </thead>
            <tbody>
              {entries.flatMap((entry, ei) =>
                entry.rows.map((row, ri) => {
                  const gi = entries.slice(0, ei).reduce((s, e) => s + e.rows.length, 0) + ri;
                  return (
                    <tr key={`${ei}-${ri}`} style={{ borderTop: '1px solid var(--border)', background: gi % 2 === 0 ? 'var(--surface)' : 'var(--surface2)' }}>
                      <td style={TD}>{gi + 1}</td>
                      <td style={{ ...TD, fontWeight: 700, color: 'var(--rose)' }}>{entry.platform}</td>
                      <td style={{ ...TD, maxWidth: 260 }}>{row.name}</td>
                      <td style={TD}>{row.qty}</td>
                      <td style={{ ...TD, fontFamily: "'DM Mono',monospace", fontSize: 10 }}>{row.orderNo}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {entries.length === 0 && (
        <div className="empty" style={{ marginTop: 0 }}>
          <div className="empty-icon">◈</div>
          <p>플랫폼 선택 후 발주서 파일을 업로드하세요</p>
        </div>
      )}
    </div>
  );
}

/* ── SalesTab ── */

interface LocalDailyRow {
  id: string;
  project_id: string;
  date: string;
  sales_amount: number;
  quantity: number;
  memo: string;
  _new?: boolean;
}

function SalesTab({ projectId, rows, setRows }: {
  projectId: string;
  rows: DailyRow[];
  setRows: (r: DailyRow[]) => void;
}) {
  const [localRows, setLocalRows] = useState<LocalDailyRow[]>(rows);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => { setLocalRows(rows); }, [rows]);

  const totalSales = localRows.reduce((s, r) => s + r.sales_amount, 0);
  const totalQty = localRows.reduce((s, r) => s + r.quantity, 0);

  function addRow() {
    const newRow: LocalDailyRow = {
      id: `new-${Date.now()}`, project_id: projectId,
      date: dk(new Date()), sales_amount: 0, quantity: 0, memo: '', _new: true,
    };
    setLocalRows(prev => [...prev, newRow]);
  }

  function updRow(id: string, field: keyof LocalDailyRow, value: unknown) {
    setLocalRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }

  function removeLocalRow(id: string) {
    setLocalRows(prev => prev.filter(r => r.id !== id));
  }

  async function handleSalesFileUpload(file: File) {
    setUploadError(''); setUploading(true);
    try {
      const buf = await readBuffer(file);
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
      const dateKeys = ['날짜', 'date', 'Date', '일자'];
      const amtKeys = ['매출액', '매출', 'sales_amount', 'amount', '금액', 'Amount'];
      const qtyKeys = ['수량', 'quantity', 'qty', 'Qty'];
      const memoKeys = ['메모', 'memo', 'Memo', '비고'];
      function findKey(obj: Record<string, unknown>, candidates: string[]): string {
        return candidates.find(k => k in obj) ?? '';
      }
      const parsed: LocalDailyRow[] = raw.map(r => {
        const dk2 = findKey(r, dateKeys);
        const ak = findKey(r, amtKeys);
        const qk = findKey(r, qtyKeys);
        const mk = findKey(r, memoKeys);
        let dateStr = dk2 ? String(r[dk2]) : '';
        // Handle Excel serial date number
        if (dateStr && /^\d+$/.test(dateStr)) {
          const d = XLSX.SSF.parse_date_code(parseInt(dateStr));
          dateStr = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
        }
        return {
          id: `new-${Date.now()}-${Math.random()}`,
          project_id: projectId,
          date: dateStr,
          sales_amount: ak ? parseInt(String(r[ak]).replace(/,/g, '')) || 0 : 0,
          quantity: qk ? parseInt(String(r[qk])) || 0 : 0,
          memo: mk ? String(r[mk]) : '',
          _new: true,
        };
      }).filter(r => r.date);
      if (parsed.length === 0) { setUploadError('날짜 컬럼을 찾을 수 없습니다. 컬럼명을 확인해주세요.'); }
      else { setLocalRows(prev => { const existingDates = new Set(prev.map(r => r.date)); return [...prev, ...parsed.filter(r => !existingDates.has(r.date))]; }); }
    } catch { setUploadError('파일을 읽는 중 오류가 발생했습니다.'); }
    finally { setUploading(false); }
  }

  async function handleSave() {
    setSaving(true);
    // Upsert all rows to Supabase
    const upsertData = localRows.map(r => ({
      ...(r._new ? {} : { id: r.id }),
      project_id: r.project_id,
      date: r.date,
      sales_amount: r.sales_amount,
      quantity: r.quantity,
      memo: r.memo,
    }));
    const { data, error } = await supabase.from('settlement_daily').upsert(upsertData, { onConflict: 'project_id,date' }).select();
    if (!error && data) {
      const saved = data as DailyRow[];
      setRows(saved);
      setLocalRows(saved);
    }
    setSaving(false);
  }

  async function deleteRow(id: string) {
    if (id.startsWith('new-')) { removeLocalRow(id); return; }
    await supabase.from('settlement_daily').delete().eq('id', id);
    const newRows = localRows.filter(r => r.id !== id);
    setLocalRows(newRows);
    setRows(newRows as DailyRow[]);
  }

  return (
    <div>
      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <KpiBox label="누적 총매출" value={`${fmt(totalSales)}원`} />
        <KpiBox label="누적 총수량" value={`${fmt(totalQty)}개`} />
      </div>

      {/* Upload + Add buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
        <label style={{ cursor: 'pointer' }}>
          <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleSalesFileUpload(f); e.target.value = ''; }} />
          <span className="btn btn-ghost btn-sm">{uploading ? '처리 중...' : '📥 엑셀 업로드'}</span>
        </label>
        <button className="btn btn-ghost btn-sm" onClick={addRow}>+ 행 추가</button>
        <button className="btn btn-rose btn-sm" style={{ marginLeft: 'auto' }} onClick={handleSave} disabled={saving}>{saving ? '저장 중...' : '저장'}</button>
      </div>
      {uploadError && <div style={{ color: 'var(--rose)', fontSize: 11, marginBottom: 10 }}>{uploadError}</div>}

      {/* Table */}
      {localRows.length > 0 ? (
        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                <th style={TH}>날짜</th>
                <th style={TH}>매출액 (원)</th>
                <th style={TH}>수량</th>
                <th style={TH}>메모</th>
                <th style={{ ...TH, borderRight: 'none' }}></th>
              </tr>
            </thead>
            <tbody>
              {localRows.sort((a, b) => a.date.localeCompare(b.date)).map((row, i) => (
                <tr key={row.id} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)' }}>
                  <td style={TD}>
                    <input type="date" value={row.date} onChange={e => updRow(row.id, 'date', e.target.value)}
                      style={{ background: 'none', border: 'none', fontSize: 11, fontFamily: "'DM Mono',monospace", color: 'var(--text)', outline: 'none', width: 120 }} />
                  </td>
                  <td style={TD}>
                    <input type="number" value={row.sales_amount || ''} placeholder="0"
                      onChange={e => updRow(row.id, 'sales_amount', parseInt(e.target.value) || 0)}
                      style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--text)', outline: 'none', width: 100, textAlign: 'right' }} />
                  </td>
                  <td style={TD}>
                    <input type="number" value={row.quantity || ''} placeholder="0"
                      onChange={e => updRow(row.id, 'quantity', parseInt(e.target.value) || 0)}
                      style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--text)', outline: 'none', width: 60 }} />
                  </td>
                  <td style={TD}>
                    <input value={row.memo} placeholder="메모"
                      onChange={e => updRow(row.id, 'memo', e.target.value)}
                      style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--text)', outline: 'none', width: '100%' }} />
                  </td>
                  <td style={{ ...TD, borderRight: 'none' }}>
                    <button onClick={() => deleteRow(row.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 12, padding: '0 4px' }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty" style={{ marginTop: 0 }}>
          <div className="empty-icon">₩</div>
          <p>엑셀 업로드 또는 직접 행을 추가하세요</p>
        </div>
      )}
    </div>
  );
}

/* ── SettlementTab ── */

function SettlementTab({ project, totalOrders, totalQty, dailyRows, totalSales, totalSalesQty }: {
  project: SProject;
  totalOrders: number;
  totalQty: number;
  dailyRows: DailyRow[];
  totalSales: number;
  totalSalesQty: number;
}) {
  const sorted = [...dailyRows].sort((a, b) => a.date.localeCompare(b.date));

  function downloadExcel() {
    const wb = XLSX.utils.book_new();

    // Build sheet data
    const data: unknown[][] = [
      ['정산서'],
      [],
      ['프로젝트명', project.name],
      ['브랜드', project.brand],
      ['인플루언서', project.influencer],
      ['기간', `${project.start_date || '—'} ~ ${project.end_date || '—'}`],
      ['구분', project.type === 'pay' ? '지급' : '수취'],
      ['상태', project.status === 'active' ? '진행중' : '완료'],
      [],
      ['발주서 요약'],
      ['총 주문건수', totalOrders],
      ['총 수량', totalQty],
      [],
      ['일별 매출'],
      ['날짜', '매출액', '수량', '메모'],
      ...sorted.map(r => [r.date, r.sales_amount, r.quantity, r.memo]),
      [],
      ['총 매출', totalSales, totalSalesQty, ''],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 16 }, { wch: 18 }, { wch: 10 }, { wch: 24 }];
    XLSX.utils.book_append_sheet(wb, ws, '정산서');
    XLSX.writeFile(wb, `정산서_${project.name}_${dk(new Date())}.xlsx`);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button className="btn btn-rose btn-sm" onClick={downloadExcel}>⬇ 엑셀 다운로드</button>
      </div>

      {/* Preview */}
      <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', maxWidth: 560 }}>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
          정산서 미리보기
        </div>

        {/* Project info */}
        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '6px 12px', marginBottom: 16, fontSize: 12 }}>
          {[
            ['프로젝트명', project.name],
            ['브랜드', project.brand],
            ['인플루언서', project.influencer],
            ['기간', `${project.start_date || '—'} ~ ${project.end_date || '—'}`],
            ['구분', project.type === 'pay' ? '지급' : '수취'],
          ].map(([label, value]) => (
            value ? [
              <span key={`l-${label}`} style={{ color: 'var(--text3)' }}>{label}</span>,
              <span key={`v-${label}`} style={{ fontWeight: 600, color: 'var(--text)' }}>{value}</span>,
            ] : null
          ))}
        </div>

        {/* Order summary */}
        {(totalOrders > 0 || totalQty > 0) && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>발주서 요약</div>
            <div style={{ display: 'flex', gap: 24, fontSize: 12 }}>
              <span>총 주문건수 <strong style={{ color: 'var(--rose)' }}>{fmt(totalOrders)}건</strong></span>
              <span>총 수량 <strong style={{ color: 'var(--rose)' }}>{fmt(totalQty)}개</strong></span>
            </div>
          </div>
        )}

        {/* Daily sales table */}
        {sorted.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>일별 매출</div>
            <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: 'var(--surface)' }}>
                    <th style={TH}>날짜</th>
                    <th style={{ ...TH, textAlign: 'right' }}>매출액</th>
                    <th style={{ ...TH, textAlign: 'right' }}>수량</th>
                    <th style={{ ...TH, borderRight: 'none' }}>메모</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row, i) => (
                    <tr key={row.id} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface2)' : 'var(--surface)' }}>
                      <td style={{ ...TD, fontFamily: "'DM Mono',monospace" }}>{row.date}</td>
                      <td style={{ ...TD, textAlign: 'right', fontFamily: "'DM Mono',monospace" }}>{fmt(row.sales_amount)}</td>
                      <td style={{ ...TD, textAlign: 'right' }}>{fmt(row.quantity)}</td>
                      <td style={{ ...TD, borderRight: 'none' }}>{row.memo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Total */}
        <div style={{ background: 'rgba(180,60,90,0.06)', border: '1px solid rgba(180,60,90,0.2)', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 24 }}>
          <span style={{ fontSize: 13 }}>최종 총매출 <strong style={{ color: 'var(--rose)', fontSize: 15 }}>{fmt(totalSales)}원</strong></span>
          <span style={{ fontSize: 13 }}>총수량 <strong style={{ color: 'var(--rose)' }}>{fmt(totalSalesQty)}개</strong></span>
        </div>
      </div>
    </div>
  );
}

/* ── Shared helpers ── */

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', marginBottom: 4, letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: "'DM Mono',monospace" }}>{label}</div>
      {children}
    </div>
  );
}

function KpiBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--rose)', fontFamily: "'DM Mono',monospace" }}>{value}</div>
    </div>
  );
}
