"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  BarChart3,
  UserCog,
  ChevronRight,
  Star,
} from "lucide-react";

const navItems = [
  {
    href: "/",
    icon: LayoutDashboard,
    label: "대시보드",
  },
  {
    href: "/influencers",
    icon: Users,
    label: "인플루언서/공구",
  },
  {
    href: "/brands",
    icon: Briefcase,
    label: "브랜드 프로젝트",
  },
  {
    href: "/calendar",
    icon: Calendar,
    label: "캘린더",
  },
  {
    href: "/revenue",
    icon: BarChart3,
    label: "정산/매출",
  },
  {
    href: "/team",
    icon: UserCog,
    label: "팀원 관리",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 240,
        minHeight: "100vh",
        background: "linear-gradient(180deg, #111111 0%, #0d0d0d 100%)",
        borderRight: "1px solid #2a2a2a",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 40,
        overflowY: "auto",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "28px 20px 24px",
          borderBottom: "1px solid #1f1f1f",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              background: "linear-gradient(135deg, #b76e79 0%, #d4af37 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Star size={18} color="#fff" fill="#fff" />
          </div>
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                background: "linear-gradient(135deg, #b76e79 0%, #d4af37 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              LUCY V
            </div>
            <div style={{ fontSize: 10, color: "#8a8280", letterSpacing: "0.12em", fontWeight: 500 }}>
              AGENCY
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 12,
            padding: "6px 10px",
            background: "rgba(183, 110, 121, 0.08)",
            border: "1px solid rgba(183, 110, 121, 0.15)",
            borderRadius: 8,
            fontSize: 11,
            color: "#d4a5a8",
            letterSpacing: "0.05em",
          }}
        >
          업무 관리 시스템
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "16px 12px" }}>
        <div style={{ fontSize: 10, color: "#5a5250", letterSpacing: "0.1em", fontWeight: 600, padding: "0 8px", marginBottom: 8 }}>
          MENU
        </div>
        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`sidebar-item${isActive ? " active" : ""}`}
                >
                  <Icon size={18} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {isActive && <ChevronRight size={14} style={{ opacity: 0.5 }} />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom info */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid #1f1f1f",
        }}
      >
        <div
          style={{
            padding: "12px 14px",
            background: "rgba(212, 175, 55, 0.06)",
            border: "1px solid rgba(212, 175, 55, 0.15)",
            borderRadius: 10,
          }}
        >
          <div style={{ fontSize: 11, color: "#d4af37", fontWeight: 600, marginBottom: 2 }}>
            lucyvagency
          </div>
          <div style={{ fontSize: 11, color: "#8a8280" }}>
            2026년 3월 현재
          </div>
        </div>
      </div>
    </aside>
  );
}
