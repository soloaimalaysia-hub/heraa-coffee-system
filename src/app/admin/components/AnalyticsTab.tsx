"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/lib/LanguageContext";

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
  const { t } = useLang();
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
        { label: t.funnelOpen, value: funnel.app_open },
        { label: t.funnelWallet, value: funnel.wallet_viewed },
        { label: t.funnelRedeem, value: funnel.redeem_clicked },
        { label: t.funnelSuccess, value: funnel.redeem_success },
      ]
    : [];
  const funnelMax = Math.max(1, ...funnelSteps.map((s) => s.value));

  return (
    <div className="space-y-3 md:space-y-4">
      {/* KPI Grid */}
      <div className="bg-white rounded-xl p-3 md:p-5 border border-gray-100">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wide">
            📊 {t.analyticsTitle}
          </div>
          <button
            onClick={load}
            className="text-[10px] md:text-xs text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            🔄 {t.refresh}
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Kpi
            label={t.totalMembers}
            value={overview?.total_members ?? 0}
            sub={`+${overview?.new_members ?? 0} ${t.newMembers}`}
          />
          <Kpi
            label={t.todayActive}
            value={overview?.dau ?? 0}
            sub={`${t.dayAvg} ${overview?.dau_7d_avg ?? 0}`}
          />
          <Kpi
            label={t.revenue30d}
            value={`RM ${Number(overview?.total_revenue ?? 0).toFixed(0)}`}
            sub={`${overview?.total_redemptions ?? 0} ${t.redemptions}`}
          />
          <Kpi
            label={t.gameParticipants}
            value={gami?.total_garden_users ?? 0}
            sub={`${overview?.watering_rate ?? 0}% ${t.todayWatering}`}
          />
        </div>
      </div>

      {/* Funnel + Gamification side-by-side on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
      <div className="bg-white rounded-xl p-3 md:p-5 border border-gray-100">
        <div className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {t.funnelTitle}
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
          🌱 {t.gameTitle}
        </div>
        <div className="grid grid-cols-4 gap-2 md:gap-3 text-center">
          <Mini label={t.gameWatering} value={gami?.today_watering ?? 0} />
          <Mini label={t.gameUsers} value={gami?.total_garden_users ?? 0} />
          <Mini label={t.game30days} value={gami?.ready_users ?? 0} />
          <Mini label={t.gameAvgDays} value={gami?.avg_day_count ?? 0} />
        </div>
      </div>
      </div>

      {/* Export */}
      <div className="bg-white rounded-xl p-3 md:p-5 border border-gray-100">
        <div className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          📥 {t.exportTitle}
        </div>
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <button
            onClick={exportUsers}
            disabled={exporting !== ""}
            className="border border-gray-200 rounded-lg py-2.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {exporting === "users" ? "..." : `📥 ${t.exportUsers}`}
          </button>
          <button
            onClick={exportTx}
            disabled={exporting !== ""}
            className="border border-gray-200 rounded-lg py-2.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {exporting === "tx" ? "..." : `📥 ${t.exportTxn}`}
          </button>
        </div>
        <div className="text-[9px] text-gray-400 mt-2 text-center">
          {t.exportHint}
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
