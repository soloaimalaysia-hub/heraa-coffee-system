"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface FeedItem {
  member_name: string;
  drink_name: string;
  amount: number;
  created_at: string;
}

interface Stats {
  today_cups: number;
  total_members: number;
  today_revenue: number;
}

interface MainEvent {
  name: string;
  drink: string;
  time: string;
}

export default function ScreenPage() {
  const [stats, setStats] = useState<Stats>({
    today_cups: 0,
    total_members: 0,
    today_revenue: 0,
  });
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [mainEvent, setMainEvent] = useState<MainEvent | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const feedRef = useRef<FeedItem[]>([]);

  const loadInitialData = useCallback(async () => {
    const { data: statsData } = await supabase.rpc("heraa_screen_stats");
    if (statsData) setStats(statsData);

    const { data: feedData } = await supabase.rpc("heraa_screen_feed", {
      p_limit: 5,
    });
    if (feedData) {
      setFeed(feedData);
      feedRef.current = feedData;
      if (feedData.length > 0) {
        setMainEvent({
          name: feedData[0].member_name,
          drink: feedData[0].drink_name,
          time: formatTime(feedData[0].created_at),
        });
      }
    }
  }, []);

  useEffect(() => {
    loadInitialData();

    // Polling fallback: RLS blocks anon realtime on heraa_transactions,
    // so refresh via SECURITY DEFINER RPCs every 5s to guarantee updates.
    const poll = setInterval(loadInitialData, 3000);

    const channel = supabase
      .channel("heraa-screen")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "heraa_transactions",
        },
        async (payload) => {
          const record = payload.new as {
            member_id: string;
            description: string;
            amount: number;
            type: string;
            created_at: string;
          };

          if (record.type !== "debit") return;

          const { data: memberName } = await supabase.rpc(
            "heraa_get_member_name",
            { p_member_id: record.member_id }
          );

          const name = memberName || "Member";
          const newItem: FeedItem = {
            member_name: name,
            drink_name: record.description,
            amount: record.amount,
            created_at: record.created_at,
          };

          setMainEvent({
            name,
            drink: record.description,
            time: formatTime(record.created_at),
          });
          setAnimKey((k) => k + 1);

          feedRef.current = [newItem, ...feedRef.current].slice(0, 5);
          setFeed([...feedRef.current]);

          setStats((prev) => ({
            ...prev,
            today_cups: prev.today_cups + 1,
            today_revenue: prev.today_revenue + record.amount,
          }));
        }
      )
      .subscribe();

    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [loadInitialData]);

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}秒前`;
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    return d.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-center"
      style={{ background: "#1a0305" }}
    >
      {/* Top Logo */}
      <div
        className="absolute top-4 left-0 right-0 text-center text-xs font-bold tracking-[0.15em]"
        style={{ color: "#C8111A" }}
      >
        HERAA COFFEE · SMART VENDING
      </div>

      {/* Background Rings */}
      <div
        className="absolute rounded-full"
        style={{
          width: 360,
          height: 360,
          border: "1px solid rgba(200,17,26,0.15)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 240,
          height: 240,
          border: "1px solid rgba(200,17,26,0.25)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
        }}
      />

      {/* Right Feed */}
      <div className="absolute top-16 right-6 flex flex-col gap-2 z-10">
        {feed.slice(0, 3).map((item, i) => (
          <div
            key={`${item.created_at}-${i}`}
            className="rounded-md px-3 py-1.5 text-xs"
            style={{
              background: "rgba(200,17,26,0.2)",
              border: "1px solid rgba(200,17,26,0.3)",
              color: "rgba(255,255,255,0.8)",
              animation: i === 0 ? "slideIn 0.3s ease-out" : undefined,
            }}
          >
            {item.member_name} · {item.drink_name}
          </div>
        ))}
      </div>

      {/* Center Main Event */}
      <div className="relative z-10 flex flex-col items-center" key={animKey}>
        <div
          className="text-5xl mb-3"
          style={{ animation: "pulse 0.3s ease-out" }}
        >
          ☕
        </div>
        {mainEvent ? (
          <>
            <div
              className="text-center text-lg font-semibold"
              style={{ animation: "fadeIn 0.5s ease-out" }}
            >
              <span style={{ color: "#C8111A" }}>{mainEvent.name}</span>
              <span style={{ color: "#fff" }}> 刚刚兑换了</span>
              <br />
              <span style={{ color: "#fff" }}>{mainEvent.drink}</span>
            </div>
            <div
              className="mt-2 text-xs"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              {mainEvent.time} · Wisma Genting
            </div>
          </>
        ) : (
          <div className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            等待第一笔兑换...
          </div>
        )}
      </div>

      {/* Bottom Stats */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-16 z-10">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {stats.today_cups}
          </div>
          <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            今日杯数
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {stats.total_members}
          </div>
          <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            会员人数
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            RM {stats.today_revenue.toFixed(0)}
          </div>
          <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            今日营收
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
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
