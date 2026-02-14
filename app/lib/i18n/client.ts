"use client";

import { useState, useEffect } from "react";
import { languageFiles } from "../i18n";

export function useTranslationClient() {
  const [lang, setLang] = useState("en");
  const [messages, setMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem("lang") || "en";
    setLang(saved);
  }, []);

  useEffect(() => {
    if (!languageFiles[lang]) return;

    languageFiles[lang]().then((mod) => {
      setMessages(mod.default || {});
    });
  }, [lang]);

  const setLanguage = (newLang: string) => {
    localStorage.setItem("lang", newLang);
    setLang(newLang);
  };

  // ⚠️ KHÔNG dùng useCallback
  function t(key: string) {
    if (!messages) return key;
    return messages[key] || key;
  }

  return {
    t,
    lang,
    setLang: setLanguage,
  };
}
