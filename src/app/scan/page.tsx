"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/lib/LanguageContext";
import BottomNav from "@/components/BottomNav";

export default function ScanPage() {
  const { t } = useLang();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function handleConfirm() {
    if (!code.trim()) return;
    setError("");
    setChecking(true);
    const { data } = await supabase.rpc("heraa_verify_machine", { p_code: code.trim() });
    setChecking(false);
    if (data?.success) {
      router.push(`/machine/${encodeURIComponent(code.trim().toUpperCase())}/order`);
    } else {
      setError(data?.error || t.scanMachineNotFound);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white pb-20 md:pb-0 md:pl-[84px]">
      <div className="py-6 text-center relative" style={{ background: "#C8111A" }}>
        <button
          onClick={() => router.push("/home")}
          className="absolute top-3 left-3 text-white text-sm px-3 py-1"
        >
          ←
        </button>
        <div className="text-white font-bold text-base">{t.scanTitle}</div>
      </div>

      <div className="flex-1 flex flex-col items-center px-6 pt-10">
        <div
          className="flex items-center justify-center rounded-2xl mb-6"
          style={{ width: 220, height: 220, border: "2px dashed #D4AF37", background: "#FAFAFA" }}
        >
          <span style={{ fontSize: 64 }}>📷</span>
        </div>
        <p className="text-sm text-gray-500 mb-8 text-center">{t.scanInstruction}</p>

        <p className="text-xs text-gray-400 mb-2">{t.scanOrType}</p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t.scanCodePlaceholder}
          className="w-full border rounded-xl px-4 py-3 text-sm mb-3 text-center tracking-wide"
          style={{ borderColor: "#E5E5E5" }}
        />
        {error && (
          <p className="text-xs mb-3 text-center" style={{ color: "#C8111A" }}>
            {error}
          </p>
        )}
        <button
          onClick={handleConfirm}
          disabled={checking || !code.trim()}
          className="w-full text-white font-bold rounded-xl py-3.5 disabled:opacity-50"
          style={{ background: "#C8111A" }}
        >
          {checking ? "..." : t.scanConfirmBtn}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
