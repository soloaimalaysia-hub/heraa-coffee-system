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

interface DailyRow {
  d: string;
  new_users: number;
  active_users: number;
  redemptions: number;
  revenue: number;
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

export default function Analytics() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [gami, setGami] = useState<Gamification | null>(null);
  const [exporting, setExporting] = useState("");

  const load = useCallback(async () => {
    const [ov, dl, fn, gm] = await Promise.all([
      supabase.rpc("heraa_analytics_overview", { p_days: 30 }),
      supabase.rpc("heraa_analytics_daily", { p_days: 30 }),
      supabase.rpc("heraa_analytics_funnel", { p_days: 7 }),
      supabase.rpc("heraa_analytics_gamification"),
    ]);
    if (ov.data) setOverview(ov.data);
    if (dl.data) setDaily(dl.data);
    if (fn.data) setFunnel(fn.data);
    if (gm.data) setGami(gm.data);
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
    if (data) downloadCSV(`heraa_users_${end.toISOString().slice(0, 10)}.csv`, toCSV(data));
    setExporting("");
  }

  async function exportTransactions() {
    setExporting("tx");
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 90);
    const { data } = await supabase.rpc("heraa_analytics_export_transactions", {
      p_start: start.toISOString().slice(0, 10),
      p_end: end.toISOString().slice(0, 10),
    });
    if (data)
      downloadCSV(`heraa_transactions_${end.toISOString().slice(0, 10)}.csv`, toCSV(data));
    setExporting("");
  }

  const maxUsers = Math.max(1, ...daily.map((d) => d.new_users));
  const maxRedeem = Math.max(1, ...daily.map((d) => d.redemptions));

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
    <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          📊 数据报表 · 近 30 天
        </div>
        <button
          onClick={load}
          className="text-[10px] text-gray-400 hover:text-gray-600"
        >
          🔄 刷新
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <KpiCard
          label="总会员"
          value={overview?.total_members ?? 0}
          sub={`+${overview?.new_members ?? 0} 新增`}
        />
        <KpiCard
          label="今日活跃"
          value={overview?.dau ?? 0}
          sub={`7日均 ${overview?.dau_7d_avg ?? 0}`}
        />
        <KpiCard
          label="兑换转化"
          value={`${overview?.conversion_rate ?? 0}%`}
          sub="打开 → 成功兑换"
        />
        <KpiCard
          label="30日营收"
          value={`RM ${Number(overview?.total_revenue ?? 0).toFixed(0)}`}
          sub={`${overview?.total_redemptions ?? 0} 笔`}
        />
      </div>

      {/* Trend Chart */}
      <div className="mb-4 rounded-lg p-3" style={{ background: "#FFF3F3" }}>
        <div className="text-[10px] font-semibold text-gray-500 mb-2 flex items-center gap-3">
          <span>30 天趋势</span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block w-2 h-2 rounded"
              style={{ background: "#3b82f6" }}
            />
            新用户
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block w-2 h-2 rounded"
              style={{ background: "#C8111A" }}
            />
            兑换
          </span>
        </div>
        <div className="flex items-end gap-[2px] h-24">
          {daily.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end gap-[1px]">
              <div
                className="rounded-t"
                style={{
                  height: `${(d.new_users / maxUsers) * 45}%`,
                  background: "#3b82f6",
                  minHeight: d.new_users > 0 ? "2px" : "0",
                }}
                title={`${d.d}: +${d.new_users} 新用户`}
              />
              <div
                className="rounded-t"
                style={{
                  height: `${(d.redemptions / maxRedeem) * 45}%`,
                  background: "#C8111A",
                  minHeight: d.redemptions > 0 ? "2px" : "0",
                }}
                title={`${d.d}: ${d.redemptions} 兑换`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-gray-400 mt-1">
          <span>{daily[0]?.d?.slice(5)}</span>
          <span>{daily[daily.length - 1]?.d?.slice(5)}</span>
        </div>
      </div>

      {/* Funnel */}
      <div className="mb-4">
        <div className="text-[10px] font-semibold text-gray-500 mb-2 uppercase">
          用户漏斗 · 近 7 天
        </div>
        {funnelSteps.map((step, i) => {
          const pct = funnelMax > 0 ? (step.value / funnelMax) * 100 : 0;
          const conv =
            i === 0 || funnelSteps[i - 1].value === 0
              ? null
              : ((step.value / funnelSteps[i - 1].value) * 100).toFixed(0);
          return (
            <div key={step.label} className="mb-1.5">
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-gray-600">{step.label}</span>
                <span className="font-semibold" style={{ color: "#C8111A" }}>
                  {step.value}
                  {conv !== null && (
                    <span className="text-gray-400 ml-1">({conv}%)</span>
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
      <div className="mb-4 rounded-lg p-3" style={{ background: "#f0fdf4" }}>
        <div className="text-[10px] font-semibold text-green-700 mb-2 uppercase">
          🌱 咖啡豆游戏数据
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <MiniStat label="今日浇水" value={gami?.today_watering ?? 0} />
          <MiniStat label="参与用户" value={gami?.total_garden_users ?? 0} />
          <MiniStat label="已到30天" value={gami?.ready_users ?? 0} />
          <MiniStat label="平均天数" value={gami?.avg_day_count ?? 0} />
        </div>
        <div className="text-[10px] text-green-600 mt-2 text-center">
          参与率：<span className="font-bold">{overview?.watering_rate ?? 0}%</span>
        </div>
      </div>

      {/* Export */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={exportUsers}
          disabled={exporting !== ""}
          className="border border-gray-200 rounded-lg py-2 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {exporting === "users" ? "导出中..." : "📥 导出用户 CSV"}
        </button>
        <button
          onClick={exportTransactions}
          disabled={exporting !== ""}
          className="border border-gray-200 rounded-lg py-2 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {exporting === "tx" ? "导出中..." : "📥 导出交易 CSV"}
        </button>
      </div>
      <div className="text-[9px] text-gray-400 mt-2 text-center">
        导出近 90 天数据 · 排除 demo 用户
      </div>
    </div>
  );
}

function KpiCard({
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

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <div className="text-sm font-bold text-green-700">{value}</div>
      <div className="text-[9px] text-green-500">{label}</div>
    </div>
  );
}
