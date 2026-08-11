"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/lib/LanguageContext";
import { parseCSV } from "@/lib/csv";

interface Lead {
  id: string;
  name: string;
  phone: string;
  company: string | null;
  position: string | null;
  email: string | null;
  source: string;
  area: string | null;
  stage: string;
  assigned_staff_id: string | null;
  assigned_staff_name: string | null;
  created_at: string;
}

interface Staff {
  id: string;
  name: string;
}

interface Funnel {
  total: number;
  contacted: number;
  scheduled: number;
  closed_won: number;
  contacted_rate: number;
  scheduled_rate: number;
  closed_rate: number;
}

interface Suggestion {
  staff_id: string;
  staff_name: string;
  score: number;
  specialty_score: number;
  close_rate_score: number;
  availability_score: number;
  reason: string;
}

interface NurtureLead {
  lead_id: string;
  lead_name: string;
  lead_phone: string;
  entered_at: string | null;
  last_step: number | null;
  last_sent_at: string | null;
}

const STAGES = ["new", "contacted", "nurturing", "scheduled", "closed_won", "closed_lost"];
const STAGE_LABEL: Record<string, { zh: string; en: string; color: string }> = {
  new: { zh: "新进", en: "New", color: "#6B6864" },
  contacted: { zh: "已接触", en: "Contacted", color: "#B8791F" },
  nurturing: { zh: "培育中", en: "Nurturing", color: "#B8791F" },
  scheduled: { zh: "已预约", en: "Scheduled", color: "#2F3E6B" },
  closed_won: { zh: "已成交", en: "Closed Won", color: "#3E7A52" },
  closed_lost: { zh: "已流失", en: "Closed Lost", color: "#A6402E" },
};

