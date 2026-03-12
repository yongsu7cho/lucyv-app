'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Influencer, Project, TeamMember, ActionItem, Brand, InfluencerStatus, ProjectStatus, TeamStatus } from '../types';

type PanelItem = Influencer | Project | TeamMember;
export type PanelType = 'influencer' | 'project' | 'team';

interface Props {
  type: PanelType;
  item: PanelItem;
  onSave: (item: PanelItem) => Promise<void> | void;
  onClose: () => void;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function DetailPanel({ type, item, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<PanelItem>(item);
  const [saving, setSaving] = useState(false);

  // Team autosave state
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [snapshots, setSnapshots] = useState<PanelItem[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedStatusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track whether draft changed by user (vs external item sync)
  const userChangedRef = useRef(false);

  // Sync when item changes externally (e.g. after reorderActions save)
  useEffect(() => {
    userChangedRef.current = false;
    setDraft(item);
  }, [item]);

  // Team: debounced autosave
  useEffect(() => {
    if (type !== 'team') return;
    if (!userChangedRef.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await onSave(draft);
        // Save snapshot for undo (up to 10 levels)
        setSnapshots(prev => [...prev, draft].slice(-10));
        setSaveStatus('saved');
        if (savedStatusTimer.current) clearTimeout(savedStatusTimer.current);
        savedStatusTimer.current = setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('error');
      }
    }, 1500);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, type]);

  // Undo handler
  const handleUndo = useCallback(() => {
    setSnapshots(prev => {
      if (prev.length === 0) return prev;
      const restored = prev[prev.length - 1];
      const remaining = prev.slice(0, -1);
      userChangedRef.current = true;
      setDraft(restored);
      return remaining;
    });
  }, []);

  // Keyboard: Escape to close, Cmd/Ctrl+Z to undo (team only)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (type === 'team' && (e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, type, handleUndo]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = draft as any;
  const actions: ActionItem[] = d.actions ?? [];
  const notes: string = d.notes ?? '';

  function upd(field: string, value: unknown) {
    userChangedRef.current = true;
    setDraft(prev => ({ ...prev, [field]: value }));
  }

  // Sorted view: incomplete first, then complete
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
    const newActions = toggled.done ? [...rest, toggled] : [toggled, ...rest];
    upd('actions', newActions);
  }
  function updateActionText(id: number, text: string) {
    upd('actions', actions.map(a => a.id === id ? { ...a, text } : a));
  }
  function removeAction(id: number) {
    upd('actions', actions.filter(a => a.id !== id));
  }
  async function reorderActions(newActions: ActionItem[]) {
    userChangedRef.current = false; // reorder saves immediately, don't debounce
    setDraft(prev => ({ ...prev, actions: newActions }));
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

  const [infoOpen, setInfoOpen] = useState(true);

  const saveStatusEl = type === 'team' && saveStatus !== 'idle' ? (
    <span style={{
      fontSize: 11, fontFamily: "'DM Mono',monospace",
      color: saveStatus === 'saving' ? 'var(--text3)' : saveStatus === 'saved' ? 'var(--success)' : 'var(--danger)',
    }}>
      {saveStatus === 'saving' ? '저장 중...' : saveStatus === 'saved' ? '저장됨 ✓' : '저장 실패 ✗'}
    </span>
  ) : null;

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {saveStatusEl}
            {type === 'team' && snapshots.length > 0 && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleUndo}
                title="되돌리기 (Cmd+Z)"
                style={{ fontSize: 12, padding: '3px 8px' }}
              >↩ 되돌리기</button>
            )}
            <button className="dp-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="dp-body">
          {type === 'team' ? (
            <>
              <div className="dp-section">
                <div className="dp-section-label">상태</div>
                <TeamStatusField m={draft as TeamMember} upd={upd} />
              </div>

              <div className="dp-section">
                <div className="dp-section-label">노트 / 메모</div>
                <textarea
                  className="dp-notes"
                  placeholder="자유롭게 메모를 입력하세요..."
                  value={notes}
                  onChange={e => upd('notes', e.target.value)}
                />
              </div>

              <div className="dp-section">
                <div className="dp-section-label">
                  액션 아이템
                  {actions.length > 0 && (
                    <span className="dp-action-count">
                      {actions.filter(a => a.done).length}/{actions.length}
                    </span>
                  )}
                  <button className="dp-add-action-btn dp-add-action-inline" onClick={addAction}>+ 추가</button>
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
              </div>

              <div className="dp-section">
                <div className="dp-section-label">기본 정보</div>
                <TeamFields m={draft as TeamMember} upd={upd} />
              </div>
            </>
          ) : (
            <>
              <div className="dp-section">
                <div className="dp-section-label" style={{ cursor: 'pointer' }} onClick={() => setInfoOpen(o => !o)}>
                  <span style={{ marginRight: 4, fontSize: 8, display: 'inline-block', transition: 'transform 0.15s', transform: infoOpen ? 'rotate(90deg)' : 'none' }}>▶</span>
                  기본 정보
                  <button
                    className="dp-add-action-btn dp-add-action-inline"
                    style={{ fontSize: 10, color: 'var(--text3)' }}
                    onClick={e => { e.stopPropagation(); setInfoOpen(o => !o); }}
                  >{infoOpen ? '접기' : '펼치기'}</button>
                </div>
                {infoOpen && type === 'influencer' && <InfluencerFields inf={draft as Influencer} upd={upd} />}
                {infoOpen && type === 'project' && <ProjectFields p={draft as Project} upd={upd} />}
              </div>

              <div className="dp-section">
                <div className="dp-section-label">노트 / 메모</div>
                <textarea
                  className="dp-notes"
                  placeholder="자유롭게 메모를 입력하세요..."
                  value={notes}
                  onChange={e => upd('notes', e.target.value)}
                />
              </div>

              <div className="dp-section">
                <div className="dp-section-label">
                  액션 아이템
                  {actions.length > 0 && (
                    <span className="dp-action-count">
                      {actions.filter(a => a.done).length}/{actions.length}
                    </span>
                  )}
                  <button className="dp-add-action-btn dp-add-action-inline" onClick={addAction}>+ 추가</button>
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
              </div>
            </>
          )}
        </div>

        {/* Footer — hidden for team (autosave), shown for others */}
        {type !== 'team' && (
          <div className="dp-foot">
            <button className="btn btn-ghost" onClick={onClose}>닫기</button>
            <button className="btn btn-rose" onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        )}
        {type === 'team' && (
          <div className="dp-foot">
            <button className="btn btn-ghost" onClick={onClose}>닫기</button>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>변경 시 1.5초 후 자동저장</span>
          </div>
        )}
      </div>
    </>
  );
}

