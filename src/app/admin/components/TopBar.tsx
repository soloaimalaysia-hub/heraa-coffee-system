"use client";

import { useLang } from "@/lib/LanguageContext";

export default function TopBar() {
  const { lang, toggleLang } = useLang();

  return (
    <div
      className="px-4 py-3 flex items-center gap-2 sticky top-0 z-20"
      style={{ background: "#C8111A" }}
    >
      <div className="w-2 h-2 rounded-full bg-white/50" />
      <div className="text-white text-sm font-semibold">
        ☕ Heraa Coffee · Admin
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={toggleLang}
          className="text-white text-xs font-medium rounded px-2.5 py-1 border transition-colors"
          style={{
            background: "rgba(255,255,255,0.15)",
            borderColor: "rgba(255,255,255,0.3)",
          }}
        >
          {lang === "zh" ? "EN" : "中文"}
        </button>
        <div className="text-white/60 text-[10px]">v1.0</div>
      </div>
    </div>
  );
}
