"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { formatPhone } from "@/lib/phone";
import { track } from "@/lib/track";
import { useLang } from "@/lib/LanguageContext";

function RegisterContent() {
  const { t, lang, toggleLang } = useLang();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [showCorpInput, setShowCorpInput] = useState(false);
  const [corpCode, setCorpCode] = useState("");

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      localStorage.setItem("heraa_ref_code", ref.toUpperCase());
    }
  }, [searchParams]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "public",
          phone: phone.trim(),
          name: name.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "发送失败");
        setLoading(false);
        return;
      }

      track("register_initiated", null, { phone: phone.trim(), type: "public" });
      setSent(true);
    } catch (err: unknown) {
      setError((err as Error).message);
    }
    setLoading(false);
  }

  function handleCorpGo() {
    const code = corpCode.trim().toLowerCase();
    if (code) {
      router.push(`/register/${code}`);
    }
  }

  const normalizedPhone = phone.trim().length >= 4 ? formatPhone(phone.trim()) : "";

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <div className="py-8 text-center" style={{ background: "#C8111A" }}>
          <div className="text-white font-bold text-lg tracking-wider">
            HERAA COFFEE
          </div>
          <div className="text-white/70 text-xs mt-1">{t.walletTitle}</div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-6xl mb-5">📱</div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">
            {t.registerSent}
          </h2>
          <p className="text-sm text-gray-500 text-center leading-relaxed">
            {t.registerSentSub}
            <br />
            <span className="font-semibold text-gray-700 text-base">{normalizedPhone || phone}</span>
            <br /><br />
            {t.registerSentValid}{" "}
            <span style={{ color: "#C8111A" }} className="font-bold">{t.registerSentValidMin}</span>{" "}
            {t.registerSentValidAfter}
          </p>
          <p className="text-xs text-gray-400 mt-4 text-center">
            {lang === "zh"
              ? "点击链接后设置密码即可登入"
              : "Set your password after clicking the link"}
          </p>
          <button
            onClick={() => router.push("/login")}
            className="mt-8 text-sm font-medium"
            style={{ color: "#C8111A" }}
          >
            {t.registerBack}
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
        <div className="text-white/70 text-xs mt-1">{t.walletTitle}</div>
      </div>

      <div className="flex-1 px-6 py-8">
        <h2 className="text-xl font-bold text-gray-800 mb-2">{t.registerTitle}</h2>
        <p className="text-sm text-gray-400 mb-6">
          {lang === "zh"
            ? "填写资料，WhatsApp 激活"
            : "Fill in your details, activate via WhatsApp"}
        </p>

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1.5">
              {t.registerName}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.registerNamePlaceholder}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": "#C8111A" } as React.CSSProperties}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1.5">
              {lang === "zh" ? "手机号码" : "Phone Number"}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t.registerPhonePlaceholder}
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

          <div
            className="text-xs text-gray-500 rounded-lg p-3 flex items-center gap-2"
            style={{ background: "#FFF3F3" }}
          >
            <span>🎁</span>
            <span>{lang === "zh" ? "注册即送 RM2 优惠券" : "Get RM2 voucher on signup"}</span>
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
            {loading
              ? (lang === "zh" ? "发送中..." : "Sending...")
              : `📱 ${lang === "zh" ? "发送 WhatsApp 激活链接" : "Send WhatsApp Activation Link"}`}
          </button>

          <p className="text-xs text-center text-gray-400 mt-3">
            {t.registerSandboxHint}{" "}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">join doctor-through</code>{" "}
            {t.registerSandboxTarget}
          </p>
        </form>

        {/* Corporate entry */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          {!showCorpInput ? (
            <button
              onClick={() => setShowCorpInput(true)}
              className="w-full text-sm text-gray-500 flex items-center justify-center gap-2 py-2"
            >
              <span>🏢</span>
              <span>{lang === "zh" ? "我是企业员工 →" : "I'm a corporate employee →"}</span>
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-600 text-center">
                {lang === "zh" ? "请输入企业代码" : "Enter company code"}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={corpCode}
                  onChange={(e) => setCorpCode(e.target.value)}
                  placeholder={lang === "zh" ? "e.g. genting" : "e.g. genting"}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2"
                  style={{ "--tw-ring-color": "#C8111A" } as React.CSSProperties}
                />
                <button
                  onClick={handleCorpGo}
                  className="px-5 py-3 text-white font-bold rounded-xl"
                  style={{ background: "#C8111A" }}
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => router.push("/login")}
            className="text-sm font-medium"
            style={{ color: "#C8111A" }}
          >
            {t.registerBack}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
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
      <RegisterContent />
    </Suspense>
  );
}
