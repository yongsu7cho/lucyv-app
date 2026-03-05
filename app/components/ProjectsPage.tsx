'use client';
import { useState } from 'react';
import { BRAND_STYLE, PROJ_COLOR, PROJ_STAT } from '../constants';
import type { Project } from '../types';
import DetailPanel from './DetailPanel';

interface ProjectsPageProps {
  projects: Project[];
  setProjects: (p: Project[]) => void;
}

const EMPTY_FORM = {
  name: '', brand: '이너피움' as const, desc: '',
  start: '', due: '', progress: 0, status: 'active' as const,
};

export default function ProjectsPage({ projects, setProjects }: ProjectsPageProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState<'all' | 'active' | 'hold' | 'done'>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selectedProj = selectedId != null ? projects.find(p => p.id === selectedId) ?? null : null;

  const PROJ_ORDER: Record<string, number> = { active: 0, hold: 1, done: 2 };
  const filtered = (filter === 'all' ? projects : projects.filter(p => p.status === filter))
    .slice().sort((a, b) => (PROJ_ORDER[a.status] ?? 9) - (PROJ_ORDER[b.status] ?? 9));

  function handleAdd() {
    if (!form.name.trim()) return;
    const newProj: Project = {
      id: Date.now(),
      name: form.name,
      brand: form.brand,
      desc: form.desc,
      start: form.start,
      due: form.due,
      progress: Math.min(100, Math.max(0, form.progress)),
      status: form.status,
      notes: '', actions: [],
    };
    setProjects([...projects, newProj]);
    setForm(EMPTY_FORM);
    setOpen(false);
  }

  function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('삭제할까요?')) return;
    setProjects(projects.filter(p => p.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function handlePanelSave(updated: Project) {
    setProjects(projects.map(p => p.id === updated.id ? updated : p));
    setSelectedId(null);
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'active', 'hold', 'done'] as const).map(f => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-rose' : 'btn-ghost'}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? '전체' : f === 'active' ? '진행 중' : f === 'hold' ? '보류' : '완료'}
            </button>
          ))}
        </div>
        <button className="btn btn-rose" onClick={() => setOpen(true)}>+ 프로젝트 추가</button>
      </div>

      {/* Brand Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 22 }}>
        {(['이너피움', '아쿠아크', '문화콘텐츠'] as const).map(brand => {
          const count = projects.filter(p => p.brand === brand).length;
          const active = projects.filter(p => p.brand === brand && p.status === 'active').length;
          const bs = BRAND_STYLE[brand];
          return (
            <div key={brand} className="kpi" style={{ paddingTop: 14, paddingBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className="brand-tag" style={{ ...parseStyle(bs) }}>{brand}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text3)' }}>
                  활성 {active}
                </span>
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: 'var(--text)' }}>
                {count}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>총 프로젝트</div>
            </div>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">◉</div>
          <p>프로젝트를 추가해보세요</p>
        </div>
      ) : (
        <div className="proj-grid">
          {filtered.map(p => {
            const bs = BRAND_STYLE[p.brand] || BRAND_STYLE['기타'];
            const ps = PROJ_STAT[p.status];
            return (
              <div key={p.id} className="proj-card sli" onClick={() => setSelectedId(p.id)} style={{ cursor: 'pointer' }}>
                <button className="xbtn" onClick={e => handleDelete(p.id, e)}>✕</button>
                <span className="proj-brand-tag" style={{ ...parseStyle(bs) }}>{p.brand}</span>
                <div className="proj-name">{p.name}</div>
                <div className="proj-desc">{p.desc || '설명 없음'}</div>
                <div className="pbar-wrap">
                  <div className="pbar">
                    <div className="pfill" style={{ width: `${p.progress}%`, background: PROJ_COLOR[p.status] }} />
                  </div>
                  <div className="plbl">
                    <span>{p.progress}% 완료</span>
                    <span>{p.due || '마감 미정'}</span>
                  </div>
                </div>
                <div className="proj-foot">
                  <span className={`status-pill ${ps.cls}`}>{ps.lbl}</span>
                  {p.start && (
                    <span className="proj-due">{p.start} ~ {p.due || '?'}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Panel */}
      {selectedProj && (
        <DetailPanel
          type="project"
          item={selectedProj}
          onSave={item => handlePanelSave(item as Project)}
          onClose={() => setSelectedId(null)}
        />
      )}

      {/* Modal */}
      <div className={`modal-ov${open ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
        <div className="modal">
          <div className="modal-title">프로젝트 추가</div>
          <div className="form-row">
            <div className="form-lbl">프로젝트명</div>
            <input className="input" placeholder="캠페인/프로젝트 이름" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-lbl">브랜드</div>
            <select className="input" value={form.brand}
              onChange={e => setForm({ ...form, brand: e.target.value as typeof form.brand })}>
              <option value="이너피움">이너피움 (건기식)</option>
              <option value="아쿠아크">아쿠아크 (스킨케어)</option>
              <option value="문화콘텐츠">문화/콘텐츠 기획</option>
              <option value="에이전시">에이전시 공통</option>
            </select>
          </div>
          <div className="form-row">
            <div className="form-lbl">설명</div>
            <textarea className="input" placeholder="프로젝트 설명" value={form.desc}
              onChange={e => setForm({ ...form, desc: e.target.value })} />
          </div>
          <div className="form-row-2">
            <div className="form-row" style={{ margin: 0 }}>
              <div className="form-lbl">시작일</div>
              <input className="input" type="date" value={form.start}
                onChange={e => setForm({ ...form, start: e.target.value })} />
            </div>
            <div className="form-row" style={{ margin: 0 }}>
              <div className="form-lbl">마감일</div>
              <input className="input" type="date" value={form.due}
                onChange={e => setForm({ ...form, due: e.target.value })} />
            </div>
          </div>
          <div className="form-row-2">
            <div className="form-row" style={{ margin: 0 }}>
              <div className="form-lbl">진행률 (%)</div>
              <input className="input" type="number" min={0} max={100} value={form.progress}
                onChange={e => setForm({ ...form, progress: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="form-row" style={{ margin: 0 }}>
              <div className="form-lbl">상태</div>
              <select className="input" value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value as typeof form.status })}>
                <option value="active">진행 중</option>
                <option value="hold">보류</option>
                <option value="done">완료</option>
              </select>
            </div>
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
