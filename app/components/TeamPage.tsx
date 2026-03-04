'use client';
import { useState } from 'react';
import { AVCOL, TEAM_STAT } from '../constants';
import type { TeamMember, TeamStatus } from '../types';

interface TeamPageProps {
  members: TeamMember[];
  setMembers: (m: TeamMember[]) => void;
}

const EMPTY_FORM = {
  name: '', role: '', email: '', phone: '', tags: '', status: 'a' as TeamStatus,
};

export default function TeamPage({ members, setMembers }: TeamPageProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<number | null>(null);

  function handleAdd() {
    if (!form.name.trim()) return;
    const newMem: TeamMember = {
      id: Date.now(),
      name: form.name,
      role: form.role,
      email: form.email,
      phone: form.phone,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      status: form.status,
      color: AVCOL[members.length % AVCOL.length],
    };
    setMembers([...members, newMem]);
    setForm(EMPTY_FORM);
    setOpen(false);
  }

  function handleStatusChange(id: number, status: TeamStatus) {
    setMembers(members.map(m => m.id === id ? { ...m, status } : m));
  }

  function handleDelete(id: number) {
    if (!confirm('삭제할까요?')) return;
    setMembers(members.filter(m => m.id !== id));
  }

  const activeCount = members.filter(m => m.status === 'a').length;
  const leaveCount = members.filter(m => m.status === 'l').length;
  const outsideCount = members.filter(m => m.status === 'w').length;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 14 }}>
          <StatChip label="재직 중" count={activeCount} color="var(--success)" />
          <StatChip label="휴가 중" count={leaveCount} color="var(--gold)" />
          <StatChip label="외근 중" count={outsideCount} color="var(--text3)" />
        </div>
        <button className="btn btn-rose" onClick={() => setOpen(true)}>+ 팀원 추가</button>
      </div>

      {/* Grid */}
      {members.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">◎</div>
          <p>팀원을 추가해보세요</p>
        </div>
      ) : (
        <div className="team-grid">
          {members.map(m => {
            const ms = TEAM_STAT[m.status];
            return (
              <div key={m.id} className="mem-card sli">
                <button className="xbtn" onClick={() => handleDelete(m.id)}>✕</button>
                <div className="mem-av" style={{ background: m.color }}>
                  {m.name.charAt(0)}
                </div>
                <div className="mem-name">{m.name}</div>
                <div className="mem-role">{m.role || '역할 미지정'}</div>
                <div className="mem-contacts">
                  {m.email && <div className="mem-contact">✉ {m.email}</div>}
                  {m.phone && <div className="mem-contact">☎ {m.phone}</div>}
                </div>
                {m.tags.length > 0 && (
                  <div className="mem-tags">
                    {m.tags.map((t, idx) => (
                      <span key={idx} className="mem-tag">{t}</span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className={`mem-status ${ms.cls}`}>
                    <div className="sdot" />
                    {ms.lbl}
                  </div>
                  <select
                    className="input"
                    style={{ width: 'auto', padding: '3px 8px', fontSize: 10, marginTop: 0 }}
                    value={m.status}
                    onChange={e => handleStatusChange(m.id, e.target.value as TeamStatus)}
                  >
                    <option value="a">재직 중</option>
                    <option value="l">휴가 중</option>
                    <option value="w">외근 중</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <div className={`modal-ov${open ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
        <div className="modal">
          <div className="modal-title">팀원 추가</div>
          <div className="form-row">
            <div className="form-lbl">이름</div>
            <input className="input" placeholder="이름" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-lbl">직책/역할</div>
            <input className="input" placeholder="예: 마케팅 · 공구 담당" value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })} />
          </div>
          <div className="form-row-2">
            <div className="form-row" style={{ margin: 0 }}>
              <div className="form-lbl">이메일</div>
              <input className="input" placeholder="email@lucyv.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-row" style={{ margin: 0 }}>
              <div className="form-lbl">연락처</div>
              <input className="input" placeholder="010-0000-0000" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-lbl">담당 업무 (쉼표 구분)</div>
            <input className="input" placeholder="인플루언서 관리, SNS 운영, 브랜드 기획" value={form.tags}
              onChange={e => setForm({ ...form, tags: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-lbl">상태</div>
            <select className="input" value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value as TeamStatus })}>
              <option value="a">재직 중</option>
              <option value="l">휴가 중</option>
              <option value="w">외근 중</option>
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

function StatChip({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      <span style={{ fontSize: 12, color: 'var(--text2)' }}>{label}</span>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 700, color }}>{count}</span>
    </div>
  );
}
