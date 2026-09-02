"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/lib/LanguageContext";

interface Company {
  id: string;
  name: string;
  code: string;
  logo_url: string | null;
  allowance_amount: number;
  allowance_cycle: string;
  allowance_reset_day: number;
  allowance_accumulate: boolean;
  requires_staff_id: boolean;
  is_active: boolean;
  contract_end_date: string | null;
  created_at: string;
  member_count: number;
  month_allowance_total: number;
}

interface CompanyMember {
  id: string;
  name: string;
  phone: string;
  staff_id: string;
  is_activated: boolean;
  balance: number;
  month_orders: number;
  month_spent: number;
}

export default function CompaniesTab() {
  const { lang } = useLang();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "edit" | "members" | "qr">("list");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Edit form state
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formAllowance, setFormAllowance] = useState("20");
  const [formCycle, setFormCycle] = useState("monthly");
  const [formResetDay, setFormResetDay] = useState("1");
  const [formAccumulate, setFormAccumulate] = useState(true);
  const [formRequiresStaffId, setFormRequiresStaffId] = useState(true);
  const [formActive, setFormActive] = useState(true);
  const [formContractEnd, setFormContractEnd] = useState("");
  const [saving, setSaving] = useState(false);

  const loadCompanies = useCallback(async () => {
    const { data } = await supabase.rpc("heraa_admin_list_companies");
    if (data?.success) {
      setCompanies(data.companies || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  function openEdit(company: Company | null) {
    if (company) {
      setFormName(company.name);
      setFormCode(company.code);
      setFormAllowance(String(company.allowance_amount));
      setFormCycle(company.allowance_cycle);
      setFormResetDay(String(company.allowance_reset_day));
      setFormAccumulate(company.allowance_accumulate);
      setFormRequiresStaffId(company.requires_staff_id);
      setFormActive(company.is_active);
      setFormContractEnd(company.contract_end_date || "");
      setSelectedCompany(company);
    } else {
      setFormName("");
      setFormCode("");
      setFormAllowance("20");
      setFormCycle("monthly");
      setFormResetDay("1");
      setFormAccumulate(true);
      setFormRequiresStaffId(true);
      setFormActive(true);
      setFormContractEnd("");
      setSelectedCompany(null);
    }
    setView("edit");
  }

  async function handleSave() {
    setSaving(true);
    await supabase.rpc("heraa_admin_upsert_company", {
      p_id: selectedCompany?.id || null,
      p_name: formName,
      p_code: formCode.toLowerCase(),
      p_allowance_amount: Number(formAllowance),
      p_allowance_cycle: formCycle,
      p_allowance_reset_day: Number(formResetDay),
      p_allowance_accumulate: formAccumulate,
      p_requires_staff_id: formRequiresStaffId,
      p_is_active: formActive,
      p_contract_end_date: formContractEnd || null,
    });
    setSaving(false);
    await loadCompanies();
    setView("list");
  }

  async function openMembers(company: Company) {
    setSelectedCompany(company);
    setMembersLoading(true);
    setView("members");
    const { data } = await supabase.rpc("heraa_admin_company_members", {
      p_company_id: company.id,
    });
    if (data?.success) {
      setMembers(data.members || []);
    }
    setMembersLoading(false);
  }

  function openQR(company: Company) {
    setSelectedCompany(company);
    setView("qr");
  }

  async function handleGrantAll() {
    const { data } = await supabase.rpc("heraa_grant_all_allowances");
    if (data?.success) {
      alert(`✅ ${lang === "zh" ? "已发放" : "Granted to"} ${data.granted} ${lang === "zh" ? "人" : "members"}`);
      loadCompanies();
    } else {
      alert(`❌ ${data?.error || "Failed"}`);
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading...</div>;
  }

  // Members view
  if (view === "members" && selectedCompany) {
    const activeMembers = members.filter((m) => m.is_activated);
    const usageRate = members.length > 0
      ? Math.round((activeMembers.filter((m) => m.month_orders > 0).length / Math.max(activeMembers.length, 1)) * 100)
      : 0;

    return (
      <div>
        <button onClick={() => setView("list")} className="text-sm mb-4" style={{ color: "#C8111A" }}>
          ← {lang === "zh" ? "返回" : "Back"}
        </button>
        <h3 className="font-bold text-lg mb-1">{selectedCompany.name}</h3>
        <p className="text-xs text-gray-400 mb-4">
          {members.length} {lang === "zh" ? "人" : "members"} · {lang === "zh" ? "使用率" : "Usage"} {usageRate}%
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500">
                <th className="text-left p-2">{lang === "zh" ? "姓名" : "Name"}</th>
                <th className="text-left p-2">{lang === "zh" ? "工号" : "Staff ID"}</th>
                <th className="text-left p-2">{lang === "zh" ? "手机" : "Phone"}</th>
                <th className="text-right p-2">{lang === "zh" ? "余额" : "Balance"}</th>
                <th className="text-right p-2">{lang === "zh" ? "本月消费" : "This Month"}</th>
              </tr>
            </thead>
            <tbody>
              {membersLoading ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">
                  {lang === "zh" ? "暂无员工" : "No employees yet"}
                </td></tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50">
                    <td className="p-2 font-medium">{m.name}</td>
                    <td className="p-2 text-gray-500">{m.staff_id || "-"}</td>
                    <td className="p-2 text-gray-500 text-xs">{m.phone}</td>
                    <td className="p-2 text-right font-medium">RM{Number(m.balance).toFixed(2)}</td>
                    <td className="p-2 text-right text-xs text-gray-500">
                      {m.month_orders}{lang === "zh" ? "次" : "x"} / RM{Number(m.month_spent).toFixed(0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // QR view
  if (view === "qr" && selectedCompany) {
    const regUrl = `${window.location.origin}/register/${selectedCompany.code}`;
    return (
      <div>
        <button onClick={() => setView("list")} className="text-sm mb-4" style={{ color: "#C8111A" }}>
          ← {lang === "zh" ? "返回" : "Back"}
        </button>
        <h3 className="font-bold text-lg mb-4">
          {selectedCompany.name} · {lang === "zh" ? "注册 QR" : "Register QR"}
        </h3>
        <div className="bg-white rounded-xl p-6 text-center border border-gray-100">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(regUrl)}`}
            alt="QR Code"
            className="mx-auto mb-4"
            width={200}
            height={200}
          />
          <p className="text-sm text-gray-600 font-medium mb-2">{lang === "zh" ? "员工扫码注册" : "Scan to Register"}</p>
          <p className="text-xs text-gray-400 break-all mb-4">{regUrl}</p>
          <button
            onClick={() => {
              const link = document.createElement("a");
              link.href = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(regUrl)}`;
              link.download = `heraa-register-${selectedCompany.code}.png`;
              link.click();
            }}
            className="text-sm font-bold text-white rounded-lg px-4 py-2"
            style={{ background: "#C8111A" }}
          >
            📥 {lang === "zh" ? "下载 PNG" : "Download PNG"}
          </button>
        </div>
      </div>
    );
  }

  // Edit form view
  if (view === "edit") {
    return (
      <div>
        <button onClick={() => setView("list")} className="text-sm mb-4" style={{ color: "#C8111A" }}>
          ← {lang === "zh" ? "返回" : "Back"}
        </button>
        <h3 className="font-bold text-lg mb-4">
          {selectedCompany ? (lang === "zh" ? "编辑企业" : "Edit Company") : (lang === "zh" ? "新增企业" : "New Company")}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">{lang === "zh" ? "企业名称" : "Company Name"}</label>
            <input value={formName} onChange={(e) => setFormName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <div>
            <label className="text-xs text-gray-500">{lang === "zh" ? "代码（唯一）" : "Code (unique)"}</label>
            <input value={formCode} onChange={(e) => setFormCode(e.target.value)}
              disabled={!!selectedCompany}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1 disabled:bg-gray-100" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">{lang === "zh" ? "津贴金额 (RM)" : "Allowance (RM)"}</label>
              <input type="number" value={formAllowance} onChange={(e) => setFormAllowance(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500">{lang === "zh" ? "周期" : "Cycle"}</label>
              <select value={formCycle} onChange={(e) => setFormCycle(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1">
                <option value="monthly">{lang === "zh" ? "每月" : "Monthly"}</option>
                <option value="weekly">{lang === "zh" ? "每周" : "Weekly"}</option>
                <option value="none">{lang === "zh" ? "无津贴" : "None"}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">
              {formCycle === "monthly"
                ? (lang === "zh" ? "每月几号发" : "Reset day of month")
                : (lang === "zh" ? "星期几发 (1=一)" : "Day of week (1=Mon)")}
            </label>
            <input type="number" value={formResetDay} onChange={(e) => setFormResetDay(e.target.value)}
              min={1} max={formCycle === "monthly" ? 28 : 7}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <div>
            <label className="text-xs text-gray-500">{lang === "zh" ? "合约到期日" : "Contract End Date"}</label>
            <input type="date" value={formContractEnd} onChange={(e) => setFormContractEnd(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={formAccumulate} onChange={(e) => setFormAccumulate(e.target.checked)} />
              {lang === "zh" ? "累积不清零" : "Accumulate"}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={formRequiresStaffId} onChange={(e) => setFormRequiresStaffId(e.target.checked)} />
              {lang === "zh" ? "需要工号" : "Require Staff ID"}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={formActive} onChange={(e) => setFormActive(e.target.checked)} />
              {lang === "zh" ? "启用" : "Active"}
            </label>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !formName || !formCode}
            className="w-full text-white font-bold rounded-lg py-3 mt-4 disabled:opacity-50"
            style={{ background: "#C8111A" }}
          >
            {saving ? "..." : (lang === "zh" ? "保存" : "Save")}
          </button>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">🏢 {lang === "zh" ? "企业管理" : "Companies"}</h3>
        <div className="flex gap-2">
          <button
            onClick={handleGrantAll}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            💰 {lang === "zh" ? "手动补发津贴" : "Grant Allowances"}
          </button>
          <button
            onClick={() => openEdit(null)}
            className="text-xs text-white font-medium px-3 py-1.5 rounded-lg"
            style={{ background: "#C8111A" }}
          >
            + {lang === "zh" ? "新增企业" : "Add Company"}
          </button>
        </div>
      </div>

      {companies.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          {lang === "zh" ? "暂无企业" : "No companies yet"}
        </div>
      ) : (
        <div className="space-y-3">
          {companies.map((c) => (
            <div key={c.id} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-gray-800">{c.name}</h4>
                  <p className="text-xs text-gray-400">
                    {lang === "zh" ? "代码" : "Code"}: {c.code} · {c.member_count}{lang === "zh" ? "人" : " members"} · RM{c.allowance_amount}/{c.allowance_cycle === "monthly" ? (lang === "zh" ? "月" : "mo") : (lang === "zh" ? "周" : "wk")}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.is_active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                  {c.is_active ? "🟢" : "🔴"} {c.is_active ? (lang === "zh" ? "有效" : "Active") : (lang === "zh" ? "停用" : "Inactive")}
                </span>
              </div>
              {c.contract_end_date && (
                <p className="text-xs text-gray-400 mb-2">
                  {lang === "zh" ? "合约至" : "Contract until"} {c.contract_end_date}
                </p>
              )}
              <div className="text-xs text-gray-400 mb-3">
                {lang === "zh" ? "本月已发" : "This month"}: RM{Number(c.month_allowance_total).toFixed(0)}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(c)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  ✏️ {lang === "zh" ? "编辑" : "Edit"}
                </button>
                <button
                  onClick={() => openMembers(c)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  👥 {lang === "zh" ? "员工名单" : "Members"}
                </button>
                <button
                  onClick={() => openQR(c)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  📱 {lang === "zh" ? "注册QR" : "QR Code"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
