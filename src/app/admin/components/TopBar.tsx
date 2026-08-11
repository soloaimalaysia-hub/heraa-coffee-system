"use client";

import { useLang } from "@/lib/LanguageContext";

export default function TopBar({
  adminName,
  onLogout,
  onChangePassword,
}: {
  adminName?: string;
  onLogout?: () => void;
  onChangePassword?: () => void;
}) {
  const { lang, toggleLang } = useLang();

  return (
    <header
      className="md:hidden sticky top-0 z-20"
      style={{
        background: "#fff",
        padding: "14px 18px 12px",
        borderBottom: "2px solid #D4AF37",
      }}
    >
      <div className="flex items-center justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo.webp" alt="HERAA COFFEE" style={{ height: 30 }} />
        <div className="flex items-center gap-2.5">
          {adminName && (
            <span style={{ fontSize: 11, color: "#6B6864", fontWeight: 500 }}>
              👤 {adminName}
            </span>
          )}
          <span
            onClick={toggleLang}
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#C8102E",
              cursor: "pointer",
              letterSpacing: "0.5px",
              userSelect: "none",
            }}
          >
            {lang === "zh" ? "EN" : "中文"}
          </span>
          {onChangePassword && (
            <span
              onClick={onChangePassword}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#6B6864",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              改密码
            </span>
          )}
          {onLogout && (
            <span
              onClick={onLogout}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#6B6864",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              退出
            </span>
          )}
          <span style={{ fontSize: 10, color: "#C8102E", fontWeight: 500, opacity: 0.75 }}>
            v1.0
          </span>
        </div>
      </div>
    </header>
  );
}
