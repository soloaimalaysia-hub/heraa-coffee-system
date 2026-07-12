"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface Overview {
  total_members: number;
  new_members: number;
  dau: number;
  dau_7d_avg: number;
  total_redemptions: number;
  total_revenue: number;
  watering_rate: number;
  conversion_rate: number;
}

interface Funnel {
  app_open: number;
  wallet_viewed: number;
  redeem_clicked: number;
  redeem_success: number;
}

interface Gamification {
  today_watering: number;
  total_garden_users: number;
  ready_users: number;
  avg_day_count: number;
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
}

function downloadCSV(filename: string, csv: string) {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AnalyticsTab() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [gami, setGami] = useState<Gamification | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState("");

  const load = useCallback(async () => {
    const [ov, fn, gm] = await Promise.all([
      supabase.rpc("heraa_analytics_overview", { p_days: 30 }),
      supabase.rpc("heraa_analytics_funnel", { p_days: 7 }),
      supabase.rpc("heraa_analytics_gamification"),
    ]);
    if (ov.data) setOverview(ov.data);
    if (fn.data) setFunnel(fn.data);
    if (gm.data) setGami(gm.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  async function exportUsers() {
    setExporting("users");
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 90);
    const { data } = await supabase.rpc("heraa_analytics_export_users", {
      p_start: start.toISOString().slice(0, 10),
      p_end: end.toISOString().slice(0, 10),
    });
    if (data)
      downloadCSV(
        `heraa_users_${end.toISOString().slice(0, 10)}.csv`,
        toCSV(data)
      );
    setExporting("");
  }

  async function exportTx() {
    setExporting("tx");
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 90);
    const { data } = await supabase.rpc(
      "heraa_analytics_export_transactions",
      {
        p_start: start.toISOString().slice(0, 10),
        p_end: end.toISOString().slice(0, 10),
      }
    );
    if (data)
      downloadCSV(
        `heraa_transactions_${end.toISOString().slice(0, 10)}.csv`,
        toCSV(data)
      );
    setExporting("");
  }

  const funnelSteps = funnel
    ? [
        { label: "打开 App", value: funnel.app_open },
        { label: "看钱包", value: funnel.wallet_viewed },
        { label: "按兑换", value: funnel.redeem_clicked },
        { label: "成功兑换", value: funnel.redeem_success },
      ]
    : [];
  const funnelMax = Math.max(1, ...funnelSteps.map((s) => s.value));

  return (
    <div className="space-y-3 md:space-y-4">
      {/* KPI Grid */}
      <div className="bg-white rounded-xl p-3 md:p-5 border border-gray-100">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wide">
            📊 数据报表 · 近 30 天
          </div>
          <button
            onClick={load}
            className="text-[10px] md:text-xs text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            🔄 刷新
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Kpi
            label="总会员"
            value={overview?.total_members ?? 0}
            sub={`+${overview?.new_members ?? 0} 新增`}
          />
          <Kpi
            label="今日活跃"
            value={overview?.dau ?? 0}
            sub={`7 日均 ${overview?.dau_7d_avg ?? 0}`}
          />
          <Kpi
            label="30 日营收"
            value={`RM ${Number(overview?.total_revenue ?? 0).toFixed(0)}`}
            sub={`${overview?.total_redemptions ?? 0} 笔兑换`}
          />
          <Kpi
            label="游戏参与"
            value={gami?.total_garden_users ?? 0}
            sub={`${overview?.watering_rate ?? 0}% 今日浇水`}
          />
        </div>
      </div>

      {/* Funnel + Gamification side-by-side on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
      <div className="bg-white rounded-xl p-3 md:p-5 border border-gray-100">
        <div className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          用户漏斗 · 近 7 天
        </div>
        {funnelSteps.map((step, i) => {
          const pct = funnelMax > 0 ? (step.value / funnelMax) * 100 : 0;
          const conv =
            i === 0 || funnelSteps[i - 1].value === 0
              ? null
              : ((step.value / funnelSteps[i - 1].value) * 100).toFixed(0);
          return (
            <div key={step.label} className="mb-2">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-gray-600">{step.label}</span>
                <span className="font-semibold" style={{ color: "#C8111A" }}>
                  {step.value}
                  {conv !== null && (
                    <span className="text-gray-400 ml-1 text-[10px]">
                      ({conv}%)
                    </span>
                  )}
                </span>
              </div>
              <div className="h-4 bg-gray-100 rounded overflow-hidden">
                <div
                  className="h-full transition-all duration-500 rounded"
                  style={{ width: `${pct}%`, background: "#C8111A" }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Gamification */}
      <div
        className="rounded-xl p-3 md:p-5 border"
        style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}
      >
        <div
          className="text-xs md:text-sm font-semibold mb-2 md:mb-3 uppercase tracking-wide"
          style={{ color: "#0F6E56" }}
        >
          🌱 咖啡豆游戏
        </div>
        <div className="grid grid-cols-4 gap-2 md:gap-3 text-center">
          <Mini label="今日浇水" value={gami?.today_watering ?? 0} />
          <Mini label="参与用户" value={gami?.total_garden_users ?? 0} />
          <Mini label="已到 30 天" value={gami?.ready_users ?? 0} />
          <Mini label="平均天数" value={gami?.avg_day_count ?? 0} />
        </div>
      </div>
      </div>

      {/* Export */}
      <div className="bg-white rounded-xl p-3 md:p-5 border border-gray-100">
        <div className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          📥 数据导出
        </div>
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <button
            onClick={exportUsers}
            disabled={exporting !== ""}
            className="border border-gray-200 rounded-lg py-2.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {exporting === "users" ? "导出中..." : "📥 用户 CSV"}
          </button>
          <button
            onClick={exportTx}
            disabled={exporting !== ""}
            className="border border-gray-200 rounded-lg py-2.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {exporting === "tx" ? "导出中..." : "📥 交易 CSV"}
          </button>
        </div>
        <div className="text-[9px] text-gray-400 mt-2 text-center">
          导出近 90 天数据 · UTF-8 BOM · Excel 直接打开
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="rounded-lg p-3" style={{ background: "#FFF3F3" }}>
      <div className="text-[9px] text-gray-500 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-xl font-bold my-0.5" style={{ color: "#C8111A" }}>
        {value}
      </div>
      <div className="text-[9px] text-gray-400">{sub}</div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-sm font-bold" style={{ color: "#0F6E56" }}>
        {value}
      </div>
      <div className="text-[9px]" style={{ color: "#0F6E56", opacity: 0.7 }}>
        {label}
      </div>
    </div>
  );
}
