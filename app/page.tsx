'use client';

import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import PasswordLock from './components/PasswordLock';
import Dashboard from './components/Dashboard';
import InfluencerPage from './components/InfluencerPage';
import ProjectsPage from './components/ProjectsPage';
import CalendarPage from './components/CalendarPage';
import SettlementPage from './components/SettlementPage';
import TeamPage from './components/TeamPage';
import MemoPage from './components/MemoPage';
import OrderPage from './components/OrderPage';
import MetaPage from './components/MetaPage';
import SalesPage from './components/SalesPage';
import { supabase } from '../lib/supabase';
import type {
  TabName, Influencer, Project, CalendarEventMap, CalendarEvent,
  Settlement, TeamMember, Memo,
} from './types';

// ── DB row → App type converters ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToInfluencer(r: any): Influencer {
  return {
    id: r.id, name: r.name, handle: r.handle, followers: r.followers,
    count: r.count, tags: r.tags ?? [], brand: r.brand,
    start: r.start_date, end: r.end_date, status: r.status, color: r.color,
    notes: r.notes ?? '', actions: r.actions ?? [],
  };
}
function infToRow(inf: Influencer): Record<string, unknown> {
  return {
    id: inf.id, name: inf.name, handle: inf.handle, followers: inf.followers,
    count: inf.count, tags: inf.tags, brand: inf.brand,
    start_date: inf.start, end_date: inf.end, status: inf.status, color: inf.color,
    notes: inf.notes, actions: inf.actions,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProject(r: any): Project {
  return {
    id: r.id, name: r.name, brand: r.brand, desc: r.description,
    start: r.start_date, due: r.due_date, progress: r.progress, status: r.status,
    notes: r.notes ?? '', actions: r.actions ?? [],
  };
}
function projToRow(p: Project): Record<string, unknown> {
  return {
    id: p.id, name: p.name, brand: p.brand, description: p.desc,
    start_date: p.start, due_date: p.due, progress: p.progress, status: p.status,
    notes: p.notes, actions: p.actions,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToCalEvent(r: any): { key: string; ev: CalendarEvent } {
  return { key: r.date_key, ev: { id: r.id, title: r.title, time: r.time, cat: r.cat } };
}
function evToRow(key: string, ev: CalendarEvent): Record<string, unknown> {
  return { id: ev.id, date_key: key, title: ev.title, time: ev.time, cat: ev.cat };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowsToEventMap(rows: any[]): CalendarEventMap {
  const map: CalendarEventMap = {};
  for (const row of rows) {
    const { key, ev } = rowToCalEvent(row);
    if (!map[key]) map[key] = [];
    map[key].push(ev);
  }
  return map;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSettlement(r: any): Settlement {
  return {
    id: r.id, name: r.name, date: r.date, type: r.type,
    amount: r.amount, brand: r.brand, memo: r.memo,
  };
}
function settleToRow(s: Settlement): Record<string, unknown> {
  return { id: s.id, name: s.name, date: s.date, type: s.type, amount: s.amount, brand: s.brand, memo: s.memo };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToMember(r: any): TeamMember {
  return {
    id: r.id, name: r.name, role: r.role, email: r.email,
    phone: r.phone, tags: r.tags ?? [], status: r.status, color: r.color,
    notes: r.notes ?? '', actions: r.actions ?? [],
  };
}
function memberToRow(m: TeamMember): Record<string, unknown> {
  return { id: m.id, name: m.name, role: m.role, email: m.email, phone: m.phone, tags: m.tags, status: m.status, color: m.color, notes: m.notes, actions: m.actions };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToMemo(r: any): Memo {
  return { id: r.id, title: r.title, content: r.content, color: r.color, updatedAt: r.updated_at };
}
function memoToRow(m: Memo): Record<string, unknown> {
  return { id: m.id, title: m.title, content: m.content, color: m.color, updated_at: m.updatedAt };
}

// ── Generic array diff → Supabase insert/update/delete ──
async function syncTable<T extends { id: number }>(
  table: string,
  oldItems: T[],
  newItems: T[],
  toRow: (item: T) => Record<string, unknown>,
) {
  const oldMap = new Map(oldItems.map(i => [i.id, i]));
  const newMap = new Map(newItems.map(i => [i.id, i]));

  for (const id of oldMap.keys()) {
    if (!newMap.has(id)) {
      await supabase.from(table).delete().eq('id', id);
    }
  }
  for (const item of newItems) {
    const old = oldMap.get(item.id);
    if (!old) {
      await supabase.from(table).insert(toRow(item));
    } else if (JSON.stringify(old) !== JSON.stringify(item)) {
      await supabase.from(table).update(toRow(item)).eq('id', item.id);
    }
  }
}

// Sync CalendarEventMap (nested Record<string, CalendarEvent[]>)
async function syncCalendarEvents(oldMap: CalendarEventMap, newMap: CalendarEventMap) {
  const oldFlat = Object.entries(oldMap).flatMap(([key, evs]) => evs.map(ev => ({ key, ev })));
  const newFlat = Object.entries(newMap).flatMap(([key, evs]) => evs.map(ev => ({ key, ev })));
  const oldIds = new Set(oldFlat.map(x => x.ev.id));
  const newIds = new Set(newFlat.map(x => x.ev.id));

  for (const { ev } of oldFlat) {
    if (!newIds.has(ev.id)) await supabase.from('calendar_events').delete().eq('id', ev.id);
  }
  for (const { key, ev } of newFlat) {
    if (!oldIds.has(ev.id)) await supabase.from('calendar_events').insert(evToRow(key, ev));
  }
  for (const { key, ev } of newFlat) {
    const old = oldFlat.find(x => x.ev.id === ev.id);
    if (old && (JSON.stringify(old.ev) !== JSON.stringify(ev) || old.key !== key)) {
      await supabase.from('calendar_events').update(evToRow(key, ev)).eq('id', ev.id);
    }
  }
}


// ── Main App ──
export default function Home() {
  const [activeTab, setActiveTab] = useState<TabName>('dashboard');
  const [mounted, setMounted] = useState(false);
  const [openInfluencerId, setOpenInfluencerId] = useState<number | null>(null);

  const [influencers, setInfluencersState] = useState<Influencer[]>([]);
  const [projects, setProjectsState] = useState<Project[]>([]);
  const [events, setEventsState] = useState<CalendarEventMap>({});
  const [settlements, setSettlementsState] = useState<Settlement[]>([]);
  const [members, setMembersState] = useState<TeamMember[]>([]);
  const [memos, setMemosState] = useState<Memo[]>([]);

  // Load all data from Supabase on mount
  useEffect(() => {
    async function loadAll() {
      const [infs, projs, evs, settles, team, memoRows] = await Promise.all([
        supabase.from('influencers').select('*').order('created_at'),
        supabase.from('projects').select('*').order('created_at'),
        supabase.from('calendar_events').select('*'),
        supabase.from('settlements').select('*').order('created_at', { ascending: false }),
        supabase.from('team_members').select('*').order('created_at'),
        supabase.from('memos').select('*').order('updated_at', { ascending: false }),
      ]);
      setInfluencersState((infs.data ?? []).map(rowToInfluencer));
      setProjectsState((projs.data ?? []).map(rowToProject));
      setEventsState(rowsToEventMap(evs.data ?? []));
      setSettlementsState((settles.data ?? []).map(rowToSettlement));
      setMembersState((team.data ?? []).map(rowToMember));
      setMemosState((memoRows.data ?? []).map(rowToMemo));
      setMounted(true);
    }
    loadAll();
  }, []);

  // Real-time subscriptions — re-fetch on any DB change from any user
  useEffect(() => {
    const channel = supabase
      .channel('lucyv-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'influencers' }, () => {
        supabase.from('influencers').select('*').order('created_at')
          .then(({ data }) => { if (data) setInfluencersState(data.map(rowToInfluencer)); });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        supabase.from('projects').select('*').order('created_at')
          .then(({ data }) => { if (data) setProjectsState(data.map(rowToProject)); });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, () => {
        supabase.from('calendar_events').select('*')
          .then(({ data }) => { if (data) setEventsState(rowsToEventMap(data)); });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settlements' }, () => {
        supabase.from('settlements').select('*').order('created_at', { ascending: false })
          .then(({ data }) => { if (data) setSettlementsState(data.map(rowToSettlement)); });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => {
        supabase.from('team_members').select('*').order('created_at')
          .then(({ data }) => { if (data) setMembersState(data.map(rowToMember)); });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'memos' }, () => {
        supabase.from('memos').select('*').order('updated_at', { ascending: false })
          .then(({ data }) => { if (data) setMemosState(data.map(rowToMemo)); });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Handle Google OAuth redirect
  useEffect(() => {
    if (!mounted) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('gcal') === 'connected' || params.has('error')) {
      setActiveTab('personal');
    }
  }, [mounted]);

  // ── Smart setters: optimistic UI update + Supabase sync ──
  // async functions returning Promise<void> are assignable to (T[]) => void in prop position

  async function setInfluencers(newItems: Influencer[]) {
    const old = influencers;
    setInfluencersState(newItems);
    await syncTable('influencers', old, newItems, infToRow);
  }

  async function setProjects(newItems: Project[]) {
    const old = projects;
    setProjectsState(newItems);
    await syncTable('projects', old, newItems, projToRow);
  }

  async function setEvents(newMap: CalendarEventMap) {
    const old = events;
    setEventsState(newMap);
    await syncCalendarEvents(old, newMap);
  }

  async function setSettlements(newItems: Settlement[]) {
    const old = settlements;
    setSettlementsState(newItems);
    await syncTable('settlements', old, newItems, settleToRow);
  }

  async function setMembers(newItems: TeamMember[]) {
    const old = members;
    setMembersState(newItems);
    await syncTable('team_members', old, newItems, memberToRow);
  }

  async function setMemos(newItems: Memo[]) {
    const old = memos;
    setMemosState(newItems);
    await syncTable('memos', old, newItems, memoToRow);
  }

  if (!mounted) {
    return (
      <div className="app-layout" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600, letterSpacing: 3, color: 'var(--rose2)', marginBottom: 8 }}>
            루씨
          </div>
          <div style={{ fontSize: 10, letterSpacing: 4, color: 'var(--text3)', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase' }}>
            업무관리
          </div>
        </div>
      </div>
    );
  }

  const activeInfCount = influencers.filter(i => i.status === 'active').length;

  return (
    <div className="app-layout">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeInfluencerCount={activeInfCount}
      />
      <div className="main">
        <Topbar activeTab={activeTab} />
        <div className="content">
          {activeTab === 'dashboard' && (
            <Dashboard
              influencers={influencers}
              projects={projects}
              settlements={settlements}
              members={members}
              onInfluencerClick={(id) => {
                setOpenInfluencerId(id);
                setActiveTab('influencer');
              }}
            />
          )}
          {activeTab === 'influencer' && (
            <InfluencerPage
              influencers={influencers}
              setInfluencers={setInfluencers}
              openId={openInfluencerId}
              onOpened={() => setOpenInfluencerId(null)}
            />
          )}
          {activeTab === 'projects' && (
            <ProjectsPage
              projects={projects}
              setProjects={setProjects}
            />
          )}
          {activeTab === 'personal' && (
            <CalendarPage />
          )}
          {activeTab === 'settlement' && (
            <PasswordLock tabName="settlement" password="1234">
              <SettlementPage />
            </PasswordLock>
          )}
          {activeTab === 'team' && (
            <TeamPage
              members={members}
              setMembers={setMembers}
            />
          )}
          {activeTab === 'memo' && (
            <MemoPage
              memos={memos}
              setMemos={setMemos}
            />
          )}
          {activeTab === 'orders' && <OrderPage />}
          {activeTab === 'meta' && <MetaPage />}
          {activeTab === 'sales' && (
            <PasswordLock tabName="sales" password="1111">
              <SalesPage />
            </PasswordLock>
          )}
        </div>
      </div>
    </div>
  );
}
