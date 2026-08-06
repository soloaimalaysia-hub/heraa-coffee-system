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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const [fn, ld, sf] = await Promise.all([
      supabase.rpc("heraa_lead_admin_funnel"),
      supabase.rpc("heraa_lead_admin_list_leads", {
        p_search: search.trim() || null,
        p_source: sourceFilter || null,
        p_stage: stageFilter || null,
      }),
      supabase.rpc("heraa_lead_admin_list_staff"),
    ]);
    if (fn.data) setFunnel(fn.data);
    if (ld.data) setLeads(ld.data);
    if (sf.data) setStaff(sf.data);
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

  async function handleAssign(leadId: string, staffId: string) {
    await supabase.rpc("heraa_lead_admin_assign_staff", {
      p_lead_id: leadId,
      p_staff_id: staffId || null,
    });
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
          <table className="w-full text-xs" style={{ minWidth: 640 }}>
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
                      <select
                        value={l.assigned_staff_id || ""}
                        onChange={(e) => handleAssign(l.id, e.target.value)}
                        className="text-[11px] rounded px-1.5 py-1 border border-gray-200"
                      >
                        <option value="">{lang === "zh" ? "未分配" : "Unassigned"}</option>
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
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
