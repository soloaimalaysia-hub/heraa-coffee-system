"use client";

import { useState } from "react";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [staffId, setStaffId] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

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
          <div className="text-white/70 text-xs mt-1">Member Wallet</div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-5xl mb-4">📱</div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            检查你的 WhatsApp
          </h2>
          <p className="text-sm text-gray-500 text-center leading-relaxed">
            登入链接已发送到
            <br />
            <span className="font-semibold text-gray-700">{phone}</span>
            <br />
            <br />
            链接 <span style={{ color: "#C8111A" }} className="font-bold">5 分钟</span> 内有效
          </p>
          <button
            onClick={() => {
              setSent(false);
              setShowInfo(false);
            }}
            className="mt-8 text-sm font-medium"
            style={{ color: "#C8111A" }}
          >
            ← 返回重新输入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="py-8 text-center" style={{ background: "#C8111A" }}>
        <div className="text-white font-bold text-lg tracking-wider">
          HERAA COFFEE
        </div>
        <div className="text-white/70 text-xs mt-1">Member Wallet</div>
      </div>

      <div className="flex-1 px-6 py-8">
        <h2 className="text-lg font-bold text-gray-800 mb-1">员工登入</h2>
        <p className="text-xs text-gray-400 mb-6">
          {showInfo
            ? "首次登入 · 请填写姓名和工号"
            : "输入 WhatsApp 手机号，我们发送登入链接给你"}
        </p>

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              WhatsApp 手机号
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="011-1234 5678"
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
                  姓名
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kenny Ngui"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                  style={
                    { "--tw-ring-color": "#C8111A" } as React.CSSProperties
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  工号 Staff ID
                </label>
                <input
                  type="text"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="e.g. GEN-0042"
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
                💡 首次登入将自动开通钱包（RM20 津贴）
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
              ? "发送中..."
              : showInfo
              ? "📱 提交并发送链接"
              : "📱 发送 WhatsApp 登入链接"}
          </button>

          {!showInfo && (
            <p className="text-[10px] text-center text-gray-400 mt-3">
              ⚠️ Twilio Sandbox 用户：先发 <code className="bg-gray-100 px-1 rounded">join doctor-through</code> 到 +1 415 523 8886
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
