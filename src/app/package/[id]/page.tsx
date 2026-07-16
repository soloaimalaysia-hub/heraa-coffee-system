"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  description_zh: string | null;
  description_en: string | null;
  is_popular: boolean;
}

export default function PackageDetailPage() {
  const { t, lang } = useLang();
  const router = useRouter();
  const params = useParams();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("heraa_packages")
        .select("*")
        .eq("id", params.id)
        .single();
      if (data) setPkg(data);
      setLoading(false);
    })();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse font-bold text-lg" style={{ color: "#C8111A" }}>
          HERAA COFFEE
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white pb-20">
        <span className="text-4xl mb-3">📦</span>
        <span className="text-sm text-gray-400">Package not found</span>
        <button
          onClick={() => router.push("/packages")}
          className="mt-4 text-sm font-medium"
          style={{ color: "#C8111A" }}
        >
          {t.packagesBack}
        </button>
        <BottomNav />
      </div>
    );
  }

  const name = lang === "zh" ? pkg.name_zh : pkg.name_en;
  const desc = lang === "zh" ? pkg.description_zh : pkg.description_en;
  const totalCups = pkg.credits + pkg.bonus_credits;

  return (
    <div className="min-h-screen flex flex-col bg-white pb-20">
      {/* Header */}
      <div className="py-8 text-center relative" style={{ background: "#C8111A" }}>
        <button
          onClick={() => router.push("/packages")}
          className="absolute top-3 left-3 text-white text-sm px-3 py-1"
        >
          ←
        </button>
        <div className="text-white font-bold text-lg tracking-widest">HERAA COFFEE</div>
        <div className="text-white/70 text-xs mt-1">{t.packagesTitle}</div>
      </div>

      <div className="flex-1 px-4 py-6">
        {/* Package Info */}
        <div className="text-center mb-6">
          {pkg.is_popular && (
            <span
              className="inline-block text-white text-[10px] font-bold px-3 py-1 rounded-full mb-3"
              style={{ background: "#C8111A" }}
            >
              {t.packagesPopular}
            </span>
          )}
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{name}</h1>
          <div className="text-3xl font-bold mb-1" style={{ color: "#C8111A" }}>
            RM {pkg.price_rm}
          </div>
          {desc && <p className="text-sm text-gray-500 mt-2">{desc}</p>}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold" style={{ color: "#C8111A" }}>{totalCups}</div>
            <div className="text-[10px] text-gray-400">{t.packagesCups}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-green-600">+{pkg.bonus_credits}</div>
            <div className="text-[10px] text-gray-400">{t.packagesBonus}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-gray-700">{pkg.validity_days}</div>
            <div className="text-[10px] text-gray-400">{t.packagesDays}</div>
          </div>
        </div>

        {/* Includes */}
        <div className="rounded-xl border border-gray-100 p-4 mb-6">
          <div className="text-sm font-semibold text-gray-700 mb-3">{t.packagesIncludes}</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-sm text-gray-600">{pkg.credits} {t.packagesInclude1}</span>
            </div>
            {pkg.bonus_credits > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-sm text-gray-600">🎁 {t.packagesBonus} +{pkg.bonus_credits} {t.packagesCups}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-sm text-gray-600">{t.packagesInclude2}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-300">⚠</span>
              <span className="text-sm text-gray-400">{t.packagesInclude3}</span>
            </div>
          </div>
        </div>

        {/* Buy Button (disabled) */}
        <button
          disabled
          className="w-full text-gray-400 font-bold rounded-xl text-lg bg-gray-100"
          style={{ height: 58 }}
        >
          {t.packagesComingSoon}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
