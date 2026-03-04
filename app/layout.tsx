import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '루씨 — 업무관리',
  description: '루씨 전용 업무관리 시스템',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
