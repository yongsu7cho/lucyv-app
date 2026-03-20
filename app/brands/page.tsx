"use client";

import { useState } from "react";
import Header from "@/components/Header";
import {
  Plus,
  ChevronRight,
  Calendar,
  DollarSign,
  CheckSquare,
  Clock,
  AlertCircle,
  TrendingUp,
  FileText,
  Layers,
  X,
  BarChart2,
} from "lucide-react";

type Project = {
  id: number;
  brand: string;
  brandColor: string;
  brandBg: string;
  name: string;
  description: string;
  manager: string;
  startDate: string;
  endDate: string;
  budget: string;
  spent: string;
  progress: number;
  status: string;
  tasks: { title: string; done: boolean; assignee: string; due: string }[];
  tags: string[];
};

const projects: Project[] = [
  {
    id: 1,
    brand: "이너피움",
    brandColor: "#b76e79",
    brandBg: "rgba(183, 110, 121, 0.12)",
    name: "2026 봄 시즌 캠페인",
    description: "비타민C & 레티놀 라인 봄 시즌 인플루언서 마케팅 캠페인",
    manager: "김지은",
    startDate: "2026-02-15",
    endDate: "2026-04-30",
    budget: "2,500만원",
    spent: "980만원",
    progress: 42,
    status: "active",
    tasks: [
      { title: "인플루언서 계약 완료", done: true, assignee: "김지은", due: "2/28" },
      { title: "콘텐츠 기획서 승인", done: true, assignee: "박민서", due: "3/1" },
      { title: "1차 콘텐츠 촬영", done: false, assignee: "이수현", due: "3/10" },
      { title: "SNS 게시 및 모니터링", done: false, assignee: "최하은", due: "3/15" },
      { title: "캠페인 성과 보고서", done: false, assignee: "김지은", due: "4/30" },
    ],
    tags: ["SNS마케팅", "인플루언서", "봄캠페인"],
  },
  {
    id: 2,
    brand: "이너피움",
    brandColor: "#b76e79",
    brandBg: "rgba(183, 110, 121, 0.12)",
    name: "유튜버 협찬 프로그램",
    description: "뷰티 유튜버 대상 제품 협찬 및 리뷰 콘텐츠 제작 지원",
    manager: "이수현",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    budget: "4,800만원",
    spent: "1,200만원",
    progress: 25,
    status: "active",
    tasks: [
      { title: "협찬 대상 유튜버 선정", done: true, assignee: "이수현", due: "1/15" },
      { title: "제품 발송 (1차)", done: true, assignee: "최하은", due: "2/1" },
      { title: "리뷰 콘텐츠 모니터링", done: false, assignee: "박민서", due: "진행중" },
      { title: "2차 협찬 제품 선정", done: false, assignee: "이수현", due: "5/1" },
    ],
    tags: ["유튜브", "협찬", "연간계약"],
  },
  {
    id: 3,
    brand: "아쿠아크",
    brandColor: "#d4af37",
    brandBg: "rgba(212, 175, 55, 0.1)",
    name: "신제품 런칭 - 딥모이스처 크림",
    description: "딥모이스처 크림 시장 출시 및 초기 인지도 마케팅",
    manager: "박민서",
    startDate: "2026-02-01",
    endDate: "2026-03-31",
    budget: "1,800만원",
    spent: "1,540만원",
    progress: 86,
    status: "active",
    tasks: [
      { title: "제품 스펙 & 포지셔닝 확정", done: true, assignee: "박민서", due: "2/1" },
      { title: "런칭 이벤트 기획", done: true, assignee: "김지은", due: "2/10" },
      { title: "인스타그램 광고 집행", done: true, assignee: "최하은", due: "2/20" },
      { title: "공구 진행 (1차)", done: false, assignee: "이수현", due: "3/20" },
      { title: "런칭 성과 분석", done: false, assignee: "박민서", due: "3/31" },
    ],
    tags: ["신제품", "런칭", "광고"],
  },
  {
    id: 4,
    brand: "아쿠아크",
    brandColor: "#d4af37",
    brandBg: "rgba(212, 175, 55, 0.1)",
    name: "여름 시즌 선케어 캠페인",
    description: "선쿠션/선크림 제품군 여름 시즌 집중 마케팅",
    manager: "최하은",
    startDate: "2026-04-01",
    endDate: "2026-07-31",
    budget: "3,200만원",
    spent: "0원",
    progress: 0,
    status: "upcoming",
    tasks: [
      { title: "캠페인 기획서 작성", done: false, assignee: "최하은", due: "3/20" },
      { title: "인플루언서 풀 구성", done: false, assignee: "이수현", due: "3/25" },
      { title: "광고 소재 제작", done: false, assignee: "박민서", due: "4/10" },
    ],
    tags: ["여름", "선케어", "캠페인"],
  },
  {
    id: 5,
    brand: "문화콘텐츠",
    brandColor: "#4caf82",
    brandBg: "rgba(76, 175, 130, 0.1)",
    name: "K-뷰티 문화 콘텐츠 시리즈",
    description: "한국 뷰티 문화 소개 영상/글 콘텐츠 제작 및 배포",
    manager: "김지은",
    startDate: "2026-01-15",
    endDate: "2026-06-30",
    budget: "2,000만원",
    spent: "720만원",
    progress: 36,
    status: "active",
    tasks: [
      { title: "콘텐츠 주제 기획 (12편)", done: true, assignee: "김지은", due: "1/31" },
      { title: "1~3편 제작 완료", done: true, assignee: "박민서", due: "2/28" },
      { title: "4~6편 제작 진행", done: false, assignee: "이수현", due: "3/31" },
      { title: "SNS 배포 및 반응 분석", done: false, assignee: "최하은", due: "진행중" },
      { title: "7~12편 제작", done: false, assignee: "박민서", due: "6/30" },
    ],
    tags: ["문화콘텐츠", "K-뷰티", "시리즈"],
  },
  {
    id: 6,
    brand: "문화콘텐츠",
    brandColor: "#4caf82",
    brandBg: "rgba(76, 175, 130, 0.1)",
    name: "인플루언서 대담 프로그램",
    description: "탑 인플루언서와의 인터뷰 및 협업 콘텐츠 제작",
    manager: "이수현",
    startDate: "2026-03-01",
    endDate: "2026-05-31",
    budget: "1,500만원",
    spent: "0원",
    progress: 5,
    status: "active",
    tasks: [
      { title: "인터뷰 대상 섭외", done: false, assignee: "이수현", due: "3/15" },
      { title: "인터뷰 질문지 작성", done: false, assignee: "김지은", due: "3/20" },
      { title: "촬영 진행", done: false, assignee: "박민서", due: "4/1" },
    ],
    tags: ["인터뷰", "콜라보", "문화"],
  },
];

