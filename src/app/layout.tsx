import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "竞品情报 Agent",
  description:
    "以证据为核心的 AI 竞品研究、对比、洞察与策略工作流。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
