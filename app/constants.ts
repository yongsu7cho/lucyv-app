import { Brand, EventCategory, ProjectStatus, InfluencerStatus, TeamStatus } from './types';

export const AVCOL = ['#e8a0a8', '#c9a96e', '#7ecec4', '#a89ee8', '#e87070', '#70c8e8'];

export const BRAND_STYLE: Record<Brand, string> = {
  '이너피움': 'background:rgba(126,206,196,.15);color:#7ecec4;',
  '아쿠아크': 'background:rgba(232,160,168,.15);color:#e8a0a8;',
  '문화콘텐츠': 'background:rgba(168,158,232,.15);color:#a89ee8;',
  '에이전시': 'background:rgba(201,169,110,.15);color:#c9a96e;',
  '공구': 'background:rgba(201,169,110,.15);color:#c9a96e;',
  '기타': 'background:rgba(85,83,95,.2);color:#9896a8;',
};

export const INF_STAT_MAP: Record<InfluencerStatus, { cls: string; lbl: string }> = {
  active: { cls: 's-active', lbl: '공구 진행 중' },
  standby: { cls: 's-standby', lbl: '대기 중' },
  end: { cls: 's-end', lbl: '종료' },
};

export const PROJ_COLOR: Record<ProjectStatus, string> = {
  active: 'var(--mint)',
  hold: 'var(--gold)',
  done: 'var(--rose)',
};

export const PROJ_STAT: Record<ProjectStatus, { cls: string; lbl: string }> = {
  active: { cls: 'sp-active', lbl: '진행 중' },
  hold: { cls: 'sp-hold', lbl: '보류' },
  done: { cls: 'sp-done', lbl: '완료' },
};

export const CAT_COL: Record<EventCategory, string> = {
  '공구': 'var(--rose)',
  '캠페인': 'var(--mint)',
  '전시': 'var(--lavender)',
  '미팅': 'var(--gold)',
  '기타': 'var(--text2)',
};

export const TEAM_STAT: Record<TeamStatus, { cls: string; lbl: string }> = {
  a: { cls: 'ms-a', lbl: '재직 중' },
  l: { cls: 'ms-l', lbl: '휴가 중' },
  w: { cls: 'ms-w', lbl: '외근 중' },
};

export const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const MONTHS_KO = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월',
];

export function fmt(n: number): string {
  return Number(n).toLocaleString('ko-KR');
}

export function dk(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const TAB_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  influencer: 'Influencer & 공구',
  projects: 'Projects & Campaigns',
  calendar: 'Calendar',
  settlement: 'Settlement & 매출',
  team: 'Team',
};

export const TAB_SUBS: Record<string, string> = {
  dashboard: '루씨 · 오늘 현황',
  influencer: '인플루언서 공동구매 관리',
  projects: '이너피움 · 아쿠아크 · 문화콘텐츠',
  calendar: '일정 및 스케줄 관리',
  settlement: '매출 · 지출 · 정산 트래킹',
  team: '팀원 현황 및 업무 배분',
};
