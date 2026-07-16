"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchMe, Transaction } from "@/lib/session";
import { track } from "@/lib/track";
import { useLang } from "@/lib/LanguageContext";
import BottomNav from "@/components/BottomNav";

type Filter = "all" | "success" | "failed";

export default function HistoryPage() {
  const { t } = useLang();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  const loadData = useCallback(async () => {
    const me = await fetchMe();
    if (!me) {
      router.replace("/login");
      return;
    }
    setTransactions(me.transactions);
    setLoading(false);
    track("history_viewed", me.member.id);
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = transactions.filter((tx) => {
    if (filter === "success") return tx.type === "debit" || tx.type === "credit";
    if (filter === "failed") return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse font-bold text-lg" style={{ color: "#C8111A" }}>
          HERAA COFFEE
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white pb-20">
      {/* Header */}
      <div className="py-8 text-center" style={{ background: "#C8111A" }}>
        <div className="text-white font-bold text-lg tracking-widest">
          HERAA COFFEE
        </div>
        <div className="text-white/70 text-xs mt-1">{t.historyTitle}</div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-100">
        {(["all", "success", "failed"] as Filter[]).map((f) => {
          const label = f === "all" ? t.historyAll : f === "success" ? t.historySuccess : t.historyFailed;
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="flex-1 py-3 text-sm font-medium transition-colors"
              style={{
                color: active ? "#C8111A" : "#888",
                borderBottom: active ? "2px solid #C8111A" : "2px solid transparent",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Transaction List */}
      <div className="flex-1 px-4 py-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-4xl mb-3">📋</span>
            <span className="text-sm text-gray-400">{t.historyEmpty}</span>
          </div>
        ) : (
          filtered.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between py-4 border-b border-gray-50"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                  style={{
                    background: tx.type === "credit" ? "#f0fdf4" : "#FFF5F5",
                  }}
                >
                  {tx.type === "credit" ? "💰" : "☕"}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">{tx.description}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(tx.created_at).toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "numeric",
                      day: "numeric",
                    })}{" "}
                    {new Date(tx.created_at).toLocaleTimeString("zh-CN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className="text-sm font-bold"
                  style={{ color: tx.type === "credit" ? "#1a8a3a" : "#C8111A" }}
                >
                  {tx.type === "credit" ? "+" : "-"}RM {Number(tx.amount).toFixed(2)}
                </div>
                <div
                  className="text-[10px] font-medium mt-0.5 px-1.5 py-0.5 rounded inline-block"
                  style={{
                    background: tx.type === "credit" ? "#dcfce7" : "#fee2e2",
                    color: tx.type === "credit" ? "#16a34a" : "#C8111A",
                  }}
                >
                  {tx.type === "credit" ? t.historyCredit : t.historyDebit}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
