"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchMe, Wallet } from "@/lib/session";
import { track } from "@/lib/track";
import { useLang } from "@/lib/LanguageContext";
import BottomNav from "@/components/BottomNav";

function SuccessContent() {
  const { t } = useLang();
  const searchParams = useSearchParams();
  const router = useRouter();
  const drinkName = searchParams.get("drink") || "";
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [animate, setAnimate] = useState(false);

  const load = useCallback(async () => {
    const me = await fetchMe();
    if (!me) {
      router.replace("/login");
      return;
    }
    setWallet(me.wallet);
    track("success_viewed", me.member.id, { drink: drinkName });
  }, [router, drinkName]);

  useEffect(() => {
    load();
    requestAnimationFrame(() => setAnimate(true));
  }, [load]);

  const balance = Number(wallet?.balance ?? 0);
  const cups = Math.floor(balance / 6.5);

  return (
    <div className="min-h-screen flex flex-col bg-white pb-20">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Animated Checkmark */}
        <div
          className="mb-6 transition-all duration-500"
          style={{
            fontSize: 80,
            transform: animate ? "scale(1)" : "scale(0.3)",
            opacity: animate ? 1 : 0,
          }}
        >
          ✅
        </div>

        <h1 className="text-xl font-bold text-gray-800 mb-2 text-center">
          {t.successTitle}
        </h1>
        <p className="text-sm text-gray-500 text-center mb-1">
          {t.successSub}
        </p>
        <p className="text-lg font-bold text-gray-800 mb-6">
          {drinkName}
        </p>

        {/* Divider */}
        <div className="w-16 h-0.5 bg-gray-200 mb-6" />

        {/* Balance Info */}
        <div className="text-center mb-8">
          <div className="text-xs text-gray-400 mb-1">{t.successBalance}</div>
          <div className="text-2xl font-bold" style={{ color: "#C8111A" }}>
            RM {balance.toFixed(2)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {t.successCups} <span className="font-bold" style={{ color: "#C8111A" }}>{cups}</span> {t.successCupsUnit}
          </div>
        </div>

        {/* Buttons */}
        <button
          onClick={() => router.push("/home")}
          className="w-full max-w-sm text-white font-bold rounded-xl text-lg mb-3"
          style={{ background: "#C8111A", height: 58 }}
        >
          {t.successBackHome}
        </button>
        <button
          onClick={() => router.push("/history")}
          className="w-full max-w-sm font-medium rounded-xl text-sm text-gray-500"
          style={{ height: 44 }}
        >
          {t.successViewHistory}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse font-bold text-lg" style={{ color: "#C8111A" }}>
            HERAA COFFEE
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
