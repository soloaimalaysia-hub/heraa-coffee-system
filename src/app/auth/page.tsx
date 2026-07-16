"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/track";
import { useLang } from "@/lib/LanguageContext";

function AuthContent() {
  const { t } = useLang();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("链接无效");
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/auth/verify?token=${token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "链接无效或已过期");
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
      } catch (err: unknown) {
        setError((err as Error).message);
      }
    })();
  }, [token, router]);

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
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            {error}
          </h2>
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

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div
            className="animate-pulse font-bold"
            style={{ color: "#C8111A" }}
          >
            加载中...
          </div>
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
