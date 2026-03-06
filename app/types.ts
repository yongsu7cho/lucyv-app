export type TabName = 'dashboard' | 'influencer' | 'projects' | 'calendar' | 'settlement' | 'team' | 'memo' | 'orders' | 'meta';

export type Brand = '이너피움' | '아쿠아크' | '문화콘텐츠' | '에이전시' | '공구' | '기타';
export type InfluencerStatus = 'active' | 'standby' | 'end';
export type ProjectStatus = 'active' | 'hold' | 'done';
export type TeamStatus = 'a' | 'l' | 'w';
export type EventCategory = '공구' | '캠페인' | '전시' | '미팅' | '기타';

export interface ActionItem {
  id: number;
  text: string;
  done: boolean;
}

export interface Influencer {
  id: number;
  name: string;
  handle: string;
  followers: string;
  count: number;
  tags: string[];
  brand: Brand;
  start: string;
  end: string;
  status: InfluencerStatus;
  color: string;
  notes: string;
  actions: ActionItem[];
}

export interface Project {
  id: number;
  name: string;
  brand: Brand;
  desc: string;
  start: string;
  due: string;
  progress: number;
  status: ProjectStatus;
  notes: string;
  actions: ActionItem[];
}

export interface CalendarEvent {
  id: number;
  title: string;
  time: string;
  cat: EventCategory;
}

export type CalendarEventMap = Record<string, CalendarEvent[]>;

export interface Settlement {
  id: number;
  name: string;
  date: string;
  type: 'in' | 'out';
  amount: number;
  brand: Brand;
  memo: string;
}

export interface Memo {
  id: number;
  title: string;
  content: string;
  color: string;
  updatedAt: string;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  tags: string[];
  status: TeamStatus;
  color: string;
  notes: string;
  actions: ActionItem[];
}

