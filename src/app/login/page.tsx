"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [staffId, setStaffId] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/wallet`,
        data: { name, staff_id: staffId },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col">
        <div
          className="py-8 text-center"
          style={{ background: "var(--heraa-red)" }}
        >
          <div className="text-white font-bold text-lg tracking-wider">
            HERAA COFFEE
          </div>
          <div className="text-white/70 text-xs mt-1">Member Wallet</div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            检查你的邮件
          </h2>
          <p className="text-sm text-gray-500 text-center">
            我们已发送登录链接到
            <br />
            <span className="font-semibold text-gray-700">{email}</span>
          </p>
          <button
            onClick={() => setSent(false)}
            className="mt-6 text-sm font-medium"
            style={{ color: "var(--heraa-red)" }}
          >
            ← 返回重新输入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div
        className="py-8 text-center"
        style={{ background: "var(--heraa-red)" }}
      >
        <div className="text-white font-bold text-lg tracking-wider">
          HERAA COFFEE
        </div>
        <div className="text-white/70 text-xs mt-1">Member Wallet</div>
      </div>

      <div className="flex-1 px-6 py-8">
        <h2 className="text-lg font-bold text-gray-800 mb-1">员工登入</h2>
        <p className="text-xs text-gray-400 mb-6">
          首次登入将自动开通钱包（RM20 津贴）
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
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
                { "--tw-ring-color": "var(--heraa-red)" } as React.CSSProperties
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
                { "--tw-ring-color": "var(--heraa-red)" } as React.CSSProperties
              }
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. kenny@genting.com"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
              style={
                { "--tw-ring-color": "var(--heraa-red)" } as React.CSSProperties
              }
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-semibold rounded-xl py-3 text-sm disabled:opacity-50 transition-opacity"
            style={{ background: "var(--heraa-red)" }}
          >
            {loading ? "发送中..." : "📧 发送登录链接"}
          </button>
        </form>
      </div>
    </div>
  );
}
