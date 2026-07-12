"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { translations, Lang } from "./i18n";

type Ctx = {
  lang: Lang;
  t: typeof translations.zh;
  toggleLang: () => void;
};

const LanguageContext = createContext<Ctx>({
  lang: "zh",
  t: translations.zh,
  toggleLang: () => {},
});

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lang, setLang] = useState<Lang>("zh");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("heraa_lang");
    if (saved === "en" || saved === "zh") setLang(saved);
    setMounted(true);
  }, []);

  const toggleLang = () => {
    const next = lang === "zh" ? "en" : "zh";
    setLang(next);
    try {
      localStorage.setItem("heraa_lang", next);
    } catch {}
  };

  const value: Ctx = {
    lang,
    t: translations[mounted ? lang : "zh"],
    toggleLang,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
