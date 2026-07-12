"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { fetchMe } from "@/lib/session";
import { track } from "@/lib/track";
import { useLang } from "@/lib/LanguageContext";

interface GardenState {
  day_count: number;
  stage: string;
  last_watered: string | null;
  reward_claimed: boolean;
  can_water: boolean;
}

const STAGE_META: Record<string, { emoji: string; color: string; idx: number }> = {
  seed: { emoji: "🌰", color: "#8B6914", idx: 0 },
  sprout: { emoji: "🌱", color: "#2E8B57", idx: 1 },
  flower: { emoji: "🌿", color: "#228B22", idx: 2 },
  ready: { emoji: "☕", color: "#C8111A", idx: 3 },
};

export default function GardenPage() {
  const { t } = useLang();
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
        <div className="animate-pulse font-bold" style={{ color: "#C8111A" }}>
          加载中...
        </div>
      </div>
    );
  }

  const stageMeta = garden ? STAGE_META[garden.stage] || STAGE_META.seed : STAGE_META.seed;
  const stage = { ...stageMeta, label: t.gardenStages[stageMeta.idx] };
  const progress = garden ? Math.min((garden.day_count / 30) * 100, 100) : 0;
  const daysLeft = garden ? Math.max(30 - garden.day_count, 0) : 30;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="py-6 text-center" style={{ background: "#C8111A" }}>
        <div className="text-white font-bold text-base tracking-widest">
          HERAA COFFEE
        </div>
        <div className="text-white/70 text-[10px] mt-0.5">
          {t.gardenTitle}
        </div>
      </div>

      {/* Plant Display */}
      <div className="flex-1 flex flex-col items-center px-6 py-6">
        <div
          className="relative w-40 h-40 rounded-full flex items-center justify-center mb-4"
          style={{
            background: `radial-gradient(circle, ${stage.color}15, ${stage.color}05)`,
            border: `2px solid ${stage.color}30`,
          }}
        >
          <div
            className="text-6xl transition-transform duration-500"
            style={{
              transform: justWatered ? "scale(1.3)" : "scale(1)",
            }}
          >
            {stage.emoji}
          </div>
          {justWatered && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-3xl animate-bounce">💧</div>
            </div>
          )}
        </div>

        {/* Stage Label */}
        <div className="text-center mb-4">
          <div className="text-sm font-bold" style={{ color: stage.color }}>
            {stage.label}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {garden?.day_count || 0} {t.gardenProgress}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xs mb-4">
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
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
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-gray-400">🌰 {t.gardenStages[0]}</span>
            <span className="text-[10px] text-gray-400">🌱 {t.gardenStages[1]}</span>
            <span className="text-[10px] text-gray-400">🌿 {t.gardenStages[2]}</span>
            <span className="text-[10px] text-gray-400">☕ {t.gardenStages[3]}</span>
          </div>
        </div>

        {/* Days Left */}
        {daysLeft > 0 && (
          <div
            className="rounded-xl px-4 py-2 mb-4 text-center"
            style={{ background: "#FFF3F3", border: "1px solid #FFD0D0" }}
          >
            <div className="text-xs text-gray-500">
              {t.gardenDaysLeft} <span className="font-bold" style={{ color: "#C8111A" }}>{daysLeft}</span> {t.gardenDaysUnit}
            </div>
          </div>
        )}

        {/* Reward Message */}
        {rewardMsg && (
          <div className="rounded-xl px-4 py-3 mb-4 text-center bg-green-50 border border-green-200">
            <div className="text-sm font-bold text-green-700">
              {t.gardenReward}
            </div>
            <div className="text-xs text-green-500 mt-1">
              {t.gardenRewardSub}
            </div>
          </div>
        )}

        {/* Water Button */}
        <button
          onClick={handleWater}
          disabled={watering || !garden?.can_water}
          className="w-full max-w-xs text-white font-semibold rounded-xl py-3.5 text-sm disabled:opacity-40 transition-all"
          style={{ background: "#C8111A" }}
        >
          {watering
            ? t.gardenWatering
            : !garden?.can_water
            ? t.gardenWatered
            : t.gardenWater}
        </button>

        {/* Today's Task */}
        <div className="w-full max-w-xs mt-4 rounded-xl border border-gray-100 p-3">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
            {t.gardenTask}
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
              style={{
                background: !garden?.can_water ? "#dcfce7" : "#f3f4f6",
                color: !garden?.can_water ? "#16a34a" : "#9ca3af",
              }}
            >
              {!garden?.can_water ? "✓" : "○"}
            </div>
            <span className="text-xs text-gray-600">{t.gardenTaskItem}</span>
          </div>
        </div>

        {/* Back */}
        <button
          onClick={() => router.push("/wallet")}
          className="mt-6 text-xs font-medium"
          style={{ color: "#C8111A" }}
        >
          {t.gardenBack}
        </button>
      </div>
    </div>
  );
}
