"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface Stats {
  today_cups: number;
  total_members: number;
  today_revenue: number;
}

const DRINKS = [
  { name: "Heraa Signature Latte", price: 6.5 },
  { name: "Heraa Americano", price: 6.0 },
  { name: "Heraa Mocha", price: 7.0 },
  { name: "Heraa Iced Latte", price: 6.5 },
  { name: "Heraa Cappuccino", price: 6.5 },
];

export default function SimulateTab() {
  const [stats, setStats] = useState<Stats>({
    today_cups: 0,
    total_members: 0,
    today_revenue: 0,
  });
  const [name, setName] = useState("");
  const [selectedDrink, setSelectedDrink] = useState(DRINKS[0]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const loadStats = useCallback(async () => {
    const { data } = await supabase.rpc("heraa_screen_stats");
    if (data) setStats(data);
  }, []);

  useEffect(() => {
    loadStats();
    const t = setInterval(loadStats, 5000);
    return () => clearInterval(t);
  }, [loadStats]);

  async function handleSimulate() {
    if (!name.trim()) return;
    setSending(true);

    const { error } = await supabase.rpc("heraa_simulate_redemption", {
      p_member_name: name.trim(),
      p_drink_name: selectedDrink.name,
      p_amount: selectedDrink.price,
    });

    setSending(false);
    if (error) {
      alert("Error: " + error.message);
      return;
    }
    setSent(true);
    setTimeout(() => setSent(false), 1500);
    setName("");
    loadStats();
  }

  return (
    <div className="space-y-3 md:space-y-4 md:max-w-2xl md:mx-auto">
      {/* Today KPIs */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div
          className="rounded-lg p-3 md:p-5 text-center"
          style={{ background: "#FFF3F3" }}
        >
          <div className="text-xl md:text-3xl font-bold" style={{ color: "#C8111A" }}>
            {stats.today_cups}
          </div>
          <div className="text-[10px] md:text-xs text-gray-500 mt-0.5">今日杯数</div>
        </div>
        <div
          className="rounded-lg p-3 md:p-5 text-center"
          style={{ background: "#FFF3F3" }}
        >
          <div className="text-xl md:text-3xl font-bold" style={{ color: "#C8111A" }}>
            RM {stats.today_revenue.toFixed(0)}
          </div>
          <div className="text-[10px] md:text-xs text-gray-500 mt-0.5">今日营收</div>
        </div>
      </div>

      {/* Simulate Form */}
      <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-100">
        <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
          ☕ 模拟出咖啡（展会用）
        </div>

        <label className="block text-[10px] font-medium text-gray-500 mb-1">
          投资人姓名
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Dato Sri Ahmad"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2"
          style={{ "--tw-ring-color": "#C8111A" } as React.CSSProperties}
        />

        <label className="block text-[10px] font-medium text-gray-500 mb-1">
          饮品
        </label>
        <select
          value={selectedDrink.name}
          onChange={(e) =>
            setSelectedDrink(
              DRINKS.find((d) => d.name === e.target.value) || DRINKS[0]
            )
          }
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none"
        >
          {DRINKS.map((d) => (
            <option key={d.name} value={d.name}>
              {d.name} — RM {d.price.toFixed(2)}
            </option>
          ))}
        </select>

        <button
          onClick={handleSimulate}
          disabled={sending || !name.trim()}
          className="w-full text-white font-semibold rounded-lg py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          style={{ background: sent ? "#0F6E56" : "#C8111A" }}
        >
          {sent
            ? "✅ 已发送！"
            : sending
            ? "发送中..."
            : "☕ 模拟出咖啡"}
        </button>

        <div className="text-[10px] text-gray-400 mt-3 text-center">
          🎬 按下后大屏幕 <code className="bg-gray-100 px-1 rounded">/screen</code> 实时跳出名字
        </div>
      </div>
    </div>
  );
}
