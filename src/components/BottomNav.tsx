"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLang } from "@/lib/LanguageContext";

const TABS = [
  { key: "home", path: "/home", icon: "🏠" },
  { key: "history", path: "/history", icon: "📋" },
  { key: "voucher", path: "/voucher", icon: "🎫" },
  { key: "referral", path: "/referral", icon: "👫" },
] as const;

const LABEL_MAP = {
  home: { zh: "首页", en: "Home" },
  history: { zh: "记录", en: "History" },
  voucher: { zh: "优惠券", en: "Voucher" },
  referral: { zh: "推荐好友", en: "Refer" },
};

// Mobile: fixed bottom bar (unchanged). Desktop (md+): fixed left sidebar —
// same nav, same active-state logic, pure CSS breakpoint swap like Admin's Sidebar.
export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useLang();

  return (
    <>
      {/* Mobile bottom bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white flex items-center justify-around"
        style={{
          height: 64,
          borderTop: "1px solid #F0F0F0",
          zIndex: 50,
        }}
      >
        {TABS.map((tab) => {
          const active =
            pathname === tab.path ||
            (tab.key === "home" && pathname === "/wallet");
          return (
            <button
              key={tab.key}
              onClick={() => router.push(tab.path)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1"
              style={{ color: active ? "#C8111A" : "#888888" }}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[10px] font-medium">
                {LABEL_MAP[tab.key][lang]}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Desktop left sidebar */}
      <aside
        className="hidden md:flex flex-col shrink-0"
        style={{
          width: 84,
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          background: "#fff",
          borderRight: "1px solid #F0F0F0",
          zIndex: 50,
        }}
      >
        <div className="text-center" style={{ padding: "20px 0 8px" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#C8111A", letterSpacing: "0.05em" }}>
            HERAA
          </span>
        </div>
        <nav className="flex-1 flex flex-col items-center" style={{ gap: 6, padding: "8px 8px" }}>
          {TABS.map((tab) => {
            const active =
              pathname === tab.path ||
              (tab.key === "home" && pathname === "/wallet");
            return (
              <button
                key={tab.key}
                onClick={() => router.push(tab.path)}
                className="w-full flex flex-col items-center gap-1"
                style={{
                  padding: "10px 4px",
                  borderRadius: 12,
                  background: active ? "#FFF3F3" : "transparent",
                }}
              >
                <span className="text-xl">{tab.icon}</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: active ? 700 : 600,
                    color: active ? "#C8111A" : "#888888",
                    whiteSpace: "nowrap",
                  }}
                >
                  {LABEL_MAP[tab.key][lang]}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
