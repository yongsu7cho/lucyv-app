"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import {
  Plus,
  Search,
  Filter,
  Instagram,
  Youtube,
  Star,
  TrendingUp,
  Package,
  ChevronDown,
  X,
  Users,
  BarChart2,
  Heart,
  CheckSquare,
  Square,
  Trash2,
  StickyNote,
  ListTodo,
} from "lucide-react";

type Influencer = {
  id: number;
  name: string;
  handle: string;
  platform: string;
  category: string;
  followers: string;
  engagementRate: string;
  totalRevenue: string;
  activeGouups: number;
  status: string;
  tier: string;
  joinDate: string;
  tags: string[];
};

const influencers: Influencer[] = [
  {
    id: 1,
    name: "김미라",
    handle: "@mira_beauty",
    platform: "instagram",
    category: "뷰티/스킨케어",
    followers: "128K",
    engagementRate: "4.2%",
    totalRevenue: "1,240만원",
    activeGouups: 2,
    status: "active",
    tier: "gold",
    joinDate: "2024-06",
    tags: ["스킨케어", "이너피움", "공구"],
  },
  {
    id: 2,
    name: "박수진",
    handle: "@sujin_life",
    platform: "instagram",
    category: "라이프스타일",
    followers: "85K",
    engagementRate: "5.8%",
    totalRevenue: "890만원",
    activeGouups: 1,
    status: "active",
    tier: "silver",
    joinDate: "2024-09",
    tags: ["라이프", "아쿠아크", "공구"],
  },
  {
    id: 3,
    name: "이하늘",
    handle: "@haneul_kbeauty",
    platform: "youtube",
    category: "K-뷰티",
    followers: "320K",
    engagementRate: "3.1%",
    totalRevenue: "3,420만원",
    activeGouups: 3,
    status: "active",
    tier: "platinum",
    joinDate: "2023-11",
    tags: ["K-뷰티", "리뷰", "공구", "이너피움"],
  },
  {
    id: 4,
    name: "최다은",
    handle: "@dayeon_luxury",
    platform: "instagram",
    category: "럭셔리/패션",
    followers: "62K",
    engagementRate: "6.4%",
    totalRevenue: "540만원",
    activeGouups: 0,
    status: "inactive",
    tier: "silver",
    joinDate: "2024-11",
    tags: ["럭셔리", "패션", "뷰티"],
  },
  {
    id: 5,
    name: "정유나",
    handle: "@yuna_wellness",
    platform: "instagram",
    category: "웰니스/헬스",
    followers: "195K",
    engagementRate: "4.8%",
    totalRevenue: "2,180만원",
    activeGouups: 2,
    status: "active",
    tier: "gold",
    joinDate: "2024-02",
    tags: ["웰니스", "건강", "이너피움"],
  },
  {
    id: 6,
    name: "강민지",
    handle: "@minji_daily",
    platform: "youtube",
    category: "데일리/브이로그",
    followers: "440K",
    engagementRate: "2.9%",
    totalRevenue: "4,100만원",
    activeGouups: 1,
    status: "active",
    tier: "platinum",
    joinDate: "2023-08",
    tags: ["브이로그", "일상", "공구"],
  },
];

type GroupBuy = {
  id: number;
  product: string;
  brand: string;
  influencer: string;
  startDate: string;
  endDate: string;
  target: number;
  current: number;
  revenue: string;
  status: string;
};

