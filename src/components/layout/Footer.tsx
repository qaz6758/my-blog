// src/components/layout/Footer.tsx
"use client";

import React from "react";
import { siteConfig } from "@/config/site";
import { useSeasonalEffect } from "@/hooks/useSeasonalEffect";
import { useI18n } from "@/lib/i18n/I18nContext";
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
    <footer className="relative w-full select-none bg-transparent text-neutral-600 dark:text-neutral-400 mt-auto px-6 sm:px-8 pt-8 sm:pt-10 pb-10 sm:pb-12">

      {/* 居中短横线分割线：处于正文与页脚上下空间的绝对正中心，与全站 max-w-[620px] 严格同心对齐 (50px 黄金规格) */}
      <div className="relative z-10 mx-auto w-full max-w-[620px] flex justify-center mb-8 sm:mb-10">
        <div
          className="w-[50px] h-px bg-[#7d7d7d4d]"
          role="separator"
          aria-hidden="true"
        />
      </div>

      {/* 核心内容层：容器 max-w-[620px] 与全站正文严格垂直左对齐 */}
      <div className="relative z-10 mx-auto w-full max-w-[620px] flex flex-col items-start text-left space-y-2.5 text-sm font-sans">
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

        {/* 站点构建信息与实用工具整合为紧凑的一行 */}
        <div className="text-xs opacity-50 font-sans flex items-center gap-2.5 flex-wrap pt-0.5">
          <span>Powered by Next.js & React</span>
          <span className="select-none opacity-40">·</span>
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline underline-offset-4"
            style={{ color: "inherit" }}
          >
            sitemap
          </a>
          <span className="select-none opacity-40">·</span>

          {/* 背景效果控制（恢复用户原本的高辨识度精致微型线框开关） */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleEnabled}
              className="cursor-pointer select-none hover:underline focus:outline-none"
              title={
                enabled
                  ? `Background effect: Enabled (${seasonTitle})`
                  : "Background effect: Disabled"
              }
            >
              <span>{t("footer.bg_effect")}</span>
            </button>

            {/* 极简纯粹开关：清晰线框 + 内部高亮小方块 */}
            <button
              type="button"
              onClick={toggleEnabled}
              className={`relative inline-flex h-3.5 w-6.5 items-center rounded-[2.5px] transition-colors duration-200 focus:outline-none cursor-pointer p-[1.5px] bg-transparent ${
                enabled
                  ? "border border-[#f472b6] dark:border-[#f472b6]"
                  : "border border-neutral-400 dark:border-neutral-500"
              }`}
              title={
                enabled
                  ? `Click to disable background effect (${seasonTitle})`
                  : "Click to enable background effect"
              }
              aria-label={
                enabled ? "Disable background effect" : "Enable background effect"
              }
            >
              <span
                className={`inline-block h-2 w-2 rounded-[1px] transition-transform duration-200 ${
                  enabled
                    ? "translate-x-3 bg-[#f472b6] dark:bg-[#f472b6] shadow-[0_0_6px_rgba(244,114,182,0.8)]"
                    : "translate-x-0 bg-neutral-400 dark:bg-neutral-400"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}