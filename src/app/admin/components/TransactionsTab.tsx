"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface TxRow {
  id: string;
  member_name: string;
  drink_name: string;
  amount: number;
  type: string;
  created_at: string;
  isNew?: boolean;
}

export default function TransactionsTab() {
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const txRef = useRef<TxRow[]>([]);

  const loadData = useCallback(async () => {
    const { data } = await supabase.rpc("heraa_screen_feed", { p_limit: 20 });
    if (data) {
      const mapped = data.map(
        (
          f: {
            member_name: string;
            drink_name: string;
            amount: number;
            created_at: string;
          },
          i: number
        ) => ({
          id: `init-${i}-${f.created_at}`,
          member_name: f.member_name,
          drink_name: f.drink_name,
          amount: f.amount,
          type: "debit",
          created_at: f.created_at,
        })
      );
      setTransactions(mapped);
      txRef.current = mapped;
    }
  }, []);

  useEffect(() => {
    loadData();
    const channel = supabase
      .channel("heraa-admin-transactions")
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

          const { data: memberName } = await supabase.rpc(
            "heraa_get_member_name",
            { p_member_id: record.member_id }
          );

          const newTx: TxRow = {
            id: record.id,
            member_name: memberName || "Member",
            drink_name: record.description,
            amount: record.amount,
            type: record.type,
            created_at: record.created_at,
            isNew: true,
          };

          txRef.current = [newTx, ...txRef.current].slice(0, 20);
          setTransactions([...txRef.current]);

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
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          🧾 实时交易流水
        </div>
        <div className="flex items-center gap-1 text-[10px] text-gray-400">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "#0F6E56" }}
          />
          Realtime
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="p-8 text-center text-xs text-gray-300">
          暂无交易记录
        </div>
      ) : (
        <>
        {/* Desktop table header */}
        <div className="hidden md:grid md:grid-cols-[2fr_1fr_2fr_1fr] gap-4 px-6 py-2 bg-gray-50 border-b border-gray-100">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">会员</div>
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">时间</div>
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">饮品</div>
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide text-right">金额</div>
        </div>
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="md:grid md:grid-cols-[2fr_1fr_2fr_1fr] md:gap-4 md:items-center flex justify-between items-center px-4 md:px-6 py-3 border-b border-gray-50 transition-colors duration-1000"
            style={{ background: tx.isNew ? "#FFF3F3" : "transparent" }}
          >
            <div className="md:contents">
              <div className="text-xs md:text-sm font-medium text-gray-800">
                {tx.member_name}
              </div>
              <div className="hidden md:block text-[11px] text-gray-500">
                {new Date(tx.created_at).toLocaleTimeString("zh-CN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </div>
              <div className="hidden md:block text-[11px] text-gray-600">
                {tx.drink_name}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5 md:hidden">
                {new Date(tx.created_at).toLocaleTimeString("zh-CN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}{" "}
                · {tx.drink_name}
              </div>
            </div>
            <div
              className="text-xs md:text-sm font-semibold px-2 py-1 rounded-md md:justify-self-end whitespace-nowrap"
              style={{
                background: tx.type === "credit" ? "#dcfce7" : "#FFE4E4",
                color: tx.type === "credit" ? "#0F6E56" : "#C8111A",
              }}
            >
              {tx.type === "credit" ? "+" : "-"}RM {Number(tx.amount).toFixed(2)}
            </div>
          </div>
        ))}
        </>
      )}
      <div className="px-4 py-2 text-[10px] text-gray-400 text-center">
        显示最新 {transactions.length} 笔交易
      </div>
    </div>
  );
}
