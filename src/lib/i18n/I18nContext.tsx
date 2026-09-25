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
  // 同步读取 blocking script 已注入的 data-locale 属性，确保首帧即为正确语言（零闪跳）
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof document !== "undefined") {
      const dataLocale = document.documentElement.getAttribute("data-locale") as Locale;
      if (dataLocale && SUPPORTED_LOCALES.some((l) => l.id === dataLocale)) {
        return dataLocale;
      }
    }
    return "en";
  });

  // 兜底：确保 document.documentElement.lang 与 React state 同步
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      // 若 blocking script 未执行（极端情况），从 localStorage 再次读取
      const saved = localStorage.getItem("blog_lang") as Locale;
      if (saved && SUPPORTED_LOCALES.some((l) => l.id === saved)) {
        if (saved !== locale) {
          setLocaleState(saved);
        }
        document.documentElement.lang = saved;
      } else {
        document.documentElement.lang = locale;
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
      const dict = DICTIONARIES[locale] || DICTIONARIES["en"];
      let value: string = (dict as any)[key] || (DICTIONARIES["en"] as any)[key] || key;

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
      locale: "en" as Locale,
      setLocale: () => {},
      t: (key: TranslationKey, params?: Record<string, string | number>) => {
        let val: string = (DICTIONARIES["en"] as any)[key] || key;
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
