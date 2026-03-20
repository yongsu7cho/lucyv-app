"use client";

import Header from "@/components/Header";
import {
  TrendingUp,
  Users,
  Briefcase,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Star,
  Package,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const revenueData = [
  { month: "10월", revenue: 32000000, target: 35000000 },
  { month: "11월", revenue: 41000000, target: 40000000 },
  { month: "12월", revenue: 38000000, target: 42000000 },
  { month: "1월", revenue: 52000000, target: 45000000 },
  { month: "2월", revenue: 48000000, target: 48000000 },
  { month: "3월", revenue: 61000000, target: 55000000 },
];

const brandData = [
  { name: "이너피움", value: 45, color: "#b76e79" },
  { name: "아쿠아크", value: 32, color: "#d4af37" },
  { name: "문화콘텐츠", value: 23, color: "#4caf82" },
];

const statCards = [
  {
    title: "이번 달 매출",
    value: "6,100만원",
    change: "+12.3%",
    positive: true,
    icon: DollarSign,
    color: "#b76e79",
  },
  {
    title: "활성 인플루언서",
    value: "24명",
    change: "+3명",
    positive: true,
    icon: Users,
    color: "#d4af37",
  },
  {
    title: "진행 중 프로젝트",
    value: "8개",
    change: "-1개",
    positive: false,
    icon: Briefcase,
    color: "#4caf82",
  },
  {
    title: "이번 달 공구",
    value: "12건",
    change: "+4건",
    positive: true,
    icon: Package,
    color: "#9b7dea",
  },
];

const recentActivities = [
  {
    type: "공구",
    content: "이너피움 비타민C 세럼 공구 마감",
    time: "2시간 전",
    status: "completed",
    icon: CheckCircle2,
  },
  {
    type: "정산",
    content: "아쿠아크 2월 정산 처리 필요",
    time: "4시간 전",
    status: "pending",
    icon: AlertCircle,
  },
  {
    type: "캘린더",
    content: "브랜드 미팅 - 이너피움 신제품 기획",
    time: "내일 오전 10시",
    status: "upcoming",
    icon: Calendar,
  },
  {
    type: "인플루언서",
    content: "새 인플루언서 @luxury_daily 계약 검토",
    time: "어제",
    status: "pending",
    icon: Star,
  },
  {
    type: "프로젝트",
    content: "문화콘텐츠 4월 콘텐츠 기획 시작",
    time: "오늘",
    status: "active",
    icon: TrendingUp,
  },
];

const upcomingTasks = [
  { task: "이너피움 콘텐츠 검수", date: "3/5", assignee: "김지은", priority: "high" },
  { task: "아쿠아크 인스타 광고 세팅", date: "3/6", assignee: "박민서", priority: "medium" },
  { task: "3월 공구 인플루언서 섭외", date: "3/7", assignee: "이수현", priority: "high" },
  { task: "문화콘텐츠 계약서 검토", date: "3/8", assignee: "최하은", priority: "low" },
  { task: "2월 매출 정산 완료", date: "3/10", assignee: "김지은", priority: "high" },
];

const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
  completed: { bg: "rgba(76, 175, 130, 0.1)", color: "#4caf82", label: "완료" },
  pending: { bg: "rgba(232, 169, 74, 0.1)", color: "#e8a94a", label: "대기" },
  upcoming: { bg: "rgba(183, 110, 121, 0.1)", color: "#d4a5a8", label: "예정" },
  active: { bg: "rgba(155, 125, 234, 0.1)", color: "#9b7dea", label: "진행" },
};

const priorityStyle: Record<string, { color: string; label: string }> = {
  high: { color: "#e05a6b", label: "높음" },
  medium: { color: "#e8a94a", label: "중간" },
  low: { color: "#4caf82", label: "낮음" },
};

