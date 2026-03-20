"use client";

import { useState } from "react";
import Header from "@/components/Header";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  X,
  ExternalLink,
} from "lucide-react";

type CalEvent = {
  id: number;
  title: string;
  date: string;
  time: string;
  type: string;
  location?: string;
  attendees?: string[];
  color: string;
  calendar: "company" | "google";
  description?: string;
};

const events: CalEvent[] = [
  {
    id: 1,
    title: "이너피움 브랜드 미팅",
    date: "2026-03-05",
    time: "10:00",
    type: "미팅",
    location: "강남 이너피움 본사",
    attendees: ["김지은", "박민서"],
    color: "#b76e79",
    calendar: "company",
    description: "봄 시즌 캠페인 방향성 협의 및 신제품 라인업 논의",
  },
  {
    id: 2,
    title: "아쿠아크 공구 마감",
    date: "2026-03-10",
    time: "23:59",
    type: "마감",
    color: "#d4af37",
    calendar: "company",
    description: "딥모이스처 크림 1차 공구 마감일",
  },
  {
    id: 3,
    title: "인플루언서 계약 갱신",
    date: "2026-03-12",
    time: "14:00",
    type: "계약",
    location: "루씨브이 사무실",
    attendees: ["이수현", "최다은"],
    color: "#9b7dea",
    calendar: "company",
    description: "@luxury_daily 계약 갱신 미팅",
  },
  {
    id: 4,
    title: "팀 주간 회의",
    date: "2026-03-06",
    time: "09:30",
    type: "내부",
    attendees: ["김지은", "박민서", "이수현", "최하은"],
    color: "#4caf82",
    calendar: "company",
  },
  {
    id: 5,
    title: "문화콘텐츠 촬영",
    date: "2026-03-15",
    time: "11:00",
    type: "촬영",
    location: "성수 스튜디오",
    attendees: ["박민서", "이수현"],
    color: "#4caf82",
    calendar: "company",
    description: "K-뷰티 시리즈 4편 촬영",
  },
  {
    id: 6,
    title: "2월 정산 처리",
    date: "2026-03-07",
    time: "15:00",
    type: "정산",
    color: "#d4af37",
    calendar: "company",
    description: "2월 인플루언서 공구 정산 처리",
  },
  {
    id: 7,
    title: "Google Meet: 이너피움 팀",
    date: "2026-03-05",
    time: "15:00",
    type: "화상",
    color: "#4285f4",
    calendar: "google",
    description: "Google Calendar에서 가져온 화상 미팅",
  },
  {
    id: 8,
    title: "아쿠아크 광고 검토",
    date: "2026-03-11",
    time: "11:00",
    type: "검토",
    color: "#4285f4",
    calendar: "google",
  },
  {
    id: 9,
    title: "팀 런치 미팅",
    date: "2026-03-13",
    time: "12:30",
    type: "내부",
    color: "#0f9d58",
    calendar: "google",
  },
  {
    id: 10,
    title: "이너피움 콘텐츠 마감",
    date: "2026-03-18",
    time: "18:00",
    type: "마감",
    color: "#b76e79",
    calendar: "company",
  },
  {
    id: 11,
    title: "팀 주간 회의",
    date: "2026-03-13",
    time: "09:30",
    type: "내부",
    color: "#4caf82",
    calendar: "company",
  },
  {
    id: 12,
    title: "아쿠아크 신제품 PT",
    date: "2026-03-19",
    time: "14:00",
    type: "미팅",
    color: "#d4af37",
    calendar: "company",
    location: "아쿠아크 본사",
  },
];

const typeStyle: Record<string, string> = {
  미팅: "#b76e79",
  마감: "#e05a6b",
  계약: "#9b7dea",
  내부: "#4caf82",
  촬영: "#e8a94a",
  정산: "#d4af37",
  화상: "#4285f4",
  검토: "#4285f4",
};

