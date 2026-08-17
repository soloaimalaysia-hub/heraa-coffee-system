"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/lib/LanguageContext";
import BottomNav from "@/components/BottomNav";

interface Machine {
  id: string;
  code: string;
  name: string;
  address: string | null;
  is_online: boolean;
}

export default function MachineLocatorPage() {
  const { t } = useLang();
  const router = useRouter();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("heraa_machines").select("*").order("name");
      setMachines(data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = machines.filter((m) =>
    query.trim() === "" ||
    m.name.toLowerCase().includes(query.toLowerCase()) ||
    m.code.toLowerCase().includes(query.toLowerCase()) ||
    (m.address || "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pb-20 md:pb-0 md:pl-[84px]">
      <div className="py-6 text-center relative" style={{ background: "#C8111A" }}>
        <button onClick={() => router.push("/home")} className="absolute top-3 left-3 text-white text-sm px-3 py-1">
          ←
        </button>
        <div className="text-white font-bold text-base">{t.locatorTitle}</div>
      </div>

      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.locatorSearchPlaceholder}
          className="w-full border rounded-xl px-4 py-2.5 text-sm"
          style={{ borderColor: "#E5E5E5" }}
        />
      </div>

      {/* Map placeholder — Google Map pins to be wired later */}
      <div
        className="mx-4 mt-3 rounded-xl flex items-center justify-center text-gray-300 text-xs"
        style={{ height: 160, background: "#EFEFEF" }}
      >
        🗺️ Map view coming soon
      </div>

      <div className="flex-1 px-4 py-3 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-400 text-sm">...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">{t.locatorNoMachines}</div>
        ) : (
          filtered.map((m) => (
            <div key={m.id} className="bg-white rounded-xl p-4" style={{ border: "1px solid #F0F0F0" }}>
              <div className="flex justify-between items-start mb-1">
                <div className="text-sm font-bold text-gray-800">
                  {m.code} - {m.name.replace(`${m.code} - `, "")}
                </div>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${m.is_online ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}
                >
                  🟢 {m.is_online ? t.locatorOnline : t.locatorOffline}
                </span>
              </div>
              {m.address && <div className="text-xs text-gray-400 mb-3">{m.address}</div>}
              <button
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.address || m.name)}`,
                    "_blank"
                  )
                }
                className="w-full text-center text-sm font-bold rounded-lg py-2 text-white"
                style={{ background: "#C8111A" }}
              >
                🧭 {t.locatorNavigate}
              </button>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
