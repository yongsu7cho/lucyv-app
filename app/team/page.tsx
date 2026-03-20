"use client";

import { useState } from "react";
import Header from "@/components/Header";
import {
  Plus,
  Mail,
  Phone,
  Briefcase,
  Star,
  CheckCircle2,
  Clock,
  TrendingUp,
  X,
  Edit3,
  Users,
  BarChart2,
  Award,
} from "lucide-react";

type TeamMember = {
  id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  joinDate: string;
  status: "active" | "vacation" | "remote";
  level: string;
  projects: string[];
  tasks: { title: string; status: string; due: string }[];
  performance: { month: string; score: number }[];
  completedTasks: number;
  totalTasks: number;
  skills: string[];
  color: string;
};

const team: TeamMember[] = [
  {
    id: 1,
    name: "김지은",
    role: "마케팅 디렉터",
    email: "jieun@lucyv.kr",
    phone: "010-1234-5678",
    joinDate: "2023-03",
    status: "active",
    level: "Director",
    projects: ["이너피움 봄 캠페인", "문화콘텐츠 시리즈"],
    tasks: [
      { title: "이너피움 콘텐츠 검수", status: "pending", due: "3/5" },
      { title: "2월 성과 보고서 작성", status: "processing", due: "3/7" },
      { title: "신규 인플루언서 미팅", status: "done", due: "3/3" },
    ],
    performance: [
      { month: "11월", score: 88 },
      { month: "12월", score: 92 },
      { month: "1월", score: 95 },
      { month: "2월", score: 90 },
      { month: "3월", score: 87 },
    ],
    completedTasks: 24,
    totalTasks: 27,
    skills: ["마케팅전략", "브랜드관리", "인플루언서마케팅", "데이터분석"],
    color: "#b76e79",
  },
  {
    id: 2,
    name: "박민서",
    role: "콘텐츠 매니저",
    email: "minseo@lucyv.kr",
    phone: "010-2345-6789",
    joinDate: "2023-08",
    status: "active",
    level: "Manager",
    projects: ["아쿠아크 신제품 런칭", "K-뷰티 문화콘텐츠"],
    tasks: [
      { title: "아쿠아크 인스타 광고 세팅", status: "pending", due: "3/6" },
      { title: "SNS 콘텐츠 캘린더 제작", status: "done", due: "3/4" },
    ],
    performance: [
      { month: "11월", score: 85 },
      { month: "12월", score: 88 },
      { month: "1월", score: 91 },
      { month: "2월", score: 89 },
      { month: "3월", score: 92 },
    ],
    completedTasks: 18,
    totalTasks: 20,
    skills: ["SNS콘텐츠", "카피라이팅", "포토샵", "영상편집"],
    color: "#d4af37",
  },
  {
    id: 3,
    name: "이수현",
    role: "인플루언서 매니저",
    email: "suhyeon@lucyv.kr",
    phone: "010-3456-7890",
    joinDate: "2024-01",
    status: "remote",
    level: "Manager",
    projects: ["이너피움 유튜버 협찬", "인플루언서 대담 프로그램"],
    tasks: [
      { title: "3월 공구 인플루언서 섭외", status: "pending", due: "3/7" },
      { title: "@haneul_kbeauty 계약 갱신", status: "processing", due: "3/12" },
      { title: "공구 성과 분석", status: "done", due: "3/2" },
    ],
    performance: [
      { month: "11월", score: 82 },
      { month: "12월", score: 86 },
      { month: "1월", score: 84 },
      { month: "2월", score: 88 },
      { month: "3월", score: 85 },
    ],
    completedTasks: 15,
    totalTasks: 18,
    skills: ["인플루언서관리", "계약협상", "공구기획", "성과분석"],
    color: "#4caf82",
  },
  {
    id: 4,
    name: "최하은",
    role: "정산/운영 담당",
    email: "haeun@lucyv.kr",
    phone: "010-4567-8901",
    joinDate: "2024-05",
    status: "active",
    level: "Staff",
    projects: ["아쿠아크 선케어 캠페인", "정산 시스템"],
    tasks: [
      { title: "문화콘텐츠 계약서 검토", status: "pending", due: "3/8" },
      { title: "2월 정산 처리", status: "processing", due: "3/7" },
    ],
    performance: [
      { month: "11월", score: 78 },
      { month: "12월", score: 82 },
      { month: "1월", score: 85 },
      { month: "2월", score: 83 },
      { month: "3월", score: 86 },
    ],
    completedTasks: 12,
    totalTasks: 14,
    skills: ["정산관리", "계약검토", "데이터입력", "고객응대"],
    color: "#9b7dea",
  },
];

const statusStyle: Record<string, { color: string; bg: string; label: string }> = {
  active: { color: "#4caf82", bg: "rgba(76, 175, 130, 0.1)", label: "재직 중" },
  vacation: { color: "#e8a94a", bg: "rgba(232, 169, 74, 0.1)", label: "휴가 중" },
  remote: { color: "#9b7dea", bg: "rgba(155, 125, 234, 0.1)", label: "재택근무" },
};

