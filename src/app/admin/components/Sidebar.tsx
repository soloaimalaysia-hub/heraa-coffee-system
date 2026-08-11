"use client";

import { useLang } from "@/lib/LanguageContext";
import { getTabs, TabKey } from "./tabConfig";

export default function Sidebar({
  active,
  onChange,
  adminName,
  onLogout,
  onChangePassword,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
  adminName?: string;
  onLogout?: () => void;
  onChangePassword?: () => void;
}) {
  const { t, lang, toggleLang } = useLang();
  const TABS = getTabs(t, lang);

  return (
    <aside
      className="hidden md:flex flex-col shrink-0"
      style={{
        width: 208,
        height: "100vh",
        position: "sticky",
        top: 0,
        background: "#fff",
        borderRight: "2px solid #D4AF37",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "20px 18px 16px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo.webp" alt="HERAA COFFEE" style={{ height: 28 }} />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: "4px 10px" }}>
        {TABS.map((tabItem) => {
          const isActive = tabItem.key === active;
          return (
            <button
              key={tabItem.key}
              onClick={() => onChange(tabItem.key)}
              className="w-full flex items-center gap-3 text-left border-none"
              style={{
                padding: "10px 10px",
                marginBottom: 2,
                borderRadius: 10,
                background: isActive ? "#FBF3DD" : "transparent",
                cursor: "pointer",
              }}
            >
              {tabItem.icon ? (
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    flexShrink: 0,
                    boxShadow: isActive ? "0 3px 8px rgba(26,26,26,0.18)" : "none",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tabItem.icon}
                    alt={tabItem.label}
                    style={{ width: "100%", height: "100%", display: "block", borderRadius: "50%" }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                    background: "#F6F3EE",
                    border: "1px solid #ECE8E1",
                  }}
                >
                  {tabItem.emoji}
                </div>
              )}
              <span
                style={{
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? "#C8102E" : "#3A3733",
                  whiteSpace: "nowrap",
                }}
              >
                {tabItem.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer: account controls */}
      <div style={{ padding: "14px 18px 18px", borderTop: "1px solid #ECE8E1" }}>
        {adminName && (
          <div style={{ fontSize: 11.5, color: "#6B6864", fontWeight: 600, marginBottom: 10 }}>
            👤 {adminName}
          </div>
        )}
        <div className="flex flex-col gap-2" style={{ fontSize: 12, fontWeight: 600 }}>
          <span onClick={toggleLang} style={{ color: "#C8102E", cursor: "pointer", userSelect: "none" }}>
            {lang === "zh" ? "EN" : "中文"}
          </span>
          {onChangePassword && (
            <span onClick={onChangePassword} style={{ color: "#6B6864", cursor: "pointer", userSelect: "none" }}>
              {lang === "zh" ? "改密码" : "Change password"}
            </span>
          )}
          {onLogout && (
            <span onClick={onLogout} style={{ color: "#6B6864", cursor: "pointer", userSelect: "none" }}>
              {lang === "zh" ? "退出" : "Logout"}
            </span>
          )}
        </div>
        <div style={{ fontSize: 9.5, color: "#C8102E", opacity: 0.6, marginTop: 12 }}>v1.0</div>
      </div>
    </aside>
  );
}
