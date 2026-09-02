"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { QRCodeSVG } from "qrcode.react";
import { useLang } from "@/lib/LanguageContext";

interface EventItem {
  id: string;
  name: string;
  date: string;
  location: string;
  is_active: boolean;
}

interface Analytics {
  total_registrations: number;
  total_redeemed: number;
  redemption_rate: number;
  flavor_breakdown: { flavor: string; cnt: number }[];
  area_breakdown: { area: string; cnt: number }[];
  registrations_by_hour: { hour: number; cnt: number }[];
}

export default function EventsTab() {
  const { lang } = useLang();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  // Create event form
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [creating, setCreating] = useState(false);

  const loadEvents = useCallback(async () => {
    const { data } = await supabase
      .from("heraa_events_list")
      .select("*")
      .order("date", { ascending: false });

    if (data && data.length > 0) {
      setEvents(data);
      if (!selectedEvent) setSelectedEvent(data[0].id);
    }
    setLoading(false);
  }, [selectedEvent]);

  const loadAnalytics = useCallback(async () => {
    if (!selectedEvent) return;
    const { data } = await supabase.rpc("heraa_event_analytics", {
      p_event_id: selectedEvent,
    });
    if (data) setAnalytics(data);
  }, [selectedEvent]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (selectedEvent) loadAnalytics();
  }, [selectedEvent, loadAnalytics]);

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const { error } = await supabase.rpc("heraa_admin_create_event", {
      p_name: newName.trim(),
      p_date: newDate,
      p_location: newLocation.trim(),
    });
    if (!error) {
      setShowCreate(false);
      setNewName("");
      setNewDate("");
      setNewLocation("");
      await loadEvents();
    }
    setCreating(false);
  }

  async function handleExportCSV() {
    if (!selectedEvent) return;
    const { data } = await supabase
      .from("heraa_event_registrations")
      .select("name, phone, area, flavor_preferences, created_at")
      .eq("event_id", selectedEvent)
      .order("created_at", { ascending: false });

    if (!data) return;

    const bom = "﻿";
    const header = "Name,Phone,Area,Flavors,Registered At\n";
    const rows = data
      .map(
        (r) =>
          `"${r.name}","${r.phone}","${r.area}","${(r.flavor_preferences || []).join("; ")}","${r.created_at}"`
      )
      .join("\n");

    const blob = new Blob([bom + header + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `event-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400">
        {lang === "zh" ? "加载中..." : "Loading..."}
      </div>
    );
  }

  const eventUrl = selectedEvent
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/event/${selectedEvent}`
    : "";

  return (
    <div className="space-y-4">
      {/* Event Selector + Create */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800">
            {lang === "zh" ? "📅 活动管理" : "📅 Event Manager"}
          </h3>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="text-sm font-semibold text-white rounded-lg px-3 py-1.5"
            style={{ background: "#C8111A" }}
          >
            {showCreate
              ? lang === "zh" ? "取消" : "Cancel"
              : lang === "zh" ? "+ 新建活动" : "+ New Event"}
          </button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <form
            onSubmit={handleCreateEvent}
            className="bg-gray-50 rounded-lg p-4 mb-3 space-y-3"
          >
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={lang === "zh" ? "活动名称" : "Event name"}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder={lang === "zh" ? "地点" : "Location"}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={creating}
              className="w-full text-white font-semibold rounded-lg py-2 text-sm disabled:opacity-50"
              style={{ background: "#C8111A" }}
            >
              {creating
                ? lang === "zh" ? "创建中..." : "Creating..."
                : lang === "zh" ? "创建活动" : "Create Event"}
            </button>
          </form>
        )}

        {/* Event Select */}
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name} · {ev.date} · {ev.location}
            </option>
          ))}
        </select>
      </div>

      {/* QR Code */}
      {selectedEvent && (
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-3">
            {lang === "zh" ? "🔗 活动 QR Code" : "🔗 Event QR Code"}
          </h3>
          <div className="flex items-start gap-4">
            <div id="event-qr-code" className="bg-white rounded-xl border border-gray-200 p-3">
              <QRCodeSVG value={eventUrl} size={140} level="H" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-2 break-all">{eventUrl}</p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => navigator.clipboard.writeText(eventUrl)}
                  className="text-xs font-semibold rounded-lg px-3 py-1.5 border"
                  style={{ borderColor: "#C8111A", color: "#C8111A" }}
                >
                  {lang === "zh" ? "📋 复制链接" : "📋 Copy Link"}
                </button>
                <button
                  onClick={() => {
                    const svg = document.querySelector("#event-qr-code svg");
                    if (!svg) return;
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const img = new Image();
                    img.onload = () => {
                      canvas.width = 400;
                      canvas.height = 400;
                      ctx!.fillStyle = "white";
                      ctx!.fillRect(0, 0, 400, 400);
                      ctx!.drawImage(img, 0, 0, 400, 400);
                      const a = document.createElement("a");
                      a.download = `heraa-event-qr-${new Date().toISOString().slice(0, 10)}.png`;
                      a.href = canvas.toDataURL("image/png");
                      a.click();
                    };
                    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
                  }}
                  className="text-xs font-semibold rounded-lg px-3 py-1.5 border"
                  style={{ borderColor: "#C8111A", color: "#C8111A" }}
                >
                  {lang === "zh" ? "📥 下载 QR" : "📥 Download QR"}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {lang === "zh"
                  ? "打印此 QR 或截图给现场顾客扫码"
                  : "Print this QR or screenshot for on-site customers"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Analytics */}
      {analytics && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <div className="text-2xl font-bold" style={{ color: "#C8111A" }}>
                {analytics.total_registrations}
              </div>
              <div className="text-xs text-gray-400">
                {lang === "zh" ? "总注册" : "Registrations"}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <div className="text-2xl font-bold text-green-600">
                {analytics.total_redeemed}
              </div>
              <div className="text-xs text-gray-400">
                {lang === "zh" ? "已兑换" : "Redeemed"}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.redemption_rate}%
              </div>
              <div className="text-xs text-gray-400">
                {lang === "zh" ? "兑换率" : "Redemption Rate"}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {(analytics.registrations_by_hour || []).length}
              </div>
              <div className="text-xs text-gray-400">
                {lang === "zh" ? "活跃小时" : "Active Hours"}
              </div>
            </div>
          </div>

          {/* Flavor Ranking */}
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-3">
              {lang === "zh" ? "☕ 口味排行" : "☕ Flavor Ranking"}
            </h3>
            <div className="space-y-2">
              {(analytics.flavor_breakdown || []).map(
                (f: { flavor: string; cnt: number }, i: number) => {
                  const max = analytics.flavor_breakdown[0]?.cnt || 1;
                  return (
                    <div key={f.flavor} className="flex items-center gap-3">
                      <div className="w-6 text-xs text-gray-400 text-right">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">
                            {f.flavor}
                          </span>
                          <span className="text-gray-400">{f.cnt}人</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(f.cnt / max) * 100}%`,
                              background:
                                i === 0 ? "#C8111A" : i === 1 ? "#ef4444" : "#fca5a5",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
              {(analytics.flavor_breakdown || []).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  {lang === "zh" ? "暂无数据" : "No data yet"}
                </p>
              )}
            </div>
          </div>

          {/* Area Distribution */}
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-3">
              {lang === "zh" ? "📍 地区分布" : "📍 Area Distribution"}
            </h3>
            <div className="space-y-2">
              {(analytics.area_breakdown || []).map(
                (a: { area: string; cnt: number }) => (
                  <div
                    key={a.area}
                    className="flex justify-between text-sm py-1.5 border-b border-gray-50"
                  >
                    <span className="font-medium text-gray-700">{a.area}</span>
                    <span className="text-gray-400">{a.cnt}人</span>
                  </div>
                )
              )}
              {(analytics.area_breakdown || []).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  {lang === "zh" ? "暂无数据" : "No data yet"}
                </p>
              )}
            </div>
          </div>

          {/* Export */}
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <button
              onClick={handleExportCSV}
              className="w-full text-sm font-semibold rounded-lg py-3 border transition-colors"
              style={{ borderColor: "#C8111A", color: "#C8111A" }}
            >
              {lang === "zh" ? "📥 导出活动数据 CSV" : "📥 Export Event Data CSV"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
