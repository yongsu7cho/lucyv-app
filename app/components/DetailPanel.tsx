'use client';
import { useState, useEffect, useRef } from 'react';
import type { Influencer, Project, TeamMember, ActionItem, Brand, InfluencerStatus, ProjectStatus, TeamStatus } from '../types';

type PanelItem = Influencer | Project | TeamMember;
export type PanelType = 'influencer' | 'project' | 'team';

interface Props {
  type: PanelType;
  item: PanelItem;
  onSave: (item: PanelItem) => Promise<void> | void;
  onClose: () => void;
}

export default function DetailPanel({ type, item, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<PanelItem>(item);
  const [saving, setSaving] = useState(false);

  // Sync when item changes externally
  useEffect(() => { setDraft(item); }, [item]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = draft as any;
  const actions: ActionItem[] = d.actions ?? [];
  const notes: string = d.notes ?? '';

  function upd(field: string, value: unknown) {
    setDraft(prev => ({ ...prev, [field]: value }));
  }

  // Sorted view: incomplete first, then complete (stable within each group)
  const sortedActions = [
    ...actions.filter(a => !a.done),
    ...actions.filter(a => a.done),
  ];

  function addAction() {
    upd('actions', [...actions, { id: Date.now(), text: '', done: false }]);
  }
  function toggleAction(id: number) {
    const target = actions.find(a => a.id === id);
    if (!target) return;
    const toggled = { ...target, done: !target.done };
    const rest = actions.filter(a => a.id !== id);
    // completed → push to end; uncompleted → push to front of incomplete section
    const newActions = toggled.done
      ? [...rest, toggled]
      : [toggled, ...rest];
    upd('actions', newActions);
  }
  function updateActionText(id: number, text: string) {
    upd('actions', actions.map(a => a.id === id ? { ...a, text } : a));
  }
  function removeAction(id: number) {
    upd('actions', actions.filter(a => a.id !== id));
  }
  async function reorderActions(newActions: ActionItem[]) {
    upd('actions', newActions);
    // Immediately persist order to DB
    const updated = { ...draft, actions: newActions } as PanelItem;
    await onSave(updated);
  }

  async function handleSave() {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
  }

  const panelTitle =
    type === 'influencer' ? (draft as Influencer).name :
    type === 'project' ? (draft as Project).name :
    (draft as TeamMember).name;

  return (
    <>
      <div className="dp-backdrop" onClick={onClose} />
      <div className="detail-panel">
        {/* Header */}
        <div className="dp-head">
          <div className="dp-head-info">
            <div className="dp-head-title">{panelTitle || '상세 정보'}</div>
            <div className="dp-head-sub">
              {type === 'influencer' ? '인플루언서' : type === 'project' ? '프로젝트' : '팀원'}
            </div>
          </div>
          <button className="dp-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="dp-body">
          {type === 'team' ? (
            <>
              {/* 상태 */}
              <div className="dp-section">
                <div className="dp-section-label">상태</div>
                <TeamStatusField m={draft as TeamMember} upd={upd} />
              </div>

              {/* Notes */}
              <div className="dp-section">
                <div className="dp-section-label">노트 / 메모</div>
                <textarea
                  className="dp-notes"
                  placeholder="자유롭게 메모를 입력하세요..."
                  value={notes}
                  onChange={e => upd('notes', e.target.value)}
                />
              </div>

              {/* Action Items */}
              <div className="dp-section">
                <div className="dp-section-label">
                  액션 아이템
                  {actions.length > 0 && (
                    <span className="dp-action-count">
                      {actions.filter(a => a.done).length}/{actions.length}
                    </span>
                  )}
                </div>
                {actions.length > 0 && (
                  <ActionList
                    actions={sortedActions}
                    onReorder={reorderActions}
                    onToggle={toggleAction}
                    onUpdateText={updateActionText}
                    onRemove={removeAction}
                  />
                )}
                <button className="dp-add-action-btn" onClick={addAction}>+ 액션 추가</button>
              </div>

              {/* 기본 정보 */}
              <div className="dp-section">
                <div className="dp-section-label">기본 정보</div>
                <TeamFields m={draft as TeamMember} upd={upd} />
              </div>
            </>
          ) : (
            <>
              {/* Basic Info */}
              <div className="dp-section">
                <div className="dp-section-label">기본 정보</div>
                {type === 'influencer' && <InfluencerFields inf={draft as Influencer} upd={upd} />}
                {type === 'project' && <ProjectFields p={draft as Project} upd={upd} />}
              </div>

              {/* Notes */}
              <div className="dp-section">
                <div className="dp-section-label">노트 / 메모</div>
                <textarea
                  className="dp-notes"
                  placeholder="자유롭게 메모를 입력하세요..."
                  value={notes}
                  onChange={e => upd('notes', e.target.value)}
                />
              </div>

              {/* Action Items */}
              <div className="dp-section">
                <div className="dp-section-label">
                  액션 아이템
                  {actions.length > 0 && (
                    <span className="dp-action-count">
                      {actions.filter(a => a.done).length}/{actions.length}
                    </span>
                  )}
                </div>
                {actions.length > 0 && (
                  <ActionList
                    actions={sortedActions}
                    onReorder={reorderActions}
                    onToggle={toggleAction}
                    onUpdateText={updateActionText}
                    onRemove={removeAction}
                  />
                )}
                <button className="dp-add-action-btn" onClick={addAction}>+ 액션 추가</button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="dp-foot">
          <button className="btn btn-ghost" onClick={onClose}>닫기</button>
          <button className="btn btn-rose" onClick={handleSave} disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </>
  );
}

/* ── ActionList with drag-and-drop ── */

interface ActionListProps {
  actions: ActionItem[];
  onReorder: (newActions: ActionItem[]) => void;
  onToggle: (id: number) => void;
  onUpdateText: (id: number, text: string) => void;
  onRemove: (id: number) => void;
}

function ActionList({ actions, onReorder, onToggle, onUpdateText, onRemove }: ActionListProps) {
  const dragId = useRef<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);

  function handleDragStart(e: React.DragEvent, id: number) {
    dragId.current = id;
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent, id: number, done: boolean) {
    e.preventDefault();
    if (done) return;
    setOverId(id);
  }

  function handleDrop(e: React.DragEvent, targetId: number, done: boolean) {
    e.preventDefault();
    setOverId(null);
    const fromId = dragId.current;
    if (fromId === null || fromId === targetId || done) return;

    const incomplete = actions.filter(a => !a.done);
    const complete = actions.filter(a => a.done);

    const fromIdx = incomplete.findIndex(a => a.id === fromId);
    const toIdx = incomplete.findIndex(a => a.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const reordered = [...incomplete];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    onReorder([...reordered, ...complete]);
    dragId.current = null;
  }

  function handleDragEnd() {
    setOverId(null);
    dragId.current = null;
  }

  return (
    <div className="dp-action-list">
      {actions.map(a => (
        <div
          key={a.id}
          className={`dp-action-row${overId === a.id ? ' dp-drag-over' : ''}`}
          draggable={!a.done}
          onDragStart={a.done ? undefined : e => handleDragStart(e, a.id)}
          onDragOver={e => handleDragOver(e, a.id, a.done)}
          onDrop={e => handleDrop(e, a.id, a.done)}
          onDragEnd={handleDragEnd}
        >
          <span
            className="dp-drag-handle"
            style={{ cursor: a.done ? 'default' : 'grab', opacity: a.done ? 0.2 : 0.45 }}
          >⋮⋮</span>
          <input type="checkbox" className="dp-action-check" checked={a.done} onChange={() => onToggle(a.id)} />
          <input type="text" className={`dp-action-text${a.done ? ' done' : ''}`} placeholder="할 일 입력..." value={a.text} onChange={e => onUpdateText(a.id, e.target.value)} />
          <button className="dp-action-del" onClick={() => onRemove(a.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}

/* ── Field helpers ── */

function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="dp-field">
      <div className="dp-field-label">{label}</div>
      {children}
    </div>
  );
}

function InfluencerFields({ inf, upd }: { inf: Influencer; upd: (f: string, v: unknown) => void }) {
  const G2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 } as const;
  return (
    <>
      <div style={G2}>
        <Fld label="이름">
          <input className="input" value={inf.name} onChange={e => upd('name', e.target.value)} />
        </Fld>
        <Fld label="인스타 계정">
          <input className="input" value={inf.handle} placeholder="@계정명" onChange={e => upd('handle', e.target.value)} />
        </Fld>
      </div>
      <div style={G2}>
        <Fld label="팔로워 수">
          <input className="input" value={inf.followers} placeholder="예: 12만" onChange={e => upd('followers', e.target.value)} />
        </Fld>
        <Fld label="공구 횟수">
          <input className="input" type="number" value={inf.count} onChange={e => upd('count', parseInt(e.target.value) || 0)} />
        </Fld>
      </div>
      <div style={G2}>
        <Fld label="카테고리 태그">
          <input className="input" value={inf.tags.join(', ')} placeholder="쉼표 구분" onChange={e => upd('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} />
        </Fld>
        <Fld label="연결 브랜드">
          <input className="input" value={inf.brand} placeholder="브랜드명 직접 입력" onChange={e => upd('brand', e.target.value)} />
        </Fld>
      </div>
      <div style={G2}>
        <Fld label="시작일">
          <input className="input" type="date" value={inf.start} onChange={e => upd('start', e.target.value)} />
        </Fld>
        <Fld label="종료일">
          <input className="input" type="date" value={inf.end} onChange={e => upd('end', e.target.value)} />
        </Fld>
      </div>
      <Fld label="상태">
        <select className="input" value={inf.status} onChange={e => upd('status', e.target.value as InfluencerStatus)}>
          <option value="active">공구 진행 중</option>
          <option value="standby">대기 중</option>
          <option value="end">종료</option>
        </select>
      </Fld>
    </>
  );
}

function ProjectFields({ p, upd }: { p: Project; upd: (f: string, v: unknown) => void }) {
  return (
    <>
      <Fld label="프로젝트명">
        <input className="input" value={p.name} onChange={e => upd('name', e.target.value)} />
      </Fld>
      <Fld label="브랜드">
        <select className="input" value={p.brand} onChange={e => upd('brand', e.target.value as Brand)}>
          <option value="이너피움">이너피움</option>
          <option value="아쿠아크">아쿠아크</option>
          <option value="문화콘텐츠">문화콘텐츠</option>
          <option value="에이전시">에이전시</option>
          <option value="기타">기타</option>
        </select>
      </Fld>
      <Fld label="설명">
        <textarea className="input" value={p.desc} placeholder="설명" style={{ minHeight: 72, resize: 'vertical' }} onChange={e => upd('desc', e.target.value)} />
      </Fld>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Fld label="시작일">
          <input className="input" type="date" value={p.start} onChange={e => upd('start', e.target.value)} />
        </Fld>
        <Fld label="마감일">
          <input className="input" type="date" value={p.due} onChange={e => upd('due', e.target.value)} />
        </Fld>
      </div>
      <Fld label="진행률 (%)">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="range" min={0} max={100} value={p.progress}
            style={{ flex: 1, accentColor: 'var(--rose)' }}
            onChange={e => upd('progress', parseInt(e.target.value))}
          />
          <span style={{ fontSize: 12, fontFamily: "'DM Mono',monospace", color: 'var(--text2)', minWidth: 36 }}>
            {p.progress}%
          </span>
        </div>
      </Fld>
      <Fld label="상태">
        <select className="input" value={p.status} onChange={e => upd('status', e.target.value as ProjectStatus)}>
          <option value="active">진행 중</option>
          <option value="hold">보류</option>
          <option value="done">완료</option>
        </select>
      </Fld>
    </>
  );
}

function TeamStatusField({ m, upd }: { m: TeamMember; upd: (f: string, v: unknown) => void }) {
  return (
    <div className="dp-compact">
      <div className="dp-cr">
        <span className="dp-cl">상태</span>
        <select className="dp-ci dp-ci-sel" value={m.status} onChange={e => upd('status', e.target.value as TeamStatus)}>
          <option value="a">재직 중</option>
          <option value="l">휴가 중</option>
          <option value="w">외근 중</option>
        </select>
      </div>
    </div>
  );
}

function TeamFields({ m, upd }: { m: TeamMember; upd: (f: string, v: unknown) => void }) {
  const rows: { label: string; el: React.ReactNode }[] = [
    { label: '이름', el: <input className="dp-ci" value={m.name} onChange={e => upd('name', e.target.value)} /> },
    { label: '직책', el: <input className="dp-ci" value={m.role} placeholder="마케팅 · 공구 담당" onChange={e => upd('role', e.target.value)} /> },
    { label: '이메일', el: <input className="dp-ci" type="email" value={m.email} onChange={e => upd('email', e.target.value)} /> },
    { label: '연락처', el: <input className="dp-ci" value={m.phone} onChange={e => upd('phone', e.target.value)} /> },
    { label: '담당 업무', el: <input className="dp-ci" value={m.tags.join(', ')} placeholder="쉼표로 구분" onChange={e => upd('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} /> },
  ];
  return (
    <div className="dp-compact">
      {rows.map(({ label, el }) => (
        <div key={label} className="dp-cr">
          <span className="dp-cl">{label}</span>
          {el}
        </div>
      ))}
    </div>
  );
}
