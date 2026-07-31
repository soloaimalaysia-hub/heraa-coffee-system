"use client";

import { useLang } from "@/lib/LanguageContext";

export type TabKey =
  | "analytics"
  | "simulate"
  | "whatsapp"
  | "transactions"
  | "members"
  | "events"
  | "companies";

interface TabDef {
  key: TabKey;
  label: string;
  icon?: string;
  emoji?: string;
}

export default function TabNav({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
}) {
  const { t, lang } = useLang();

  const TABS: TabDef[] = [
    { key: "analytics", label: t.tabData, icon: "/assets/icons/nav-analytics.webp" },
    { key: "simulate", label: t.tabCoffee, icon: "/assets/icons/nav-coffee.webp" },
    { key: "whatsapp", label: t.tabWhatsApp, icon: "/assets/icons/nav-whatsapp.webp" },
    { key: "transactions", label: t.tabTransactions, icon: "/assets/icons/nav-transactions.webp" },
    { key: "members", label: t.tabMembers, icon: "/assets/icons/nav-members.webp" },
    { key: "events", label: t.tabEvents, emoji: "📅" },
    { key: "companies", label: lang === "zh" ? "企业" : "Companies", emoji: "🏢" },
  ];

  return (
    <div
      style={{ background: "#fff" }}
      className="sticky top-[48px] z-10"
    >
      <div
        className="flex justify-between overflow-x-auto scrollbar-hide"
        style={{ padding: "14px 16px 10px" }}
      >
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className="flex flex-col items-center gap-[5px] border-none bg-transparent"
              style={{ width: 44, cursor: "pointer", flexShrink: 0 }}
            >
              {tab.icon ? (
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    transform: isActive ? "translateY(-3px)" : "none",
                    boxShadow: isActive
                      ? "0 6px 14px rgba(26,26,26,0.22)"
                      : "none",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tab.icon}
                    alt={tab.label}
                    style={{ width: "100%", height: "100%", display: "block", borderRadius: "50%" }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    background: "#F6F3EE",
                    border: "1px solid #ECE8E1",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    transform: isActive ? "translateY(-3px)" : "none",
                    boxShadow: isActive
                      ? "0 6px 14px rgba(26,26,26,0.22)"
                      : "none",
                  }}
                >
                  {tab.emoji}
                </div>
              )}
              <span
                style={{
                  fontSize: 9,
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? "#C8102E" : "#6B6864",
                  letterSpacing: "0.2px",
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