const statusStyle: Record<string, { color: string; bg: string; label: string }> = {
  active: { color: "#4caf82", bg: "rgba(76, 175, 130, 0.1)", label: "진행 중" },
  upcoming: { color: "#9b7dea", bg: "rgba(155, 125, 234, 0.1)", label: "예정" },
  completed: { color: "#d4a5a8", bg: "rgba(183, 110, 121, 0.1)", label: "완료" },
  paused: { color: "#e8a94a", bg: "rgba(232, 169, 74, 0.1)", label: "보류" },
};

const brands = ["전체", "이너피움", "아쿠아크", "문화콘텐츠"];

export default function BrandsPage() {
  const [selectedBrand, setSelectedBrand] = useState("전체");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showModal, setShowModal] = useState(false);

  const filtered = projects.filter(
    (p) => selectedBrand === "전체" || p.brand === selectedBrand
  );

  return (
    <div>
      <Header title="브랜드 프로젝트 관리" subtitle="이너피움 · 아쿠아크 · 문화콘텐츠 프로젝트 현황" />
      <div style={{ padding: "32px" }}>

        {/* Brand Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { name: "이너피움", color: "#b76e79", projects: 2, budget: "7,300만원", progress: 34 },
            { name: "아쿠아크", color: "#d4af37", projects: 2, budget: "5,000만원", progress: 43 },
            { name: "문화콘텐츠", color: "#4caf82", projects: 2, budget: "3,500만원", progress: 21 },
          ].map((brand) => (
            <div
              key={brand.name}
              className="luxury-card"
              style={{
                padding: 22,
                cursor: "pointer",
                borderColor: selectedBrand === brand.name ? `${brand.color}50` : "#2a2a2a",
                background: selectedBrand === brand.name ? `${brand.color}08` : undefined,
              }}
              onClick={() => setSelectedBrand(selectedBrand === brand.name ? "전체" : brand.name)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "3px 10px",
                      borderRadius: 6,
                      background: `${brand.color}18`,
                      border: `1px solid ${brand.color}30`,
                      color: brand.color,
                      fontSize: 12,
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    {brand.name}
                  </div>
                  <p style={{ fontSize: 11, color: "#8a8280" }}>진행 프로젝트 {brand.projects}개</p>
                </div>
                <BarChart2 size={22} color={brand.color} style={{ opacity: 0.6 }} />
              </div>
              <p style={{ fontSize: 22, fontWeight: 700, color: "#f5f0ee", marginBottom: 12 }}>
                {brand.budget}
              </p>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "#8a8280" }}>전체 진행률</span>
                  <span style={{ fontSize: 11, color: brand.color, fontWeight: 600 }}>{brand.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${brand.progress}%`, background: brand.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter & Action */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {brands.map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBrand(b)}
                style={{
                  padding: "7px 16px",
                  borderRadius: 8,
                  border: selectedBrand === b ? "1px solid rgba(183,110,121,0.3)" : "1px solid #2a2a2a",
                  background: selectedBrand === b ? "rgba(183,110,121,0.12)" : "transparent",
                  color: selectedBrand === b ? "#d4a5a8" : "#8a8280",
                  fontSize: 13,
                  fontWeight: selectedBrand === b ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {b}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            프로젝트 추가
          </button>
        </div>

        {/* Project Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {filtered.map((project) => {
            const status = statusStyle[project.status];
            const doneTasks = project.tasks.filter((t) => t.done).length;
            return (
              <div
                key={project.id}
                className="luxury-card"
                style={{ padding: 24, cursor: "pointer" }}
                onClick={() => setSelectedProject(project)}
              >
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "3px 10px",
                        borderRadius: 6,
                        background: project.brandBg,
                        color: project.brandColor,
                        fontWeight: 700,
                        border: `1px solid ${project.brandColor}30`,
                      }}
                    >
                      {project.brand}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
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
                  <ChevronRight size={16} color="#5a5250" />
                </div>

                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#f5f0ee", marginBottom: 4 }}>
                  {project.name}
                </h3>
                <p style={{ fontSize: 12, color: "#8a8280", marginBottom: 16, lineHeight: 1.5 }}>
                  {project.description}
                </p>

                {/* Meta */}
                <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Calendar size={12} color="#5a5250" />
                    <span style={{ fontSize: 11, color: "#8a8280" }}>
                      {project.startDate.slice(5)} ~ {project.endDate.slice(5)}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <DollarSign size={12} color="#5a5250" />
                    <span style={{ fontSize: 11, color: "#8a8280" }}>예산 {project.budget}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <CheckSquare size={12} color="#5a5250" />
                    <span style={{ fontSize: 11, color: "#8a8280" }}>
                      {doneTasks}/{project.tasks.length} 완료
                    </span>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: "#8a8280" }}>진행률</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: project.brandColor }}>
                      {project.progress}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${project.progress}%`, background: project.brandColor }}
                    />
                  </div>
                </div>

                {/* Tags */}
                <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: "#1f1f1f",
                        color: "#8a8280",
                        border: "1px solid #2a2a2a",
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Project Detail Drawer */}
        {selectedProject && (
          <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
            <div
              className="luxury-card"
              style={{
                width: 560,
                maxHeight: "85vh",
                overflowY: "auto",
                padding: 32,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "3px 10px",
                        borderRadius: 6,
                        background: selectedProject.brandBg,
                        color: selectedProject.brandColor,
                        fontWeight: 700,
                      }}
                    >
                      {selectedProject.brand}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: statusStyle[selectedProject.status].bg,
                        color: statusStyle[selectedProject.status].color,
                        fontWeight: 600,
                      }}
                    >
                      {statusStyle[selectedProject.status].label}
                    </span>
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f5f0ee" }}>
                    {selectedProject.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#8a8280" }}
                >
                  <X size={22} />
                </button>
              </div>

              <p style={{ fontSize: 13, color: "#c0b8b5", marginBottom: 20, lineHeight: 1.6 }}>
                {selectedProject.description}
              </p>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
                {[
                  { icon: DollarSign, label: "예산", value: selectedProject.budget, color: "#b76e79" },
                  { icon: TrendingUp, label: "집행", value: selectedProject.spent, color: "#d4af37" },
                  { icon: Layers, label: "진행률", value: `${selectedProject.progress}%`, color: "#4caf82" },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div
                      key={s.label}
                      style={{
                        padding: "12px 14px",
                        background: "#111111",
                        borderRadius: 10,
                        border: "1px solid #1f1f1f",
                      }}
                    >
                      <Icon size={14} color={s.color} style={{ marginBottom: 4 }} />
                      <p style={{ fontSize: 11, color: "#8a8280", marginBottom: 2 }}>{s.label}</p>
                      <p style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</p>
                    </div>
                  );
                })}
              </div>

              {/* Info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
                <div style={{ padding: "10px 14px", background: "#111111", borderRadius: 8, border: "1px solid #1f1f1f" }}>
                  <p style={{ fontSize: 11, color: "#8a8280", marginBottom: 2 }}>담당자</p>
                  <p style={{ fontSize: 14, color: "#f5f0ee", fontWeight: 600 }}>{selectedProject.manager}</p>
                </div>
                <div style={{ padding: "10px 14px", background: "#111111", borderRadius: 8, border: "1px solid #1f1f1f" }}>
                  <p style={{ fontSize: 11, color: "#8a8280", marginBottom: 2 }}>기간</p>
                  <p style={{ fontSize: 13, color: "#f5f0ee" }}>
                    {selectedProject.startDate} ~ {selectedProject.endDate}
                  </p>
                </div>
              </div>

              {/* Tasks */}
              <div>
                <h4
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#8a8280",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  Task 목록
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selectedProject.tasks.map((task, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 14px",
                        background: task.done ? "rgba(76, 175, 130, 0.05)" : "#111111",
                        borderRadius: 8,
                        border: task.done ? "1px solid rgba(76, 175, 130, 0.2)" : "1px solid #1f1f1f",
                      }}
                    >
                      {task.done ? (
                        <CheckSquare size={15} color="#4caf82" style={{ flexShrink: 0 }} />
                      ) : (
                        <Clock size={15} color="#5a5250" style={{ flexShrink: 0 }} />
                      )}
                      <span
                        style={{
                          flex: 1,
                          fontSize: 13,
                          color: task.done ? "#8a8280" : "#f5f0ee",
                          textDecoration: task.done ? "line-through" : "none",
                        }}
                      >
                        {task.title}
                      </span>
                      <span style={{ fontSize: 11, color: "#5a5250" }}>{task.assignee}</span>
                      <span style={{ fontSize: 11, color: "#5a5250" }}>{task.due}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div
              className="luxury-card"
              style={{ width: 480, padding: 32 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f5f0ee" }}>새 프로젝트 추가</h2>
                <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8a8280" }}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>브랜드</label>
                  <select className="luxury-input">
                    <option>이너피움</option>
                    <option>아쿠아크</option>
                    <option>문화콘텐츠</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>프로젝트명</label>
                  <input className="luxury-input" placeholder="프로젝트명 입력" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>설명</label>
                  <textarea
                    className="luxury-input"
                    style={{ height: 80, resize: "vertical" }}
                    placeholder="프로젝트 설명..."
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>시작일</label>
                    <input type="date" className="luxury-input" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>종료일</label>
                    <input type="date" className="luxury-input" />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>예산</label>
                  <input className="luxury-input" placeholder="예: 2000만원" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>담당자</label>
                  <select className="luxury-input">
                    <option>김지은</option>
                    <option>박민서</option>
                    <option>이수현</option>
                    <option>최하은</option>
                  </select>
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
