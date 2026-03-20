"use client";

import { useState } from "react";
import Header from "@/components/Header";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Filter,
  ChevronDown,
  Plus,
  X,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

const monthlyRevenue = [
  { month: "9월", revenue: 28000000, commission: 8400000, target: 30000000 },
  { month: "10월", revenue: 32000000, commission: 9600000, target: 35000000 },
  { month: "11월", revenue: 41000000, commission: 12300000, target: 40000000 },
  { month: "12월", revenue: 38000000, commission: 11400000, target: 42000000 },
  { month: "1월", revenue: 52000000, commission: 15600000, target: 45000000 },
  { month: "2월", revenue: 48000000, commission: 14400000, target: 48000000 },
  { month: "3월", revenue: 61000000, commission: 18300000, target: 55000000 },
];

const brandRevenue = [
  { brand: "이너피움", revenue: 27450000, share: 45, color: "#b76e79" },
  { brand: "아쿠아크", revenue: 19520000, share: 32, color: "#d4af37" },
  { brand: "문화콘텐츠", revenue: 14030000, share: 23, color: "#4caf82" },
];

type Settlement = {
  id: number;
  influencer: string;
  handle: string;
  brand: string;
  product: string;
  period: string;
  totalSales: string;
  commission: string;
  rate: string;
  status: string;
  dueDate: string;
  paidDate?: string;
};

const settlements: Settlement[] = [
  {
    id: 1,
    influencer: "이하늘",
    handle: "@haneul_kbeauty",
    brand: "이너피움",
    product: "비타민C 세럼 공구",
    period: "2026-02",
    totalSales: "3,296만원",
    commission: "659만원",
    rate: "20%",
    status: "pending",
    dueDate: "2026-03-15",
  },
  {
    id: 2,
    influencer: "강민지",
    handle: "@minji_daily",
    brand: "아쿠아크",
    product: "딥모이스처 크림",
    period: "2026-02",
    totalSales: "1,840만원",
    commission: "368만원",
    rate: "20%",
    status: "paid",
    dueDate: "2026-03-10",
    paidDate: "2026-03-08",
  },
  {
    id: 3,
    influencer: "정유나",
    handle: "@yuna_wellness",
    brand: "이너피움",
    product: "레티놀 앰플 세트",
    period: "2026-02",
    totalSales: "2,184만원",
    commission: "437만원",
    rate: "20%",
    status: "paid",
    dueDate: "2026-03-10",
    paidDate: "2026-03-07",
  },
  {
    id: 4,
    influencer: "김미라",
    handle: "@mira_beauty",
    brand: "이너피움",
    product: "봄 시즌 캠페인",
    period: "2026-03",
    totalSales: "980만원",
    commission: "196만원",
    rate: "20%",
    status: "processing",
    dueDate: "2026-04-10",
  },
  {
    id: 5,
    influencer: "박수진",
    handle: "@sujin_life",
    brand: "아쿠아크",
    product: "선쿠션 공구",
    period: "2026-03",
    totalSales: "1,120만원",
    commission: "224만원",
    rate: "20%",
    status: "pending",
    dueDate: "2026-04-10",
  },
  {
    id: 6,
    influencer: "이하늘",
    handle: "@haneul_kbeauty",
    brand: "문화콘텐츠",
    product: "K-뷰티 영상 제작",
    period: "2026-02",
    totalSales: "720만원",
    commission: "144만원",
    rate: "20%",
    status: "overdue",
    dueDate: "2026-03-05",
  },
];

const statusStyle: Record<string, { color: string; bg: string; label: string; icon: React.ElementType }> = {
  paid: { color: "#4caf82", bg: "rgba(76, 175, 130, 0.1)", label: "정산 완료", icon: CheckCircle2 },
  pending: { color: "#e8a94a", bg: "rgba(232, 169, 74, 0.1)", label: "정산 대기", icon: Clock },
  processing: { color: "#9b7dea", bg: "rgba(155, 125, 234, 0.1)", label: "처리 중", icon: TrendingUp },
  overdue: { color: "#e05a6b", bg: "rgba(224, 90, 107, 0.1)", label: "기한 초과", icon: AlertCircle },
};

