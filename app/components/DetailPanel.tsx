'use client';
import { useState, useEffect } from 'react';
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

  function addAction() {
    upd('actions', [...actions, { id: Date.now(), text: '', done: false }]);
  }
  function toggleAction(id: number) {
    upd('actions', actions.map(a => a.id === id ? { ...a, done: !a.done } : a));
  }
  function updateActionText(id: number, text: string) {
    upd('actions', actions.map(a => a.id === id ? { ...a, text } : a));
  }
  function removeAction(id: number) {
    upd('actions', actions.filter(a => a.id !== id));
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
          {/* Basic Info */}
          <div className="dp-section">
            <div className="dp-section-label">기본 정보</div>
            {type === 'influencer' && <InfluencerFields inf={draft as Influencer} upd={upd} />}
            {type === 'project' && <ProjectFields p={draft as Project} upd={upd} />}
            {type === 'team' && <TeamFields m={draft as TeamMember} upd={upd} />}
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
              <div className="dp-action-list">
                {actions.map(a => (
                  <div key={a.id} className="dp-action-row">
                    <input
                      type="checkbox"
                      className="dp-action-check"
                      checked={a.done}
                      onChange={() => toggleAction(a.id)}
                    />
                    <input
                      type="text"
                      className={`dp-action-text${a.done ? ' done' : ''}`}
                      placeholder="할 일 입력..."
                      value={a.text}
                      onChange={e => updateActionText(a.id, e.target.value)}
                    />
                    <button className="dp-action-del" onClick={() => removeAction(a.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <button className="dp-add-action-btn" onClick={addAction}>
              + 액션 추가
            </button>
          </div>
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
  return (
    <>
      <Fld label="이름">
        <input className="input" value={inf.name} onChange={e => upd('name', e.target.value)} />
      </Fld>
      <Fld label="인스타 계정">
        <input className="input" value={inf.handle} placeholder="@계정명" onChange={e => upd('handle', e.target.value)} />
      </Fld>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Fld label="팔로워 수">
          <input className="input" value={inf.followers} placeholder="예: 12만" onChange={e => upd('followers', e.target.value)} />
        </Fld>
        <Fld label="공구 횟수">
          <input className="input" type="number" value={inf.count} onChange={e => upd('count', parseInt(e.target.value) || 0)} />
        </Fld>
      </div>
      <Fld label="카테고리 태그 (쉼표 구분)">
        <input className="input" value={inf.tags.join(', ')} onChange={e => upd('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} />
      </Fld>
      <Fld label="연결 브랜드">
        <select className="input" value={inf.brand} onChange={e => upd('brand', e.target.value as Brand)}>
          <option value="이너피움">이너피움</option>
          <option value="아쿠아크">아쿠아크</option>
          <option value="문화콘텐츠">문화콘텐츠</option>
          <option value="공구">공동구매</option>
          <option value="기타">기타</option>
        </select>
      </Fld>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
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

function TeamFields({ m, upd }: { m: TeamMember; upd: (f: string, v: unknown) => void }) {
  return (
    <>
      <Fld label="이름">
        <input className="input" value={m.name} onChange={e => upd('name', e.target.value)} />
      </Fld>
      <Fld label="직책 / 역할">
        <input className="input" value={m.role} placeholder="마케팅 · 공구 담당" onChange={e => upd('role', e.target.value)} />
      </Fld>
      <Fld label="이메일">
        <input className="input" type="email" value={m.email} onChange={e => upd('email', e.target.value)} />
      </Fld>
      <Fld label="연락처">
        <input className="input" value={m.phone} onChange={e => upd('phone', e.target.value)} />
      </Fld>
      <Fld label="담당 업무 (쉼표 구분)">
        <input
          className="input"
          value={m.tags.join(', ')}
          onChange={e => upd('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
        />
      </Fld>
      <Fld label="상태">
        <select className="input" value={m.status} onChange={e => upd('status', e.target.value as TeamStatus)}>
          <option value="a">재직 중</option>
          <option value="l">휴가 중</option>
          <option value="w">외근 중</option>
        </select>
      </Fld>
    </>
  );
}
