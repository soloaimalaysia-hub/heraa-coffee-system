"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatPhone } from "@/lib/phone";
import { track } from "@/lib/track";
import { useLang } from "@/lib/LanguageContext";

interface CompanyData {
  id: string;
  name: string;
  code: string;
  logo_url: string | null;
  allowance_amount: number;
  allowance_cycle: string;
  requires_staff_id: boolean;
  member_count: number;
}

export default function CorporateRegisterPage() {
  const { lang, toggleLang } = useLang();
  const params = useParams();
  const router = useRouter();
  const companyCode = params.companyCode as string;

  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [companyError, setCompanyError] = useState("");

  const [name, setName] = useState("");
  const [staffId, setStaffId] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [allowanceAmount, setAllowanceAmount] = useState(0);

  useEffect(() => {
    (async () => {
      const { data, error: rpcErr } = await supabase.rpc("heraa_get_company_by_code", {
        p_code: companyCode.toLowerCase(),
      });

      if (rpcErr || !data?.success) {
        setCompanyError(data?.error || rpcErr?.message || "企业代码无效");
        setLoadingCompany(false);
        return;
      }

      setCompany(data.company);
      setLoadingCompany(false);
    })();
  }, [companyCode]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "corporate",
          phone: phone.trim(),
          name: name.trim(),
          staff_id: staffId.trim(),
          company_code: companyCode,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "发送失败");
        setLoading(false);
        return;
      }

      setAllowanceAmount(data.allowance || 0);
      track("register_initiated", null, {
        phone: phone.trim(),
        type: "corporate",
        company: companyCode,
      });
      setSent(true);
    } catch (err: unknown) {
      setError((err as Error).message);
    }
    setLoading(false);
  }

  const normalizedPhone = phone.trim().length >= 4 ? formatPhone(phone.trim()) : "";

  if (loadingCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse font-bold text-lg" style={{ color: "#C8111A" }}>
          HERAA COFFEE
        </div>
      </div>
    );
  }

  if (companyError) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <div className="py-8 text-center" style={{ background: "#C8111A" }}>
          <div className="text-white font-bold text-lg tracking-wider">HERAA COFFEE</div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">{companyError}</h2>
          <p className="text-xs text-gray-400 text-center mb-6">
            {lang === "zh"
              ? "请检查企业代码是否正确，或联系HR获取"
              : "Please check the company code or contact HR"}
          </p>
          <button
            onClick={() => router.push("/register")}
            className="text-white font-semibold rounded-xl py-3 px-6 text-sm"
            style={{ background: "#C8111A" }}
          >
            {lang === "zh" ? "← 一般注册" : "← Regular Registration"}
          </button>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <div className="py-8 text-center" style={{ background: "#C8111A" }}>
          <div className="text-white font-bold text-lg tracking-wider">HERAA COFFEE</div>
          <div className="text-white/70 text-xs mt-1">{company?.name}</div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-6xl mb-5">📱</div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">
            {lang === "zh" ? "检查你的 WhatsApp" : "Check your WhatsApp"}
          </h2>
          <p className="text-sm text-gray-500 text-center leading-relaxed">
            {lang === "zh" ? "激活链接已发送到" : "Activation link sent to"}
            <br />
            <span className="font-semibold text-gray-700 text-base">{normalizedPhone || phone}</span>
          </p>
          {allowanceAmount > 0 && (
            <div className="mt-4 rounded-lg p-3 text-center" style={{ background: "#F0FFF4" }}>
              <p className="text-sm text-green-700 font-medium">
                💰 {lang === "zh"
                  ? `激活后每月自动获得 RM${allowanceAmount} 咖啡津贴`
                  : `After activation, get RM${allowanceAmount} coffee allowance monthly`}
              </p>
            </div>
          )}
          <button
            onClick={() => router.push("/login")}
            className="mt-8 text-sm font-medium"
            style={{ color: "#C8111A" }}
          >
            {lang === "zh" ? "← 去登入" : "← Go to Login"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="py-8 text-center relative" style={{ background: "#C8111A" }}>
        <button
          onClick={toggleLang}
          className="absolute top-3 right-3 text-white text-sm font-medium rounded px-3 py-1.5 border"
          style={{
            background: "rgba(255,255,255,0.15)",
            borderColor: "rgba(255,255,255,0.3)",
          }}
        >
          {lang === "zh" ? "EN" : "中文"}
        </button>
        {company?.logo_url && (
          <img src={company.logo_url} alt={company.name} className="w-12 h-12 rounded-full mx-auto mb-2" />
        )}
        <div className="text-white font-bold text-lg tracking-wider">HERAA COFFEE</div>
        <div className="text-white/70 text-sm mt-1">{company?.name}</div>
        <div className="text-white/50 text-xs mt-0.5">
          {lang === "zh" ? "员工专属注册" : "Employee Registration"}
        </div>
      </div>

      <div className="flex-1 px-6 py-8">
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1.5">
              {lang === "zh" ? "姓名" : "Name"}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kenny Ngui"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": "#C8111A" } as React.CSSProperties}
            />
          </div>

          {company?.requires_staff_id && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1.5">
                {lang === "zh" ? "工号 Staff ID" : "Staff ID"}
              </label>
              <input
                type="text"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                placeholder="e.g. GEN-0042"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": "#C8111A" } as React.CSSProperties}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1.5">
              {lang === "zh" ? "WhatsApp 手机号" : "WhatsApp Number"}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="011-1234 5678"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": "#C8111A" } as React.CSSProperties}
            />
            {normalizedPhone && (
              <p className="text-xs mt-1.5 font-medium" style={{ color: "#C8111A" }}>
                {lang === "zh" ? "将识别为" : "Recognized as"}: <span className="font-bold">{normalizedPhone}</span>
              </p>
            )}
          </div>

          {company && company.allowance_amount > 0 && (
            <div
              className="text-xs text-gray-600 rounded-lg p-3 flex items-center gap-2"
              style={{ background: "#F0FFF4" }}
            >
              <span>💰</span>
              <span>
                {lang === "zh"
                  ? `激活后每${company.allowance_cycle === "monthly" ? "月" : "周"}自动获得 RM${company.allowance_amount} 咖啡津贴`
                  : `Get RM${company.allowance_amount} coffee allowance ${company.allowance_cycle === "monthly" ? "monthly" : "weekly"} after activation`}
              </span>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-bold rounded-xl text-lg disabled:opacity-50 transition-opacity"
            style={{ background: "#C8111A", height: 58 }}
          >
            {loading
              ? (lang === "zh" ? "发送中..." : "Sending...")
              : `📱 ${lang === "zh" ? "发送 WhatsApp 激活链接" : "Send WhatsApp Activation Link"}`}
          </button>

          <p className="text-xs text-center text-gray-400 mt-3">
            ⚠️ Twilio Sandbox{" "}
            {lang === "zh" ? "用户：先发" : "users: first send"}{" "}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">join doctor-through</code>{" "}
            {lang === "zh" ? "到 +1 415 523 8886" : "to +1 415 523 8886"}
          </p>
        </form>

        <div className="text-center mt-6 space-y-3">
          <button
            onClick={() => router.push("/register")}
            className="text-sm text-gray-400"
          >
            {lang === "zh"
              ? `不是 ${company?.name} 员工？一般注册 →`
              : `Not a ${company?.name} employee? Regular signup →`}
          </button>
        </div>
      </div>
    </div>
  );
}
