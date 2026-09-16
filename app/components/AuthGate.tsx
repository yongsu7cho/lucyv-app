'use client';
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

interface Props {
  children: (session: Session) => React.ReactNode;
}

/**
 * Supabase Auth 로그인 게이트.
 * 세션이 없으면 로그인 화면을, 있으면 children을 렌더링한다.
 * 실제 데이터 보호는 DB RLS(authenticated-only 정책)가 담당하고,
 * 이 컴포넌트는 UI 진입만 막는다.
 */
export default function AuthGate({ children }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit() {
    if (!email || !pw || submitting) return;
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다');
      setPw('');
    }
    setSubmitting(false);
  }

  if (checking) {
    return (
      <div className="app-layout" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600, letterSpacing: 3, color: 'var(--rose2)' }}>
          루씨
        </div>
      </div>
    );
  }

  if (session) return <>{children(session)}</>;

  return (
    <div className="app-layout" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '40px 36px',
        width: 340,
        boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 600, letterSpacing: 3, color: 'var(--rose2)', marginBottom: 6 }}>
            루씨
          </div>
          <div style={{ fontSize: 10, letterSpacing: 4, color: 'var(--text3)', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase' }}>
            업무관리
          </div>
        </div>

        <input
          className="input"
          type="email"
          placeholder="이메일"
          value={email}
          autoFocus
          autoComplete="username"
          onChange={e => { setEmail(e.target.value); setError(null); }}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }}
          style={{ marginBottom: 8 }}
        />
        <input
          className="input"
          type="password"
          placeholder="비밀번호"
          value={pw}
          autoComplete="current-password"
          onChange={e => { setPw(e.target.value); setError(null); }}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }}
          style={{ marginBottom: 8 }}
        />

        {error && (
          <div style={{ color: 'var(--danger)', fontSize: 12, textAlign: 'center', marginBottom: 8 }}>
            {error}
          </div>
        )}

        <button
          className="btn btn-rose"
          onClick={submit}
          disabled={submitting}
          style={{ marginTop: 8, width: '100%' }}
        >
          {submitting ? '확인 중…' : '로그인'}
        </button>
      </div>
    </div>
  );
}
