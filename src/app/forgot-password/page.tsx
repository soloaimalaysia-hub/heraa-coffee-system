"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPhone } from "@/lib/phone";
import { useLang } from "@/lib/LanguageContext";

export default function ForgotPasswordPage() {
  const { t, lang, toggleLang } = useLang();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const normalizedPhone = phone.trim().length >= 4 ? formatPhone(phone.trim()) : "";

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), name: "", staff_id: "" }),
      });
      const data = await res.json();

      if (!res.ok && !data.needs_info) {
        setError(data.error || (lang === "zh" ? "发送失败" : "Send failed"));
        setLoading(false);
        return;
      }

      setSent(true);
    } catch (err: unknown) {
      setError((err as Error).message);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <div className="py-8 text-center" style={{ background: "#C8111A" }}>
          <div className="text-white font-bold text-lg tracking-wider">
            HERAA COFFEE
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-6xl mb-5">📱</div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">
            {t.forgotSent}
          </h2>
          <p className="text-sm text-gray-500 text-center leading-relaxed">
            {lang === "zh"
              ? "点击 WhatsApp 中的链接，设置新密码即可"
              : "Click the link in WhatsApp to set your new password"}
          </p>
          <button
            onClick={() => router.push("/login")}
            className="mt-8 text-sm font-medium"
            style={{ color: "#C8111A" }}
          >
            {t.forgotBack}
          </button>
        </div>
      </div>
    );
  }

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
      </div>

      <div className="flex-1 px-6 py-8">
        <h2 className="text-xl font-bold text-gray-800 mb-2">{t.forgotTitle}</h2>
        <p className="text-sm text-gray-400 mb-6">{t.forgotSub}</p>

        <form onSubmit={handleSend} className="space-y-4">
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

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-bold rounded-xl text-lg disabled:opacity-50 transition-opacity"
            style={{ background: "#C8111A", height: 58 }}
          >
            {loading ? t.forgotBtnLoading : `📱 ${t.forgotBtn}`}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => router.push("/login")}
            className="text-sm font-medium"
            style={{ color: "#C8111A" }}
          >
            {t.forgotBack}
          </button>
        </div>
      </div>
    </div>
  );
}
