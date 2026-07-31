"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatPhone } from "@/lib/phone";
import { track } from "@/lib/track";
import { useLang } from "@/lib/LanguageContext";

function LoginContent() {
  const { t, lang, toggleLang } = useLang();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notActivated, setNotActivated] = useState(false);
  const [notActivatedMemberId, setNotActivatedMemberId] = useState("");
  const [resending, setResending] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotActivated(false);

    const { data, error: rpcErr } = await supabase.rpc("heraa_login_password", {
      p_phone: phone.trim(),
      p_password: password,
    });

    setLoading(false);

    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }

    if (!data.success) {
      if (data.error === "not_activated") {
        setNotActivated(true);
        setNotActivatedMemberId(data.member_id || "");
        return;
      }
      setError(data.error);
      return;
    }

    localStorage.setItem("heraa_session", data.session_token);
    localStorage.setItem("heraa_member_id", data.member_id);
    track("login_success", data.member_id);

    supabase.rpc("heraa_grant_welcome_voucher", {
      p_member_id: data.member_id,
    }).then(() => {});

    const refCode = localStorage.getItem("heraa_ref_code");
    if (refCode) {
      localStorage.removeItem("heraa_ref_code");
      supabase.rpc("heraa_claim_referral", {
        p_referee_id: data.member_id,
        p_referral_code: refCode,
      }).then(() => {
        track("referral_auto_claimed", data.member_id, { code: refCode });
      });
    }

    router.replace("/home");
  }

  async function handleResendActivation() {
    if (!phone.trim()) return;
    setResending(true);
    setLinkSent(false);

    try {
      const res = await fetch("/api/auth/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), name: "", staff_id: "" }),
      });
      const data = await res.json();
      if (res.ok || data.needs_info) {
        setLinkSent(true);
      } else {
        setError(data.error || "发送失败");
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    }
    setResending(false);
  }

  const normalizedPhone = phone.trim().length >= 4 ? formatPhone(phone.trim()) : "";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="py-8 text-center relative" style={{ background: "#C8111A" }}>
        <button
          onClick={toggleLang}
          className="absolute top-3 right-3 text-white text-sm font-medium rounded px-3 py-1.5 border"
          style={{
            background: "rgba(255,255,255,0.15)",
            borderColor: "rgba(255,255,255,0.3)",
          }}
        >
          {lang === "zh" ? "EN" : "中文"}
        </button>
        <div className="text-white font-bold text-lg tracking-wider">
          HERAA COFFEE
        </div>
        <div className="text-white/70 text-xs mt-1">{t.walletTitle}</div>
      </div>

      <div className="flex-1 px-6 py-8">
        <h2 className="text-xl font-bold text-gray-800 mb-2">{t.loginTitle}</h2>
        <p className="text-sm text-gray-400 mb-6">
          {lang === "zh"
            ? "手机号 + 密码登入"
            : "Login with phone number & password"}
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1.5">
              {t.loginPhone}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t.loginPhonePlaceholder}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": "#C8111A" } as React.CSSProperties}
            />
            {normalizedPhone && (
              <p className="text-xs mt-1.5 font-medium" style={{ color: "#C8111A" }}>
                {lang === "zh" ? "将识别为" : "Recognized as"}: <span className="font-bold">{normalizedPhone}</span>
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1.5">
              {t.loginPassword}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.loginPasswordPlaceholder}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": "#C8111A" } as React.CSSProperties}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          {/* Not Activated */}
          {notActivated && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
              <p className="text-sm text-yellow-700 font-medium mb-2">
                {t.loginNotActivated}
              </p>
              {linkSent ? (
                <p className="text-sm text-green-600 font-medium">
                  ✅ {t.loginLinkSent}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendActivation}
                  disabled={resending}
                  className="text-sm font-semibold disabled:opacity-50"
                  style={{ color: "#C8111A" }}
                >
                  {resending
                    ? (lang === "zh" ? "发送中..." : "Sending...")
                    : `📱 ${t.loginResendLink}`}
                </button>
              )}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-bold rounded-xl text-lg disabled:opacity-50 transition-opacity"
            style={{ background: "#C8111A", height: 58 }}
          >
            {loading ? t.loginBtnLoading : t.loginBtn}
          </button>
        </form>

        {/* Forgot Password */}
        <div className="text-center mt-4">
          <button
            onClick={() => router.push("/forgot-password")}
            className="text-sm font-medium"
            style={{ color: "#C8111A" }}
          >
            {t.loginForgot}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">{t.loginRegisterHint}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Register */}
        <button
          onClick={() => router.push("/register")}
          className="w-full font-semibold rounded-xl text-sm border transition-colors"
          style={{ borderColor: "#C8111A", color: "#C8111A", height: 48 }}
        >
          {t.loginRegisterBtn}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
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
      <LoginContent />
    </Suspense>
  );
}