const groupBuys: GroupBuy[] = [
  {
    id: 1,
    product: "이너피움 비타민C 세럼 30ml",
    brand: "이너피움",
    influencer: "@mira_beauty",
    startDate: "2026-02-20",
    endDate: "2026-03-10",
    target: 500,
    current: 487,
    revenue: "3,896만원",
    status: "active",
  },
  {
    id: 2,
    product: "아쿠아크 딥모이스처 크림",
    brand: "아쿠아크",
    influencer: "@haneul_kbeauty",
    startDate: "2026-03-01",
    endDate: "2026-03-20",
    target: 300,
    current: 142,
    revenue: "1,136만원",
    status: "active",
  },
  {
    id: 3,
    product: "이너피움 레티놀 앰플 세트",
    brand: "이너피움",
    influencer: "@yuna_wellness",
    startDate: "2026-02-01",
    endDate: "2026-02-28",
    target: 400,
    current: 412,
    revenue: "3,296만원",
    status: "completed",
  },
  {
    id: 4,
    product: "아쿠아크 선쿠션 SPF50+",
    brand: "아쿠아크",
    influencer: "@minji_daily",
    startDate: "2026-03-15",
    endDate: "2026-04-05",
    target: 600,
    current: 0,
    revenue: "0원",
    status: "upcoming",
  },
];

const tierStyle: Record<string, { color: string; bg: string; label: string }> = {
  platinum: { color: "#c0b8b5", bg: "rgba(192, 184, 181, 0.1)", label: "PLATINUM" },
  gold: { color: "#d4af37", bg: "rgba(212, 175, 55, 0.1)", label: "GOLD" },
  silver: { color: "#9b9ea6", bg: "rgba(155, 158, 166, 0.1)", label: "SILVER" },
};

const statusStyle: Record<string, { color: string; bg: string; label: string }> = {
  active: { color: "#4caf82", bg: "rgba(76, 175, 130, 0.1)", label: "활성" },
  inactive: { color: "#8a8280", bg: "rgba(138, 130, 128, 0.1)", label: "비활성" },
  completed: { color: "#d4a5a8", bg: "rgba(183, 110, 121, 0.1)", label: "완료" },
  upcoming: { color: "#9b7dea", bg: "rgba(155, 125, 234, 0.1)", label: "예정" },
};

// ─── Side Panel Types ────────────────────────────────────────
type TodoItem = {
  id: string;
  text: string;
  done: boolean;
};

const STORAGE_KEY_TODOS = "lucyv_influencer_todos";
const STORAGE_KEY_MEMO = "lucyv_influencer_memo";

