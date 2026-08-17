"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchMe } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/track";
import { useLang } from "@/lib/LanguageContext";
import BottomNav from "@/components/BottomNav";

type Filter = "all" | "success" | "failed";

interface Item {
  id: string;
  kind: "rm" | "credit";
  title: string;
  subtitle: string;
  amountLabel: string;
  amountColor: string;
  status: "success" | "failed";
  imageUrl: string | null;
  created_at: string;
}

export default function HistoryPage() {
  const { t, lang } = useLang();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  const loadData = useCallback(async () => {
    const me = await fetchMe();
    if (!me) {
      router.replace("/login");
      return;
    }

    const rmItems: Item[] = me.transactions.map((tx) => ({
      id: `rm-${tx.id}`,
      kind: "rm",
      title: tx.description,
      subtitle: new Date(tx.created_at).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" }) +
        " " + new Date(tx.created_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      amountLabel: `${tx.type === "credit" ? "+" : "-"}RM ${Number(tx.amount).toFixed(2)}`,
      amountColor: tx.type === "credit" ? "#1a8a3a" : "#C8111A",
      status: "success",
      imageUrl: null,
      created_at: tx.created_at,
    }));

    const { data: creditTx } = await supabase
      .from("heraa_package_transactions")
      .select("id, credits_used, status, created_at, heraa_products(name_zh,name_en,image_url), heraa_machines(code)")
      .eq("member_id", me.member.id)
      .order("created_at", { ascending: false });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const creditItems: Item[] = (creditTx || []).map((tx: any) => ({
      id: `credit-${tx.id}`,
      kind: "credit",
      title: lang === "zh" ? tx.heraa_products?.name_zh : tx.heraa_products?.name_en,
      subtitle: `${tx.heraa_machines?.code || ""}  ${new Date(tx.created_at).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })} ${new Date(tx.created_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`,
      amountLabel: `-${tx.credits_used} Credit`,
      amountColor: "#C8111A",
      status: tx.status === "failed" ? "failed" : "success",
      imageUrl: tx.heraa_products?.image_url || null,
      created_at: tx.created_at,
    }));

    const merged = [...rmItems, ...creditItems].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setItems(merged);
    setLoading(false);
    track("history_viewed", me.member.id);
  }, [router, lang]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = items.filter((it) => {
    if (filter === "success") return it.status === "success";
    if (filter === "failed") return it.status === "failed";
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
    <div className="min-h-screen flex flex-col bg-white pb-20 md:pb-0 md:pl-[84px]">
      <div className="py-8 text-center" style={{ background: "#C8111A" }}>
        <div className="text-white font-bold text-lg tracking-widest">HERAA COFFEE</div>
        <div className="text-white/70 text-xs mt-1">{t.historyTitle}</div>
      </div>

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

      <div className="flex-1 px-4 py-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-4xl mb-3">📋</span>
            <span className="text-sm text-gray-400">{t.historyEmpty}</span>
          </div>
        ) : (
          filtered.map((it) => (
            <div key={it.id} className="flex items-center justify-between py-4 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg overflow-hidden shrink-0"
                  style={{ background: it.kind === "credit" ? "#8BC34A" : it.amountColor === "#1a8a3a" ? "#f0fdf4" : "#FFF5F5" }}
                >
                  {it.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : it.kind === "credit" ? (
                    "🥤"
                  ) : it.amountColor === "#1a8a3a" ? (
                    "💰"
                  ) : (
                    "☕"
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">{it.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{it.subtitle}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold" style={{ color: it.amountColor }}>
                  {it.amountLabel}
                </div>
                <div
                  className="text-[10px] font-medium mt-0.5 px-1.5 py-0.5 rounded inline-block"
                  style={{
                    background: it.status === "success" ? "#dcfce7" : "#fee2e2",
                    color: it.status === "success" ? "#16a34a" : "#C8111A",
                  }}
                >
                  {it.status === "success" ? t.historySuccess : t.historyFailed}
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
