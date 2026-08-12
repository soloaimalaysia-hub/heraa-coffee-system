"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { fetchMe } from "@/lib/session";
import { useLang } from "@/lib/LanguageContext";
import BottomNav from "@/components/BottomNav";

interface Voucher {
  id: string;
  code: string;
  type: string;
  title_zh: string;
  title_en: string;
  description_zh: string;
  description_en: string;
  value: number;
  status: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

type VoucherTab = "active" | "used" | "expired";

export default function VoucherPage() {
  const { t, lang } = useLang();
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<VoucherTab>("active");

  const loadVouchers = useCallback(async () => {
    const me = await fetchMe();
    if (!me) {
      router.replace("/login");
      return;
    }

    const { data } = await supabase.rpc("heraa_get_my_vouchers", {
      p_member_id: me.member.id,
    });

    if (data) setVouchers(data);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadVouchers();
  }, [loadVouchers]);

  const now = new Date();
  const categorized = vouchers.map((v) => {
    if (v.status === "used") return { ...v, _tab: "used" as VoucherTab };
    if (v.expires_at && new Date(v.expires_at) < now)
      return { ...v, _tab: "expired" as VoucherTab };
    return { ...v, _tab: "active" as VoucherTab };
  });

  const filtered = categorized.filter((v) => v._tab === tab);
  const counts = {
    active: categorized.filter((v) => v._tab === "active").length,
    used: categorized.filter((v) => v._tab === "used").length,
    expired: categorized.filter((v) => v._tab === "expired").length,
  };

  const tabLabels: Record<VoucherTab, string> = {
    active: lang === "zh" ? "可用" : "Active",
    used: lang === "zh" ? "已使用" : "Used",
    expired: lang === "zh" ? "已过期" : "Expired",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="animate-pulse font-bold text-lg"
          style={{ color: "#C8111A" }}
        >
          HERAA COFFEE
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pb-20 md:pb-0 md:pl-[84px]">
      {/* Header */}
      <div className="py-8 text-center" style={{ background: "#C8111A" }}>
        <div className="text-white font-bold text-lg tracking-widest">
          HERAA COFFEE
        </div>
        <div className="text-white/70 text-xs mt-1">
          {lang === "zh" ? "我的优惠券" : "My Vouchers"}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        {(["active", "used", "expired"] as VoucherTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-3 text-sm font-medium transition-colors relative"
            style={{
              color: tab === t ? "#C8111A" : "#888",
              borderBottom:
                tab === t ? "2px solid #C8111A" : "2px solid transparent",
            }}
          >
            {tabLabels[t]}
            {counts[t] > 0 && (
              <span
                className="ml-1 inline-flex items-center justify-center text-xs rounded-full px-1.5 min-w-[18px] h-[18px]"
                style={{
                  background: tab === t ? "#C8111A" : "#e5e7eb",
                  color: tab === t ? "white" : "#6b7280",
                  fontSize: 10,
                }}
              >
                {counts[t]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Voucher List */}
      <div className="flex-1 px-4 py-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-5xl mb-4">🎫</span>
            <span className="text-sm text-gray-400">
              {lang === "zh" ? "暂无优惠券" : "No vouchers"}
            </span>
          </div>
        ) : (
          filtered.map((v) => {
            const isExpired = v._tab === "expired";
            const isUsed = v._tab === "used";
            const inactive = isExpired || isUsed;

            return (
              <div
                key={v.id}
                className="bg-white rounded-xl overflow-hidden border"
                style={{
                  borderColor: inactive ? "#e5e7eb" : "#FFD0D0",
                  opacity: inactive ? 0.6 : 1,
                }}
              >
                <div className="flex">
                  {/* Left value section */}
                  <div
                    className="flex flex-col items-center justify-center px-5 py-4 min-w-[100px]"
                    style={{
                      background: inactive
                        ? "#f3f4f6"
                        : v.type === "free_drink"
                        ? "linear-gradient(135deg, #FEF3C7, #F59E0B20)"
                        : "#FEF2F2",
                    }}
                  >
                    {v.value === 0 || v.type === "free_drink" ? (
                      <span
                        className="font-bold text-lg"
                        style={{
                          color: inactive ? "#9ca3af" : "#C8111A",
                        }}
                      >
                        FREE
                      </span>
                    ) : (
                      <>
                        <span
                          className="text-xs"
                          style={{
                            color: inactive ? "#9ca3af" : "#C8111A",
                          }}
                        >
                          RM
                        </span>
                        <span
                          className="font-bold text-2xl leading-tight"
                          style={{
                            color: inactive ? "#9ca3af" : "#C8111A",
                          }}
                        >
                          {v.value}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Right info section */}
                  <div className="flex-1 px-4 py-3 flex flex-col justify-between">
                    <div>
                      <div className="text-sm font-bold text-gray-800">
                        {lang === "zh" ? v.title_zh : v.title_en}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {lang === "zh" ? v.description_zh : v.description_en}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-[10px] text-gray-400">
                        {v.expires_at
                          ? `${lang === "zh" ? "有效期至" : "Expires"} ${new Date(v.expires_at).toLocaleDateString("zh-CN")}`
                          : ""}
                      </div>
                      {isUsed && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                          {lang === "zh" ? "已使用" : "Used"}
                        </span>
                      )}
                      {isExpired && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                          {lang === "zh" ? "已过期" : "Expired"}
                        </span>
                      )}
                      {!inactive && (
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded"
                          style={{ background: "#FEF2F2", color: "#C8111A" }}
                        >
                          {lang === "zh" ? "展会后可用" : "Available after expo"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
}
