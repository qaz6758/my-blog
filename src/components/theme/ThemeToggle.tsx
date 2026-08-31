// components/theme/ThemeToggle.tsx
"use client";

import React, { useState, useEffect } from "react";
// 纠正引入源：必须指向本地 ThemeProvider 而不是 next-themes
import { useTheme } from "@/components/theme/ThemeProvider";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-8 w-8" />;
  }

  return (
    <button
      type="button"
      aria-label="切换日夜间主题"
      onClick={(e) => toggleTheme(e)}
      className="
        relative flex h-8 w-8 items-center justify-center rounded-lg
        text-neutral-500 transition-all duration-200
        hover:bg-black/[0.04] hover:text-neutral-900
        dark:text-neutral-400 dark:hover:bg-white/[0.06] dark:hover:text-white
        active:scale-90 touch-manipulation
      "
    >
      {/* 太阳图标 */}
      <Sun
        className={`
          absolute h-4 w-4 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]
          ${
            isDark
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100"
          }
        `}
      />

      {/* 月亮图标 */}
      <Moon
        className={`
          absolute h-4 w-4 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]
          ${
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0"
          }
        `}
      />
    </button>
  );
}