export type TabName = 'dashboard' | 'influencer' | 'projects' | 'calendar' | 'settlement' | 'team';

export type Brand = '이너피움' | '아쿠아크' | '문화콘텐츠' | '에이전시' | '공구' | '기타';
export type InfluencerStatus = 'active' | 'standby' | 'end';
export type ProjectStatus = 'active' | 'hold' | 'done';
export type TeamStatus = 'a' | 'l' | 'w';
export type EventCategory = '공구' | '캠페인' | '전시' | '미팅' | '기타';

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

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  tags: string[];
  status: TeamStatus;
  color: string;
}
