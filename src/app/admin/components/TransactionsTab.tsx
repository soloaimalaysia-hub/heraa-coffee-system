"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/lib/LanguageContext";

interface TxRow {
  id: string;
  member_name: string;
  drink_name: string;
  amount: number;
  type: string;
  unit: "rm" | "credit";
  created_at: string;
  isNew?: boolean;
}

export default function TransactionsTab() {
  const { t } = useLang();
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const txRef = useRef<TxRow[]>([]);

  const loadData = useCallback(async () => {
    const [{ data: rmFeed }, { data: creditFeed }] = await Promise.all([
      supabase.rpc("heraa_screen_feed", { p_limit: 20 }),
      supabase.rpc("heraa_admin_recent_credit_transactions", { p_limit: 20 }),
    ]);

    const rmRows: TxRow[] = (rmFeed || []).map(
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
        unit: "rm" as const,
        created_at: f.created_at,
      })
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const creditRows: TxRow[] = (creditFeed || []).map((f: any) => ({
      id: `credit-${f.id}`,
      member_name: f.member_name || "Member",
      drink_name: f.drink_name || "-",
      amount: f.credits_used,
      type: f.status === "failed" ? "credit" : "debit",
      unit: "credit" as const,
      created_at: f.created_at,
    }));

    const merged = [...rmRows, ...creditRows]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20);

    setTransactions(merged);
    txRef.current = merged;
  }, []);

  useEffect(() => {
    loadData();

    function pushNew(newTx: TxRow) {
      txRef.current = [newTx, ...txRef.current].slice(0, 20);
      setTransactions([...txRef.current]);
      setTimeout(() => {
        txRef.current = txRef.current.map((t) =>
          t.id === newTx.id ? { ...t, isNew: false } : t
        );
        setTransactions([...txRef.current]);
      }, 1000);
    }

    const rmChannel = supabase
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

          pushNew({
            id: record.id,
            member_name: memberName || "Member",
            drink_name: record.description,
            amount: record.amount,
            type: record.type,
            unit: "rm",
            created_at: record.created_at,
            isNew: true,
          });
        }
      )
      .subscribe();

    const creditChannel = supabase
      .channel("heraa-admin-credit-transactions")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "heraa_package_transactions",
        },
        async (payload) => {
          const record = payload.new as {
            id: string;
            member_id: string;
            product_id: string;
            credits_used: number;
            status: string;
            created_at: string;
          };

          const [{ data: memberName }, { data: product }] = await Promise.all([
            supabase.rpc("heraa_get_member_name", { p_member_id: record.member_id }),
            supabase.from("heraa_products").select("name_zh,name_en").eq("id", record.product_id).single(),
          ]);

          pushNew({
            id: `credit-${record.id}`,
            member_name: memberName || "Member",
            drink_name: product?.name_zh || product?.name_en || "-",
            amount: record.credits_used,
            type: record.status === "failed" ? "credit" : "debit",
            unit: "credit",
            created_at: record.created_at,
            isNew: true,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(rmChannel);
      supabase.removeChannel(creditChannel);
    };
  }, [loadData]);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          🧾 {t.txnTitle}
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
          {t.txnEmpty}
        </div>
      ) : (
        <>
        {/* Desktop table header */}
        <div className="hidden md:grid md:grid-cols-[2fr_1fr_2fr_1fr] gap-4 px-6 py-2 bg-gray-50 border-b border-gray-100">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{t.txnMember}</div>
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{t.txnTime}</div>
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{t.txnDrink}</div>
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide text-right">{t.txnAmount}</div>
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
            <div className="flex items-center gap-1.5 md:justify-self-end">
              <span
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap"
                style={{
                  background: tx.unit === "credit" ? "#FFF3E0" : "#EEF2FF",
                  color: tx.unit === "credit" ? "#B8860B" : "#4338CA",
                }}
              >
                {tx.unit === "credit" ? "Credits" : "RM"}
              </span>
              <div
                className="text-xs md:text-sm font-semibold px-2 py-1 rounded-md whitespace-nowrap"
                style={{
                  background: tx.type === "credit" ? "#dcfce7" : "#FFE4E4",
                  color: tx.type === "credit" ? "#0F6E56" : "#C8111A",
                }}
              >
                {tx.type === "credit" ? "+" : "-"}
                {tx.unit === "credit" ? `${tx.amount} Credit` : `RM ${Number(tx.amount).toFixed(2)}`}
              </div>
            </div>
          </div>
        ))}
        </>
      )}
      <div className="px-4 py-2 text-[10px] text-gray-400 text-center">
        {t.txnLatest} {transactions.length} {t.txnRecords}
      </div>
    </div>
  );
}
