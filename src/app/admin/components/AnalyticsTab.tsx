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
  const { t, lang } = useLang();
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
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
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

  if (loading) {
    return (
      <div className="text-center py-12" style={{ color: "#A6A29B" }}>
        {lang === "zh" ? "加载中..." : "Loading..."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ===== Analytics Card (gold border) ===== */}
      <div
        style={{
          border: "2px solid #D4AF37",
          borderRadius: 18,
          padding: "16px 16px 4px",
          background: "#fff",
        }}
      >
        {/* Section title */}
        <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <h2
            className="flex items-center gap-1.5"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#C8102E",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
              margin: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/icons/section-analytics.webp"
              alt=""
              style={{ width: 17, height: 17 }}
            />
            {t.analyticsTitle} · Last 30 days
          </h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/icons/refresh.webp"
            alt="Refresh"
            onClick={load}
            style={{
              width: 18,
              height: 18,
              cursor: "pointer",
              transition: "transform 0.15s ease",
            }}
            onMouseDown={(e) => {
              (e.target as HTMLElement).style.transform = "rotate(90deg)";
            }}
            onMouseUp={(e) => {
              setTimeout(() => {
                (e.target as HTMLElement).style.transform = "none";
              }, 200);
            }}
          />
        </div>

        {/* KPI Grid — red solid cards */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4"
          style={{
            gap: 10,
            marginBottom: 16,
          }}
        >
          <MetricCard
            label={t.totalMembers}
            value={String(overview?.total_members ?? 0)}
            delta={`+${overview?.new_members ?? 0} new`}
          />
          <MetricCard
            label={t.todayActive}
            value={String(overview?.dau ?? 0)}
            delta={`7-day avg ${overview?.dau_7d_avg ?? 0}`}
          />
          <MetricCard
            label={t.revenue30d}
            value={`RM ${Number(overview?.total_revenue ?? 0).toFixed(0)}`}
            delta={`${overview?.total_redemptions ?? 0} redemptions`}
          />
          <MetricCard
            label={t.gameParticipants}
            value={String(gami?.total_garden_users ?? 0)}
            delta={`${overview?.watering_rate ?? 0}% watered today`}
          />
        </div>
      </div>

      {/* ===== User Funnel (gold border) ===== */}
      <div
        style={{
          border: "2px solid #D4AF37",
          borderRadius: 16,
          padding: 16,
          background: "#fff",
        }}
      >
        <h3
          style={{
            color: "#C8102E",
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 14,
            marginTop: 0,
          }}
        >
          {t.funnelTitle} · Last 7 days
        </h3>
        {funnelSteps.map((step, i) => {
          const pct = funnelMax > 0 ? (step.value / funnelMax) * 100 : 0;
          const conv =
            i === 0 || funnelSteps[i - 1].value === 0
              ? null
              : ((step.value / funnelSteps[i - 1].value) * 100).toFixed(0);
          return (
            <div key={step.label} style={{ marginBottom: 12 }}>
              <div
                className="flex justify-between"
                style={{ fontSize: 12, color: "#1A1A1A", marginBottom: 6 }}
              >
                <span style={{ color: "#C8102E", fontWeight: 300 }}>
                  {step.label}
                  {conv !== null && (
                    <span style={{ color: "#A6A29B", fontWeight: 300, marginLeft: 4 }}>
                      ({conv}%)
                    </span>
                  )}
                </span>
                <b style={{ fontWeight: 700 }}>{step.value}</b>
              </div>
              <div
                style={{
                  height: 8,
                  background: "#FBE9EB",
                  borderRadius: 5,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${Math.max(pct, 4)}%`,
                    background: "linear-gradient(90deg, #3DDC5A, #FFD93D)",
                    borderRadius: 5,
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== Data Export (gold border) ===== */}
      <div
        style={{
          border: "2px solid #D4AF37",
          borderRadius: 16,
          padding: 16,
          background: "#fff",
        }}
      >
        <h3
          style={{
            color: "#C8102E",
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 14,
            marginTop: 0,
          }}
        >
          {t.exportTitle}
        </h3>
        <div className="flex gap-2.5">
          <button
            onClick={exportUsers}
            disabled={exporting !== ""}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 12,
              border: "none",
              background: "#C8102E",
              color: "#fff",
              fontWeight: 700,
              fontSize: 12.5,
              fontFamily: "'Satoshi', sans-serif",
              cursor: "pointer",
              opacity: exporting ? 0.5 : 1,
            }}
          >
            {exporting === "users" ? "..." : t.exportUsers}
          </button>
          <button
            onClick={exportTx}
            disabled={exporting !== ""}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 12,
              border: "none",
              background: "#C8102E",
              color: "#fff",
              fontWeight: 700,
              fontSize: 12.5,
              fontFamily: "'Satoshi', sans-serif",
              cursor: "pointer",
              opacity: exporting ? 0.5 : 1,
            }}
          >
            {exporting === "tx" ? "..." : t.exportTxn}
          </button>
        </div>
        <div
          style={{
            fontSize: 9.5,
            color: "#A6A29B",
            textAlign: "center",
            marginTop: 10,
            letterSpacing: "0.1px",
          }}
        >
          Exports last 90 days · UTF-8 BOM · opens directly in Excel
        </div>
      </div>

    </div>
  );
}

function MetricCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta: string;
}) {
  return (
    <div
      style={{
        background: "#C8102E",
        borderRadius: 14,
        padding: "14px 14px 12px",
      }}
    >
      <div
        style={{
          textTransform: "uppercase",
          letterSpacing: "0.3px",
          fontSize: 10.5,
          color: "rgba(255,255,255,0.8)",
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: "#fff",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 10.5,
          color: "rgba(255,255,255,0.7)",
          marginTop: 6,
          fontWeight: 500,
        }}
      >
        {delta}
      </div>
    </div>
  );
}
