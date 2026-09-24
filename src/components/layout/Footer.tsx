// src/components/layout/Footer.tsx
"use client";

import React from "react";
import { siteConfig } from "@/config/site";
import { useSeasonalEffect } from "@/hooks/useSeasonalEffect";
import { useI18n } from "@/lib/i18n/I18nContext";
import { InkMountainBackground } from "./InkMountainBackground";

export function Footer() {
  const { enabled, activeSeason, toggleEnabled } = useSeasonalEffect();
  const { t } = useI18n();

  // 当前季节标签（随自然节气自动流转）
  const SEASON_MAP = {
    spring: "Spring Cherry",
    summer: "Summer Fireflies",
    autumn: "Autumn Maples",
    winter: "Silent First Snow",
  } as const;
  const seasonTitle = SEASON_MAP[activeSeason] || "Silent First Snow";

  return (
    <footer className="relative w-full select-none overflow-hidden bg-transparent text-neutral-600 dark:text-neutral-400 mt-auto px-6 sm:px-8 pt-4 pb-10 sm:pb-12 min-h-[220px] sm:min-h-[260px] flex flex-col justify-end">
      {/* 浪客行水墨原画抠图背景（武藏立绘右下角伫立） */}
      <InkMountainBackground />

      {/* 居中短横线分割线（紧凑留白，告别空旷断层） */}
      <div
        className="relative z-10 w-12 sm:w-16 h-px bg-[#7d7d7d4d] mx-auto mb-6 sm:mb-8"
        role="separator"
        aria-hidden="true"
      />

      {/* 核心内容层：容器 max-w-[620px] 与全站正文严格垂直左对齐 */}
      <div className="relative z-10 mx-auto w-full max-w-[620px] flex flex-col items-start text-left space-y-2 text-sm font-sans">
        {/* 名言宣言（浪客行禅意衬线体，字距舒展，气度内敛） */}
        <div className="text-[15px] sm:text-[16px] font-medium text-neutral-900 dark:text-neutral-100 leading-relaxed font-serif tracking-widest select-text">
          “{t("footer.motto")}”
        </div>

        {/* 许可协议与版权归属 */}
        <div className="text-xs sm:text-[13px] opacity-70 font-sans flex items-center gap-1.5 flex-wrap">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
            className="hover:underline underline-offset-4"
            style={{ color: "inherit" }}
          >
            CC BY-NC-SA 4.0
          </a>
          <span>2026-PRESENT © {siteConfig.name}</span>
        </div>

        {/* 站点构建信息与实用工具整合为紧凑的一行，告别孤立浮动 */}
        <div className="text-xs opacity-40 font-sans flex items-center gap-2.5 flex-wrap pt-0.5">
          <span>Powered by Next.js & React</span>
          <span className="select-none opacity-60">·</span>
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline underline-offset-4"
            style={{ color: "inherit" }}
          >
            sitemap
          </a>
          <span className="select-none opacity-60">·</span>
          <button
            type="button"
            onClick={toggleEnabled}
            className="cursor-pointer hover:underline underline-offset-4 focus:outline-none"
            title={
              enabled
                ? `Background effect: Enabled (${seasonTitle})`
                : "Background effect: Disabled"
            }
            aria-label="Toggle background effect"
          >
            {enabled ? "fx on" : "fx off"}
          </button>
        </div>
      </div>
    </footer>
  );
}