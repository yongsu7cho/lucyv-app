import type { TabName } from '../types';

interface SidebarProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
  activeInfluencerCount: number;
}

const NAV_ITEMS: { tab: TabName; icon: string; label: string; section?: string; badge?: boolean }[] = [
  { tab: 'dashboard', icon: '◈', label: '대시보드', section: 'Overview' },
  { tab: 'influencer', icon: '✦', label: '인플루언서/공구', section: 'Commerce', badge: true },
  { tab: 'settlement', icon: '₩', label: '정산/매출' },
  { tab: 'projects', icon: '◉', label: '프로젝트/캠페인', section: 'Brand' },
  { tab: 'calendar', icon: '◷', label: '일정/캘린더' },
  { tab: 'team', icon: '◎', label: '팀원 관리', section: 'Team' },
];

export default function Sidebar({ activeTab, onTabChange, activeInfluencerCount }: SidebarProps) {
  return (
    <div className="sidebar">
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
              onClick={() => onTabChange(item.tab)}
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
  );
}
