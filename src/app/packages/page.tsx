"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/lib/LanguageContext";
import BottomNav from "@/components/BottomNav";

interface Package {
  id: string;
  name_zh: string;
  name_en: string;
  price_rm: number;
  credits: number;
  bonus_credits: number;
  validity_days: number;
  is_popular: boolean;
  sort_order: number;
  valid_from: string | null;
  valid_until: string | null;
}

type Tab = "coffee" | "matcha";

export default function PackagesPage() {
  const { t, lang } = useLang();
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("coffee");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("heraa_packages")
        .select("*")
        .eq("is_available", true)
        .order("sort_order");
      const now = new Date();
      const visible = (data || []).filter((p: Package) => {
        if (p.valid_from && new Date(p.valid_from) > now) return false;
        if (p.valid_until && new Date(p.valid_until) < now) return false;
        return true;
      });
      setPackages(visible);
      setLoading(false);
    })();
  }, []);

  const coffeePackages = packages.filter((p) => !p.name_en.toLowerCase().includes("matcha"));
  const matchaPackages = packages.filter((p) => p.name_en.toLowerCase().includes("matcha"));
  const displayed = tab === "coffee" ? coffeePackages : matchaPackages;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse font-bold text-lg" style={{ color: "#C8111A" }}>
          HERAA COFFEE
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pb-20 md:pb-0 md:pl-[84px]">
      {/* Header */}
      <div className="py-8 text-center" style={{ background: "#C8111A" }}>
        <div className="text-white font-bold text-lg tracking-widest">HERAA COFFEE</div>
        <div className="text-white/70 text-xs mt-1">{t.packagesTitle}</div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-100">
        {(["coffee", "matcha"] as Tab[]).map((key) => {
          const label = key === "coffee" ? t.packagesCoffeeTab : t.packagesMatchaTab;
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex-1 py-3 text-sm font-medium transition-colors"
              style={{
                color: active ? "#C8111A" : "#888",
                borderBottom: active ? "2px solid #C8111A" : "2px solid transparent",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Package Cards */}
      <div className="px-4 py-4 space-y-4">
        {displayed.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl mb-3 block">📦</span>
            <span className="text-sm text-gray-400">{t.comingSoonSub}</span>
          </div>
        ) : (
          displayed.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => router.push(`/package/${pkg.id}`)}
              className="w-full bg-white rounded-2xl p-5 text-left relative overflow-hidden"
              style={{ border: pkg.is_popular ? "2px solid #C8111A" : "1px solid #F0F0F0" }}
            >
              {pkg.is_popular && (
                <div
                  className="absolute top-0 right-0 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl"
                  style={{ background: "#C8111A" }}
                >
                  {t.packagesPopular}
                </div>
              )}
              {pkg.valid_until && (
                <div
                  className="absolute top-0 left-0 text-white text-[10px] font-bold px-3 py-1 rounded-br-xl"
                  style={{ background: "#D4AF37" }}
                >
                  ⏱ {t.packagesLimitedTime}
                </div>
              )}

              <div className="text-lg font-bold text-gray-800 mb-1">
                {lang === "zh" ? pkg.name_zh : pkg.name_en}
              </div>

              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-2xl font-bold" style={{ color: "#C8111A" }}>
                  RM {pkg.price_rm}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-3 py-1">
                  ☕ {pkg.credits} {t.packagesCups}
                </span>
                {pkg.bonus_credits > 0 && (
                  <span className="text-xs bg-green-50 text-green-600 rounded-full px-3 py-1">
                    🎁 {t.packagesBonus} +{pkg.bonus_credits} {t.packagesCups}
                  </span>
                )}
                <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-3 py-1">
                  📅 {pkg.validity_days} {t.packagesDays}
                </span>
              </div>

              <div
                className="w-full text-center text-sm font-bold rounded-xl py-3 text-white"
                style={{ background: "#C8111A" }}
              >
                {t.packagesBuyBtn}
              </div>
            </button>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
