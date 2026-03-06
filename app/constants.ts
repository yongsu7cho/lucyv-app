import { Brand, EventCategory, ProjectStatus, InfluencerStatus, TeamStatus } from './types';

export const AVCOL = ['#d4596a', '#b8832a', '#2b9e94', '#7b6fd4', '#c94444', '#2b88b8'];

export const BRAND_STYLE: Record<Brand, string> = {
  '이너피움': 'background:rgba(43,158,148,.12);color:#2b9e94;',
  '아쿠아크': 'background:rgba(212,89,106,.12);color:#d4596a;',
  '문화콘텐츠': 'background:rgba(123,111,212,.12);color:#7b6fd4;',
  '에이전시': 'background:rgba(184,131,42,.12);color:#b8832a;',
  '공구': 'background:rgba(184,131,42,.12);color:#b8832a;',
  '기타': 'background:rgba(150,150,160,.1);color:#6b6978;',
};

export const INF_STAT_MAP: Record<InfluencerStatus, { cls: string; lbl: string }> = {
  active: { cls: 's-active', lbl: '공구 진행 중' },
  standby: { cls: 's-standby', lbl: '대기 중' },
  end: { cls: 's-end', lbl: '종료' },
};

export const PROJ_COLOR: Record<ProjectStatus, string> = {
  active: '#2b9e94',
  hold: '#b8832a',
  done: '#d4596a',
};

export const PROJ_STAT: Record<ProjectStatus, { cls: string; lbl: string }> = {
  active: { cls: 'sp-active', lbl: '진행 중' },
  hold: { cls: 'sp-hold', lbl: '보류' },
  done: { cls: 'sp-done', lbl: '완료' },
};

export const CAT_COL: Record<EventCategory, string> = {
  '공구': '#d4596a',
  '캠페인': '#2b9e94',
  '전시': '#7b6fd4',
  '미팅': '#b8832a',
  '기타': '#9aa0a6',
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
  settlement: 'Settlement & 발주',
  team: 'Team',
  orders: 'Orders & 발주',
  meta: 'Meta 광고 분석',
};

export const TAB_SUBS: Record<string, string> = {
  dashboard: '루씨 · 오늘 현황',
  influencer: '인플루언서 공동구매 관리',
  projects: '이너피움 · 아쿠아크 · 문화콘텐츠',
  calendar: '일정 및 스케줄 관리',
  settlement: '발주 · 지출 · 정산 트래킹',
  team: '팀원 현황 및 업무 배분',
  orders: '플랫폼 주문 → 발주서 자동 변환',
  meta: '이너피움 · 아쿠아크 캠페인 성과',
};
