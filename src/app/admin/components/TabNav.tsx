export type TabKey = "analytics" | "simulate" | "whatsapp" | "transactions" | "members";

export const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "analytics", label: "数据", icon: "📊" },
  { key: "simulate", label: "咖啡", icon: "☕" },
  { key: "whatsapp", label: "WhatsApp", icon: "📱" },
  { key: "transactions", label: "交易", icon: "🧾" },
  { key: "members", label: "会员", icon: "👥" },
];

export default function TabNav({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
}) {
  return (
    <div className="bg-white border-b border-gray-100 sticky top-[44px] z-10">
      <div className="flex overflow-x-auto max-w-lg mx-auto scrollbar-hide">
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className="flex-1 min-w-[70px] flex flex-col items-center py-2.5 px-2 transition-colors relative"
              style={{
                color: isActive ? "#C8111A" : "#9ca3af",
              }}
            >
              <div className="text-base">{tab.icon}</div>
              <div className="text-[10px] font-semibold mt-0.5">
                {tab.label}
              </div>
              {isActive && (
                <div
                  className="absolute bottom-0 left-3 right-3 h-[2px] rounded-t"
                  style={{ background: "#C8111A" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
