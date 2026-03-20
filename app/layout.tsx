import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Lucy V Agency - 업무관리",
  description: "루씨브이에이전시 전용 업무 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body style={{ backgroundColor: "#0a0a0a", color: "#f5f0ee" }}>
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <Sidebar />
          <main
            style={{
              flex: 1,
              marginLeft: 240,
              minHeight: "100vh",
              backgroundColor: "#0a0a0a",
            }}
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
