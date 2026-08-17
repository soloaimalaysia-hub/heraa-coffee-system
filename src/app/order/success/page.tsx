"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLang } from "@/lib/LanguageContext";
import BottomNav from "@/components/BottomNav";

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={null}>
      <OrderSuccessContent />
    </Suspense>
  );
}

function OrderSuccessContent() {
  const { t } = useLang();
  const router = useRouter();
  const params = useSearchParams();

  const drink = params.get("drink") || "";
  const machine = params.get("machine") || "";
  const used = params.get("used") || "1";
  const left = params.get("left") || "0";
  const now = new Date();

  return (
    <div className="min-h-screen flex flex-col bg-white pb-20 md:pb-0 md:pl-[84px]">
      <div className="flex-1 flex flex-col items-center px-6 pt-16">
        <div
          className="rounded-full flex items-center justify-center mb-5"
          style={{ width: 72, height: 72, background: "#C8111A" }}
        >
          <span style={{ fontSize: 34, color: "#fff" }}>✓</span>
        </div>
        <h1 className="text-lg font-bold text-gray-800 mb-1">{t.orderSuccessTitle}</h1>
        <p className="text-sm text-gray-400 mb-8">{t.orderSuccessSub}</p>

        <div
          className="w-full rounded-2xl p-4 mb-8 flex items-center gap-3"
          style={{ background: "#FFF5F5", border: "1px solid #FFD0D0" }}
        >
          <div
            className="rounded-lg flex items-center justify-center shrink-0"
            style={{ width: 44, height: 44, background: "#8BC34A" }}
          >
            <span style={{ fontSize: 20 }}>🥤</span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-gray-800">{drink}</div>
            <div className="text-xs text-gray-400">
              {machine} · {now.toLocaleDateString()} {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          <div className="text-sm font-bold" style={{ color: "#C8111A" }}>
            -{used} Credit
          </div>
        </div>

        <div className="w-full flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 mb-8">
          <span className="text-sm text-gray-500">{t.orderSuccessCreditsLeft}</span>
          <span className="text-lg font-bold" style={{ color: "#C8111A" }}>
            {left} Cups
          </span>
        </div>

        <button
          onClick={() => router.push("/home")}
          className="w-full text-white font-bold rounded-xl py-3.5"
          style={{ background: "#C8111A" }}
        >
          {t.orderSuccessBackHome}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