const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 4));
  const [activeCalendar, setActiveCalendar] = useState<"all" | "company" | "google">("all");
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const filteredEvents = events.filter(
    (e) => activeCalendar === "all" || e.calendar === activeCalendar
  );

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return filteredEvents.filter((e) => e.date === dateStr);
  };

  const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

  // Upcoming events (sorted)
  const upcomingEvents = filteredEvents
    .filter((e) => e.date >= `${year}-${String(month + 1).padStart(2, "0")}-04`)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 8);

  return (
    <div>
      <Header title="캘린더" subtitle="회사 일정 및 Google Calendar 통합 관리" />
      <div style={{ padding: "32px" }}>
        {/* Calendar Toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { key: "all", label: "전체", color: "#f5f0ee" },
              { key: "company", label: "회사 캘린더", color: "#b76e79" },
              { key: "google", label: "Google 캘린더", color: "#4285f4" },
            ].map((cal) => (
              <button
                key={cal.key}
                onClick={() => setActiveCalendar(cal.key as typeof activeCalendar)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: activeCalendar === cal.key ? `1px solid ${cal.color}40` : "1px solid #2a2a2a",
                  background: activeCalendar === cal.key ? `${cal.color}12` : "transparent",
                  color: activeCalendar === cal.key ? cal.color : "#8a8280",
                  fontSize: 13,
                  fontWeight: activeCalendar === cal.key ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: cal.color, flexShrink: 0 }} />
                {cal.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid #4285f420",
                background: "rgba(66, 133, 244, 0.06)",
                color: "#4285f4",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <ExternalLink size={13} />
              Google 연동
            </button>
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              일정 추가
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
          {/* Calendar Grid */}
          <div className="luxury-card" style={{ padding: 0, overflow: "hidden" }}>
            {/* Month Nav */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 24px",
                borderBottom: "1px solid #1f1f1f",
              }}
            >
              <button
                onClick={prevMonth}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "1px solid #2a2a2a",
                  background: "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#8a8280",
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#f5f0ee",
                  letterSpacing: "-0.02em",
                }}
              >
                {year}년 {monthNames[month]}
              </h2>
              <button
                onClick={nextMonth}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "1px solid #2a2a2a",
                  background: "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#8a8280",
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #1a1a1a" }}>
              {daysOfWeek.map((d, i) => (
                <div
                  key={d}
                  style={{
                    padding: "10px 0",
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: 600,
                    color: i === 0 ? "#e05a6b" : i === 6 ? "#4285f4" : "#5a5250",
                    letterSpacing: "0.05em",
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
              {/* Empty cells */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  style={{
                    minHeight: 100,
                    borderRight: "1px solid #1a1a1a",
                    borderBottom: "1px solid #1a1a1a",
                    background: "#0d0d0d",
                  }}
                />
              ))}

              {/* Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayEvents = getEventsForDay(day);
                const isToday = day === 4 && month === 2 && year === 2026;
                const dayOfWeek = (firstDay + i) % 7;

                return (
                  <div
                    key={day}
                    style={{
                      minHeight: 100,
                      padding: "8px 6px",
                      borderRight: "1px solid #1a1a1a",
                      borderBottom: "1px solid #1a1a1a",
                      background: isToday ? "rgba(183, 110, 121, 0.05)" : "transparent",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        width: 26,
                        height: 26,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                        fontSize: 13,
                        fontWeight: isToday ? 700 : 400,
                        color: isToday
                          ? "#fff"
                          : dayOfWeek === 0
                          ? "#e05a6b"
                          : dayOfWeek === 6
                          ? "#4285f4"
                          : "#c0b8b5",
                        background: isToday
                          ? "linear-gradient(135deg, #b76e79, #d4af37)"
                          : "transparent",
                        marginBottom: 4,
                      }}
                    >
                      {day}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {dayEvents.slice(0, 3).map((ev) => (
                        <button
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          style={{
                            display: "block",
                            width: "100%",
                            textAlign: "left",
                            padding: "2px 5px",
                            borderRadius: 3,
                            background: `${ev.color}20`,
                            border: `1px solid ${ev.color}30`,
                            borderLeft: `3px solid ${ev.color}`,
                            color: ev.color,
                            fontSize: 10,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            fontWeight: 500,
                          }}
                        >
                          {ev.time} {ev.title}
                        </button>
                      ))}
                      {dayEvents.length > 3 && (
                        <span style={{ fontSize: 10, color: "#5a5250", paddingLeft: 4 }}>
                          +{dayEvents.length - 3}개 더
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar: Upcoming Events */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Legend */}
            <div className="luxury-card" style={{ padding: 18 }}>
              <h4 style={{ fontSize: 12, fontWeight: 600, color: "#8a8280", letterSpacing: "0.08em", marginBottom: 12 }}>
                캘린더 유형
              </h4>
              {[
                { label: "회사 캘린더", color: "#b76e79" },
                { label: "Google 캘린더", color: "#4285f4" },
              ].map((l) => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.color }} />
                  <span style={{ fontSize: 13, color: "#c0b8b5" }}>{l.label}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #1f1f1f", marginTop: 12, paddingTop: 12 }}>
                <h4 style={{ fontSize: 12, fontWeight: 600, color: "#8a8280", letterSpacing: "0.08em", marginBottom: 10 }}>
                  일정 유형
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {Object.entries(typeStyle).map(([type, color]) => (
                    <span
                      key={type}
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: `${color}15`,
                        color: color,
                        border: `1px solid ${color}25`,
                        fontWeight: 600,
                      }}
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Upcoming */}
            <div className="luxury-card" style={{ padding: 18 }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: "#f5f0ee", marginBottom: 14 }}>
                다가오는 일정
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {upcomingEvents.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 12px",
                      background: "#111111",
                      border: `1px solid #1f1f1f`,
                      borderLeft: `3px solid ${ev.color}`,
                      borderRadius: "0 8px 8px 0",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "#1a1a1a";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "#111111";
                    }}
                  >
                    <p style={{ fontSize: 13, color: "#f5f0ee", marginBottom: 3, fontWeight: 500 }}>
                      {ev.title}
                    </p>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "1px 6px",
                          borderRadius: 3,
                          background: `${ev.color}15`,
                          color: ev.color,
                          fontWeight: 600,
                        }}
                      >
                        {ev.calendar === "google" ? "구글" : "회사"}
                      </span>
                      <span style={{ fontSize: 11, color: "#8a8280" }}>
                        {ev.date.slice(5).replace("-", "/")} {ev.time}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Event Detail Modal */}
        {selectedEvent && (
          <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
            <div
              className="luxury-card"
              style={{ width: 420, padding: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: `${selectedEvent.color}18`,
                        color: selectedEvent.color,
                        fontWeight: 600,
                      }}
                    >
                      {selectedEvent.type}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: selectedEvent.calendar === "google" ? "rgba(66,133,244,0.1)" : "rgba(183,110,121,0.1)",
                        color: selectedEvent.calendar === "google" ? "#4285f4" : "#b76e79",
                        fontWeight: 600,
                      }}
                    >
                      {selectedEvent.calendar === "google" ? "Google" : "회사"}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#f5f0ee" }}>
                    {selectedEvent.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#8a8280" }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#111111", borderRadius: 8 }}>
                  <CalendarIcon size={14} color="#8a8280" />
                  <span style={{ fontSize: 13, color: "#c0b8b5" }}>
                    {selectedEvent.date.replace(/-/g, ".")} ({selectedEvent.time})
                  </span>
                </div>
                {selectedEvent.location && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#111111", borderRadius: 8 }}>
                    <MapPin size={14} color="#8a8280" />
                    <span style={{ fontSize: 13, color: "#c0b8b5" }}>{selectedEvent.location}</span>
                  </div>
                )}
                {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#111111", borderRadius: 8 }}>
                    <Users size={14} color="#8a8280" />
                    <span style={{ fontSize: 13, color: "#c0b8b5" }}>{selectedEvent.attendees.join(", ")}</span>
                  </div>
                )}
                {selectedEvent.description && (
                  <div style={{ padding: "10px 12px", background: "#111111", borderRadius: 8 }}>
                    <p style={{ fontSize: 13, color: "#c0b8b5", lineHeight: 1.6 }}>
                      {selectedEvent.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div
              className="luxury-card"
              style={{ width: 440, padding: 32 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f5f0ee" }}>일정 추가</h2>
                <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8a8280" }}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>일정 제목</label>
                  <input className="luxury-input" placeholder="일정 제목 입력" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>캘린더</label>
                  <select className="luxury-input">
                    <option value="company">회사 캘린더</option>
                    <option value="google">Google 캘린더</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>유형</label>
                  <select className="luxury-input">
                    {Object.keys(typeStyle).map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>날짜</label>
                    <input type="date" className="luxury-input" defaultValue="2026-03-04" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>시간</label>
                    <input type="time" className="luxury-input" />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>장소 (선택)</label>
                  <input className="luxury-input" placeholder="장소 입력" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>설명 (선택)</label>
                  <textarea className="luxury-input" style={{ height: 70, resize: "vertical" }} placeholder="일정 설명..." />
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>취소</button>
                  <button className="btn-primary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>저장하기</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
