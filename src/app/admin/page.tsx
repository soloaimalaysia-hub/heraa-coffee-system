"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import Analytics from "./Analytics";

interface Stats {
  today_cups: number;
  total_members: number;
  today_revenue: number;
}

interface TxRow {
  id: string;
  member_name: string;
  drink_name: string;
  amount: number;
  created_at: string;
  isNew?: boolean;
}

const DRINKS = [
  { name: "Heraa Signature Latte", price: 6.5 },
  { name: "Heraa Americano", price: 6.0 },
  { name: "Heraa Mocha", price: 7.0 },
  { name: "Heraa Iced Latte", price: 6.5 },
  { name: "Heraa Cappuccino", price: 6.5 },
];

function AdminContent() {
  const searchParams = useSearchParams();
  const key = searchParams.get("key");

  const [stats, setStats] = useState<Stats>({
    today_cups: 0,
    total_members: 0,
    today_revenue: 0,
  });
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [name, setName] = useState("");
  const [selectedDrink, setSelectedDrink] = useState(DRINKS[0]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [waMsg, setWaMsg] = useState("");
  const [waTarget, setWaTarget] = useState("all");
  const [waSending, setWaSending] = useState(false);
  const [waResult, setWaResult] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState("");
  const txRef = useRef<TxRow[]>([]);

  const loadData = useCallback(async () => {
    const { data: statsData } = await supabase.rpc("heraa_screen_stats");
    if (statsData) setStats(statsData);

    const { data: feedData } = await supabase.rpc("heraa_screen_feed", {
      p_limit: 10,
    });
    if (feedData) {
      const mapped = feedData.map((f: { member_name: string; drink_name: string; amount: number; created_at: string }, i: number) => ({
        id: `init-${i}`,
        member_name: f.member_name,
        drink_name: f.drink_name,
        amount: f.amount,
        created_at: f.created_at,
      }));
      setTransactions(mapped);
      txRef.current = mapped;
    }
  }, []);

  useEffect(() => {
    if (key !== "heraa2026") return;

    loadData();
    const interval = setInterval(loadData, 5000);

    const channel = supabase
      .channel("heraa-admin")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "heraa_transactions",
        },
        async (payload) => {
          const record = payload.new as {
            id: string;
            member_id: string;
            description: string;
            amount: number;
            type: string;
            created_at: string;
          };

          if (record.type !== "debit") return;

          const { data: memberName } = await supabase.rpc(
            "heraa_get_member_name",
            { p_member_id: record.member_id }
          );

          const newTx: TxRow = {
            id: record.id,
            member_name: memberName || "Member",
            drink_name: record.description,
            amount: record.amount,
            created_at: record.created_at,
            isNew: true,
          };

          txRef.current = [newTx, ...txRef.current].slice(0, 10);
          setTransactions([...txRef.current]);

          setStats((prev) => ({
            ...prev,
            today_cups: prev.today_cups + 1,
            today_revenue: prev.today_revenue + record.amount,
          }));

          setTimeout(() => {
            txRef.current = txRef.current.map((t) =>
              t.id === record.id ? { ...t, isNew: false } : t
            );
            setTransactions([...txRef.current]);
          }, 1000);
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [key, loadData]);

  if (key !== "heraa2026") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <div className="text-sm text-gray-400">
            Access denied. Add ?key=heraa2026 to URL.
          </div>
        </div>
      </div>
    );
  }

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
  }

  const usageRate =
    stats.total_members > 0
      ? Math.round(
          (stats.today_cups / (stats.total_members * 3)) * 100
        )
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ background: "#C8111A" }}
      >
        <div className="w-2 h-2 rounded-full bg-white/50" />
        <div className="text-white text-sm font-semibold">
          Heraa Coffee · Admin
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        {/* Analytics Dashboard (Top) */}
        <Analytics />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatCard value={stats.today_cups} label="今日杯数" />
          <StatCard
            value={`RM ${stats.today_revenue.toFixed(0)}`}
            label="今日营收"
          />
          <StatCard value={stats.total_members} label="会员总数" />
          <StatCard value={`${Math.min(usageRate, 100)}%`} label="补贴使用率" />
        </div>

        {/* Simulate Section */}
        <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
            模拟出咖啡（展会用）
          </div>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="投资人姓名 e.g. Dato Sri Ahmad"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2"
            style={
              { "--tw-ring-color": "#C8111A" } as React.CSSProperties
            }
          />

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
            style={{
              background: sent ? "#1a8a3a" : "#C8111A",
            }}
          >
            {sent ? "✅ 已发送！" : sending ? "发送中..." : "☕ 模拟出咖啡"}
          </button>
        </div>

        {/* WhatsApp Broadcast */}
        <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
            📱 WhatsApp 推送中心
          </div>

          {/* Quick Test */}
          <button
            onClick={async () => {
              setTestSending(true);
              setTestResult("");
              try {
                const res = await fetch("/api/send-whatsapp", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "x-admin-key": "heraa2026",
                  },
                  body: JSON.stringify({
                    to: process.env.NEXT_PUBLIC_TWILIO_TEST_TO || "whatsapp:+60169212796",
                    message: "☕ Heraa Coffee 测试消息\n\n系统运作正常！展会准备就绪 🔥",
                  }),
                });
                const data = await res.json();
                setTestResult(data.success ? "✅ 测试消息已发送！" : `❌ ${data.error}`);
              } catch (err: unknown) {
                setTestResult(`❌ ${(err as Error).message}`);
              }
              setTestSending(false);
            }}
            disabled={testSending}
            className="w-full border border-green-200 bg-green-50 text-green-700 font-semibold rounded-lg py-2.5 text-xs mb-3 disabled:opacity-50"
          >
            {testSending ? "发送中..." : "🧪 发送测试消息给 Captain K"}
          </button>
          {testResult && (
            <div className="text-xs mb-3 px-2">{testResult}</div>
          )}

          {/* Manual Daily Reminder Trigger */}
          <button
            onClick={async () => {
              setTestSending(true);
              setTestResult("");
              try {
                const res = await fetch("/api/daily-reminder", {
                  method: "POST",
                  headers: { "x-admin-key": "heraa2026" },
                });
                const data = await res.json();
                setTestResult(
                  data.sent > 0
                    ? `✅ 已发送 ${data.sent}/${data.total} 人浇水提醒`
                    : `ℹ️ ${data.message || "没有需要提醒的会员"}`
                );
              } catch (err: unknown) {
                setTestResult(`❌ ${(err as Error).message}`);
              }
              setTestSending(false);
            }}
            disabled={testSending}
            className="w-full border border-orange-200 bg-orange-50 text-orange-700 font-semibold rounded-lg py-2.5 text-xs mb-3 disabled:opacity-50"
          >
            {testSending ? "发送中..." : "🌱 手动触发每日浇水提醒"}
          </button>

          <div className="text-[10px] text-gray-400 mb-3 px-1">
            ⏰ 自动提醒已配置：每天 9:00am MYT 自动发送给未浇水会员
          </div>

          <div className="border-t border-gray-100 pt-3 mt-1">
            <textarea
              value={waMsg}
              onChange={(e) => setWaMsg(e.target.value)}
              placeholder="输入推送消息内容..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none resize-none"
            />

            <select
              value={waTarget}
              onChange={(e) => setWaTarget(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none"
            >
              <option value="all">全部会员</option>
              <option value="low_balance">余额 &lt; RM10</option>
            </select>

            <button
              onClick={async () => {
                if (!waMsg.trim()) return;
                setWaSending(true);
                setWaResult("");
                try {
                  const res = await fetch("/api/broadcast", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "x-admin-key": "heraa2026",
                    },
                    body: JSON.stringify({ message: waMsg, target: waTarget }),
                  });
                  const data = await res.json();
                  setWaResult(`✅ 已发送 ${data.sent}/${data.total} 人`);
                  if (data.errors?.length > 0) {
                    setWaResult((prev) => prev + ` (${data.errors.length} 失败)`);
                  }
                  setWaMsg("");
                } catch (err: unknown) {
                  setWaResult(`❌ ${(err as Error).message}`);
                }
                setWaSending(false);
              }}
              disabled={waSending || !waMsg.trim()}
              className="w-full text-white font-semibold rounded-lg py-2.5 text-sm disabled:opacity-50"
              style={{ background: "#25D366" }}
            >
              {waSending ? "发送中..." : "📱 发送 WhatsApp"}
            </button>
            {waResult && (
              <div className="text-xs mt-2 px-2">{waResult}</div>
            )}
          </div>
        </div>

        {/* Transaction Feed */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-2 border-b border-gray-100">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              实时交易流水
            </div>
          </div>
          {transactions.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-300">
              暂无交易
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex justify-between items-center px-4 py-2.5 border-b border-gray-50 transition-colors duration-1000"
                style={{
                  background: tx.isNew ? "#FFF3F3" : "transparent",
                }}
              >
                <div>
                  <div className="text-xs font-medium text-gray-700">
                    {tx.member_name}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {new Date(tx.created_at).toLocaleTimeString("zh-CN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </div>
                </div>
                <div className="text-xs font-medium" style={{ color: "#C8111A" }}>
                  {tx.drink_name}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <div
      className="rounded-lg p-3 text-center"
      style={{ background: "#FFF3F3" }}
    >
      <div className="text-xl font-bold" style={{ color: "#C8111A" }}>
        {value}
      </div>
      <div className="text-[9px] text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse font-bold" style={{ color: "#C8111A" }}>
            加载中...
          </div>
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
