"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/lib/LanguageContext";

interface Appointment {
  id: string;
  lead_id: string;
  lead_name: string | null;
  staff_id: string;
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

interface LeadOption {
  id: string;
  name: string;
  phone: string;
  stage: string;
}

interface StaffOption {
  id: string;
  name: string;
}

interface DueReminder {
  appointment_id: string;
  lead_name: string;
  lead_phone: string;
  staff_name: string | null;
  slot_start: string;
  reminder_stage: string;
}

const STATUS_COLOR: Record<string, string> = {
  pending: "#B8791F",
  confirmed: "#2F3E6B",
  completed: "#3E7A52",
  rescheduled: "#B8791F",
  no_show: "#A6402E",
  cancelled: "#6B6864",
};

const OUTCOMES = [
  { value: "closed_won", zh: "成交", en: "Closed Won" },
  { value: "closed_lost", zh: "未成交", en: "Closed Lost" },
  { value: "follow_up_needed", zh: "需再跟进", en: "Follow-up needed" },
];

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AppointmentsTab() {
  const { lang } = useLang();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [ranking, setRanking] = useState<StaffRank[]>([]);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [leadOptions, setLeadOptions] = useState<LeadOption[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [dueReminders, setDueReminders] = useState<DueReminder[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [newLeadId, setNewLeadId] = useState("");
  const [newStaffId, setNewStaffId] = useState("");
  const [newSlotStart, setNewSlotStart] = useState("");
  const [creating, setCreating] = useState(false);

  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleSlot, setRescheduleSlot] = useState("");
  const [rescheduling, setRescheduling] = useState(false);

  const [outcomeApt, setOutcomeApt] = useState<Appointment | null>(null);
  const [outcomeValue, setOutcomeValue] = useState("closed_won");
  const [outcomeNotes, setOutcomeNotes] = useState("");
  const [recordingOutcome, setRecordingOutcome] = useState(false);

  const load = useCallback(async () => {
    const [ap, rk, sr, ld, sf, dr] = await Promise.all([
      supabase.rpc("heraa_lead_admin_list_appointments"),
      supabase.rpc("heraa_lead_admin_staff_ranking"),
      supabase.rpc("heraa_lead_admin_source_breakdown"),
      supabase.rpc("heraa_lead_admin_list_leads"),
      supabase.rpc("heraa_lead_admin_list_staff"),
      supabase.rpc("heraa_lead_admin_due_reminders"),
    ]);
    if (ap.data) setAppointments(ap.data);
    if (rk.data) setRanking(rk.data);
    if (sr.data) setSources(sr.data);
    if (ld.data) setLeadOptions(ld.data.filter((l: LeadOption) => !["closed_won", "closed_lost"].includes(l.stage)));
    if (sf.data) setStaffOptions(sf.data);
    if (dr.data) setDueReminders(dr.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreateAppointment(e: React.FormEvent) {
    e.preventDefault();
    if (!newLeadId || !newStaffId || !newSlotStart) return;
    setCreating(true);
    const start = new Date(newSlotStart);
    const end = new Date(start.getTime() + 30 * 60000);
    await supabase.rpc("heraa_lead_admin_create_appointment", {
      p_lead_id: newLeadId,
      p_staff_id: newStaffId,
      p_slot_start: start.toISOString(),
      p_slot_end: end.toISOString(),
    });
    setCreating(false);
    setShowCreate(false);
    setNewLeadId("");
    setNewStaffId("");
    setNewSlotStart("");
    load();
  }

  async function handleReschedule(id: string) {
    if (!rescheduleSlot) return;
    setRescheduling(true);
    const start = new Date(rescheduleSlot);
    const end = new Date(start.getTime() + 30 * 60000);
    await supabase.rpc("heraa_lead_admin_reschedule_appointment", {
      p_appointment_id: id,
      p_new_slot_start: start.toISOString(),
      p_new_slot_end: end.toISOString(),
    });
    setRescheduling(false);
    setRescheduleId(null);
    setRescheduleSlot("");
    load();
  }

  async function handleRecordOutcome() {
    if (!outcomeApt) return;
    setRecordingOutcome(true);
    await supabase.rpc("heraa_lead_admin_record_outcome", {
      p_appointment_id: outcomeApt.id,
      p_outcome: outcomeValue,
      p_outcome_notes: outcomeNotes.trim() || null,
    });
    setRecordingOutcome(false);
    setOutcomeApt(null);
    setOutcomeNotes("");
    load();
  }

  async function handleQuickStatus(id: string, status: string) {
    await supabase.rpc("heraa_lead_admin_update_appointment_status", { p_appointment_id: id, p_status: status });
    load();
  }

  async function handleMarkReminderSent(appointmentId: string, stage: string) {
    await supabase.rpc("heraa_lead_admin_mark_reminder_sent", { p_appointment_id: appointmentId, p_stage: stage });
    load();
  }

  if (loading) {
    return (
      <div className="text-center py-12" style={{ color: "#A6A29B" }}>
        {lang === "zh" ? "加载中..." : "Loading..."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Due reminders — logic only, actual WhatsApp send wires in after Meta verification */}
      {dueReminders.length > 0 && (
        <div style={{ border: "2px solid #D4AF37", borderRadius: 16, padding: 16, background: "#FBF3DD" }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#B8791F", marginBottom: 8, marginTop: 0 }}>
            ⏰ {lang === "zh" ? "待发提醒" : "Due Reminders"}
          </h3>
          <p className="text-[11px] mb-3" style={{ color: "#8a6a1a" }}>
            {lang === "zh"
              ? "WhatsApp 自动发送等 Meta verification 通过后接上，现在需要手动发送后按「已发送」"
              : "Auto-send wires in once Meta verification is approved — send manually for now, then mark as sent"}
          </p>
          <div className="space-y-1.5">
            {dueReminders.map((r) => (
              <div key={`${r.appointment_id}-${r.reminder_stage}`} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2">
                <span>
                  <b>{r.lead_name}</b> ({r.lead_phone}) · {r.staff_name || "—"} ·{" "}
                  {new Date(r.slot_start).toLocaleString(lang === "zh" ? "zh-CN" : "en-MY", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  {" · "}
                  <span style={{ color: "#B8791F", fontWeight: 600 }}>{r.reminder_stage === "2h" ? (lang === "zh" ? "2小时前" : "2h before") : (lang === "zh" ? "24小时前" : "24h before")}</span>
                </span>
                <button
                  onClick={() => handleMarkReminderSent(r.appointment_id, r.reminder_stage)}
                  className="text-[11px] font-semibold"
                  style={{ color: "#3E7A52" }}
                >
                  {lang === "zh" ? "✓ 已发送" : "✓ Sent"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Appointments list */}
      <div style={{ border: "1px solid #ECE8E1", borderRadius: 16, padding: 16, background: "#fff" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>
            {lang === "zh" ? "📅 预约列表" : "📅 Appointments"}
          </h3>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="text-xs font-semibold rounded-lg px-3 py-1.5 border"
            style={{ borderColor: "#C8102E", color: "#C8102E" }}
          >
            {showCreate ? (lang === "zh" ? "取消" : "Cancel") : lang === "zh" ? "+ 新增预约" : "+ New appointment"}
          </button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreateAppointment} className="flex flex-wrap gap-2 mb-3 bg-gray-50 rounded-lg p-3">
            <select
              value={newLeadId}
              onChange={(e) => setNewLeadId(e.target.value)}
              required
              className="text-xs rounded-lg px-2 py-2 border border-gray-200"
            >
              <option value="" disabled>{lang === "zh" ? "选择 Lead" : "Select lead"}</option>
              {leadOptions.map((l) => (
                <option key={l.id} value={l.id}>{l.name} · {l.phone}</option>
              ))}
            </select>
            <select
              value={newStaffId}
              onChange={(e) => setNewStaffId(e.target.value)}
              required
              className="text-xs rounded-lg px-2 py-2 border border-gray-200"
            >
              <option value="" disabled>{lang === "zh" ? "选择员工" : "Select staff"}</option>
              {staffOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={newSlotStart}
              onChange={(e) => setNewSlotStart(e.target.value)}
              required
              className="text-xs rounded-lg px-2 py-2 border border-gray-200"
            />
            <button
              type="submit"
              disabled={creating}
              className="text-xs font-semibold rounded-lg px-4 py-2 text-white"
              style={{ background: "#C8102E" }}
            >
              {creating ? "..." : lang === "zh" ? "保存" : "Save"}
            </button>
          </form>
        )}

        <div style={{ overflowX: "auto" }}>
          <table className="w-full text-xs" style={{ minWidth: 680 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #ECE8E1" }}>
                <th className="text-left py-2 px-2">{lang === "zh" ? "Lead" : "Lead"}</th>
                <th className="text-left py-2 px-2">{lang === "zh" ? "负责人" : "Staff"}</th>
                <th className="text-left py-2 px-2">{lang === "zh" ? "时段" : "Slot"}</th>
                <th className="text-left py-2 px-2">{lang === "zh" ? "状态" : "Status"}</th>
                <th className="text-left py-2 px-2">{lang === "zh" ? "结果" : "Outcome"}</th>
                <th className="text-left py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-300">
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
                    <td className="py-2 px-2">
                      {(a.status === "confirmed" || a.status === "pending") && (
                        <div className="flex gap-2 justify-end flex-wrap">
                          <button
                            onClick={() => {
                              setRescheduleId(a.id);
                              setRescheduleSlot(toLocalInput(new Date(a.slot_start)));
                            }}
                            className="text-[11px] font-semibold"
                            style={{ color: "#2F3E6B" }}
                          >
                            {lang === "zh" ? "改期" : "Reschedule"}
                          </button>
                          <button
                            onClick={() => setOutcomeApt(a)}
                            className="text-[11px] font-semibold"
                            style={{ color: "#3E7A52" }}
                          >
                            {lang === "zh" ? "记录结果" : "Record outcome"}
                          </button>
                          <button
                            onClick={() => handleQuickStatus(a.id, "no_show")}
                            className="text-[11px] font-semibold"
                            style={{ color: "#A6402E" }}
                          >
                            No-show
                          </button>
                        </div>
                      )}
                    </td>
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

      {/* Reschedule modal */}
      {rescheduleId && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setRescheduleId(null); }}
          style={{ position: "fixed", inset: 0, background: "rgba(26,26,26,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 16 }}
        >
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, width: 340, maxWidth: "100%" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>
              {lang === "zh" ? "改期" : "Reschedule"}
            </h3>
            <input
              type="datetime-local"
              value={rescheduleSlot}
              onChange={(e) => setRescheduleSlot(e.target.value)}
              className="w-full text-xs rounded-lg px-3 py-2 border border-gray-200 mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setRescheduleId(null)}
                className="flex-1 text-xs font-semibold rounded-lg py-2 border border-gray-200"
              >
                {lang === "zh" ? "取消" : "Cancel"}
              </button>
              <button
                onClick={() => handleReschedule(rescheduleId)}
                disabled={rescheduling}
                className="flex-1 text-xs font-semibold rounded-lg py-2 text-white"
                style={{ background: "#C8102E" }}
              >
                {rescheduling ? "..." : lang === "zh" ? "确认改期" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Outcome modal */}
      {outcomeApt && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOutcomeApt(null); }}
          style={{ position: "fixed", inset: 0, background: "rgba(26,26,26,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 16 }}
        >
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, width: 360, maxWidth: "100%" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 0, marginBottom: 4 }}>
              {lang === "zh" ? "记录结果" : "Record outcome"}
            </h3>
            <p className="text-xs text-gray-400 mb-3">{outcomeApt.lead_name}</p>
            <div className="flex flex-col gap-1.5 mb-3">
              {OUTCOMES.map((o) => (
                <label key={o.value} className="flex items-center gap-2 text-xs">
                  <input
                    type="radio"
                    name="outcome"
                    value={o.value}
                    checked={outcomeValue === o.value}
                    onChange={() => setOutcomeValue(o.value)}
                  />
                  {o[lang]}
                </label>
              ))}
            </div>
            <textarea
              value={outcomeNotes}
              onChange={(e) => setOutcomeNotes(e.target.value)}
              placeholder={lang === "zh" ? "备注（选填）" : "Notes (optional)"}
              className="w-full text-xs rounded-lg px-3 py-2 border border-gray-200 mb-3"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setOutcomeApt(null)}
                className="flex-1 text-xs font-semibold rounded-lg py-2 border border-gray-200"
              >
                {lang === "zh" ? "取消" : "Cancel"}
              </button>
              <button
                onClick={handleRecordOutcome}
                disabled={recordingOutcome}
                className="flex-1 text-xs font-semibold rounded-lg py-2 text-white"
                style={{ background: "#C8102E" }}
              >
                {recordingOutcome ? "..." : lang === "zh" ? "保存" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
