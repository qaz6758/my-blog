// src/lib/i18n/I18nContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { Locale, SUPPORTED_LOCALES, DICTIONARIES, TranslationKey } from "./locales";
import * as OpenCC from "opencc-js";

interface I18nContextType {
  locale: Locale;
  setLocale: (newLocale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  convertText: (text: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh-CN");

  // 初始化语言
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("blog_lang") as Locale;
      if (saved && SUPPORTED_LOCALES.some((l) => l.id === saved)) {
        setLocaleState(saved);
        document.documentElement.lang = saved;
      }
    } catch {
      // ignore
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("blog_lang", newLocale);
      document.documentElement.lang = newLocale;
    } catch {
      // ignore
    }
  }, []);

  // 繁体中文 OpenCC 转换器实例（缓存）
  const openccConverter = useMemo(() => {
    try {
      return OpenCC.Converter({ from: "cn", to: "tw" });
    } catch {
      return (s: string) => s;
    }
  }, []);

  // 文本转换（正體中文自动 OpenCC 纯离线秒转）
  const convertText = useCallback(
    (text: string) => {
      if (!text) return "";
      if (locale === "zh-TW") {
        return openccConverter(text);
      }
      return text;
    },
    [locale, openccConverter]
  );

  // 字典取词
  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const dict = DICTIONARIES[locale] || DICTIONARIES["zh-CN"];
      let value: string = (dict as any)[key] || (DICTIONARIES["zh-CN"] as any)[key] || key;

      if (params) {
        Object.entries(params).forEach(([paramKey, paramVal]) => {
          value = value.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramVal));
        });
      }
      return value;
    },
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      convertText,
    }),
    [locale, setLocale, t, convertText]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // 降级兜底，避免非 Provider 下报错
    return {
      locale: "zh-CN" as Locale,
      setLocale: () => {},
      t: (key: TranslationKey, params?: Record<string, string | number>) => {
        let val: string = (DICTIONARIES["zh-CN"] as any)[key] || key;
        if (params) {
          Object.entries(params).forEach(([pk, pv]) => {
            val = val.replace(new RegExp(`\\{${pk}\\}`, "g"), String(pv));
          });
        }
        return val;
      },
      convertText: (text: string) => text,
    };
  }
  return ctx;
}
