"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLang } from "@/lib/LanguageContext";

const TABS = [
  { key: "home", path: "/home", icon: "🏠" },
  { key: "history", path: "/history", icon: "📋" },
  { key: "voucher", path: "/voucher", icon: "🎫" },
] as const;

const LABEL_MAP = {
  home: { zh: "首页", en: "Home" },
  history: { zh: "记录", en: "History" },
  voucher: { zh: "优惠券", en: "Voucher" },
};

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useLang();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white flex items-center justify-around"
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
  );
}