export default function LeadsTab() {
  const { lang } = useLang();
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [nurturePool, setNurturePool] = useState<NurtureLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [sweeping, setSweeping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [adding, setAdding] = useState(false);

  // AI match suggestion panel
  const [matchLead, setMatchLead] = useState<Lead | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [confirming, setConfirming] = useState("");

  const load = useCallback(async () => {
    const [fn, ld, sf, np] = await Promise.all([
      supabase.rpc("heraa_lead_admin_funnel"),
      supabase.rpc("heraa_lead_admin_list_leads", {
        p_search: search.trim() || null,
        p_source: sourceFilter || null,
        p_stage: stageFilter || null,
      }),
      supabase.rpc("heraa_lead_admin_list_staff"),
      supabase.rpc("heraa_lead_admin_list_nurture_pool"),
    ]);
    if (fn.data) setFunnel(fn.data);
    if (ld.data) setLeads(ld.data);
    if (sf.data) setStaff(sf.data);
    if (np.data) setNurturePool(np.data);
    setLoading(false);
  }, [search, stageFilter, sourceFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;
    setAdding(true);
    await supabase.rpc("heraa_lead_admin_create_lead", {
      p_name: newName.trim(),
      p_phone: newPhone.trim(),
      p_company: newCompany.trim() || null,
      p_source: "manual",
    });
    setAdding(false);
    setShowAdd(false);
    setNewName("");
    setNewPhone("");
    setNewCompany("");
    load();
  }

  async function handleStageChange(leadId: string, stage: string) {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage } : l)));
    await supabase.rpc("heraa_lead_admin_update_stage", { p_lead_id: leadId, p_stage: stage });
    load();
  }

  async function openMatchPanel(lead: Lead) {
    setMatchLead(lead);
    setSuggestions([]);
    setLoadingSuggest(true);
    const { data } = await supabase.rpc("heraa_lead_admin_suggest_matches", { p_lead_id: lead.id });
    setSuggestions(data || []);
    setLoadingSuggest(false);
  }

  async function handleConfirmMatch(s: Suggestion) {
    if (!matchLead) return;
    setConfirming(s.staff_id);
    await supabase.rpc("heraa_lead_admin_confirm_match", {
      p_lead_id: matchLead.id,
      p_staff_id: s.staff_id,
      p_score: s.score,
      p_reason: s.reason,
    });
    setConfirming("");
    setMatchLead(null);
    load();
  }

  async function handleManualAssign(staffId: string) {
    if (!matchLead) return;
    await supabase.rpc("heraa_lead_admin_assign_staff", {
      p_lead_id: matchLead.id,
      p_staff_id: staffId || null,
    });
    setMatchLead(null);
    load();
  }

  async function handleCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg("");

    const text = await file.text();
    const rows = parseCSV(text)
      .filter((r) => r.name && r.phone)
      .map((r) => ({
        name: r.name,
        phone: r.phone,
        company: r.company || null,
        position: r.position || null,
        email: r.email || null,
        area: r.area || null,
        source: "csv_import",
      }));

    if (rows.length === 0) {
      setImportMsg(lang === "zh" ? "没有找到有效数据（需要 name / phone 栏位）" : "No valid rows found (need name / phone columns)");
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const { data, error } = await supabase.rpc("heraa_lead_admin_bulk_import", { p_rows: rows });

    if (error) {
      setImportMsg(error.message);
    } else {
      setImportMsg(
        lang === "zh"
          ? `导入完成：新增 ${data.inserted} 位，更新 ${data.updated} 位`
          : `Import done: ${data.inserted} added, ${data.updated} updated`
      );
      load();
    }
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleRunSweep() {
    setSweeping(true);
    const { data } = await supabase.rpc("heraa_lead_admin_run_nurture_sweep");
    setSweeping(false);
    if (data) {
      alert(
        lang === "zh"
          ? `本次扫描：${data.moved_to_nurture} 位转入培育池`
          : `Sweep done: ${data.moved_to_nurture} moved to nurture pool`
      );
    }
    load();
  }

  async function handleExitNurture(leadId: string) {
    await supabase.rpc("heraa_lead_admin_exit_nurture", { p_lead_id: leadId, p_intent_tag: "warm" });
    load();
  }

  const sources = Array.from(new Set(leads.map((l) => l.source)));

  if (loading) {
    return (
      <div className="text-center py-12" style={{ color: "#A6A29B" }}>
        {lang === "zh" ? "加载中..." : "Loading..."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Funnel */}
      <div
        style={{ border: "2px solid #D4AF37", borderRadius: 18, padding: "16px 16px 4px", background: "#fff" }}
      >
        <h2
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#C8102E",
            textTransform: "uppercase",
            letterSpacing: "0.3px",
            marginBottom: 14,
            marginTop: 0,
          }}
        >
          {lang === "zh" ? "📇 Lead 漏斗" : "📇 Lead Funnel"}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <FunnelCard label={lang === "zh" ? "总数" : "Total"} value={funnel?.total ?? 0} sub="" />
          <FunnelCard
            label={lang === "zh" ? "已接触" : "Contacted"}
            value={funnel?.contacted ?? 0}
            sub={`${funnel?.contacted_rate ?? 0}%`}
          />
          <FunnelCard
            label={lang === "zh" ? "已预约" : "Scheduled"}
            value={funnel?.scheduled ?? 0}
            sub={`${funnel?.scheduled_rate ?? 0}%`}
          />
          <FunnelCard
            label={lang === "zh" ? "已成交" : "Closed Won"}
            value={funnel?.closed_won ?? 0}
            sub={`${funnel?.closed_rate ?? 0}%`}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={{ border: "1px solid #ECE8E1", borderRadius: 16, padding: 16, background: "#fff" }}>
        <div className="flex flex-wrap gap-2 items-center justify-between mb-3">
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === "zh" ? "🔍 搜索姓名/手机号/公司" : "🔍 Search name/phone/company"}
              className="border border-gray-200 rounded-lg px-3 py-2 text-xs"
              style={{ minWidth: 200 }}
            />
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-2 text-xs"
            >
              <option value="">{lang === "zh" ? "全部阶段" : "All stages"}</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s][lang]}
                </option>
              ))}
            </select>
            {sources.length > 0 && (
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-2 text-xs"
              >
                <option value="">{lang === "zh" ? "全部来源" : "All sources"}</option>
                {sources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="text-xs font-semibold rounded-lg px-3 py-2 border"
              style={{ borderColor: "#C8102E", color: "#C8102E" }}
            >
              {showAdd ? (lang === "zh" ? "取消" : "Cancel") : lang === "zh" ? "+ 新增 Lead" : "+ New Lead"}
            </button>
            <label
              className="text-xs font-semibold rounded-lg px-3 py-2 text-white cursor-pointer"
              style={{ background: "#C8102E" }}
            >
              {importing ? "..." : lang === "zh" ? "📥 导入 CSV" : "📥 Import CSV"}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                disabled={importing}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {importMsg && (
          <div className="text-xs rounded-lg px-3 py-2 mb-3" style={{ background: "#F0FFF4", color: "#3E7A52" }}>
            {importMsg}
          </div>
        )}

        {showAdd && (
          <form onSubmit={handleCreateLead} className="flex flex-wrap gap-2 mb-3 bg-gray-50 rounded-lg p-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={lang === "zh" ? "姓名" : "Name"}
              required
              className="border border-gray-200 rounded-lg px-3 py-2 text-xs"
            />
            <input
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder={lang === "zh" ? "手机号" : "Phone"}
              required
              className="border border-gray-200 rounded-lg px-3 py-2 text-xs"
            />
            <input
              type="text"
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              placeholder={lang === "zh" ? "公司（选填）" : "Company (optional)"}
              className="border border-gray-200 rounded-lg px-3 py-2 text-xs"
            />
            <button
              type="submit"
              disabled={adding}
              className="text-xs font-semibold rounded-lg px-4 py-2 text-white"
              style={{ background: "#C8102E" }}
            >
              {adding ? "..." : lang === "zh" ? "保存" : "Save"}
            </button>
          </form>
        )}

        <div className="text-xs text-gray-400 mb-2">
          {lang === "zh" ? `共 ${leads.length} 位` : `${leads.length} leads`}
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table className="w-full text-xs" style={{ minWidth: 680 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #ECE8E1" }}>
                <th className="text-left py-2 px-2">{lang === "zh" ? "姓名" : "Name"}</th>
                <th className="text-left py-2 px-2">{lang === "zh" ? "手机号" : "Phone"}</th>
                <th className="text-left py-2 px-2">{lang === "zh" ? "公司" : "Company"}</th>
                <th className="text-left py-2 px-2">{lang === "zh" ? "来源" : "Source"}</th>
                <th className="text-left py-2 px-2">{lang === "zh" ? "阶段" : "Stage"}</th>
                <th className="text-left py-2 px-2">{lang === "zh" ? "负责人" : "Assigned"}</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-300">
                    {lang === "zh" ? "暂无 Lead 数据" : "No leads yet"}
                  </td>
                </tr>
              ) : (
                leads.map((l) => (
                  <tr key={l.id} style={{ borderBottom: "1px solid #F5F3EE" }}>
                    <td className="py-2 px-2 font-medium text-gray-700">{l.name}</td>
                    <td className="py-2 px-2 text-gray-500">{l.phone}</td>
                    <td className="py-2 px-2 text-gray-500">{l.company || "—"}</td>
                    <td className="py-2 px-2 text-gray-500">{l.source}</td>
                    <td className="py-2 px-2">
                      <select
                        value={l.stage}
                        onChange={(e) => handleStageChange(l.id, e.target.value)}
                        className="text-[11px] rounded px-1.5 py-1 border-0 font-semibold"
                        style={{
                          background: `${STAGE_LABEL[l.stage]?.color}18`,
                          color: STAGE_LABEL[l.stage]?.color,
                        }}
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>
                            {STAGE_LABEL[s][lang]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <button
                        onClick={() => openMatchPanel(l)}
                        className="text-[11px] rounded px-2 py-1 border font-medium"
                        style={{
                          borderColor: l.assigned_staff_name ? "#ECE8E1" : "#D4AF37",
                          color: l.assigned_staff_name ? "#374151" : "#B8791F",
                          background: l.assigned_staff_name ? "#fff" : "#FBF3DD",
                        }}
                      >
                        {l.assigned_staff_name ? `👤 ${l.assigned_staff_name}` : "🎯 " + (lang === "zh" ? "AI配对" : "AI Match")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nurture pool */}
      <div style={{ border: "1px solid #ECE8E1", borderRadius: 16, padding: 16, background: "#fff" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>
            {lang === "zh" ? "🔁 长期培育池" : "🔁 Nurture Pool"}
          </h3>
          <button
            onClick={handleRunSweep}
            disabled={sweeping}
            className="text-xs font-semibold rounded-lg px-3 py-1.5 border"
            style={{ borderColor: "#C8102E", color: "#C8102E" }}
          >
            {sweeping ? "..." : lang === "zh" ? "立即执行扫描" : "Run sweep now"}
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mb-3">
          {lang === "zh"
            ? "超过设定天数没回应且未预约的 Lead 会自动转入这里（天数在 heraa_lead_settings.nurture_wait_days 设置）。文案由 Benny 团队提供，系统只负责判断谁该进/该出。"
            : "Leads with no response past the wait window (and no appointment) land here automatically. Message content comes from Benny's team — this only tracks who's in/out."}
        </p>
        <div style={{ overflowX: "auto" }}>
          <table className="w-full text-xs" style={{ minWidth: 480 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #ECE8E1" }}>
                <th className="text-left py-2 px-2">{lang === "zh" ? "姓名" : "Name"}</th>
                <th className="text-left py-2 px-2">{lang === "zh" ? "手机号" : "Phone"}</th>
                <th className="text-left py-2 px-2">{lang === "zh" ? "进入时间" : "Entered"}</th>
                <th className="text-left py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {nurturePool.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-gray-300">
                    {lang === "zh" ? "培育池是空的" : "Nurture pool is empty"}
                  </td>
                </tr>
              ) : (
                nurturePool.map((n) => (
                  <tr key={n.lead_id} style={{ borderBottom: "1px solid #F5F3EE" }}>
                    <td className="py-2 px-2 font-medium text-gray-700">{n.lead_name}</td>
                    <td className="py-2 px-2 text-gray-500">{n.lead_phone}</td>
                    <td className="py-2 px-2 text-gray-500">
                      {n.entered_at ? new Date(n.entered_at).toLocaleDateString(lang === "zh" ? "zh-CN" : "en-MY") : "—"}
                    </td>
                    <td className="py-2 px-2 text-right">
                      <button
                        onClick={() => handleExitNurture(n.lead_id)}
                        className="text-[11px] font-semibold"
                        style={{ color: "#3E7A52" }}
                      >
                        {lang === "zh" ? "✓ 客户已回复，跳出" : "✓ Replied, exit pool"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI match suggestion modal */}
      {matchLead && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setMatchLead(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(26,26,26,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: 16,
          }}
        >
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, width: 420, maxWidth: "100%" }}>
            <div className="flex items-center justify-between mb-1">
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>
                🎯 {lang === "zh" ? "AI 建议配对" : "AI Suggested Matches"}
              </h3>
              <button onClick={() => setMatchLead(null)} className="text-gray-400 text-lg leading-none">
                &times;
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-3">{matchLead.name} · {matchLead.phone}</p>

            {loadingSuggest ? (
              <div className="text-center py-8 text-gray-300 text-xs">{lang === "zh" ? "计算中..." : "Scoring..."}</div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-6 text-gray-300 text-xs">
                {lang === "zh" ? "暂无可用员工" : "No active staff"}
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {suggestions.map((s, i) => (
                  <div
                    key={s.staff_id}
                    className="rounded-lg p-3"
                    style={{ border: i === 0 ? "2px solid #D4AF37" : "1px solid #ECE8E1", background: i === 0 ? "#FBF3DD" : "#fff" }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-gray-800">
                        {i === 0 && "⭐ "}{s.staff_name}
                      </span>
                      <span className="text-sm font-bold" style={{ color: "#C8102E" }}>{s.score}分</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mb-2">{s.reason}</p>
                    <button
                      onClick={() => handleConfirmMatch(s)}
                      disabled={confirming === s.staff_id}
                      className="w-full text-xs font-semibold rounded-lg py-1.5 text-white"
                      style={{ background: "#C8102E" }}
                    >
                      {confirming === s.staff_id ? "..." : lang === "zh" ? "确认配对" : "Confirm match"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3" style={{ borderTop: "1px solid #ECE8E1" }}>
              <p className="text-[11px] text-gray-400 mb-1.5">{lang === "zh" ? "或手动指定" : "Or assign manually"}</p>
              <select
                defaultValue=""
                onChange={(e) => e.target.value && handleManualAssign(e.target.value)}
                className="w-full text-xs rounded-lg px-2 py-2 border border-gray-200"
              >
                <option value="" disabled>{lang === "zh" ? "选择员工" : "Choose staff"}</option>
                <option value="">{lang === "zh" ? "取消分配" : "Unassign"}</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FunnelCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div style={{ background: "#C8102E", borderRadius: 14, padding: "14px 14px 12px" }}>
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
      <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{value}</div>
      {sub && (
        <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.7)", marginTop: 6, fontWeight: 500 }}>{sub}</div>
      )}
    </div>
  );
}
