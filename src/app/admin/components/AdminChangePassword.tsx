"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminChangePassword({
  token,
  forced,
  onDone,
  onCancel,
}: {
  token: string;
  forced: boolean;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("新密码最少 6 位");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("两次输入的新密码不一致");
      return;
    }

    setLoading(true);
    const { data, error: rpcErr } = await supabase.rpc("heraa_admin_change_password", {
      p_token: token,
      p_old_password: oldPassword,
      p_new_password: newPassword,
    });
    setLoading(false);

    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }
    if (!data.success) {
      setError(data.error);
      return;
    }

    onDone();
  }

  const formBody = (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label style={{ fontSize: 12, color: "#6B6864", fontWeight: 600 }}>
          {forced ? "临时密码" : "当前密码"}
        </label>
        <input
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          placeholder="••••••"
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mt-1 focus:outline-none"
        />
      </div>
      <div>
        <label style={{ fontSize: 12, color: "#6B6864", fontWeight: 600 }}>新密码</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="至少 6 位"
          required
          minLength={6}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mt-1 focus:outline-none"
        />
      </div>
      <div>
        <label style={{ fontSize: 12, color: "#6B6864", fontWeight: 600 }}>确认新密码</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="再输入一次"
          required
          minLength={6}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mt-1 focus:outline-none"
        />
      </div>

      {error && (
        <p className="text-xs rounded-lg px-3 py-2" style={{ background: "#FBE9EB", color: "#C8102E" }}>
          {error}
        </p>
      )}

      <div className="flex gap-2">
        {!forced && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 text-sm font-semibold rounded-lg py-3 border border-gray-200"
          >
            取消
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 text-white font-bold rounded-lg text-sm py-3 disabled:opacity-50"
          style={{ background: "#C8102E" }}
        >
          {loading ? "更新中..." : "确认更改"}
        </button>
      </div>
    </form>
  );

  if (forced) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "#F6F3EE" }}>
        <div style={{ width: 320, maxWidth: "90vw" }}>
          <div className="text-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo.webp" alt="HERAA COFFEE" style={{ height: 36, margin: "0 auto 12px" }} />
            <div style={{ fontSize: 12, color: "#6B6864", fontWeight: 600, letterSpacing: "0.05em" }}>
              首次登入，请设置新密码
            </div>
          </div>
          <div style={{ background: "#fff", border: "2px solid #D4AF37", borderRadius: 16, padding: 24 }}>
            {formBody}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && onCancel) onCancel();
      }}
      style={{ position: "fixed", inset: 0, background: "rgba(26,26,26,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 16 }}
    >
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: 340, maxWidth: "100%" }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 0, marginBottom: 14 }}>更改密码</h3>
        {formBody}
      </div>
    </div>
  );
}
