// src/components/layout/LanguageSwitcher.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Languages, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n/I18nContext";
import { SUPPORTED_LOCALES, Locale } from "@/lib/i18n/locales";

export interface LanguageSwitcherProps {
  placement?: "top" | "bottom";
  align?: "left" | "right";
  className?: string;
  value?: Locale;
  onChange?: (locale: Locale) => void;
}

export function LanguageSwitcher({
  placement = "top",
  align = "left",
  className = "",
  value,
  onChange,
}: LanguageSwitcherProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const { locale: globalLocale, setLocale: setGlobalLocale, t } = useI18n();
  const currentLocale = value || globalLocale;
  const menuRef = useRef<HTMLDivElement | null>(null);

  // 点击外部自动收起下拉面板
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectLanguage = (newLocale: Locale) => {
    if (onChange) {
      onChange(newLocale);
    } else {
      setGlobalLocale(newLocale);
    }
    setIsOpen(false);
  };

  const activeOption =
    SUPPORTED_LOCALES.find((item) => item.id === currentLocale) || SUPPORTED_LOCALES[0];

  const positionClasses =
    placement === "top"
      ? align === "right"
        ? "bottom-full mb-2.5 right-0"
        : "bottom-full mb-2.5 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0"
      : align === "right"
      ? "top-full mt-2.5 right-0"
      : "top-full mt-2.5 left-0";

  return (
    <div
      ref={menuRef}
      className={`relative inline-flex items-center text-[12.5px] sm:text-xs font-medium select-none ${className}`}
    >
      {/* 触发按钮（[文A 图标] 简体中文 [ChevronDown]） */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group inline-flex items-center gap-1.5 text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white transition-colors duration-200 cursor-pointer focus:outline-none"
        title={t("common.switch_lang")}
        aria-expanded={isOpen}
      >
        <Languages className="h-3.5 w-3.5 opacity-80 group-hover:opacity-100 transition-opacity" />
        <span className="font-normal tracking-tight">{activeOption.label}</span>
        <ChevronDown
          className={`h-3 w-3 opacity-60 group-hover:opacity-100 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* 浮动菜单卡片 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: placement === "top" ? 8 : -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: placement === "top" ? 6 : -6, scale: 0.95 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute z-50 min-w-[136px] rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#1f1f21]/95 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_48px_rgba(0,0,0,0.6)] backdrop-blur-2xl ${positionClasses}`}
          >
            <div className="flex flex-col gap-0.5">
              {SUPPORTED_LOCALES.map((lang) => {
                const isSelected = lang.id === currentLocale;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => handleSelectLanguage(lang.id)}
                    className={`group/item flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-colors cursor-pointer select-none ${
                      isSelected
                        ? "bg-black/[0.06] dark:bg-white/10 text-neutral-950 dark:text-white"
                        : "text-neutral-700 hover:text-neutral-950 hover:bg-black/[0.04] dark:text-neutral-300 dark:hover:text-white dark:hover:bg-white/[0.06]"
                    }`}
                  >
                    <span>{lang.label}</span>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-[#f43f5e] dark:text-[#fb7185] shrink-0 ml-3" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
