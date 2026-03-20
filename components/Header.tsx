"use client";

import { Bell, Search, Settings } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header
      style={{
        height: 72,
        background: "rgba(10, 10, 10, 0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #1f1f1f",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      <div>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#f5f0ee",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 13, color: "#8a8280", marginTop: 1 }}>
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#111111",
            border: "1px solid #2a2a2a",
            borderRadius: 10,
            padding: "8px 14px",
            width: 220,
            cursor: "text",
          }}
        >
          <Search size={15} color="#5a5250" />
          <span style={{ fontSize: 13, color: "#5a5250" }}>검색...</span>
        </div>

        {/* Notifications */}
        <button
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "#111111",
            border: "1px solid #2a2a2a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            position: "relative",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#b76e79";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a2a2a";
          }}
        >
          <Bell size={17} color="#c0b8b5" />
          <span
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 7,
              height: 7,
              background: "#b76e79",
              borderRadius: "50%",
              border: "1.5px solid #0a0a0a",
            }}
          />
        </button>

        {/* Settings */}
        <button
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "#111111",
            border: "1px solid #2a2a2a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#b76e79";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a2a2a";
          }}
        >
          <Settings size={17} color="#c0b8b5" />
        </button>

        {/* Avatar */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "linear-gradient(135deg, #b76e79 0%, #d4af37 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 700,
            color: "#fff",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          L
        </div>
      </div>
    </header>
  );
}
