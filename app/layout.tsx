import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LUCY V — Agency OS',
  description: '루씨브이에이전시 전용 업무관리 시스템',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
