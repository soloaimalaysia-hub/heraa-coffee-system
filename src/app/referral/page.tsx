"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { fetchMe, Member } from "@/lib/session";
import { track } from "@/lib/track";
import { useLang } from "@/lib/LanguageContext";
import BottomNav from "@/components/BottomNav";

export default function ReferralPage() {
  const { t, lang } = useLang();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [stats, setStats] = useState({ referral_count: 0, total_reward: 0 });
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [codeMsg, setCodeMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const me = await fetchMe();
    if (!me) {
      router.replace("/login");
      return;
    }
    setMember(me.member);

    const { data } = await supabase.rpc("heraa_get_referral_stats", {
      p_member_id: me.member.id,
    });
    if (data) setStats(data);
    setLoading(false);
    track("referral_viewed", me.member.id);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCopy() {
    if (!member?.referral_code) return;
    try {
      await navigator.clipboard.writeText(member.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = member.referral_code;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleShare() {
    if (!member?.referral_code) return;
    const url = `https://heraa-coffee-system.vercel.app/login?ref=${member.referral_code}`;
    const text = t.referralShareText.replace("{code}", member.referral_code) + "\n👉 " + url;

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    }
  }

  async function handleClaimCode() {
    if (!member || !code.trim()) return;
    setSubmitting(true);
    setCodeMsg("");

    const { data, error } = await supabase.rpc("heraa_claim_referral", {
      p_referee_id: member.id,
      p_referral_code: code.trim(),
    });

    setSubmitting(false);

    if (error) {
      setCodeMsg(error.message);
      return;
    }

    if (data && !data.success) {
      setCodeMsg(data.error);
      return;
    }

    setCodeMsg(lang === "zh" ? `✅ 成功！${data.referrer_name} 邀请你，你们各得 RM1` : `✅ Success! ${data.referrer_name} referred you, you both get RM1`);
    track("referral_claimed", member.id, { code: code.trim() });
    setCode("");
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pb-20 md:pb-0 md:pl-[84px]">
      {/* Header */}
      <div className="py-8 text-center" style={{ background: "#C8111A" }}>
        <div className="text-white font-bold text-lg tracking-widest">HERAA COFFEE</div>
        <div className="text-white/70 text-xs mt-1">{t.referralTitle}</div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Reward Banner */}
        <div className="rounded-2xl p-5" style={{ background: "#C8111A" }}>
          <div className="text-white text-base font-bold mb-2">🎉 {t.referralDesc}</div>
          <div className="text-white/90 text-sm leading-relaxed">
            {t.referralYouGet} <strong>{t.referralReward}</strong>，{t.referralFriendGet} <strong>{t.referralReward}</strong>
          </div>
        </div>

        {/* My Link */}
        <div>
          <div className="text-xs font-semibold text-gray-400 mb-2">{t.referralMyCode}</div>
          <div className="flex gap-2 mb-4">
            <div
              className="flex-1 bg-white rounded-xl px-4 py-3 text-sm text-gray-600 border border-gray-200 overflow-hidden text-ellipsis whitespace-nowrap"
            >
              {member?.referral_code
                ? `heraa.com/ref/${member.referral_code}`
                : "------"}
            </div>
            <button
              onClick={handleCopy}
              className="text-sm font-bold rounded-xl px-4 border transition-colors shrink-0"
              style={{
                borderColor: copied ? "#16a34a" : "#C8111A",
                color: copied ? "#16a34a" : "#C8111A",
                background: copied ? "#f0fdf4" : "white",
              }}
            >
              {copied ? t.referralCopied : t.referralCopy}
            </button>
          </div>

          {/* Share icons */}
          <div className="flex justify-around bg-white rounded-xl border border-gray-100 py-4">
            <button onClick={handleShare} className="flex flex-col items-center gap-1.5">
              <span
                className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
                style={{ background: "#25D366" }}
              >
                💬
              </span>
              <span className="text-[10px] text-gray-500">WhatsApp</span>
            </button>
            <button onClick={handleShare} className="flex flex-col items-center gap-1.5">
              <span
                className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
                style={{ background: "#1877F2" }}
              >
                📘
              </span>
              <span className="text-[10px] text-gray-500">Facebook</span>
            </button>
            <button onClick={handleShare} className="flex flex-col items-center gap-1.5">
              <span
                className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
                style={{ background: "#0088cc" }}
              >
                ✈️
              </span>
              <span className="text-[10px] text-gray-500">Telegram</span>
            </button>
            <button onClick={handleShare} className="flex flex-col items-center gap-1.5">
              <span
                className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
                style={{ background: "#6b7280" }}
              >
                ✉️
              </span>
              <span className="text-[10px] text-gray-500">Email</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="text-sm font-semibold text-gray-700 mb-3">{t.referralStats}</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold" style={{ color: "#C8111A" }}>
                {stats.referral_count}
              </div>
              <div className="text-xs text-gray-400">{t.referralInvited}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-green-600">
                RM {stats.total_reward}
              </div>
              <div className="text-xs text-gray-400">{t.referralEarned}</div>
            </div>
          </div>
        </div>

        {/* Enter Code */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="text-sm font-semibold text-gray-700 mb-3">{t.referralEnterCode}</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={t.referralEnterPlaceholder}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm uppercase tracking-wider focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": "#C8111A" } as React.CSSProperties}
              maxLength={8}
            />
            <button
              onClick={handleClaimCode}
              disabled={submitting || !code.trim()}
              className="text-sm font-bold text-white rounded-xl px-5 disabled:opacity-40"
              style={{ background: "#C8111A" }}
            >
              {submitting ? "..." : t.referralSubmit}
            </button>
          </div>
          {codeMsg && (
            <p className={`text-sm mt-2 ${codeMsg.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>
              {codeMsg}
            </p>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
