export type TabKey =
  | "analytics"
  | "simulate"
  | "whatsapp"
  | "transactions"
  | "members"
  | "events"
  | "companies"
  | "packages"
  | "products"
  | "leads"
  | "appointments";

export interface TabDef {
  key: TabKey;
  label: string;
  icon?: string;
  emoji?: string;
}

// Single source of truth for which tabs are open in the nav (desktop Sidebar + mobile
// TabNav both read from here) — Companies is intentionally left out, not deleted, see
// the earlier "Pull Companies tab icon from Admin nav" commit.
interface TabLabels {
  tabData: string;
  tabCoffee: string;
  tabWhatsApp: string;
  tabTransactions: string;
  tabMembers: string;
  tabEvents: string;
}

export function getTabs(t: TabLabels, lang: "zh" | "en"): TabDef[] {
  return [
    { key: "analytics", label: t.tabData, icon: "/assets/icons/nav-analytics.webp" },
    { key: "simulate", label: t.tabCoffee, icon: "/assets/icons/nav-coffee.webp" },
    { key: "whatsapp", label: t.tabWhatsApp, icon: "/assets/icons/nav-whatsapp.webp" },
    { key: "transactions", label: t.tabTransactions, icon: "/assets/icons/nav-transactions.webp" },
    { key: "members", label: t.tabMembers, icon: "/assets/icons/nav-members.webp" },
    { key: "events", label: t.tabEvents, icon: "/assets/icons/nav-events.webp" },
    { key: "packages", label: lang === "zh" ? "配套" : "Packages", emoji: "📦" },
    { key: "products", label: lang === "zh" ? "产品" : "Products", emoji: "🥤" },
    { key: "leads", label: lang === "zh" ? "Lead" : "Leads", icon: "/assets/icons/nav-leads.webp" },
    { key: "appointments", label: lang === "zh" ? "预约" : "Bookings", icon: "/assets/icons/nav-appointments.webp" },
  ];
}
