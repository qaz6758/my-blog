// src/components/layout/LanguageSwitcher.tsx
"use client";

import React from "react";
import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nContext";
import { Locale } from "@/lib/i18n/locales";

export interface LanguageSwitcherProps {
  className?: string;
  value?: Locale;
  onChange?: (locale: Locale) => void;
}

export function LanguageSwitcher({
  className = "",
  value,
  onChange,
}: LanguageSwitcherProps = {}) {
  const { locale: globalLocale, setLocale: setGlobalLocale } = useI18n();
  const currentLocale = value || globalLocale;
  const isEn = currentLocale === "en";

  const handleToggle = () => {
    const nextLocale: Locale = isEn ? "zh-CN" : "en";
    if (onChange) {
      onChange(nextLocale);
    } else {
      setGlobalLocale(nextLocale);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`group inline-flex items-center gap-1.5 text-[12.5px] sm:text-xs font-medium text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white transition-colors duration-200 cursor-pointer select-none focus:outline-none ${className}`}
      title={isEn ? "切换为中文" : "Switch to English"}
      aria-label="Toggle language between Chinese and English"
    >
      <Languages className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
      <span className="inline-flex items-center gap-0.5 tracking-tight font-sans">
        <span
          className={`transition-colors duration-150 ${
            !isEn
              ? "font-bold text-neutral-900 dark:text-white"
              : "opacity-40 font-normal"
          }`}
        >
          中
        </span>
        <span className="opacity-30">/</span>
        <span
          className={`transition-colors duration-150 ${
            isEn
              ? "font-bold text-neutral-900 dark:text-white"
              : "opacity-40 font-normal"
          }`}
        >
          EN
        </span>
      </span>
    </button>
  );
}
