"use client";

import { useState, useEffect } from "react";
import { track } from "@/lib/track";
import { useLang } from "@/lib/LanguageContext";

export default function LoginPage() {
  const { t, lang, toggleLang } = useLang();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [staffId, setStaffId] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    track("app_open");
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, name, staff_id: staffId }),
      });
      const data = await res.json();

      if (data.needs_info) {
        setShowInfo(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.error || "发送失败");
        setLoading(false);
        return;
      }

      track("login_initiated", null, { phone });
      setSent(true);
    } catch (err: unknown) {
      setError((err as Error).message);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <div
          className="py-8 text-center"
          style={{ background: "#C8111A" }}
        >
          <div className="text-white font-bold text-lg tracking-wider">
            HERAA COFFEE
          </div>
          <div className="text-white/70 text-xs mt-1">{t.walletTitle}</div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-5xl mb-4">📱</div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            {t.loginSent}
          </h2>
          <p className="text-sm text-gray-500 text-center leading-relaxed">
            {t.loginSentSub}
            <br />
            <span className="font-semibold text-gray-700">{phone}</span>
            <br />
            <br />
            {t.loginSentValid} <span style={{ color: "#C8111A" }} className="font-bold">{t.loginSentValidMin}</span> {t.loginSentValidAfter}
          </p>
          <button
            onClick={() => {
              setSent(false);
              setShowInfo(false);
            }}
            className="mt-8 text-sm font-medium"
            style={{ color: "#C8111A" }}
          >
            {t.loginBackReset}
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
          className="absolute top-3 right-3 text-white text-xs font-medium rounded px-2.5 py-1 border"
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
        <h2 className="text-lg font-bold text-gray-800 mb-1">{t.loginTitle}</h2>
        <p className="text-xs text-gray-400 mb-6">
          {showInfo ? t.loginSubInfo : t.loginSubPhone}
        </p>

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {t.loginPhone}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t.loginPhonePlaceholder}
              required
              disabled={showInfo}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 disabled:bg-gray-50"
              style={{ "--tw-ring-color": "#C8111A" } as React.CSSProperties}
            />
          </div>

          {showInfo && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t.loginName}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.loginNamePlaceholder}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                  style={
                    { "--tw-ring-color": "#C8111A" } as React.CSSProperties
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t.loginStaffId}
                </label>
                <input
                  type="text"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder={t.loginStaffPlaceholder}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                  style={
                    { "--tw-ring-color": "#C8111A" } as React.CSSProperties
                  }
                />
              </div>
              <div
                className="text-[10px] text-gray-400 rounded-lg p-2"
                style={{ background: "#FFF3F3" }}
              >
                {t.loginWalletHint}
              </div>
            </>
          )}

          {error && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-semibold rounded-xl py-3 text-sm disabled:opacity-50 transition-opacity"
            style={{ background: "#C8111A" }}
          >
            {loading
              ? t.loginBtnSending
              : showInfo
              ? t.loginBtnSubmit
              : t.loginBtn}
          </button>

          {!showInfo && (
            <p className="text-[10px] text-center text-gray-400 mt-3">
              {t.loginSandboxHint} <code className="bg-gray-100 px-1 rounded">join doctor-through</code> {t.loginSandboxTarget}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
