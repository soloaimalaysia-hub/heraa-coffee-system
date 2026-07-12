"use client";

import { useState } from "react";
import { useLang } from "@/lib/LanguageContext";

export default function WhatsAppTab() {
  const { t } = useLang();
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
        data.success ? `✅ ${t.sendSuccess}` : `❌ ${data.error}`
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
          ? `✅ ${t.sendSuccess} ${data.sent}/${data.total}`
          : `ℹ️ ${data.message || "—"}`
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
      setWaResult(`✅ ${t.sendSuccess} ${data.sent}/${data.total}`);
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
      {/* Quick Send */}
      <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-100">
        <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
          📱 {t.quickSend}
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
          {testSending ? t.sending : t.sendTest}
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
          {reminderSending ? t.sending : t.sendReminder}
        </button>
        {reminderResult && (
          <div className="text-[11px] mt-2 px-2">{reminderResult}</div>
        )}

        <div className="text-[10px] text-gray-400 mt-3 text-center">
          {t.cronHint}
        </div>
      </div>

      {/* Broadcast */}
      <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-100">
        <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
          📢 {t.broadcastTitle}
        </div>

        <textarea
          value={waMsg}
          onChange={(e) => setWaMsg(e.target.value)}
          placeholder={t.broadcastPlaceholder}
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none resize-none"
        />

        <select
          value={waTarget}
          onChange={(e) => setWaTarget(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none"
        >
          <option value="all">{t.targetAll}</option>
          <option value="low_balance">{t.targetLowBalance}</option>
        </select>

        <button
          onClick={sendBroadcast}
          disabled={waSending || !waMsg.trim()}
          className="w-full text-white font-semibold rounded-lg py-2.5 text-sm disabled:opacity-50"
          style={{ background: "#C8111A" }}
        >
          {waSending ? t.sending : t.sendWhatsApp}
        </button>
        {waResult && <div className="text-[11px] mt-2 px-2">{waResult}</div>}
      </div>
    </div>
  );
}
