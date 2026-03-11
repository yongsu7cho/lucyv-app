'use client';
import { useState } from 'react';

const SESSION_KEY = (tabName: string) => `tab_unlocked_${tabName}`;

function isUnlocked(tabName: string): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(SESSION_KEY(tabName)) === '1';
}

interface Props {
  tabName: string;
  password: string;
  children: React.ReactNode;
}

export default function PasswordLock({ tabName, password, children }: Props) {
  const [unlocked, setUnlocked] = useState(() => isUnlocked(tabName));
  const [pw, setPw] = useState('');
  const [error, setError] = useState(false);

  function submit() {
    if (pw === password) {
      sessionStorage.setItem(SESSION_KEY(tabName), '1');
      setUnlocked(true);
    } else {
      setError(true);
      setPw('');
    }
  }

  if (unlocked) return <>{children}</>;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', width: '100%',
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '40px 36px',
        width: 320,
        boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 6 }}>
            접근 제한 탭입니다
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            비밀번호를 입력하세요
          </div>
        </div>

        <input
          className="input"
          type="password"
          placeholder="비밀번호"
          value={pw}
          autoFocus
          onChange={e => { setPw(e.target.value); setError(false); }}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }}
          style={{ textAlign: 'center', letterSpacing: 6, fontSize: 20, marginBottom: 8 }}
        />

        {error && (
          <div style={{
            color: 'var(--danger)', fontSize: 12,
            textAlign: 'center', marginBottom: 8,
          }}>
            비밀번호가 틀렸습니다
          </div>
        )}

        <button
          className="btn btn-rose"
          onClick={submit}
          style={{ marginTop: 8, width: '100%' }}
        >
          확인
        </button>
      </div>
    </div>
  );
}
