"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TopBar from "./components/TopBar";
import TabNav, { TabKey } from "./components/TabNav";
import AnalyticsTab from "./components/AnalyticsTab";
import SimulateTab from "./components/SimulateTab";
import WhatsAppTab from "./components/WhatsAppTab";
import TransactionsTab from "./components/TransactionsTab";
import MembersTab from "./components/MembersTab";

function AdminContent() {
  const searchParams = useSearchParams();
  const key = searchParams.get("key");
  const [tab, setTab] = useState<TabKey>("analytics");

  if (key !== "heraa2026") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <div className="text-sm text-gray-400">
            Access denied. Add ?key=heraa2026 to URL.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <TabNav active={tab} onChange={setTab} />

      <div className="p-4 md:p-6 max-w-full md:max-w-6xl mx-auto">
        <div style={{ display: tab === "analytics" ? "block" : "none" }}>
          <AnalyticsTab />
        </div>
        <div style={{ display: tab === "simulate" ? "block" : "none" }}>
          <SimulateTab />
        </div>
        <div style={{ display: tab === "whatsapp" ? "block" : "none" }}>
          <WhatsAppTab />
        </div>
        <div style={{ display: tab === "transactions" ? "block" : "none" }}>
          <TransactionsTab />
        </div>
        <div style={{ display: tab === "members" ? "block" : "none" }}>
          <MembersTab />
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div
            className="animate-pulse font-bold"
            style={{ color: "#C8111A" }}
          >
            加载中...
          </div>
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
