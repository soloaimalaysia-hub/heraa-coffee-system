"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/track";
import { useLang } from "@/lib/LanguageContext";

function ActivateContent() {
  const { t, lang } = useLang();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [memberType, setMemberType] = useState("public");
  const [error, setError] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    if (!token) {
      setError(lang === "zh" ? "链接无效" : "Invalid link");
      setVerifying(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/auth/verify?token=${token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || (lang === "zh" ? "链接无效或已过期" : "Link invalid or expired"));
          setVerifying(false);
          return;
        }

        setMemberId(data.member_id);
        setSessionToken(data.session_token);
        setMemberType(data.member_type || "public");
        setVerified(true);
        setVerifying(false);
      } catch (err: unknown) {
        setError((err as Error).message);
        setVerifying(false);
      }
    })();
  }, [token, lang]);

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");

    if (password.length < 6) {
      setPwError(t.activateMinLength);
      return;
    }
    if (password !== confirmPassword) {
      setPwError(t.activateMismatch);
      return;
    }

    setSaving(true);

    const { data, error: rpcErr } = await supabase.rpc("heraa_set_password", {
      p_member_id: memberId,
      p_password: password,
    });

    if (rpcErr) {
      setPwError(rpcErr.message);
      setSaving(false);
      return;
    }

    if (data && !data.success) {
      setPwError(data.error);
      setSaving(false);
      return;
    }

    track("account_activated", memberId);

    localStorage.setItem("heraa_session", sessionToken);
    localStorage.setItem("heraa_member_id", memberId);

    if (memberType === "corporate") {
      await supabase.rpc("heraa_grant_allowance", { p_member_id: memberId });
    }

    supabase.rpc("heraa_grant_welcome_voucher", {
      p_member_id: memberId,
    }).then(() => {});

    const refCode = localStorage.getItem("heraa_ref_code");
    if (refCode) {
      localStorage.removeItem("heraa_ref_code");
      supabase.rpc("heraa_claim_referral", {
        p_referee_id: memberId,
        p_referral_code: refCode,
      }).then(() => {
        track("referral_auto_claimed", memberId, { code: refCode });
      });
    }

    router.replace("/home");
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="text-5xl mb-4 animate-pulse">☕</div>
        <div className="font-bold text-lg mb-1" style={{ color: "#C8111A" }}>
          HERAA COFFEE
        </div>
        <div className="text-sm text-gray-500">{t.authVerifying}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <div className="py-8 text-center" style={{ background: "#C8111A" }}>
          <div className="text-white font-bold text-lg tracking-wider">
            HERAA COFFEE
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">{error}</h2>
          <p className="text-xs text-gray-400 text-center mb-6">
            {t.authInvalidSub}
          </p>
          <button
            onClick={() => router.replace("/login")}
            className="text-white font-semibold rounded-xl py-3 px-6 text-sm"
            style={{ background: "#C8111A" }}
          >
            {t.authReturn}
          </button>
        </div>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <div className="py-8 text-center" style={{ background: "#C8111A" }}>
          <div className="text-white font-bold text-lg tracking-wider">
            HERAA COFFEE
          </div>
        </div>
        <div className="flex-1 px-6 py-8">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🔐</div>
            <h2 className="text-lg font-bold text-gray-800">{t.activateVerified}</h2>
            <p className="text-sm text-gray-500 mt-1">{t.activateTitle}</p>
          </div>

          <form onSubmit={handleSetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1.5">
                {t.activateNewPw}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                required
                minLength={6}
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": "#C8111A" } as React.CSSProperties}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1.5">
                {t.activateConfirmPw}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                required
                minLength={6}
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": "#C8111A" } as React.CSSProperties}
              />
            </div>

            {pwError && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-3">
                {pwError}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full text-white font-bold rounded-xl text-lg disabled:opacity-50 transition-opacity"
              style={{ background: "#C8111A", height: 58 }}
            >
              {saving ? t.activateBtnLoading : t.activateBtn}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
}

export default function ActivatePage() {
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
      <ActivateContent />
    </Suspense>
  );
}
