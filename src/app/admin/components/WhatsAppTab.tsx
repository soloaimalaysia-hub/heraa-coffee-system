"use client";

import { useState } from "react";

export default function WhatsAppTab() {
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState("");
  const [reminderSending, setReminderSending] = useState(false);
  const [reminderResult, setReminderResult] = useState("");

  const [waMsg, setWaMsg] = useState("");
  const [waTarget, setWaTarget] = useState("all");
  const [waSending, setWaSending] = useState(false);
  const [waResult, setWaResult] = useState("");

  async function sendTest() {
    setTestSending(true);
    setTestResult("");
    try {
      const res = await fetch("/api/test-reminder", {
        method: "POST",
        headers: { "x-admin-key": "heraa2026" },
      });
      const data = await res.json();
      setTestResult(
        data.success ? "✅ 测试消息已发送给 Captain K" : `❌ ${data.error}`
      );
    } catch (err: unknown) {
      setTestResult(`❌ ${(err as Error).message}`);
    }
    setTestSending(false);
  }

  async function sendReminder() {
    setReminderSending(true);
    setReminderResult("");
    try {
      const res = await fetch("/api/daily-reminder", {
        method: "POST",
        headers: { "x-admin-key": "heraa2026" },
      });
      const data = await res.json();
      setReminderResult(
        data.sent > 0
          ? `✅ 已发送 ${data.sent}/${data.total} 条浇水提醒`
          : `ℹ️ ${data.message || "没有需要提醒的会员"}`
      );
    } catch (err: unknown) {
      setReminderResult(`❌ ${(err as Error).message}`);
    }
    setReminderSending(false);
  }

  async function sendBroadcast() {
    if (!waMsg.trim()) return;
    setWaSending(true);
    setWaResult("");
    try {
      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": "heraa2026",
        },
        body: JSON.stringify({ message: waMsg, target: waTarget }),
      });
      const data = await res.json();
      setWaResult(`✅ 已发送 ${data.sent}/${data.total} 人`);
      if (data.errors?.length > 0) {
        setWaResult((prev) => prev + ` (${data.errors.length} 失败)`);
      }
      setWaMsg("");
    } catch (err: unknown) {
      setWaResult(`❌ ${(err as Error).message}`);
    }
    setWaSending(false);
  }

  return (
    <div className="space-y-3">
      {/* Quick Send */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
          📱 快速发送
        </div>

        <button
          onClick={sendTest}
          disabled={testSending}
          className="w-full border rounded-lg py-2.5 text-xs font-semibold mb-2 disabled:opacity-50"
          style={{
            background: "#f0fdf4",
            borderColor: "#bbf7d0",
            color: "#0F6E56",
          }}
        >
          {testSending ? "发送中..." : "🧪 发测试消息给 Captain K"}
        </button>
        {testResult && (
          <div className="text-[11px] mb-2 px-2">{testResult}</div>
        )}

        <button
          onClick={sendReminder}
          disabled={reminderSending}
          className="w-full border rounded-lg py-2.5 text-xs font-semibold disabled:opacity-50"
          style={{
            background: "#FFFBEB",
            borderColor: "#FCD34D",
            color: "#854F0B",
          }}
        >
          {reminderSending ? "发送中..." : "💧 发今日浇水提醒"}
        </button>
        {reminderResult && (
          <div className="text-[11px] mt-2 px-2">{reminderResult}</div>
        )}

        <div className="text-[10px] text-gray-400 mt-3 text-center">
          ⏰ 每天 9:00am MYT 自动发送 · Vercel Cron
        </div>
      </div>

      {/* Broadcast */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
          📢 自定义广播
        </div>

        <textarea
          value={waMsg}
          onChange={(e) => setWaMsg(e.target.value)}
          placeholder="输入推送消息内容..."
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none resize-none"
        />

        <select
          value={waTarget}
          onChange={(e) => setWaTarget(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none"
        >
          <option value="all">全部会员</option>
          <option value="low_balance">余额 &lt; RM10</option>
        </select>

        <button
          onClick={sendBroadcast}
          disabled={waSending || !waMsg.trim()}
          className="w-full text-white font-semibold rounded-lg py-2.5 text-sm disabled:opacity-50"
          style={{ background: "#C8111A" }}
        >
          {waSending ? "发送中..." : "📤 发送 WhatsApp"}
        </button>
        {waResult && <div className="text-[11px] mt-2 px-2">{waResult}</div>}
      </div>
    </div>
  );
}