export default function InfluencersPage() {
  const [activeTab, setActiveTab] = useState<"influencers" | "groupbuys">("influencers");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  // ─── Side Panel: Todos ─────────────────────────────────────
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [memo, setMemo] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedTodos = localStorage.getItem(STORAGE_KEY_TODOS);
      if (savedTodos) setTodos(JSON.parse(savedTodos));
      const savedMemo = localStorage.getItem(STORAGE_KEY_MEMO);
      if (savedMemo) setMemo(savedMemo);
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  // Persist todos
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY_TODOS, JSON.stringify(todos));
  }, [todos, hydrated]);

  // Persist memo
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY_MEMO, memo);
  }, [memo, hydrated]);

  const addTodo = useCallback(() => {
    const text = newTodo.trim();
    if (!text) return;
    setTodos((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text, done: false },
    ]);
    setNewTodo("");
  }, [newTodo]);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const doneCount = todos.filter((t) => t.done).length;

  const filtered = influencers.filter(
    (inf) =>
      inf.name.includes(search) ||
      inf.handle.includes(search) ||
      inf.category.includes(search)
  );

  return (
    <div>
      <Header title="인플루언서 / 공구 관리" subtitle="파트너 인플루언서 및 공동구매 현황 관리" />
      <div style={{ padding: "32px" }}>
        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { label: "전체 인플루언서", value: "6명", icon: Users, color: "#b76e79" },
            { label: "활성 인플루언서", value: "5명", icon: Star, color: "#d4af37" },
            { label: "진행 중 공구", value: "2건", icon: Package, color: "#4caf82" },
            { label: "이달 공구 매출", value: "5,032만원", icon: TrendingUp, color: "#9b7dea" },
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

        {/* ═══ 2-Column Layout: Main + Side Panel ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
          {/* ═══ LEFT: Main Content ═══ */}
          <div style={{ minWidth: 0 }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
              {[
                { key: "influencers", label: "인플루언서 목록" },
                { key: "groupbuys", label: "공구 현황" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as "influencers" | "groupbuys")}
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

            {/* Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#111111", border: "1px solid #2a2a2a", borderRadius: 10, padding: "8px 14px", width: 240 }}>
                  <Search size={15} color="#5a5250" />
                  <input
                    className="luxury-input"
                    style={{ background: "transparent", border: "none", padding: 0, fontSize: 13 }}
                    placeholder="이름, 핸들, 카테고리 검색..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <button className="btn-ghost" style={{ padding: "8px 14px", fontSize: 13, gap: 6 }}>
                  <Filter size={14} />
                  필터
                  <ChevronDown size={12} />
                </button>
              </div>
              <button className="btn-primary" onClick={() => setShowModal(true)}>
                <Plus size={16} />
                {activeTab === "influencers" ? "인플루언서 추가" : "공구 등록"}
              </button>
            </div>

            {/* Influencers Table */}
            {activeTab === "influencers" && (
              <div className="luxury-card" style={{ overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table className="luxury-table">
                    <thead>
                      <tr>
                        <th>인플루언서</th>
                        <th>플랫폼</th>
                        <th>카테고리</th>
                        <th>팔로워</th>
                        <th>참여율</th>
                        <th>누적 매출</th>
                        <th>공구</th>
                        <th>티어</th>
                        <th>상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((inf) => {
                        const tier = tierStyle[inf.tier];
                        const status = statusStyle[inf.status];
                        return (
                          <tr key={inf.id} style={{ cursor: "pointer" }}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div
                                  style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: "50%",
                                    background: "linear-gradient(135deg, #b76e79, #d4af37)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: "#fff",
                                    flexShrink: 0,
                                  }}
                                >
                                  {inf.name[0]}
                                </div>
                                <div>
                                  <p style={{ fontSize: 13, fontWeight: 600, color: "#f5f0ee" }}>{inf.name}</p>
                                  <p style={{ fontSize: 11, color: "#8a8280" }}>{inf.handle}</p>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                {inf.platform === "instagram" ? (
                                  <Instagram size={14} color="#b76e79" />
                                ) : (
                                  <Youtube size={14} color="#e05a6b" />
                                )}
                                <span style={{ fontSize: 12, color: "#c0b8b5", textTransform: "capitalize" }}>
                                  {inf.platform}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: 12, color: "#c0b8b5" }}>{inf.category}</span>
                            </td>
                            <td>
                              <span style={{ fontSize: 13, fontWeight: 600, color: "#f5f0ee" }}>{inf.followers}</span>
                            </td>
                            <td>
                              <span style={{ fontSize: 13, color: "#d4a5a8", fontWeight: 600 }}>{inf.engagementRate}</span>
                            </td>
                            <td>
                              <span style={{ fontSize: 13, fontWeight: 600, color: "#f5f0ee" }}>{inf.totalRevenue}</span>
                            </td>
                            <td>
                              <span style={{ fontSize: 13, color: inf.activeGouups > 0 ? "#4caf82" : "#5a5250", fontWeight: 600 }}>
                                {inf.activeGouups}건
                              </span>
                            </td>
                            <td>
                              <span
                                style={{
                                  fontSize: 10,
                                  padding: "3px 8px",
                                  borderRadius: 4,
                                  background: tier.bg,
                                  color: tier.color,
                                  fontWeight: 700,
                                  letterSpacing: "0.05em",
                                  border: `1px solid ${tier.color}30`,
                                }}
                              >
                                {tier.label}
                              </span>
                            </td>
                            <td>
                              <span
                                style={{
                                  fontSize: 11,
                                  padding: "4px 10px",
                                  borderRadius: 6,
                                  background: status.bg,
                                  color: status.color,
                                  fontWeight: 600,
                                }}
                              >
                                {status.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Group Buys */}
            {activeTab === "groupbuys" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {groupBuys.map((gb) => {
                  const status = statusStyle[gb.status];
                  const pct = gb.target > 0 ? Math.round((gb.current / gb.target) * 100) : 0;
                  return (
                    <div
                      key={gb.id}
                      className="luxury-card"
                      style={{ padding: 24 }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#f5f0ee" }}>{gb.product}</h3>
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
                          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, color: "#8a8280" }}>브랜드: <strong style={{ color: "#b76e79" }}>{gb.brand}</strong></span>
                            <span style={{ fontSize: 12, color: "#8a8280" }}>인플루언서: <strong style={{ color: "#c0b8b5" }}>{gb.influencer}</strong></span>
                            <span style={{ fontSize: 12, color: "#8a8280" }}>기간: {gb.startDate} ~ {gb.endDate}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <p style={{ fontSize: 11, color: "#8a8280", marginBottom: 2 }}>공구 매출</p>
                          <p style={{ fontSize: 22, fontWeight: 700, color: "#f5f0ee" }}>{gb.revenue}</p>
                        </div>
                      </div>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ fontSize: 12, color: "#8a8280" }}>달성률</span>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: "#c0b8b5" }}>{gb.current.toLocaleString()} / {gb.target.toLocaleString()}개</span>
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: pct >= 100 ? "#4caf82" : pct >= 70 ? "#d4af37" : "#b76e79",
                              }}
                            >
                              {pct}%
                            </span>
                          </div>
                        </div>
                        <div className="progress-bar" style={{ height: 8 }}>
                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.min(pct, 100)}%`,
                              background: pct >= 100 ? "#4caf82" : "linear-gradient(90deg, #b76e79, #d4af37)",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ═══ RIGHT: Side Panel (Todo + Memo) ═══ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 88, alignSelf: "flex-start" }}>
            {/* ── Todo List ── */}
            <div className="luxury-card" style={{ padding: 0, overflow: "hidden" }}>
              {/* Header */}
              <div
                style={{
                  padding: "16px 18px 12px",
                  borderBottom: "1px solid #1f1f1f",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ListTodo size={16} color="#b76e79" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#f5f0ee" }}>
                    투두리스트
                  </span>
                </div>
                {todos.length > 0 && (
                  <span style={{ fontSize: 11, color: "#8a8280" }}>
                    {doneCount}/{todos.length} 완료
                  </span>
                )}
              </div>

              {/* Progress mini bar */}
              {todos.length > 0 && (
                <div style={{ height: 3, background: "#111111" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${(doneCount / todos.length) * 100}%`,
                      background: "linear-gradient(90deg, #b76e79, #d4af37)",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              )}

              {/* Add todo input */}
              <div style={{ padding: "12px 14px", borderBottom: "1px solid #1a1a1a" }}>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <input
                    className="luxury-input"
                    style={{
                      background: "#111111",
                      border: "1px solid #1f1f1f",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontSize: 13,
                      flex: 1,
                    }}
                    placeholder="할 일 입력..."
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addTodo();
                    }}
                  />
                  <button
                    onClick={addTodo}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      background: newTodo.trim()
                        ? "linear-gradient(135deg, #b76e79, #9a5560)"
                        : "#1f1f1f",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: newTodo.trim() ? "pointer" : "default",
                      transition: "all 0.2s ease",
                      flexShrink: 0,
                    }}
                  >
                    <Plus size={16} color={newTodo.trim() ? "#fff" : "#5a5250"} />
                  </button>
                </div>
              </div>

              {/* Todo items */}
              <div
                style={{
                  maxHeight: 280,
                  overflowY: "auto",
                }}
              >
                {todos.length === 0 && (
                  <div
                    style={{
                      padding: "28px 14px",
                      textAlign: "center",
                    }}
                  >
                    <ListTodo size={28} color="#2a2a2a" style={{ margin: "0 auto 8px" }} />
                    <p style={{ fontSize: 12, color: "#5a5250" }}>
                      등록된 할 일이 없습니다
                    </p>
                  </div>
                )}
                {todos.map((todo) => (
                  <div
                    key={todo.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      borderBottom: "1px solid #141414",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(183,110,121,0.04)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <button
                      onClick={() => toggleTodo(todo.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                        flexShrink: 0,
                      }}
                    >
                      {todo.done ? (
                        <CheckSquare size={16} color="#4caf82" />
                      ) : (
                        <Square size={16} color="#5a5250" />
                      )}
                    </button>
                    <span
                      style={{
                        flex: 1,
                        fontSize: 13,
                        color: todo.done ? "#5a5250" : "#f5f0ee",
                        textDecoration: todo.done ? "line-through" : "none",
                        lineHeight: 1.4,
                        wordBreak: "break-word",
                      }}
                    >
                      {todo.text}
                    </span>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 2,
                        display: "flex",
                        flexShrink: 0,
                        opacity: 0.4,
                        transition: "opacity 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = "1";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = "0.4";
                      }}
                    >
                      <Trash2 size={14} color="#e05a6b" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Memo Pad ── */}
            <div className="luxury-card" style={{ padding: 0, overflow: "hidden" }}>
              {/* Header */}
              <div
                style={{
                  padding: "16px 18px 12px",
                  borderBottom: "1px solid #1f1f1f",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <StickyNote size={16} color="#d4af37" />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#f5f0ee" }}>
                  메모장
                </span>
              </div>
              <div style={{ padding: "12px 14px" }}>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="자유롭게 메모를 입력하세요..."
                  style={{
                    width: "100%",
                    minHeight: 200,
                    background: "#111111",
                    border: "1px solid #1f1f1f",
                    borderRadius: 10,
                    padding: "12px 14px",
                    color: "#f5f0ee",
                    fontSize: 13,
                    lineHeight: 1.7,
                    resize: "vertical",
                    outline: "none",
                    transition: "border-color 0.2s ease",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#b76e79";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(183,110,121,0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#1f1f1f";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <p
                  style={{
                    fontSize: 10,
                    color: "#3a3a3a",
                    marginTop: 6,
                    textAlign: "right",
                  }}
                >
                  자동 저장됨
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div
              className="luxury-card"
              style={{ width: 480, padding: 32, maxHeight: "80vh", overflowY: "auto" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f5f0ee" }}>
                  {activeTab === "influencers" ? "인플루언서 추가" : "공구 등록"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#8a8280" }}
                >
                  <X size={20} />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {activeTab === "influencers" ? (
                  <>
                    <div>
                      <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>이름</label>
                      <input className="luxury-input" placeholder="실명 입력" />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>SNS 핸들</label>
                      <input className="luxury-input" placeholder="@handle" />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>플랫폼</label>
                      <select className="luxury-input">
                        <option value="instagram">Instagram</option>
                        <option value="youtube">YouTube</option>
                        <option value="tiktok">TikTok</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>카테고리</label>
                      <input className="luxury-input" placeholder="뷰티, 라이프스타일 등" />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>팔로워 수</label>
                      <input className="luxury-input" placeholder="예: 50000" />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>상품명</label>
                      <input className="luxury-input" placeholder="공구 상품명 입력" />
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
                      <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>담당 인플루언서</label>
                      <select className="luxury-input">
                        {influencers.map((inf) => (
                          <option key={inf.id}>{inf.name} ({inf.handle})</option>
                        ))}
                      </select>
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
                      <label style={{ fontSize: 12, color: "#8a8280", display: "block", marginBottom: 6 }}>목표 수량</label>
                      <input className="luxury-input" type="number" placeholder="목표 판매 수량" />
                    </div>
                  </>
                )}
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                    취소
                  </button>
                  <button className="btn-primary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                    저장하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