export default function RevenuePage() {
  const [activeTab, setActiveTab] = useState<"overview" | "settlement">("overview");
  const [filterStatus, setFilterStatus] = useState("전체");
  const [showModal, setShowModal] = useState(false);

  const filteredSettlements = settlements.filter(
    (s) =>
      filterStatus === "전체" ||
      (filterStatus === "완료" && s.status === "paid") ||
      (filterStatus === "대기" && s.status === "pending") ||
      (filterStatus === "처리중" && s.status === "processing") ||
      (filterStatus === "초과" && s.status === "overdue")
  );

  return (
    <div>
      <Header title="정산 / 매출 트래킹" subtitle="브랜드별 매출 현황 및 인플루언서 정산 관리" />
      <div style={{ padding: "32px" }}>
        {/* KPI Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
          {[
            {
              label: "이달 총 매출",
              value: "6,100만원",
              sub: "+12.3% vs 2월",
              positive: true,
              color: "#b76e79",
              icon: DollarSign,
            },
            {
              label: "이달 수수료",
              value: "1,830만원",
              sub: "평균 30%",
              positive: true,
              color: "#d4af37",
              icon: TrendingUp,
            },
            {
              label: "정산 대기",
              value: "2건",
              sub: "1,196만원",
              positive: false,
              color: "#e8a94a",
              icon: Clock,
            },
            {
              label: "기한 초과",
              value: "1건",
              sub: "144만원",
              positive: false,
              color: "#e05a6b",
              icon: AlertCircle,
            },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="luxury-card"
                style={{ padding: 20, position: "relative", overflow: "hidden" }}
              >
                <div className="stat-accent" />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <p style={{ fontSize: 12, color: "#8a8280" }}>{kpi.label}</p>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: `${kpi.color}18`,
                      border: `1px solid ${kpi.color}30`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={17} color={kpi.color} />
                  </div>
                </div>
                <p style={{ fontSize: 24, fontWeight: 700, color: "#f5f0ee", marginBottom: 6 }}>
                  {kpi.value}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  {kpi.positive ? (
                    <ArrowUpRight size={13} color="#4caf82" />
                  ) : (
                    <ArrowDownRight size={13} color="#e05a6b" />
                  )}
                  <span style={{ fontSize: 12, color: kpi.positive ? "#4caf82" : "#e05a6b" }}>
                    {kpi.sub}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
          {[
            { key: "overview", label: "매출 현황" },
            { key: "settlement", label: "정산 관리" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                border: activeTab === tab.key ? "1px solid rgba(183,110,121,0.3)" : "1px solid #2a2a2a",
                background: activeTab === tab.key ? "rgba(183,110,121,0.12)" : "transparent",
                color: activeTab === tab.key ? "#d4a5a8" : "#8a8280",
                fontSize: 14,
                fontWeight: activeTab === tab.key ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div>
            {/* Revenue Chart */}
            <div className="luxury-card" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "#f5f0ee", marginBottom: 2 }}>월별 매출 & 수수료 추이</h3>
                  <p style={{ fontSize: 12, color: "#8a8280" }}>최근 7개월</p>
                </div>
                <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12, gap: 5 }}>
                  <Download size={13} />
                  보고서 다운로드
                </button>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthlyRevenue}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#b76e79" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#b76e79" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="comGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                  <XAxis dataKey="month" tick={{ fill: "#8a8280", fontSize: 12 }} axisLine={{ stroke: "#2a2a2a" }} tickLine={false} />
                  <YAxis tick={{ fill: "#8a8280", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 10000000).toFixed(0)}천만`} />
                  <Tooltip
                    contentStyle={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#f5f0ee", fontSize: 13 }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: any) => [
                      `${(Number(value ?? 0) / 10000000).toFixed(2)}천만원`,
                      name === "revenue" ? "매출" : name === "commission" ? "수수료" : "목표",
                    ]}
                  />
                  <Area type="monotone" dataKey="target" stroke="#2a2a2a" strokeWidth={1} strokeDasharray="4 4" fill="none" />
                  <Area type="monotone" dataKey="revenue" stroke="#b76e79" strokeWidth={2} fill="url(#revGrad)" />
                  <Area type="monotone" dataKey="commission" stroke="#d4af37" strokeWidth={2} fill="url(#comGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Brand & Breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Brand Revenue */}
              <div className="luxury-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#f5f0ee", marginBottom: 20 }}>브랜드별 매출</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={brandRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                    <XAxis dataKey="brand" tick={{ fill: "#c0b8b5", fontSize: 13 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#f5f0ee", fontSize: 13 }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(v: any) => [`${(Number(v ?? 0) / 10000000).toFixed(2)}천만원`]}
                    />
                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                      {brandRevenue.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  {brandRevenue.map((b) => (
                    <div key={b.brand}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: "#c0b8b5" }}>{b.brand}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: b.color }}>
                          {(b.revenue / 10000).toLocaleString()}만원 ({b.share}%)
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${b.share}%`, background: b.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Target Achievement */}
              <div className="luxury-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#f5f0ee", marginBottom: 20 }}>월별 목표 달성률</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {monthlyRevenue.slice(-5).map((m) => {
                    const achievement = Math.round((m.revenue / m.target) * 100);
                    const color = achievement >= 100 ? "#4caf82" : achievement >= 85 ? "#d4af37" : "#e05a6b";
                    return (
                      <div key={m.month}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ fontSize: 13, color: "#c0b8b5" }}>{m.month}</span>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: "#8a8280" }}>
                              {(m.revenue / 10000000).toFixed(1)}천만 / {(m.target / 10000000).toFixed(1)}천만
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, color }}>
                              {achievement}%
                            </span>
                            {achievement >= 100 ? (
                              <ArrowUpRight size={13} color={color} />
                            ) : (
                              <ArrowDownRight size={13} color={color} />
                            )}
                          </div>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${Math.min(achievement, 100)}%`, background: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settlement" && (
          <div>
            {/* Filter & Action */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 4 }}>
                {["전체", "완료", "대기", "처리중", "초과"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterStatus(f)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 7,
                      border: filterStatus === f ? "1px solid rgba(183,110,121,0.3)" : "1px solid #2a2a2a",
                      background: filterStatus === f ? "rgba(183,110,121,0.12)" : "transparent",
                      color: filterStatus === f ? "#d4a5a8" : "#8a8280",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-ghost" style={{ padding: "8px 14px", fontSize: 13, gap: 6 }}>
                  <Download size={14} />
                  엑셀 다운로드
                </button>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                  <Plus size={16} />
                  정산 등록
                </button>
              </div>
            </div>

            <div className="luxury-card" style={{ overflow: "hidden" }}>
              <table className="luxury-table">
                <thead>
                  <tr>
                    <th>인플루언서</th>
                    <th>브랜드</th>
                    <th>상품/캠페인</th>
                    <th>정산 기간</th>
                    <th>총 매출</th>
                    <th>수수료</th>
                    <th>요율</th>
                    <th>마감일</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSettlements.map((s) => {
                    const st = statusStyle[s.status];
                    const Icon = st.icon;
                    return (
                      <tr key={s.id}>
                        <td>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: "#f5f0ee" }}>{s.influencer}</p>
                            <p style={{ fontSize: 11, color: "#8a8280" }}>{s.handle}</p>
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: 11,
                              padding: "2px 8px",
                              borderRadius: 4,
                              background:
                                s.brand === "이너피움"
                                  ? "rgba(183,110,121,0.12)"
                                  : s.brand === "아쿠아크"
                                  ? "rgba(212,175,55,0.1)"
                                  : "rgba(76,175,130,0.1)",
                              color:
                                s.brand === "이너피움" ? "#b76e79" : s.brand === "아쿠아크" ? "#d4af37" : "#4caf82",
                              fontWeight: 600,
                            }}
                          >
                            {s.brand}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: 13, color: "#c0b8b5" }}>{s.product}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: 13, color: "#c0b8b5" }}>{s.period}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#f5f0ee" }}>{s.totalSales}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#d4af37" }}>{s.commission}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: 13, color: "#8a8280" }}>{s.rate}</span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: 13,
                              color: s.status === "overdue" ? "#e05a6b" : "#c0b8b5",
                              fontWeight: s.status === "overdue" ? 600 : 400,
                            }}
                          >
                            {s.dueDate.slice(5)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <Icon size={13} color={st.color} />
                            <span
                              style={{
                                fontSize: 11,
                                padding: "3px 8px",
                                borderRadius: 5,
                                background: st.bg,
                                color: st.color,
                                fontWeight: 600,
                              }}
                            >
                              {st.label}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary Footer */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
                marginTop: 16,
              }}
            >
              {[
                { label: "정산 완료", count: settlements.filter((s) => s.status === "paid").length, amount: "1,464만원", color: "#4caf82" },
                { label: "정산 대기", count: settlements.filter((s) => s.status === "pending").length, amount: "883만원", color: "#e8a94a" },
                { label: "처리 중", count: settlements.filter((s) => s.status === "processing").length, amount: "196만원", color: "#9b7dea" },
                { label: "기한 초과", count: settlements.filter((s) => s.status === "overdue").length, amount: "144만원", color: "#e05a6b" },
              ].map((sum) => (
                <div
                  key={sum.label}
                  style={{
                    padding: "14px 16px",
                    background: "#111111",
                    border: `1px solid ${sum.color}20`,
                    borderRadius: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <p style={{ fontSize: 11, color: "#8a8280", marginBottom: 2 }}>{sum.label}</p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: sum.color }}>{sum.amount}</p>
                  </div>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: `${sum.color}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 700,
                      color: sum.color,
                    }}
                  >
                    {sum.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div
              className="luxury-card"
              style={{ width: 460, padding: 32 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f5f0ee" }}>정산 등록</h2>
                <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8a8280" }}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>인플루언서</label>
                  <select className="luxury-input">
                    <option>김미라 (@mira_beauty)</option>
                    <option>박수진 (@sujin_life)</option>
                    <option>이하늘 (@haneul_kbeauty)</option>
                    <option>정유나 (@yuna_wellness)</option>
                    <option>강민지 (@minji_daily)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>브랜드</label>
                  <select className="luxury-input">
                    <option>이너피움</option>
                    <option>아쿠아크</option>
                    <option>문화콘텐츠</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>상품/캠페인명</label>
                  <input className="luxury-input" placeholder="정산 대상 상품 또는 캠페인명" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>총 매출</label>
                    <input className="luxury-input" placeholder="예: 2000만원" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>수수료율</label>
                    <input className="luxury-input" placeholder="예: 20%" />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>정산 기간</label>
                    <input className="luxury-input" placeholder="예: 2026-03" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>마감일</label>
                    <input type="date" className="luxury-input" />
                  </div>
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
