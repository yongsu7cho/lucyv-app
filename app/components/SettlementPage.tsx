'use client';
import { useState } from 'react';
import { BRAND_STYLE, fmt, dk } from '../constants';
import type { Settlement } from '../types';

interface SettlementPageProps {
  settlements: Settlement[];
  setSettlements: (s: Settlement[]) => void;
}

const EMPTY_FORM = {
  name: '', date: '', type: 'in' as const, amount: 0,
  brand: '이너피움' as const, memo: '',
};

export default function SettlementPage({ settlements, setSettlements }: SettlementPageProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
  const [filterBrand, setFilterBrand] = useState<string>('all');

  const totalIn = settlements.filter(s => s.type === 'in').reduce((a, s) => a + s.amount, 0);
  const totalOut = settlements.filter(s => s.type === 'out').reduce((a, s) => a + s.amount, 0);
  const net = totalIn - totalOut;

  const filtered = settlements.filter(s => {
    if (filterType !== 'all' && s.type !== filterType) return false;
    if (filterBrand !== 'all' && s.brand !== filterBrand) return false;
    return true;
  });

  function handleAdd() {
    if (!form.name.trim()) return;
    const newS: Settlement = {
      id: Date.now(),
      name: form.name,
      date: form.date || dk(new Date()),
      type: form.type,
      amount: form.amount,
      brand: form.brand,
      memo: form.memo,
    };
    setSettlements([newS, ...settlements]);
    setForm(EMPTY_FORM);
    setOpen(false);
  }

  function handleDelete(id: number) {
    if (!confirm('삭제할까요?')) return;
    setSettlements(settlements.filter(s => s.id !== id));
  }

  // Monthly chart data
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  return (
    <div className="fade-in">
      {/* KPI */}
      <div className="settle-grid">
        <div className="settle-kpi">
          <div className="sk-label">총 매출</div>
          <div className="sk-value" style={{ color: 'var(--rose2)' }}>{fmt(totalIn)}</div>
          <div className="sk-sub">원</div>
        </div>
        <div className="settle-kpi">
          <div className="sk-label">총 지출</div>
          <div className="sk-value" style={{ color: 'var(--danger)' }}>{fmt(totalOut)}</div>
          <div className="sk-sub">원</div>
        </div>
        <div className="settle-kpi">
          <div className="sk-label">순수익</div>
          <div className="sk-value" style={{ color: net >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {fmt(Math.abs(net))}
          </div>
          <div className="sk-sub">{net >= 0 ? '흑자' : '적자'}</div>
        </div>
      </div>

      {/* Monthly Chart */}
      {settlements.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-head">
            <div className="card-title">₩ 월별 매출 추이</div>
          </div>
          <div className="card-body">
            <div className="chart-bar-wrap">
              {months.map(m => {
                const mIn = settlements.filter(s => s.type === 'in' && s.date.startsWith(m)).reduce((a, s) => a + s.amount, 0);
                const mOut = settlements.filter(s => s.type === 'out' && s.date.startsWith(m)).reduce((a, s) => a + s.amount, 0);
                const maxVal = Math.max(...months.map(mm => settlements.filter(s => s.type === 'in' && s.date.startsWith(mm)).reduce((a, s) => a + s.amount, 0)), 1);
                const [y, mo] = m.split('-');
                return (
                  <div key={m} className="chart-bar-row">
                    <div className="chart-bar-label">{mo}월</div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div className="chart-bar-bg">
                        <div className="chart-bar-fill" style={{ width: `${(mIn / maxVal) * 100}%`, background: 'var(--rose)' }} />
                      </div>
                      {mOut > 0 && (
                        <div className="chart-bar-bg">
                          <div className="chart-bar-fill" style={{ width: `${(mOut / maxVal) * 100}%`, background: 'var(--danger)', opacity: 0.6 }} />
                        </div>
                      )}
                    </div>
                    <div className="chart-bar-val">
                      {mIn > 0 ? fmt(mIn) : '-'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="card-head">
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="card-title">₩ 정산 내역</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['all', 'in', 'out'] as const).map(f => (
                <button
                  key={f}
                  className={`btn btn-sm ${filterType === f ? 'btn-rose' : 'btn-ghost'}`}
                  onClick={() => setFilterType(f)}
                >
                  {f === 'all' ? '전체' : f === 'in' ? '매출' : '지출'}
                </button>
              ))}
            </div>
            <select
              className="input"
              style={{ width: 'auto', padding: '4px 10px', fontSize: 11 }}
              value={filterBrand}
              onChange={e => setFilterBrand(e.target.value)}
            >
              <option value="all">전체 브랜드</option>
              <option value="이너피움">이너피움</option>
              <option value="아쿠아크">아쿠아크</option>
              <option value="공구">공동구매</option>
              <option value="문화콘텐츠">문화/콘텐츠</option>
              <option value="기타">기타</option>
            </select>
          </div>
          <button className="btn btn-rose btn-sm" onClick={() => setOpen(true)}>+ 내역 추가</button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {filtered.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">₩</div>
              <p>내역을 추가해보세요</p>
            </div>
          ) : (
            <table className="settle-table">
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>항목</th>
                  <th>브랜드/채널</th>
                  <th>구분</th>
                  <th>금액</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const bs = BRAND_STYLE[s.brand as keyof typeof BRAND_STYLE] || BRAND_STYLE['기타'];
                  return (
                    <tr key={s.id}>
                      <td style={{ color: 'var(--text2)', fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{s.date}</td>
                      <td>
                        {s.name}
                        {s.memo && <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 6 }}>{s.memo}</span>}
                      </td>
                      <td>
                        <span className="brand-tag" style={{ ...parseStyle(bs) }}>{s.brand}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: 10, fontWeight: 700, color: s.type === 'in' ? 'var(--success)' : 'var(--danger)' }}>
                          {s.type === 'in' ? '매출' : '지출'}
                        </span>
                      </td>
                      <td className={`amount ${s.type === 'in' ? 'plus' : 'minus'}`}>
                        {s.type === 'in' ? '+' : '-'}{fmt(s.amount)}
                      </td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>삭제</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      <div className={`modal-ov${open ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
        <div className="modal">
          <div className="modal-title">정산 내역 추가</div>
          <div className="form-row">
            <div className="form-lbl">항목명</div>
            <input className="input" placeholder="예: 이너피움 공구 수익, 콘텐츠 제작비" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-row-2">
            <div className="form-row" style={{ margin: 0 }}>
              <div className="form-lbl">날짜</div>
              <input className="input" type="date" value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="form-row" style={{ margin: 0 }}>
              <div className="form-lbl">구분</div>
              <select className="input" value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value as typeof form.type })}>
                <option value="in">매출 (수입)</option>
                <option value="out">지출 (비용)</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-lbl">금액 (원)</div>
            <input className="input" type="number" placeholder="0" value={form.amount || ''}
              onChange={e => setForm({ ...form, amount: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="form-row">
            <div className="form-lbl">브랜드/채널</div>
            <select className="input" value={form.brand}
              onChange={e => setForm({ ...form, brand: e.target.value as typeof form.brand })}>
              <option value="이너피움">이너피움</option>
              <option value="아쿠아크">아쿠아크</option>
              <option value="공구">공동구매</option>
              <option value="문화콘텐츠">문화/콘텐츠</option>
              <option value="기타">기타</option>
            </select>
          </div>
          <div className="form-row">
            <div className="form-lbl">메모</div>
            <input className="input" placeholder="선택사항" value={form.memo}
              onChange={e => setForm({ ...form, memo: e.target.value })} />
          </div>
          <div className="modal-foot">
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>취소</button>
            <button className="btn btn-rose" onClick={handleAdd}>추가하기</button>
          </div>
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
