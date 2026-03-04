'use client';
import { useState } from 'react';
import { AVCOL, BRAND_STYLE, INF_STAT_MAP } from '../constants';
import type { Influencer } from '../types';

interface InfluencerPageProps {
  influencers: Influencer[];
  setInfluencers: (infs: Influencer[]) => void;
}

const EMPTY_FORM = {
  name: '', handle: '', followers: '', count: 0, tags: '',
  brand: '이너피움' as const, start: '', end: '', status: 'active' as const,
};

export default function InfluencerPage({ influencers, setInfluencers }: InfluencerPageProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState<'all' | 'active' | 'standby' | 'end'>('all');

  const filtered = filter === 'all' ? influencers : influencers.filter(i => i.status === filter);

  function handleAdd() {
    if (!form.name.trim()) return;
    const newInf: Influencer = {
      id: Date.now(),
      name: form.name,
      handle: form.handle,
      followers: form.followers,
      count: form.count,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      brand: form.brand,
      start: form.start,
      end: form.end,
      status: form.status,
      color: AVCOL[influencers.length % AVCOL.length],
    };
    setInfluencers([...influencers, newInf]);
    setForm(EMPTY_FORM);
    setOpen(false);
  }

  function handleDelete(id: number) {
    if (!confirm('삭제할까요?')) return;
    setInfluencers(influencers.filter(i => i.id !== id));
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'active', 'standby', 'end'] as const).map(f => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-rose' : 'btn-ghost'}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? '전체' : INF_STAT_MAP[f].lbl}
            </button>
          ))}
        </div>
        <button className="btn btn-rose" onClick={() => setOpen(true)}>+ 인플루언서 추가</button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">✦</div>
          <p>인플루언서를 추가해보세요</p>
        </div>
      ) : (
        <div className="inf-grid">
          {filtered.map(inf => {
            const st = INF_STAT_MAP[inf.status];
            const bs = BRAND_STYLE[inf.brand] || BRAND_STYLE['기타'];
            return (
              <div key={inf.id} className="inf-card sli">
                <button className="xbtn" onClick={() => handleDelete(inf.id)}>✕</button>
                <div className="inf-av" style={{ background: inf.color }}>
                  {inf.name.charAt(0)}
                </div>
                <div className="inf-name">{inf.name}</div>
                <div className="inf-handle">{inf.handle || '@-'}</div>
                <div className="inf-stats">
                  <div className="inf-stat">
                    <div className="inf-stat-val">{inf.followers || '-'}</div>
                    <div className="inf-stat-lbl">팔로워</div>
                  </div>
                  <div className="inf-stat">
                    <div className="inf-stat-val">{inf.count}</div>
                    <div className="inf-stat-lbl">공구횟수</div>
                  </div>
                </div>
                <div className="inf-tags">
                  <span className="brand-tag" style={{ ...parseStyle(bs) }}>{inf.brand}</span>
                  {inf.tags.map((t, idx) => (
                    <span key={idx} className="inf-tag">{t}</span>
                  ))}
                </div>
                {inf.start && (
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>
                    {inf.start} ~ {inf.end || '?'}
                  </div>
                )}
                <div className={`inf-status ${st.cls}`}>
                  <div className="sdot" />
                  {st.lbl}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <div className={`modal-ov${open ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
        <div className="modal">
          <div className="modal-title">인플루언서 추가</div>
          <div className="form-row">
            <div className="form-lbl">이름</div>
            <input className="input" placeholder="인플루언서 이름" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-lbl">인스타 계정</div>
            <input className="input" placeholder="@계정명" value={form.handle}
              onChange={e => setForm({ ...form, handle: e.target.value })} />
          </div>
          <div className="form-row-2">
            <div className="form-row" style={{ margin: 0 }}>
              <div className="form-lbl">팔로워 수</div>
              <input className="input" placeholder="예: 12만" value={form.followers}
                onChange={e => setForm({ ...form, followers: e.target.value })} />
            </div>
            <div className="form-row" style={{ margin: 0 }}>
              <div className="form-lbl">공구 횟수</div>
              <input className="input" type="number" value={form.count}
                onChange={e => setForm({ ...form, count: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-lbl">카테고리 (쉼표 구분)</div>
            <input className="input" placeholder="뷰티, 건기식, 라이프스타일" value={form.tags}
              onChange={e => setForm({ ...form, tags: e.target.value })} />
          </div>
          <div className="form-row-2">
            <div className="form-row" style={{ margin: 0 }}>
              <div className="form-lbl">공구 시작일</div>
              <input className="input" type="date" value={form.start}
                onChange={e => setForm({ ...form, start: e.target.value })} />
            </div>
            <div className="form-row" style={{ margin: 0 }}>
              <div className="form-lbl">공구 종료일</div>
              <input className="input" type="date" value={form.end}
                onChange={e => setForm({ ...form, end: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-lbl">연결 브랜드</div>
            <select className="input" value={form.brand}
              onChange={e => setForm({ ...form, brand: e.target.value as typeof form.brand })}>
              <option value="이너피움">이너피움 (건기식)</option>
              <option value="아쿠아크">아쿠아크 (스킨케어)</option>
              <option value="문화콘텐츠">문화/콘텐츠</option>
              <option value="공구">공동구매</option>
              <option value="기타">기타</option>
            </select>
          </div>
          <div className="form-row">
            <div className="form-lbl">상태</div>
            <select className="input" value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value as typeof form.status })}>
              <option value="active">공구 진행 중</option>
              <option value="standby">대기 중</option>
              <option value="end">종료</option>
            </select>
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
