// src/lib/i18n/I18nContext.tsx
"use client";

import React, {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Locale, SUPPORTED_LOCALES, DICTIONARIES, TranslationKey } from "./locales";
import * as OpenCC from "opencc-js";

const dictionaries: Record<Locale, Readonly<Record<TranslationKey, string>>> =
  DICTIONARIES;

function isLocale(value: string | null): value is Locale {
  return value !== null && SUPPORTED_LOCALES.some((locale) => locale.id === value);
}

function createOpenccConverter(): (text: string) => string {
  try {
    return OpenCC.Converter({ from: "cn", to: "tw" });
  } catch {
    return (text) => text;
  }
}

const openccConverter = createOpenccConverter();

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
      const dataLocale = document.documentElement.getAttribute("data-locale");
      if (isLocale(dataLocale)) {
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
      const saved = localStorage.getItem("blog_lang");
      if (isLocale(saved)) {
        if (saved !== locale) {
          startTransition(() => setLocaleState(saved));
        }
        document.documentElement.lang = saved;
      } else {
        document.documentElement.lang = locale;
      }
    } catch {
      // ignore
    }
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("blog_lang", newLocale);
      document.documentElement.lang = newLocale;
    } catch {
      // ignore
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
    [locale]
  );

  // 字典取词
  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const dict = dictionaries[locale] ?? dictionaries.en;
      let value = dict[key] || dictionaries.en[key] || key;

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

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // 降级兜底，避免非 Provider 下报错
    return {
      locale: "en",
      setLocale: () => {},
      t: (key: TranslationKey, params?: Record<string, string | number>) => {
        let val = dictionaries.en[key] || key;
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
