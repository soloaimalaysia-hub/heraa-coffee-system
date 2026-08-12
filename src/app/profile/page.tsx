"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchMe, clearSession, Member, Wallet, CompanyInfo } from "@/lib/session";
import { useLang } from "@/lib/LanguageContext";
import BottomNav from "@/components/BottomNav";

export default function ProfilePage() {
  const { t, lang, toggleLang } = useLang();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const me = await fetchMe();
    if (!me) {
      router.replace("/login");
      return;
    }
    setMember(me.member);
    setWallet(me.wallet);
    setCompanyInfo(me.company_info || null);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse font-bold text-lg" style={{ color: "#C8111A" }}>
          HERAA COFFEE
        </div>
      </div>
    );
  }

  const isCorporate = member?.member_type === "corporate";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pb-20 md:pb-0 md:pl-[84px]">
      {/* Header */}
      <div className="pt-12 pb-6 text-center" style={{ background: "#C8111A" }}>
        <div className="w-16 h-16 rounded-full bg-white/20 mx-auto flex items-center justify-center text-white font-bold text-2xl">
          {member?.name?.charAt(0) || "?"}
        </div>
        <div className="text-white text-lg font-semibold mt-3">{member?.name}</div>
        <div className="text-white/60 text-xs mt-1">
          {isCorporate
            ? `🏢 ${companyInfo?.name || ""} · ${lang === "zh" ? "员工" : "Staff"}`
            : `☕ ${lang === "zh" ? "会员" : "Member"}`}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Balance */}
        <div className="bg-white rounded-xl p-4 flex justify-between items-center" style={{ border: "1px solid #F0F0F0" }}>
          <div>
            <div className="text-xs text-gray-400">{t.walletBalance}</div>
            <div className="text-xl font-bold" style={{ color: "#C8111A" }}>
              RM {Number(wallet?.balance ?? 0).toFixed(2)}
            </div>
          </div>
          <button
            onClick={() => router.push("/wallet")}
            className="text-xs font-medium px-3 py-1.5 rounded-lg"
            style={{ color: "#C8111A", background: "#FFF5F5" }}
          >
            {lang === "zh" ? "查看钱包" : "View Wallet"} →
          </button>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #F0F0F0" }}>
          <button
            onClick={() => router.push("/referral")}
            className="w-full flex items-center gap-3 px-4 py-4 text-left border-b border-gray-50 hover:bg-gray-50"
          >
            <span className="text-xl">👫</span>
            <span className="text-sm font-medium text-gray-700">{t.referralTitle}</span>
            <span className="ml-auto text-gray-300">›</span>
          </button>
          <button
            onClick={() => router.push("/history")}
            className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50"
          >
            <span className="text-xl">📋</span>
            <span className="text-sm font-medium text-gray-700">{t.historyTitle}</span>
            <span className="ml-auto text-gray-300">›</span>
          </button>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #F0F0F0" }}>
          <button
            onClick={toggleLang}
            className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50"
          >
            <span className="text-xl">🌐</span>
            <span className="text-sm font-medium text-gray-700">
              {lang === "zh" ? "语言 / Language" : "Language / 语言"}
            </span>
            <span className="ml-auto text-xs text-gray-400">{lang === "zh" ? "中文" : "English"}</span>
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={() => {
            clearSession();
            router.replace("/login");
          }}
          className="w-full text-sm font-medium text-gray-400 py-4 text-center"
        >
          {t.walletLogout}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
