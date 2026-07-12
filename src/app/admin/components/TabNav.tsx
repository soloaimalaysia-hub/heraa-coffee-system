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
      <div className="flex overflow-x-auto max-w-full md:max-w-6xl mx-auto scrollbar-hide px-4 md:px-6">
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className="flex-1 min-w-[70px] md:min-w-[120px] flex flex-col md:flex-row md:items-center md:justify-center md:gap-2 items-center py-2.5 md:py-3 px-2 transition-colors relative"
              style={{
                color: isActive ? "#C8111A" : "#9ca3af",
              }}
            >
              <div className="text-base md:text-lg">{tab.icon}</div>
              <div className="text-[10px] md:text-sm font-semibold mt-0.5 md:mt-0">
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
