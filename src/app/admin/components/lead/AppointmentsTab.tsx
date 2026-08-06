"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/lib/LanguageContext";

interface Appointment {
  id: string;
  lead_name: string | null;
  staff_name: string | null;
  slot_start: string;
  slot_end: string;
  status: string;
  outcome: string | null;
}

interface StaffRank {
  staff_id: string;
  staff_name: string;
  total_appointments: number;
  closed_won: number;
  close_rate: number;
}

interface SourceRow {
  source: string;
  total: number;
  closed_won: number;
  conversion_rate: number;
}

const STATUS_COLOR: Record<string, string> = {
  pending: "#B8791F",
  confirmed: "#2F3E6B",
  completed: "#3E7A52",
  rescheduled: "#B8791F",
  no_show: "#A6402E",
  cancelled: "#6B6864",
};

export default function AppointmentsTab() {
  const { lang } = useLang();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [ranking, setRanking] = useState<StaffRank[]>([]);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [ap, rk, sr] = await Promise.all([
      supabase.rpc("heraa_lead_admin_list_appointments"),
      supabase.rpc("heraa_lead_admin_staff_ranking"),
      supabase.rpc("heraa_lead_admin_source_breakdown"),
    ]);
    if (ap.data) setAppointments(ap.data);
    if (rk.data) setRanking(rk.data);
    if (sr.data) setSources(sr.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="text-center py-12" style={{ color: "#A6A29B" }}>
        {lang === "zh" ? "加载中..." : "Loading..."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Appointments list */}
      <div style={{ border: "1px solid #ECE8E1", borderRadius: 16, padding: 16, background: "#fff" }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 12, marginTop: 0 }}>
          {lang === "zh" ? "📅 预约列表" : "📅 Appointments"}
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table className="w-full text-xs" style={{ minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #ECE8E1" }}>
                <th className="text-left py-2 px-2">{lang === "zh" ? "Lead" : "Lead"}</th>
                <th className="text-left py-2 px-2">{lang === "zh" ? "负责人" : "Staff"}</th>
                <th className="text-left py-2 px-2">{lang === "zh" ? "时段" : "Slot"}</th>
                <th className="text-left py-2 px-2">{lang === "zh" ? "状态" : "Status"}</th>
                <th className="text-left py-2 px-2">{lang === "zh" ? "结果" : "Outcome"}</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-300">
                    {lang === "zh" ? "暂无预约记录" : "No appointments yet"}
                  </td>
                </tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a.id} style={{ borderBottom: "1px solid #F5F3EE" }}>
                    <td className="py-2 px-2 font-medium text-gray-700">{a.lead_name || "—"}</td>
                    <td className="py-2 px-2 text-gray-500">{a.staff_name || "—"}</td>
                    <td className="py-2 px-2 text-gray-500">
                      {new Date(a.slot_start).toLocaleString(lang === "zh" ? "zh-CN" : "en-MY", {
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2 px-2">
                      <span
                        className="text-[11px] font-semibold rounded px-1.5 py-0.5"
                        style={{ background: `${STATUS_COLOR[a.status] || "#6B6864"}18`, color: STATUS_COLOR[a.status] || "#6B6864" }}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-gray-500">{a.outcome || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff ranking + source breakdown side by side on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div style={{ border: "1px solid #ECE8E1", borderRadius: 16, padding: 16, background: "#fff" }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 12, marginTop: 0 }}>
            {lang === "zh" ? "🏆 Staff 排行" : "🏆 Staff Ranking"}
          </h3>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid #ECE8E1" }}>
                <th className="text-left py-2 px-2">{lang === "zh" ? "员工" : "Staff"}</th>
                <th className="text-right py-2 px-2">{lang === "zh" ? "接待量" : "Received"}</th>
                <th className="text-right py-2 px-2">{lang === "zh" ? "成交率" : "Close Rate"}</th>
              </tr>
            </thead>
            <tbody>
              {ranking.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-gray-300">
                    {lang === "zh" ? "暂无 Staff 数据" : "No staff yet"}
                  </td>
                </tr>
              ) : (
                ranking.map((r) => (
                  <tr key={r.staff_id} style={{ borderBottom: "1px solid #F5F3EE" }}>
                    <td className="py-2 px-2 font-medium text-gray-700">{r.staff_name}</td>
                    <td className="py-2 px-2 text-right text-gray-500">{r.total_appointments}</td>
                    <td className="py-2 px-2 text-right font-semibold" style={{ color: "#3E7A52" }}>
                      {r.close_rate}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ border: "1px solid #ECE8E1", borderRadius: 16, padding: 16, background: "#fff" }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 12, marginTop: 0 }}>
            {lang === "zh" ? "📊 来源转化分析" : "📊 Source Conversion"}
          </h3>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid #ECE8E1" }}>
                <th className="text-left py-2 px-2">{lang === "zh" ? "来源" : "Source"}</th>
                <th className="text-right py-2 px-2">{lang === "zh" ? "总数" : "Total"}</th>
                <th className="text-right py-2 px-2">{lang === "zh" ? "转化率" : "Rate"}</th>
              </tr>
            </thead>
            <tbody>
              {sources.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-gray-300">
                    {lang === "zh" ? "暂无数据" : "No data yet"}
                  </td>
                </tr>
              ) : (
                sources.map((s) => (
                  <tr key={s.source} style={{ borderBottom: "1px solid #F5F3EE" }}>
                    <td className="py-2 px-2 font-medium text-gray-700">{s.source}</td>
                    <td className="py-2 px-2 text-right text-gray-500">{s.total}</td>
                    <td className="py-2 px-2 text-right font-semibold" style={{ color: "#C8102E" }}>
                      {s.conversion_rate}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