const taskStatusStyle: Record<string, { color: string; label: string }> = {
  done: { color: "#4caf82", label: "완료" },
  processing: { color: "#9b7dea", label: "진행" },
  pending: { color: "#e8a94a", label: "대기" },
};

const levelBadge: Record<string, { color: string; bg: string }> = {
  Director: { color: "#d4af37", bg: "rgba(212, 175, 55, 0.12)" },
  Manager: { color: "#b76e79", bg: "rgba(183, 110, 121, 0.12)" },
  Staff: { color: "#c0b8b5", bg: "rgba(192, 184, 181, 0.1)" },
};

export default function TeamPage() {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <Header title="팀원 관리" subtitle="루씨브이에이전시 팀원 현황 및 업무 배분" />
      <div style={{ padding: "32px" }}>
        {/* Team Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { label: "전체 팀원", value: "4명", icon: Users, color: "#b76e79" },
            { label: "재직 중", value: "3명", icon: CheckCircle2, color: "#4caf82" },
            { label: "이번 달 완료 태스크", value: "69건", icon: TrendingUp, color: "#d4af37" },
            { label: "평균 성과 점수", value: "87.5점", icon: Award, color: "#9b7dea" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="luxury-card"
                style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `${s.color}18`,
                    border: `1px solid ${s.color}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} color={s.color} />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "#8a8280", marginBottom: 2 }}>{s.label}</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: "#f5f0ee" }}>{s.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            팀원 추가
          </button>
        </div>

        {/* Team Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, marginBottom: 28 }}>
          {team.map((member) => {
            const status = statusStyle[member.status];
            const level = levelBadge[member.level];
            const completionRate = Math.round((member.completedTasks / member.totalTasks) * 100);

            return (
              <div
                key={member.id}
                className="luxury-card"
                style={{ padding: 24, cursor: "pointer" }}
                onClick={() => setSelectedMember(member)}
              >
                {/* Member Header */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 18 }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background: `linear-gradient(135deg, ${member.color}, ${member.color}88)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      fontWeight: 800,
                      color: "#fff",
                      flexShrink: 0,
                      boxShadow: `0 4px 16px ${member.color}40`,
                    }}
                  >
                    {member.name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f5f0ee" }}>{member.name}</h3>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: level.bg,
                          color: level.color,
                          fontWeight: 700,
                          letterSpacing: "0.05em",
                        }}
                      >
                        {member.level}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: "#c0b8b5", marginBottom: 6 }}>{member.role}</p>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: status.bg,
                        color: status.color,
                        fontWeight: 600,
                      }}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 11, color: "#8a8280", marginBottom: 2 }}>합류일</p>
                    <p style={{ fontSize: 12, color: "#c0b8b5" }}>{member.joinDate}</p>
                  </div>
                </div>

                {/* Contact */}
                <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Mail size={12} color="#5a5250" />
                    <span style={{ fontSize: 11, color: "#8a8280" }}>{member.email}</span>
                  </div>
                </div>

                {/* Task Progress */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "#8a8280" }}>이달 태스크 완료율</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: member.color }}>{completionRate}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${completionRate}%`, background: member.color }} />
                  </div>
                  <p style={{ fontSize: 11, color: "#5a5250", marginTop: 4 }}>
                    {member.completedTasks}개 완료 / {member.totalTasks}개 배정
                  </p>
                </div>

                {/* Active Projects */}
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 11, color: "#8a8280", marginBottom: 6 }}>담당 프로젝트</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {member.projects.map((proj) => (
                      <span
                        key={proj}
                        style={{
                          fontSize: 10,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: `${member.color}12`,
                          color: member.color,
                          border: `1px solid ${member.color}25`,
                        }}
                      >
                        {proj}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tasks Preview */}
                <div>
                  {member.tasks.slice(0, 2).map((task, i) => {
                    const ts = taskStatusStyle[task.status];
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "7px 0",
                          borderTop: "1px solid #1a1a1a",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            padding: "1px 6px",
                            borderRadius: 3,
                            background: `${ts.color}15`,
                            color: ts.color,
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          {ts.label}
                        </span>
                        <span style={{ fontSize: 12, color: "#c0b8b5", flex: 1 }}>{task.title}</span>
                        <span style={{ fontSize: 11, color: "#5a5250" }}>{task.due}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Performance Comparison */}
        <div className="luxury-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#f5f0ee", marginBottom: 20 }}>
            팀원별 성과 비교 (최근 5개월)
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            {team.map((member) => {
              const latest = member.performance[member.performance.length - 1].score;
              const prev = member.performance[member.performance.length - 2].score;
              const diff = latest - prev;

              return (
                <div key={member.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: `${member.color}20`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        color: member.color,
                      }}
                    >
                      {member.name[0]}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#f5f0ee" }}>{member.name}</p>
                      <p style={{ fontSize: 10, color: "#8a8280" }}>{member.role}</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: "#8a8280" }}>이달 점수</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: member.color }}>{latest}</span>
                      <span style={{ fontSize: 11, color: diff >= 0 ? "#4caf82" : "#e05a6b" }}>
                        {diff >= 0 ? `+${diff}` : diff}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 50 }}>
                    {member.performance.map((p, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: `${(p.score / 100) * 50}px`,
                          background: i === member.performance.length - 1 ? member.color : `${member.color}40`,
                          borderRadius: "3px 3px 0 0",
                          transition: "height 0.3s ease",
                        }}
                        title={`${p.month}: ${p.score}점`}
                      />
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
                    {member.performance.map((p) => (
                      <div key={p.month} style={{ flex: 1, textAlign: "center", fontSize: 9, color: "#5a5250" }}>
                        {p.month.replace("월", "")}
                      </div>
                    ))}
                  </div>

                  {/* Skills */}
                  <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {member.skills.slice(0, 2).map((skill) => (
                      <span
                        key={skill}
                        style={{
                          fontSize: 9,
                          padding: "1px 6px",
                          borderRadius: 3,
                          background: "#1f1f1f",
                          color: "#8a8280",
                          border: "1px solid #2a2a2a",
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Member Detail Modal */}
        {selectedMember && (
          <div className="modal-overlay" onClick={() => setSelectedMember(null)}>
            <div
              className="luxury-card"
              style={{ width: 520, maxHeight: "85vh", overflowY: "auto", padding: 32 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 16,
                      background: `linear-gradient(135deg, ${selectedMember.color}, ${selectedMember.color}88)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                      fontWeight: 800,
                      color: "#fff",
                      boxShadow: `0 4px 20px ${selectedMember.color}40`,
                    }}
                  >
                    {selectedMember.name[0]}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f5f0ee", marginBottom: 2 }}>
                      {selectedMember.name}
                    </h2>
                    <p style={{ fontSize: 13, color: "#c0b8b5" }}>{selectedMember.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMember(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#8a8280" }}
                >
                  <X size={22} />
                </button>
              </div>

              {/* Contact Info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                {[
                  { icon: Mail, label: "이메일", value: selectedMember.email },
                  { icon: Phone, label: "전화", value: selectedMember.phone },
                  { icon: Briefcase, label: "합류일", value: selectedMember.joinDate },
                  { icon: Star, label: "레벨", value: selectedMember.level },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      style={{ padding: "10px 14px", background: "#111111", borderRadius: 8, border: "1px solid #1f1f1f" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <Icon size={12} color="#8a8280" />
                        <span style={{ fontSize: 10, color: "#8a8280" }}>{item.label}</span>
                      </div>
                      <p style={{ fontSize: 13, color: "#f5f0ee" }}>{item.value}</p>
                    </div>
                  );
                })}
              </div>

              {/* All Tasks */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: "#8a8280", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                  현재 태스크
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selectedMember.tasks.map((task, i) => {
                    const ts = taskStatusStyle[task.status];
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 12px",
                          background: "#111111",
                          borderRadius: 8,
                          border: "1px solid #1f1f1f",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 7px",
                            borderRadius: 4,
                            background: `${ts.color}15`,
                            color: ts.color,
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          {ts.label}
                        </span>
                        <span style={{ flex: 1, fontSize: 13, color: "#f5f0ee" }}>{task.title}</span>
                        <span style={{ fontSize: 11, color: "#5a5250" }}>{task.due}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Skills */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: "#8a8280", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                  스킬
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {selectedMember.skills.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        fontSize: 12,
                        padding: "5px 12px",
                        borderRadius: 6,
                        background: `${selectedMember.color}12`,
                        color: selectedMember.color,
                        border: `1px solid ${selectedMember.color}25`,
                        fontWeight: 500,
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Performance Chart */}
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: "#8a8280", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                  성과 추이
                </h4>
                <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 80, padding: "0 4px" }}>
                  {selectedMember.performance.map((p, i) => {
                    const isLast = i === selectedMember.performance.length - 1;
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 10, color: isLast ? selectedMember.color : "#8a8280", fontWeight: isLast ? 700 : 400 }}>
                          {p.score}
                        </span>
                        <div
                          style={{
                            width: "100%",
                            height: `${(p.score / 100) * 60}px`,
                            background: isLast ? selectedMember.color : `${selectedMember.color}35`,
                            borderRadius: "4px 4px 0 0",
                          }}
                        />
                        <span style={{ fontSize: 10, color: "#5a5250" }}>{p.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div
              className="luxury-card"
              style={{ width: 440, padding: 32 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f5f0ee" }}>팀원 추가</h2>
                <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8a8280" }}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>이름</label>
                    <input className="luxury-input" placeholder="이름 입력" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>직함</label>
                    <input className="luxury-input" placeholder="직함 입력" />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>레벨</label>
                  <select className="luxury-input">
                    <option>Director</option>
                    <option>Manager</option>
                    <option>Staff</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>이메일</label>
                  <input className="luxury-input" type="email" placeholder="example@lucyv.kr" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>연락처</label>
                  <input className="luxury-input" placeholder="010-0000-0000" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>합류일</label>
                  <input type="month" className="luxury-input" />
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>취소</button>
                  <button className="btn-primary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>저장하기</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
