"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLang } from "@/lib/LanguageContext";

const TABS = [
  { key: "home", path: "/home", icon: "/assets/icons/nav-home.webp" },
  { key: "history", path: "/history", icon: "/assets/icons/nav-history.webp" },
  { key: "voucher", path: "/voucher", icon: "/assets/icons/nav-voucher.webp" },
  { key: "referral", path: "/referral", icon: "/assets/icons/nav-referral.webp" },
  { key: "profile", path: "/profile", icon: "/assets/icons/nav-profile.webp" },
] as const;

const LABEL_MAP = {
  home: { zh: "首页", en: "Home" },
  history: { zh: "记录", en: "History" },
  voucher: { zh: "优惠券", en: "Voucher" },
  referral: { zh: "推荐好友", en: "Refer" },
  profile: { zh: "我的", en: "Profile" },
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
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  overflow: "hidden",
                  opacity: active ? 1 : 0.55,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={tab.icon} alt={LABEL_MAP[tab.key][lang]} style={{ width: "100%", height: "100%", display: "block" }} />
              </div>
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
        <div className="text-center" style={{ padding: "18px 8px 8px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo.webp" alt="HERAA COFFEE" style={{ width: "100%", maxWidth: 56, margin: "0 auto", display: "block" }} />
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
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    overflow: "hidden",
                    boxShadow: active ? "0 3px 8px rgba(26,26,26,0.18)" : "none",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={tab.icon} alt={LABEL_MAP[tab.key][lang]} style={{ width: "100%", height: "100%", display: "block" }} />
                </div>
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
