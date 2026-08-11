"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminLogin({
  onLogin,
}: {
  onLogin: (token: string, name: string, mustChangePassword: boolean) => void;
}) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: rpcErr } = await supabase.rpc("heraa_admin_login", {
      p_phone: phone.trim(),
      p_password: password,
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

    onLogin(data.session_token, data.name, !!data.must_change_password);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "#F6F3EE" }}>
      <div style={{ width: 320, maxWidth: "90vw" }}>
        <div className="text-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo.webp" alt="HERAA COFFEE" style={{ height: 36, margin: "0 auto 12px" }} />
          <div style={{ fontSize: 12, color: "#6B6864", fontWeight: 600, letterSpacing: "0.05em" }}>
            ADMIN LOGIN
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ background: "#fff", border: "2px solid #D4AF37", borderRadius: 16, padding: 24 }}
          className="space-y-3"
        >
          <div>
            <label style={{ fontSize: 12, color: "#6B6864", fontWeight: 600 }}>手机号码</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="011-1234 5678"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mt-1 focus:outline-none"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#6B6864", fontWeight: 600 }}>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mt-1 focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-xs rounded-lg px-3 py-2" style={{ background: "#FBE9EB", color: "#C8102E" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-bold rounded-lg text-sm py-3 disabled:opacity-50"
            style={{ background: "#C8102E" }}
          >
            {loading ? "登入中..." : "登入"}
          </button>
        </form>
      </div>
    </div>
  );
}
