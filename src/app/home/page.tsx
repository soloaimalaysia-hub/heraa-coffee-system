"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchMe, clearSession, Member, Wallet, Transaction, CompanyInfo } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/track";
import { useLang } from "@/lib/LanguageContext";
import BottomNav from "@/components/BottomNav";

function getGreeting(t: Record<string, string>) {
  const h = new Date().getHours();
  if (h < 12) return t.homeGreetMorning;
  if (h < 18) return t.homeGreetAfternoon;
  return t.homeGreetEvening;
}

function getNextAllowanceDate(companyInfo: CompanyInfo | null | undefined): string {
  if (!companyInfo) return "";
  const now = new Date();
  if (companyInfo.allowance_cycle === "monthly") {
    const resetDay = companyInfo.allowance_reset_day || 1;
    let next = new Date(now.getFullYear(), now.getMonth(), resetDay);
    if (next <= now) next = new Date(now.getFullYear(), now.getMonth() + 1, resetDay);
    return `${next.getMonth() + 1}月${next.getDate()}日`;
  }
  return "";
}

export default function HomePage() {
  const { t, lang, toggleLang } = useLang();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const me = await fetchMe();
    if (!me) {
      router.replace("/login");
      return;
    }
    setMember(me.member);
    setWallet(me.wallet);
    setTransactions(me.transactions.slice(0, 3));
    setCompanyInfo(me.company_info || null);
    setLoading(false);
    track("home_viewed", me.member.id);

    supabase.rpc("heraa_get_member_credits", { p_member_id: me.member.id }).then(({ data }) => {
      if (data?.success) setCreditsRemaining(data.credits_remaining);
    });

    supabase.rpc("heraa_check_expired_redemptions", {
      p_member_id: me.member.id,
    }).then(({ data }) => {
      if (data?.expired_count > 0) loadData();
    });
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse font-bold text-lg" style={{ color: "#C8111A" }}>
          HERAA COFFEE
        </div>
      </div>
    );
  }

  const balance = Number(wallet?.balance ?? 0);
  const cups = Math.floor(balance / 6.5);
  const isCorporate = member?.member_type === "corporate";
  const monthlyAllowance = Number(wallet?.monthly_allowance ?? 0);
  const pct = monthlyAllowance > 0 ? (balance / monthlyAllowance) * 100 : 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tAny = t as any;
  const greeting = getGreeting(tAny);

  const memberLabel = isCorporate
    ? `${member?.name} · ${companyInfo?.name || ""} ${lang === "zh" ? "员工" : "Staff"}`
    : `${member?.name}`;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pb-20 md:pb-0 md:pl-[84px]">
      {/* Header */}
      <div className="pt-12 pb-6 px-5 relative" style={{ background: "#C8111A" }}>
        <div className="absolute top-3 left-4">
          <button
            onClick={toggleLang}
            className="text-white text-sm font-medium rounded px-3 py-1.5 border"
            style={{
              background: "rgba(255,255,255,0.15)",
              borderColor: "rgba(255,255,255,0.3)",
            }}
          >
            {lang === "zh" ? "EN" : "中文"}
          </button>
        </div>
        <button
          onClick={handleLogout}
          className="absolute top-3 right-4 text-white/70 text-sm px-3 py-1.5"
        >
          {lang === "zh" ? "退出" : "Logout"}
        </button>
        <div className="text-center">
          <div className="text-white font-bold text-lg tracking-widest">
            HERAA COFFEE
          </div>
        </div>
        <div className="text-white text-lg font-semibold mt-4">
          {greeting}, {member?.name} ☕
        </div>
        <div className="text-white/60 text-xs mt-1">
          {isCorporate
            ? `🏢 ${companyInfo?.name || ""} · ${lang === "zh" ? "员工" : "Staff"}`
            : `☕ ${lang === "zh" ? "会员" : "Member"}`}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-3">
        {/* Coffee Credits (Package system) */}
        <div className="rounded-2xl p-5 mb-4 shadow-sm text-white" style={{ background: "#C8111A" }}>
          <div className="text-xs font-semibold tracking-wide mb-1" style={{ color: "#FFD9D9" }}>
            {t.creditsRemaining}
          </div>
          <div className="flex items-end gap-2 mb-1">
            <span className="font-bold" style={{ fontSize: 42, lineHeight: 1 }}>
              {creditsRemaining}
            </span>
          </div>
          <div className="text-xs mb-3" style={{ color: "#FFD9D9" }}>
            {t.creditsCupsRemaining}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => router.push("/scan")}
              className="rounded-lg py-2 text-xs font-bold"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              📷 {t.homeScanCollect}
            </button>
            <button
              onClick={() => router.push("/packages")}
              className="rounded-lg py-2 text-xs font-bold"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              📦 {t.homeBuyPackage}
            </button>
            <button
              onClick={() => router.push("/voucher")}
              className="rounded-lg py-2 text-xs font-bold"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              🎫 {t.homeMyVouchers}
            </button>
          </div>
        </div>

        {/* RM Wallet Card (unchanged) */}
        {isCorporate ? (
          <div
            className="rounded-2xl p-5 mb-4 shadow-sm"
            style={{ background: "#FFF5F5", border: "1px solid #FFD0D0" }}
          >
            <div className="text-xs font-semibold tracking-wide mb-1" style={{ color: "#C8111A" }}>
              {lang === "zh" ? "我的余额" : "My Balance"}
            </div>
            <div className="flex items-end gap-2 mb-1">
              <span className="font-bold" style={{ fontSize: 42, color: "#C8111A", lineHeight: 1 }}>
                RM {balance.toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-gray-400 mb-2">
              {lang === "zh" ? "约" : "≈"} {cups} {lang === "zh" ? "杯" : "cups"}
            </div>
            <div className="h-2 bg-white rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(pct, 100)}%`, background: "#C8111A" }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>
                {lang === "zh" ? "本月津贴" : "Monthly allowance"} RM{monthlyAllowance.toFixed(0)}
              </span>
              <span>
                {lang === "zh" ? "下次发放" : "Next"}: {getNextAllowanceDate(companyInfo)}
              </span>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl p-5 mb-4 shadow-sm"
            style={{ background: "#FFF5F5", border: "1px solid #FFD0D0" }}
          >
            <div className="text-xs font-semibold tracking-wide mb-1" style={{ color: "#C8111A" }}>
              {lang === "zh" ? "我的余额" : "My Balance"}
            </div>
            <div className="flex items-end gap-2 mb-1">
              <span className="font-bold" style={{ fontSize: 42, color: "#C8111A", lineHeight: 1 }}>
                RM {balance.toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-gray-400 mb-3">
              {lang === "zh" ? "约" : "≈"} {cups} {lang === "zh" ? "杯" : "cups"}
            </div>
            <button
              onClick={() => router.push("/packages")}
              className="w-full text-center py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: "#C8111A" }}
            >
              💳 {lang === "zh" ? "立即充值" : "Top Up Now"}
            </button>
          </div>
        )}

        {/* Active Package */}
        <button
          className="w-full rounded-xl p-4 mb-4 flex items-center justify-between text-left"
          style={{ background: "white", border: "1px solid #F0F0F0" }}
          onClick={() => router.push("/packages")}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📦</span>
            <span className="text-sm text-gray-500">{t.homeNoPackage}</span>
          </div>
          <span className="text-gray-300">›</span>
        </button>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <button
            onClick={() => router.push("/wallet")}
            className="rounded-xl p-4 flex flex-col items-center gap-2 bg-white"
            style={{ border: "1px solid #F0F0F0" }}
          >
            <span className="text-2xl">📷</span>
            <span className="text-xs font-medium text-gray-600 text-center">
              {t.homeScanCollect}
            </span>
          </button>
          <button
            onClick={() => router.push("/packages")}
            className="rounded-xl p-4 flex flex-col items-center gap-2 bg-white"
            style={{ border: "1px solid #F0F0F0" }}
          >
            <span className="text-2xl">{isCorporate ? "💳" : "📦"}</span>
            <span className="text-xs font-medium text-gray-600 text-center">
              {isCorporate
                ? (lang === "zh" ? "额外充值" : "Top Up")
                : t.homeBuyPackage}
            </span>
          </button>
          <button
            onClick={() => router.push("/voucher")}
            className="rounded-xl p-4 flex flex-col items-center gap-2 bg-white"
            style={{ border: "1px solid #F0F0F0" }}
          >
            <span className="text-2xl">🎫</span>
            <span className="text-xs font-medium text-gray-600 text-center">
              {t.homeMyVouchers}
            </span>
          </button>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-4" style={{ border: "1px solid #F0F0F0" }}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-gray-700">{t.homeRecentActivity}</span>
            <button
              onClick={() => router.push("/history")}
              className="text-xs font-medium"
              style={{ color: "#C8111A" }}
            >
              {t.homeViewAll}
            </button>
          </div>
          {transactions.length === 0 ? (
            <div className="text-sm text-gray-300 text-center py-6">{t.homeNoActivity}</div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{tx.type === "credit" ? "💰" : "☕"}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-700">{tx.description}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(tx.created_at).toLocaleDateString("zh-CN", {
                        month: "numeric",
                        day: "numeric",
                      })}{" "}
                      {new Date(tx.created_at).toLocaleTimeString("zh-CN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
                <div
                  className="text-sm font-bold"
                  style={{ color: tx.type === "credit" ? "#1a8a3a" : "#C8111A" }}
                >
                  {tx.type === "credit" ? "+" : "-"}RM {Number(tx.amount).toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