/* ── ActionList — mouse-event based drag and drop ── */

interface ActionListProps {
  actions: ActionItem[];
  onReorder: (newActions: ActionItem[]) => void;
  onToggle: (id: number) => void;
  onUpdateText: (id: number, text: string) => void;
  onRemove: (id: number) => void;
}

function ActionList({ actions, onReorder, onToggle, onUpdateText, onRemove }: ActionListProps) {
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });

  // Refs so event listener closures always see fresh values
  const rowRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const dragIdRef = useRef<number | null>(null);
  const overIdRef = useRef<number | null>(null);
  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  const handleHandleMouseDown = useCallback((e: React.MouseEvent, id: number) => {
    if (e.button !== 0) return;
    e.preventDefault();

    dragIdRef.current = id;
    overIdRef.current = null;
    let started = false;

    const onMouseMove = (ev: MouseEvent) => {
      if (!started) {
        started = true;
        setDraggingId(id);
        document.body.style.userSelect = 'none';
      }
      setGhostPos({ x: ev.clientX, y: ev.clientY });

      // Find which incomplete item the cursor is over
      const incomplete = actionsRef.current.filter(a => !a.done && a.id !== id);
      let hovered: number | null = null;
      for (const action of incomplete) {
        const el = rowRefs.current.get(action.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (ev.clientY >= rect.top && ev.clientY <= rect.bottom) {
          hovered = action.id;
          break;
        }
      }
      overIdRef.current = hovered;
      setOverId(hovered);
    };

    const onMouseUp = () => {
      const fromId = dragIdRef.current;
      const toId = overIdRef.current;

      // Cleanup
      document.body.style.userSelect = '';
      dragIdRef.current = null;
      overIdRef.current = null;
      setDraggingId(null);
      setOverId(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      // Commit reorder if valid
      if (started && fromId !== null && toId !== null && fromId !== toId) {
        const cur = actionsRef.current;
        const incomplete = cur.filter(a => !a.done);
        const complete = cur.filter(a => a.done);
        const fromIdx = incomplete.findIndex(a => a.id === fromId);
        const toIdx = incomplete.findIndex(a => a.id === toId);
        if (fromIdx !== -1 && toIdx !== -1) {
          const reordered = [...incomplete];
          const [moved] = reordered.splice(fromIdx, 1);
          reordered.splice(toIdx, 0, moved);
          onReorderRef.current([...reordered, ...complete]);
        }
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  // Build preview-reordered list
  const incomplete = actions.filter(a => !a.done);
  const complete = actions.filter(a => a.done);
  let displayIncomplete = [...incomplete];
  if (draggingId !== null && overId !== null) {
    const fromIdx = displayIncomplete.findIndex(a => a.id === draggingId);
    const toIdx = displayIncomplete.findIndex(a => a.id === overId);
    if (fromIdx !== -1 && toIdx !== -1) {
      const r = [...displayIncomplete];
      const [mv] = r.splice(fromIdx, 1);
      r.splice(toIdx, 0, mv);
      displayIncomplete = r;
    }
  }
  const displayActions = [...displayIncomplete, ...complete];
  const draggingAction = draggingId !== null ? actions.find(a => a.id === draggingId) : null;

  return (
    <>
      {/* Ghost clone — follows cursor */}
      {draggingAction && (
        <div style={{
          position: 'fixed',
          left: ghostPos.x + 14,
          top: ghostPos.y - 14,
          pointerEvents: 'none',
          zIndex: 9999,
          background: 'var(--surface)',
          border: '1px solid var(--rose)',
          borderRadius: 8,
          padding: '5px 14px 5px 10px',
          fontSize: 12,
          color: 'var(--text)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          maxWidth: 260,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          opacity: 0.92,
        }}>
          <span style={{ marginRight: 8, color: 'var(--rose)', opacity: 0.6 }}>⋮⋮</span>
          {draggingAction.text || '(빈 항목)'}
        </div>
      )}

      <div className="dp-action-list">
        {displayActions.map(a => (
          <div
            key={a.id}
            ref={el => { if (el) rowRefs.current.set(a.id, el); else rowRefs.current.delete(a.id); }}
            className={[
              'dp-action-row',
              draggingId === a.id ? 'dp-dragging' : '',
              overId === a.id ? 'dp-drag-over' : '',
            ].filter(Boolean).join(' ')}
          >
            {/* Only the handle triggers drag */}
            <span
              className="dp-drag-handle"
              onMouseDown={a.done ? undefined : e => handleHandleMouseDown(e, a.id)}
              style={{
                cursor: a.done ? 'default' : draggingId === a.id ? 'grabbing' : 'grab',
                opacity: a.done ? 0.2 : 0.5,
                userSelect: 'none',
              }}
            >⋮⋮</span>
            <input
              type="checkbox"
              className="dp-action-check"
              checked={a.done}
              onChange={() => onToggle(a.id)}
            />
            <input
              type="text"
              className={`dp-action-text${a.done ? ' done' : ''}`}
              placeholder="할 일 입력..."
              value={a.text}
              onChange={e => onUpdateText(a.id, e.target.value)}
            />
            <button className="dp-action-del" onClick={() => onRemove(a.id)}>✕</button>
          </div>
        ))}
      </div>
    </>
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
      <div style={G2}>
        <Fld label="상태">
          <select className="input" value={inf.status} onChange={e => upd('status', e.target.value as InfluencerStatus)}>
            <option value="active">공구 진행 중</option>
            <option value="standby">대기 중</option>
            <option value="end">종료</option>
          </select>
        </Fld>
        <div />
      </div>
    </>
  );
}

function ProjectFields({ p, upd }: { p: Project; upd: (f: string, v: unknown) => void }) {
  const G2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 } as const;
  return (
    <>
      <div style={G2}>
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
      </div>
      <div style={G2}>
        <Fld label="시작일">
          <input className="input" type="date" value={p.start} onChange={e => upd('start', e.target.value)} />
        </Fld>
        <Fld label="마감일">
          <input className="input" type="date" value={p.due} onChange={e => upd('due', e.target.value)} />
        </Fld>
      </div>
      <div style={G2}>
        <Fld label="상태">
          <select className="input" value={p.status} onChange={e => upd('status', e.target.value as ProjectStatus)}>
            <option value="active">진행 중</option>
            <option value="hold">보류</option>
            <option value="done">완료</option>
          </select>
        </Fld>
        <Fld label="진행률 (%)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
            <input
              type="range" min={0} max={100} value={p.progress}
              style={{ flex: 1, accentColor: 'var(--rose)' }}
              onChange={e => upd('progress', parseInt(e.target.value))}
            />
            <span style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: 'var(--text2)', minWidth: 30 }}>
              {p.progress}%
            </span>
          </div>
        </Fld>
      </div>
      <Fld label="설명">
        <textarea className="input" value={p.desc} placeholder="설명" style={{ minHeight: 60, resize: 'vertical' }} onChange={e => upd('desc', e.target.value)} />
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
