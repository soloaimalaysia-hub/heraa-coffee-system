"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { QRCodeSVG } from "qrcode.react";

interface FeedItem {
  name: string;
  area: string;
  created_at: string;
}

interface Stats {
  total: number;
  topFlavor: string;
  topFlavorCount: number;
  topArea: string;
}

export default function EventScreenPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [stats, setStats] = useState<Stats>({
    total: 0,
    topFlavor: "-",
    topFlavorCount: 0,
    topArea: "-",
  });
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [latestJoin, setLatestJoin] = useState<FeedItem | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const feedRef = useRef<FeedItem[]>([]);

  const loadData = useCallback(async () => {
    const { data } = await supabase.rpc("heraa_event_analytics", {
      p_event_id: eventId,
    });

    if (data) {
      const flavors = data.flavor_breakdown || [];
      const areas = data.area_breakdown || [];
      setStats({
        total: data.total_registrations,
        topFlavor: flavors[0]?.flavor || "-",
        topFlavorCount: flavors[0]?.cnt || 0,
        topArea: areas[0]?.area || "-",
      });
    }

    const { data: regs } = await supabase
      .from("heraa_event_registrations")
      .select("name, area, created_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .limit(8);

    if (regs) {
      setFeed(regs);
      feedRef.current = regs;
      if (regs.length > 0) {
        setLatestJoin(regs[0]);
      }
    }
  }, [eventId]);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel("event-screen")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "heraa_event_registrations",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const rec = payload.new as {
            name: string;
            area: string;
            created_at: string;
          };

          const newItem: FeedItem = {
            name: rec.name,
            area: rec.area,
            created_at: rec.created_at,
          };

          setLatestJoin(newItem);
          setAnimKey((k) => k + 1);
          setStats((prev) => ({ ...prev, total: prev.total + 1 }));

          feedRef.current = [newItem, ...feedRef.current].slice(0, 8);
          setFeed([...feedRef.current]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData, eventId]);

  const eventUrl = `https://heraa-coffee-system.vercel.app/event/${eventId}`;

  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex flex-col"
      style={{ background: "#0a0a0a" }}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-8 py-4">
        <div
          className="text-sm font-bold tracking-[0.15em]"
          style={{ color: "#C8111A" }}
        >
          HERAA COFFEE · ROADSHOW 2026
        </div>
        <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          LIVE
          <span
            className="inline-block w-2 h-2 rounded-full ml-2 animate-pulse"
            style={{ background: "#22c55e" }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left: Big Counter */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-lg" style={{ color: "rgba(255,255,255,0.4)" }}>
            今天已有
          </div>
          <div
            key={animKey}
            className="font-bold"
            style={{
              color: "#C8111A",
              fontSize: 120,
              lineHeight: 1,
              animation: "popIn 0.3s ease-out",
            }}
          >
            {stats.total}
          </div>
          <div className="text-lg" style={{ color: "rgba(255,255,255,0.4)" }}>
            人加入 Heraa Coffee！
          </div>

          {/* Latest Join */}
          {latestJoin && (
            <div
              key={`latest-${animKey}`}
              className="mt-8 rounded-lg px-6 py-3 text-center"
              style={{
                background: "rgba(200,17,26,0.15)",
                border: "1px solid rgba(200,17,26,0.3)",
                animation: "fadeIn 0.5s ease-out",
              }}
            >
              <span style={{ color: "#C8111A" }} className="font-bold">
                {latestJoin.name}
              </span>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>
                {" "}from {latestJoin.area} 刚刚加入！
              </span>
            </div>
          )}
        </div>

        {/* Right: Feed + QR */}
        <div className="w-80 flex flex-col px-6 py-4">
          {/* Feed */}
          <div className="flex-1 flex flex-col gap-2 overflow-hidden">
            <div
              className="text-xs font-semibold mb-2"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              最新注册 RECENT
            </div>
            {feed.map((item, i) => (
              <div
                key={`${item.created_at}-${i}`}
                className="rounded-lg px-3 py-2 text-xs"
                style={{
                  background: "rgba(200,17,26,0.12)",
                  border: "1px solid rgba(200,17,26,0.2)",
                  color: "rgba(255,255,255,0.7)",
                  animation: i === 0 ? "slideIn 0.3s ease-out" : undefined,
                }}
              >
                <span className="font-semibold">{item.name}</span>
                <span style={{ color: "rgba(255,255,255,0.4)" }}>
                  {" "}· {item.area}
                </span>
              </div>
            ))}
          </div>

          {/* QR Code */}
          <div className="mt-4 flex flex-col items-center">
            <div className="bg-white rounded-xl p-3">
              <QRCodeSVG value={eventUrl} size={100} level="H" />
            </div>
            <div
              className="text-[10px] mt-2 text-center"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              扫码领取免费咖啡
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div
        className="flex justify-center gap-16 py-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="text-center">
          <div className="text-sm font-bold text-white">
            {stats.topFlavor}
          </div>
          <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            最热门口味 · {stats.topFlavorCount}人
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-white">
            {stats.topArea}
          </div>
          <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            最多来自
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-white">
            {stats.total}
          </div>
          <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            总注册
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes popIn {
          0% { transform: scale(0.8); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
