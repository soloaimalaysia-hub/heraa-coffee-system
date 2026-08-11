"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import TopBar from "./components/TopBar";
import TabNav, { TabKey } from "./components/TabNav";
import AdminLogin from "./components/AdminLogin";
import AdminChangePassword from "./components/AdminChangePassword";
import AnalyticsTab from "./components/AnalyticsTab";
import SimulateTab from "./components/SimulateTab";
import WhatsAppTab from "./components/WhatsAppTab";
import TransactionsTab from "./components/TransactionsTab";
import MembersTab from "./components/MembersTab";
import EventsTab from "./components/EventsTab";
import CompaniesTab from "./components/CompaniesTab";
import LeadsTab from "./components/lead/LeadsTab";
import AppointmentsTab from "./components/lead/AppointmentsTab";

const SESSION_KEY = "heraa_admin_session";

export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [adminName, setAdminName] = useState<string | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [tab, setTab] = useState<TabKey>("analytics");

  const checkSession = useCallback(async () => {
    const token = localStorage.getItem(SESSION_KEY);
    if (!token) {
      setChecking(false);
      return;
    }
    const { data } = await supabase.rpc("heraa_admin_verify_session", { p_token: token });
    if (data?.valid) {
      setAdminName(data.name);
      setMustChangePassword(!!data.must_change_password);
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
    setChecking(false);
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  function handleLogin(token: string, name: string, mustChange: boolean) {
    localStorage.setItem(SESSION_KEY, token);
    setAdminName(name);
    setMustChangePassword(mustChange);
  }

  async function handleLogout() {
    const token = localStorage.getItem(SESSION_KEY);
    if (token) {
      await supabase.rpc("heraa_admin_logout", { p_token: token });
    }
    localStorage.removeItem(SESSION_KEY);
    setAdminName(null);
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse font-bold" style={{ color: "#C8111A" }}>
          加载中...
        </div>
      </div>
    );
  }

  if (!adminName) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  const token = localStorage.getItem(SESSION_KEY) || "";

  if (mustChangePassword) {
    return (
      <AdminChangePassword
        token={token}
        forced
        onDone={() => setMustChangePassword(false)}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#F6F3EE" }}>
      <TopBar
        adminName={adminName}
        onLogout={handleLogout}
        onChangePassword={() => setShowChangePassword(true)}
      />
      <TabNav active={tab} onChange={setTab} />

      <div style={{ padding: "18px 18px 28px" }} className="max-w-full md:max-w-6xl mx-auto">
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
        <div style={{ display: tab === "events" ? "block" : "none" }}>
          <EventsTab />
        </div>
        <div style={{ display: tab === "companies" ? "block" : "none" }}>
          <CompaniesTab />
        </div>
        <div style={{ display: tab === "leads" ? "block" : "none" }}>
          <LeadsTab />
        </div>
        <div style={{ display: tab === "appointments" ? "block" : "none" }}>
          <AppointmentsTab />
        </div>
      </div>

      {showChangePassword && (
        <AdminChangePassword
          token={token}
          forced={false}
          onDone={() => setShowChangePassword(false)}
          onCancel={() => setShowChangePassword(false)}
        />
      )}
    </div>
  );
}
