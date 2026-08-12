"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { fetchMe } from "@/lib/session";
import { track } from "@/lib/track";
import { useLang } from "@/lib/LanguageContext";
import CoffeeBean from "@/components/CoffeeBean";
import BottomNav from "@/components/BottomNav";

interface GardenState {
  day_count: number;
  stage: string;
  last_watered: string | null;
  reward_claimed: boolean;
  can_water: boolean;
}

const STAGE_META: Record<string, { emoji: string; color: string; idx: number }> = {
  seed: { emoji: "bean", color: "#8B6914", idx: 0 },
  sprout: { emoji: "🌱", color: "#2E8B57", idx: 1 },
  flower: { emoji: "🌿", color: "#228B22", idx: 2 },
  ready: { emoji: "☕", color: "#C8111A", idx: 3 },
};

export default function GardenPage() {
  const { t, lang } = useLang();
  const router = useRouter();
  const [garden, setGarden] = useState<GardenState | null>(null);
  const [loading, setLoading] = useState(true);
  const [watering, setWatering] = useState(false);
  const [justWatered, setJustWatered] = useState(false);
  const [rewardMsg, setRewardMsg] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);

  const loadGarden = useCallback(async () => {
    const me = await fetchMe();
    if (!me) {
      router.replace("/login");
      return;
    }
    setMemberId(me.member.id);

    const { data } = await supabase.rpc("heraa_get_garden", {
      p_member_id: me.member.id,
    });
    if (data) setGarden(data);
    setLoading(false);
    track("garden_viewed", me.member.id);
  }, [router]);

  useEffect(() => {
    loadGarden();
  }, [loadGarden]);

  async function handleWater() {
    if (!memberId) return;

    setWatering(true);
    const { data, error } = await supabase.rpc("heraa_water_plant", {
      p_member_id: memberId,
    });

    setWatering(false);

    if (error) {
      alert(error.message);
      return;
    }

    track("watering_done", memberId, { day_count: data.day_count, stage: data.stage });
    setJustWatered(true);
    setTimeout(() => setJustWatered(false), 2000);

    if (data.reward_generated) {
      track("garden_reward_earned", memberId);
      setRewardMsg(true);
    }

    setGarden({
      day_count: data.day_count,
      stage: data.stage,
      last_watered: new Date().toISOString().split("T")[0],
      reward_claimed: data.reward_generated || (garden?.reward_claimed ?? false),
      can_water: false,
    });
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

  const stageMeta = garden ? STAGE_META[garden.stage] || STAGE_META.seed : STAGE_META.seed;
  const stage = { ...stageMeta, label: t.gardenStages[stageMeta.idx] };
  const isSeed = garden?.stage === "seed" || !garden?.stage;
  const progress = garden ? Math.min((garden.day_count / 30) * 100, 100) : 0;
  const daysLeft = garden ? Math.max(30 - garden.day_count, 0) : 30;

  return (
    <div className="min-h-screen flex flex-col bg-white pb-20 md:pb-0 md:pl-[84px]">
      {/* Header */}
      <div className="py-8 text-center" style={{ background: "#C8111A" }}>
        <div className="text-white font-bold text-lg tracking-widest">
          HERAA COFFEE
        </div>
        <div className="text-white/70 text-xs mt-1">
          {t.gardenTitle}
        </div>
      </div>

      {/* Main Content — fills remaining space */}
      <div className="flex-1 flex flex-col items-center justify-between px-4 py-6">
        {/* Top: Plant + Info */}
        <div className="flex flex-col items-center w-full">
          {/* Plant Circle */}
          <div
            className="relative rounded-full flex items-center justify-center mb-5"
            style={{
              width: 200,
              height: 200,
              background: isSeed ? "#F5F0E8" : `radial-gradient(circle, ${stage.color}15, ${stage.color}05)`,
              border: `3px solid ${isSeed ? "#C8A882" : stage.color}40`,
            }}
          >
            <div
              className="transition-transform duration-500"
              style={{
                transform: justWatered ? "scale(1.3)" : "scale(1)",
              }}
            >
              {isSeed ? (
                <CoffeeBean size={90} />
              ) : (
                <span className="text-7xl">{stage.emoji}</span>
              )}
            </div>
            {justWatered && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-4xl animate-bounce">💧</div>
              </div>
            )}
          </div>

          {/* Stage Label */}
          <div className="text-center mb-5">
            <div className="text-2xl font-bold" style={{ color: isSeed ? "#8B6914" : stage.color }}>
              {stage.label}
            </div>
            <div className="text-base text-gray-500 mt-1">
              {garden?.day_count || 0} {t.gardenProgress}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-sm mb-5">
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, #8B6914, #2E8B57, #228B22, #C8111A)`,
                  backgroundSize: "300% 100%",
                  backgroundPosition: `${progress}% 0%`,
                }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-400">🌰 {t.gardenStages[0]}</span>
              <span className="text-xs text-gray-400">🌱 {t.gardenStages[1]}</span>
              <span className="text-xs text-gray-400">🌿 {t.gardenStages[2]}</span>
              <span className="text-xs text-gray-400">☕ {t.gardenStages[3]}</span>
            </div>
          </div>

          {/* Days Left */}
          {daysLeft > 0 && (
            <div
              className="rounded-xl px-5 py-3 mb-5 text-center w-full max-w-sm"
              style={{ background: "#FFF3F3", border: "1px solid #FFD0D0" }}
            >
              <div className="text-sm text-gray-600">
                {t.gardenDaysLeft} <span className="font-bold text-base" style={{ color: "#C8111A" }}>{daysLeft}</span> {t.gardenDaysUnit}
              </div>
            </div>
          )}

          {/* Reward Celebration Popup */}
          {rewardMsg && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
              <div className="bg-white rounded-2xl p-6 text-center max-w-sm w-full shadow-xl">
                <div className="text-5xl mb-3">🎉</div>
                <div className="text-lg font-bold text-gray-800 mb-2">
                  {t.gardenReward}
                </div>
                <div className="text-sm text-gray-500 mb-5">
                  {t.gardenRewardSub}
                </div>
                <button
                  onClick={() => router.push("/voucher")}
                  className="w-full text-white font-bold rounded-xl py-3 text-base mb-2"
                  style={{ background: "#C8111A" }}
                >
                  {t.gardenRewardBtn}
                </button>
                <button
                  onClick={() => setRewardMsg(false)}
                  className="text-sm text-gray-400"
                >
                  {lang === "zh" ? "稍后查看" : "Later"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom: Button + Task + Back */}
        <div className="flex flex-col items-center w-full mt-2">
          {/* Water Button */}
          <button
            onClick={handleWater}
            disabled={watering || !garden?.can_water}
            className="w-full max-w-sm text-white font-bold rounded-xl text-lg disabled:opacity-40 transition-all"
            style={{ background: "#C8111A", height: 58 }}
          >
            {watering
              ? t.gardenWatering
              : !garden?.can_water
              ? t.gardenWatered
              : t.gardenWater}
          </button>

          {/* Today's Task */}
          <div className="w-full max-w-sm mt-4 rounded-xl border border-gray-100 p-4">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              {t.gardenTask}
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                style={{
                  background: !garden?.can_water ? "#dcfce7" : "#f3f4f6",
                  color: !garden?.can_water ? "#16a34a" : "#9ca3af",
                }}
              >
                {!garden?.can_water ? "✓" : "○"}
              </div>
              <span className="text-sm text-gray-600">{t.gardenTaskItem}</span>
            </div>
          </div>

          {/* Back */}
          <button
            onClick={() => router.push("/home")}
            className="mt-6 mb-4 text-sm font-medium"
            style={{ color: "#C8111A" }}
          >
            {t.gardenBack}
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
