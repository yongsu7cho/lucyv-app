'use client';

import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './components/Dashboard';
import InfluencerPage from './components/InfluencerPage';
import ProjectsPage from './components/ProjectsPage';
import CalendarPage from './components/CalendarPage';
import SettlementPage from './components/SettlementPage';
import TeamPage from './components/TeamPage';
import type { TabName, Influencer, Project, CalendarEventMap, Settlement, TeamMember } from './types';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabName>('dashboard');
  const [mounted, setMounted] = useState(false);

  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<CalendarEventMap>({});
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const i = localStorage.getItem('lv_infs');
      const p = localStorage.getItem('lv_proj');
      const e = localStorage.getItem('lv_events');
      const s = localStorage.getItem('lv_settle');
      const m = localStorage.getItem('lv_team');
      if (i) setInfluencers(JSON.parse(i));
      if (p) setProjects(JSON.parse(p));
      if (e) setEvents(JSON.parse(e));
      if (s) setSettlements(JSON.parse(s));
      if (m) setMembers(JSON.parse(m));
    } catch {}
    setMounted(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('lv_infs', JSON.stringify(influencers));
  }, [influencers, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('lv_proj', JSON.stringify(projects));
  }, [projects, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('lv_events', JSON.stringify(events));
  }, [events, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('lv_settle', JSON.stringify(settlements));
  }, [settlements, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('lv_team', JSON.stringify(members));
  }, [members, mounted]);

  // Handle Google OAuth redirect: switch to calendar tab
  useEffect(() => {
    if (!mounted) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('gcal') === 'connected' || params.has('error')) {
      setActiveTab('calendar');
    }
  }, [mounted]);

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
              events={events}
              settlements={settlements}
              members={members}
            />
          )}
          {activeTab === 'influencer' && (
            <InfluencerPage
              influencers={influencers}
              setInfluencers={setInfluencers}
            />
          )}
          {activeTab === 'projects' && (
            <ProjectsPage
              projects={projects}
              setProjects={setProjects}
            />
          )}
          {activeTab === 'calendar' && (
            <CalendarPage
              events={events}
              setEvents={setEvents}
            />
          )}
          {activeTab === 'settlement' && (
            <SettlementPage
              settlements={settlements}
              setSettlements={setSettlements}
            />
          )}
          {activeTab === 'team' && (
            <TeamPage
              members={members}
              setMembers={setMembers}
            />
          )}
        </div>
      </div>
    </div>
  );
}