export default function Dashboard() {
  return (
    <div>
      <Header title="대시보드" subtitle="루씨브이에이전시 업무 현황 한눈에 보기" />
      <div style={{ padding: "32px" }}>
        {/* Stat Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 20,
            marginBottom: 28,
          }}
        >
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="luxury-card"
                style={{ padding: 24, position: "relative", overflow: "hidden" }}
              >
                <div className="stat-accent" />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <p style={{ fontSize: 12, color: "#8a8280", letterSpacing: "0.05em", marginBottom: 4 }}>{card.title}</p>
                    <p style={{ fontSize: 26, fontWeight: 700, color: "#f5f0ee", letterSpacing: "-0.02em" }}>{card.value}</p>
                  </div>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: `${card.color}18`,
                      border: `1px solid ${card.color}30`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={20} color={card.color} />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {card.positive ? <ArrowUpRight size={14} color="#4caf82" /> : <ArrowDownRight size={14} color="#e05a6b" />}
                  <span style={{ fontSize: 13, color: card.positive ? "#4caf82" : "#e05a6b", fontWeight: 600 }}>{card.change}</span>
                  <span style={{ fontSize: 12, color: "#5a5250" }}>vs 지난달</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 28 }}>
          {/* Revenue Chart */}
          <div className="luxury-card" style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#f5f0ee", marginBottom: 2 }}>월별 매출 현황</h3>
                <p style={{ fontSize: 12, color: "#8a8280" }}>최근 6개월</p>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                {[{ color: "#b76e79", label: "실적" }, { color: "#d4af37", label: "목표" }].map((l) => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.color }} />
                    <span style={{ fontSize: 12, color: "#8a8280" }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b76e79" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#b76e79" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                <XAxis dataKey="month" tick={{ fill: "#8a8280", fontSize: 12 }} axisLine={{ stroke: "#2a2a2a" }} tickLine={false} />
                <YAxis tick={{ fill: "#8a8280", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 10000000).toFixed(0)}천만`} />
                <Tooltip
                  contentStyle={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#f5f0ee", fontSize: 13 }}
                  formatter={(value: number | string | undefined) => [`${(Number(value ?? 0) / 10000000).toFixed(1)}천만원`]}
                />
                <Area type="monotone" dataKey="target" stroke="#d4af37" strokeWidth={1.5} strokeDasharray="4 4" fill="url(#targetGrad)" />
                <Area type="monotone" dataKey="revenue" stroke="#b76e79" strokeWidth={2} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Brand Distribution */}
          <div className="luxury-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#f5f0ee", marginBottom: 4 }}>브랜드별 매출 비중</h3>
            <p style={{ fontSize: 12, color: "#8a8280", marginBottom: 24 }}>이번 달 기준</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {brandData.map((b) => (
                <div key={b.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 14, color: "#c0b8b5" }}>{b.name}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: b.color }}>{b.value}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${b.value}%`, background: b.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 24,
                padding: "14px 16px",
                background: "rgba(183, 110, 121, 0.06)",
                border: "1px solid rgba(183, 110, 121, 0.15)",
                borderRadius: 10,
              }}
            >
              <p style={{ fontSize: 11, color: "#8a8280", marginBottom: 2 }}>총 브랜드 매출</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: "#f5f0ee" }}>6,100만원</p>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Recent Activities */}
          <div className="luxury-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#f5f0ee", marginBottom: 20 }}>최근 활동</h3>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {recentActivities.map((activity, i) => {
                const st = statusStyle[activity.status];
                const Icon = activity.icon;
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: "12px 0",
                      borderBottom: i < recentActivities.length - 1 ? "1px solid #1a1a1a" : "none",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: st.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={15} color={st.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, color: "#f5f0ee", marginBottom: 3 }}>{activity.content}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: st.bg, color: st.color, fontWeight: 600 }}>
                          {st.label}
                        </span>
                        <span style={{ fontSize: 11, color: "#5a5250" }}>{activity.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="luxury-card" style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#f5f0ee" }}>이번 주 할 일</h3>
              <span style={{ fontSize: 12, color: "#b76e79", cursor: "pointer" }}>전체 보기</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {upcomingTasks.map((task, i) => {
                const pr = priorityStyle[task.priority];
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 12px",
                      background: "#111111",
                      borderRadius: 10,
                      border: "1px solid #1f1f1f",
                    }}
                  >
                    <Clock size={14} color="#5a5250" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, color: "#f5f0ee", marginBottom: 1 }}>{task.task}</p>
                      <p style={{ fontSize: 11, color: "#8a8280" }}>{task.assignee} · {task.date}</p>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 7px",
                        borderRadius: 4,
                        background: `${pr.color}18`,
                        color: pr.color,
                        border: `1px solid ${pr.color}30`,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {pr.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
