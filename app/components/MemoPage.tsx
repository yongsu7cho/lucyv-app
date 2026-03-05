'use client';
import { useState, useEffect, useRef } from 'react';
import type { Memo } from '../types';

interface MemoPageProps {
  memos: Memo[];
  setMemos: (m: Memo[]) => void;
}

const MEMO_COLORS = [
  '#E8A0A8', // rose
  '#7EC6C4', // teal
  '#F6BF26', // gold
  '#8E24AA', // purple
  '#33B679', // green
  '#039BE5', // blue
  '#F4511E', // orange
  '#9E9E9E', // gray
];

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function preview(content: string): string {
  return content.replace(/\n/g, ' ').trim().slice(0, 60) || '내용 없음';
}

export default function MemoPage({ memos, setMemos }: MemoPageProps) {
  const [selId, setSelId] = useState<number | null>(memos[0]?.id ?? null);
  const [search, setSearch] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const sel = memos.find(m => m.id === selId) ?? null;

  // Select first memo when list changes
  useEffect(() => {
    if (!sel && memos.length > 0) setSelId(memos[0].id);
  }, [memos, sel]);

  function createMemo() {
    const id = Date.now();
    const now = new Date().toISOString();
    const color = MEMO_COLORS[memos.length % MEMO_COLORS.length];
    const memo: Memo = { id, title: '새 메모', content: '', color, updatedAt: now };
    setMemos([memo, ...memos]);
    setSelId(id);
    setTimeout(() => titleRef.current?.select(), 50);
  }

  function deleteMemo(id: number) {
    const next = memos.filter(m => m.id !== id);
    setMemos(next);
    if (selId === id) setSelId(next[0]?.id ?? null);
  }

  function updateTitle(title: string) {
    if (!sel) return;
    setMemos(memos.map(m => m.id === sel.id ? { ...m, title, updatedAt: new Date().toISOString() } : m));
  }

  function updateContent(content: string) {
    if (!sel) return;
    setMemos(memos.map(m => m.id === sel.id ? { ...m, content, updatedAt: new Date().toISOString() } : m));
  }

  function updateColor(color: string) {
    if (!sel) return;
    setMemos(memos.map(m => m.id === sel.id ? { ...m, color } : m));
  }

  const filtered = search.trim()
    ? memos.filter(m =>
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.content.toLowerCase().includes(search.toLowerCase())
      )
    : memos;

  const wordCount = sel
    ? sel.content.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length
    : 0;
  const lineCount = sel ? sel.content.split('\n').length : 0;

  return (
    <div className="memo-layout fade-in">
      {/* ── Left panel: list ── */}
      <div className="memo-list-panel">
        <div className="memo-list-head">
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600, letterSpacing: 0.5 }}>
            메모장
          </div>
          <button className="btn btn-rose btn-sm" onClick={createMemo} style={{ padding: '5px 10px', fontSize: 12 }}>
            + 새 메모
          </button>
        </div>

        <div style={{ padding: '0 12px 10px' }}>
          <input
            className="input"
            placeholder="메모 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ fontSize: 12 }}
          />
        </div>

        <div className="memo-list">
          {filtered.length === 0 && (
            <div className="empty" style={{ padding: '40px 16px' }}>
              <div className="empty-icon" style={{ fontSize: 28 }}>✎</div>
              <p style={{ fontSize: 12 }}>
                {search ? '검색 결과가 없어요' : '메모가 없어요'}
              </p>
              {!search && (
                <button className="btn btn-ghost btn-sm" onClick={createMemo} style={{ marginTop: 8 }}>
                  첫 메모 만들기
                </button>
              )}
            </div>
          )}
          {filtered.map(memo => (
            <div
              key={memo.id}
              className={`memo-card${selId === memo.id ? ' active' : ''}`}
              onClick={() => setSelId(memo.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: memo.color, flexShrink: 0 }} />
                <div className="memo-card-title">{memo.title || '(제목 없음)'}</div>
              </div>
              <div className="memo-card-preview">{preview(memo.content)}</div>
              <div className="memo-card-time">{relativeTime(memo.updatedAt)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel: editor ── */}
      <div className="memo-editor-panel">
        {sel ? (
          <>
            <div className="memo-editor-head">
              <input
                ref={titleRef}
                className="memo-title-input"
                value={sel.title}
                onChange={e => updateTitle(e.target.value)}
                placeholder="제목 없음"
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {/* Color picker */}
                <div style={{ display: 'flex', gap: 4 }}>
                  {MEMO_COLORS.map(c => (
                    <div
                      key={c}
                      onClick={() => updateColor(c)}
                      style={{
                        width: 14, height: 14, borderRadius: 3,
                        background: c, cursor: 'pointer',
                        outline: sel.color === c ? `2px solid ${c}` : 'none',
                        outlineOffset: 2,
                        opacity: sel.color === c ? 1 : 0.5,
                        transition: 'opacity 0.15s',
                      }}
                      title={c}
                    />
                  ))}
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => deleteMemo(sel.id)}
                  style={{ padding: '4px 10px', fontSize: 11 }}
                >
                  삭제
                </button>
              </div>
            </div>

            <div style={{ padding: '0 24px 6px', display: 'flex', gap: 12 }}>
              <span className="memo-meta">{relativeTime(sel.updatedAt)} 수정됨</span>
              <span className="memo-meta">·</span>
              <span className="memo-meta">{lineCount}줄</span>
              <span className="memo-meta">·</span>
              <span className="memo-meta">단어 {wordCount}개</span>
            </div>

            <div style={{ borderBottom: `2px solid ${sel.color}30`, margin: '0 24px 16px', transition: 'border-color 0.3s' }} />

            <textarea
              ref={contentRef}
              className="memo-textarea"
              value={sel.content}
              onChange={e => updateContent(e.target.value)}
              placeholder={`여기에 자유롭게 내용을 입력하세요.\n\n아이디어, 할 일, 브리핑 내용 등 무엇이든 적어보세요.`}
            />
          </>
        ) : (
          <div className="empty" style={{ height: '100%', justifyContent: 'center' }}>
            <div className="empty-icon" style={{ fontSize: 40 }}>✎</div>
            <p>왼쪽에서 메모를 선택하거나 새 메모를 만들어보세요</p>
            <button className="btn btn-rose" onClick={createMemo} style={{ marginTop: 12 }}>
              + 새 메모 만들기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
