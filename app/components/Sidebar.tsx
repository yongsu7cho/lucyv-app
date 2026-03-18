'use client';
import { useState } from 'react';
import type { TabName } from '../types';

interface SidebarProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
  activeInfluencerCount: number;
}

const NAV_ITEMS: { tab: TabName; icon: string; label: string; section?: string; badge?: boolean }[] = [
  { tab: 'dashboard', icon: '◈', label: '대시보드', section: 'Overview' },
  { tab: 'influencer', icon: '✦', label: '인플루언서/공구', section: 'Commerce', badge: true },
  { tab: 'orders', icon: '◫', label: '발주서 관리' },
  { tab: 'settlement', icon: '₩', label: '정산/발주' },
  { tab: 'sales', icon: '📈', label: '브랜드 매출', section: 'Brand & Project' },
  { tab: 'meta', icon: '◐', label: '메타 광고' },
  { tab: 'projects', icon: '◉', label: '프로젝트/캠페인' },
  { tab: 'personal', icon: '◷', label: '일정/캘린더', section: 'Schedule & Team' },
  { tab: 'team', icon: '◎', label: '팀원 관리' },
  { tab: 'memo', icon: '✎', label: '메모장' },
  { tab: 'files', icon: '🗂', label: '파일함' },
];

export default function Sidebar({ activeTab, onTabChange, activeInfluencerCount }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleTabChange(tab: TabName) {
    onTabChange(tab);
    setMobileOpen(false);
  }

  return (
    <div className="sidebar-root">
      {/* Hamburger button (mobile only, via CSS) */}
      <button
        className="mob-hamburger"
        onClick={() => setMobileOpen(o => !o)}
        aria-label="메뉴 열기/닫기"
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="mob-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`sidebar${mobileOpen ? ' mob-open' : ''}`}>
        <div className="brand">
          <div className="brand-logo">루씨</div>
          <div className="brand-sub">업무관리</div>
        </div>
        <nav>
          {NAV_ITEMS.map((item) => (
            <div key={item.tab}>
              {item.section && (
                <div className="nav-section">{item.section}</div>
              )}
              <div
                className={`nav-item${activeTab === item.tab ? ' active' : ''}`}
                onClick={() => handleTabChange(item.tab)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
                {item.badge && activeInfluencerCount > 0 && (
                  <span className="nav-badge">{activeInfluencerCount}</span>
                )}
              </div>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-row">
            <div className="user-av">L</div>
            <div>
              <div className="user-name">대표님</div>
              <div className="user-co">lucyvagency.com</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
