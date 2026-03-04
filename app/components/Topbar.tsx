import { TAB_TITLES, TAB_SUBS } from '../constants';
import type { TabName } from '../types';

interface TopbarProps {
  activeTab: TabName;
}

export default function Topbar({ activeTab }: TopbarProps) {
  const now = new Date();
  const dateStr = `${now.getFullYear()}. ${String(now.getMonth() + 1).padStart(2, '0')}. ${String(now.getDate()).padStart(2, '0')}`;

  return (
    <div className="topbar">
      <div>
        <div className="page-title">{TAB_TITLES[activeTab]}</div>
        <div className="page-sub">
          {activeTab === 'dashboard' ? dateStr : TAB_SUBS[activeTab]}
        </div>
      </div>
      <div className="topbar-right" style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>
        <span>{dateStr}</span>
      </div>
    </div>
  );
}
