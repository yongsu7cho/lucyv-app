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

interface ActionItem {
  id: number;
  text: string;
  done: boolean;
}

interface ProjectDetail {
  notes: string;
  actions: ActionItem[];
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

export default function ProjectsPage({ projects, setProjects }: ProjectsPageProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState<'all' | 'active' | 'hold' | 'done'>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [details, setDetails] = useState<Record<number, ProjectDetail>>({});
  const [newAction, setNewAction] = useState('');

  const PROJ_ORDER: Record<string, number> = { active: 0, hold: 1, done: 2 };
  const filtered = (filter === 'all' ? projects : projects.filter(p => p.status === filter))
    .slice().sort((a, b) => (PROJ_ORDER[a.status] ?? 9) - (PROJ_ORDER[b.status] ?? 9));

  // 진행중 먼저, 완료는 아래로
  const sorted = [...filtered].sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;
    return 0;
  });

  function getDetail(id: number): ProjectDetail {
    return details[id] ?? { notes: '', actions: [] };
  }

  function setDetail(id: number, d: ProjectDetail) {
    setDetails(prev => ({ ...prev, [id]: d }));
  }

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

  function handleDelete(id: number, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (!confirm('삭제할까요?')) return;
    setProjects(projects.filter(p => p.id !== id));
    if (selectedProject?.id === id) setSelectedProject(null);
  }

  function addAction() {
    if (!newAction.trim() || !selectedProject) return;
    const d = getDetail(selectedProject.id);
    setDetail(selectedProject.id, {
      ...d,
      actions: [...d.actions, { id: Date.now(), text: newAction.trim(), done: false }],
    });
    setNewAction('');
  }

  function toggleAction(actionId: number) {
    if (!selectedProject) return;
    const d = getDetail(selectedProject.id);
    setDetail(selectedProject.id, {
      ...d,
      actions: d.actions.map(a => a.id === actionId ? { ...a, done: !a.done } : a),
    });
  }

  function deleteAction(actionId: number) {
    if (!selectedProject) return;
    const d = getDetail(selectedProject.id);
    setDetail(selectedProject.id, {
      ...d,
      actions: d.actions.filter(a => a.id !== actionId),
    });
  }

  const selDetail = selectedProject ? getDetail(selectedProject.id) : null;
  const sortedActions = selDetail
    ? [...selDetail.actions].sort((a, b) => Number(a.done) - Number(b.done))
    : [];

  return (
    <div className="fade-in" style={{ display: 'flex', gap: 0, position: 'relative' }}>
      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
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
        {sorted.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">◉</div>
            <p>프로젝트를 추가해보세요</p>
          </div>
        ) : (
          <div className="proj-grid">
            {sorted.map(p => {
              const bs = BRAND_STYLE[p.brand] || BRAND_STYLE['기타'];
              const ps = PROJ_STAT[p.status];
              const isSelected = selectedProject?.id === p.id;
              return (
                <div
                  key={p.id}
                  className="proj-card sli"
                  onClick={() => setSelectedProject(isSelected ? null : p)}
                  style={{
                    cursor: 'pointer',
                    border: isSelected ? '1.5px solid var(--rose)' : undefined,
                    opacity: p.status === 'done' ? 0.6 : 1,
                  }}
                >
                  <button className="xbtn" onClick={e => handleDelete(p.id, e)}>✕</button>
                  <span className="proj-brand-tag" style={{ ...parseStyle(bs) }}>{p.brand}</span>
                  <div className="proj-name">{p.name}</div>
                  <div className="proj-desc">{p.desc || '설명 없음'}</div>
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
      </div>

      {/* Detail Panel */}
      {selectedProject && selDetail && (
        <>
          {/* Overlay for mobile */}
          <div
            onClick={() => setSelectedProject(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
              zIndex: 40, display: 'none',
            }}
          />
          <div style={{
            width: 340,
            minWidth: 320,
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 24,
            marginLeft: 20,
            flexShrink: 0,
            height: 'fit-content',
            position: 'sticky',
            top: 20,
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto',
          }}>
            {/* Panel header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>
                  프로젝트 상세
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                  {selectedProject.name}
                </div>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 18, padding: 4 }}
              >
                ✕
              </button>
            </div>

            {/* Basic info */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              <span className="proj-brand-tag" style={{ ...parseStyle(BRAND_STYLE[selectedProject.brand] || '') }}>
                {selectedProject.brand}
              </span>
              <span className={`status-pill ${PROJ_STAT[selectedProject.status].cls}`}>
                {PROJ_STAT[selectedProject.status].lbl}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>
                {selectedProject.progress}% 완료
              </span>
            </div>

            {selectedProject.due && (
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 16, fontFamily: "'DM Mono', monospace" }}>
                📅 {selectedProject.start} ~ {selectedProject.due}
              </div>
            )}

            <div style={{ width: '100%', height: 4, background: 'var(--surface3)', borderRadius: 4, marginBottom: 20 }}>
              <div style={{ height: '100%', borderRadius: 4, background: PROJ_COLOR[selectedProject.status], width: `${selectedProject.progress}%` }} />
            </div>

            {/* Status */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 8, fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>
                상태
              </div>
              <select
                value={selectedProject.status}
                onChange={e => {
                  const updated = projects.map(p =>
                    p.id === selectedProject.id ? { ...p, status: e.target.value as 'active' | 'hold' | 'done' } : p
                  );
                  setProjects(updated);
                  setSelectedProject({ ...selectedProject, status: e.target.value as 'active' | 'hold' | 'done' });
                }}
                style={{
                  width: '100%',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '7px 10px',
                  fontSize: 12,
                  color: 'var(--text)',
                  outline: 'none',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <option value="active">진행 중</option>
                <option value="hold">보류</option>
                <option value="done">완료</option>
              </select>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 8, fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>
                📝 노트 / 메모
              </div>
              <textarea
                value={selDetail.notes}
                onChange={e => setDetail(selectedProject.id, { ...selDetail, notes: e.target.value })}
                placeholder="프로젝트 관련 메모를 자유롭게 적어주세요..."
                style={{
                  width: '100%',
                  minHeight: 120,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontSize: 12,
                  color: 'var(--text)',
                  resize: 'vertical',
                  outline: 'none',
                  fontFamily: 'inherit',
                  lineHeight: 1.6,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Action Items */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 10, fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>
                ✅ 액션 아이템
              </div>

              {/* Add action */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                <input
                  value={newAction}
                  onChange={e => setNewAction(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addAction(); }}
                  placeholder="할 일 추가..."
                  style={{
                    flex: 1,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '7px 10px',
                    fontSize: 12,
                    color: 'var(--text)',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={addAction}
                  className="btn btn-rose btn-sm"
                  style={{ flexShrink: 0 }}
                >
                  +
                </button>
              </div>

              {/* Action list */}
              {sortedActions.length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', padding: '12px 0' }}>
                  액션 아이템을 추가해보세요
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {sortedActions.map(a => (
                    <div key={a.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 10px',
                      background: 'var(--surface)',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      opacity: a.done ? 0.5 : 1,
                    }}>
                      <input
                        type="checkbox"
                        checked={a.done}
                        onChange={() => toggleAction(a.id)}
                        style={{ cursor: 'pointer', accentColor: 'var(--rose)', flexShrink: 0 }}
                      />
                      <span style={{
                        flex: 1, fontSize: 12, color: 'var(--text)',
                        textDecoration: a.done ? 'line-through' : 'none',
                      }}>
                        {a.text}
                      </span>
                      <button
                        onClick={() => deleteAction(a.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 14, padding: 0, flexShrink: 0 }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add Modal */}
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
