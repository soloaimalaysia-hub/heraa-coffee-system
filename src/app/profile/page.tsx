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
  const [showInfo, setShowInfo] = useState(false);

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

  const menuItems = [
    { icon: "👤", label: lang === "zh" ? "我的资料" : "My Info", onClick: () => setShowInfo((s) => !s) },
    { icon: "📦", label: lang === "zh" ? "我的配套" : "My Packages", onClick: () => router.push("/packages") },
    { icon: "📋", label: t.historyTitle, onClick: () => router.push("/history") },
    { icon: "🎫", label: lang === "zh" ? "我的优惠券" : "My Vouchers", onClick: () => router.push("/voucher") },
    { icon: "👫", label: t.referralTitle, onClick: () => router.push("/referral") },
    { icon: "⚙️", label: lang === "zh" ? "设置" : "Settings", onClick: toggleLang, trailing: lang === "zh" ? "中文" : "English" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pb-20 md:pb-0 md:pl-[84px]">
      {/* Header */}
      <div className="pt-12 pb-8 text-center" style={{ background: "#C8111A" }}>
        <div className="w-16 h-16 rounded-full bg-white/20 mx-auto flex items-center justify-center text-white font-bold text-2xl">
          {member?.name?.charAt(0) || "?"}
        </div>
        <div className="text-white text-lg font-semibold mt-3">{member?.name}</div>
        <div className="text-white/70 text-xs mt-1">{member?.phone}</div>
        <div className="text-white/60 text-xs mt-1">
          {isCorporate
            ? `🏢 ${companyInfo?.name || ""} · ${lang === "zh" ? "员工" : "Staff"}`
            : `☕ ${lang === "zh" ? "会员" : "Member"}`}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {showInfo && (
          <div className="bg-white rounded-xl p-4 text-sm space-y-2" style={{ border: "1px solid #F0F0F0" }}>
            <div className="flex justify-between">
              <span className="text-gray-400">{lang === "zh" ? "姓名" : "Name"}</span>
              <span className="font-medium text-gray-700">{member?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{lang === "zh" ? "手机号" : "Phone"}</span>
              <span className="font-medium text-gray-700">{member?.phone}</span>
            </div>
            {isCorporate && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-400">{lang === "zh" ? "工号" : "Staff ID"}</span>
                  <span className="font-medium text-gray-700">{member?.staff_id || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{lang === "zh" ? "企业" : "Company"}</span>
                  <span className="font-medium text-gray-700">{companyInfo?.name || "-"}</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-gray-50">
              <span className="text-gray-400">{t.walletBalance}</span>
              <button
                onClick={() => router.push("/wallet")}
                className="font-bold px-2 py-1 rounded"
                style={{ color: "#C8111A", background: "#FFF5F5" }}
              >
                RM {Number(wallet?.balance ?? 0).toFixed(2)} →
              </button>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #F0F0F0" }}>
          {menuItems.map((item, i) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 ${i < menuItems.length - 1 ? "border-b border-gray-50" : ""}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
              {item.trailing ? (
                <span className="ml-auto text-xs text-gray-400">{item.trailing}</span>
              ) : (
                <span className="ml-auto text-gray-300">›</span>
              )}
            </button>
          ))}
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
