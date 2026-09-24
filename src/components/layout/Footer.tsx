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
    <footer className="relative w-full select-none overflow-hidden bg-transparent text-neutral-600 dark:text-neutral-400 mt-auto px-6 sm:px-8 pb-10">
      {/* 浪客行水墨原画抠图背景 */}
      <InkMountainBackground />

      {/* Anthony Fu (antfu.me) 同款居中 50px 极简短横线分割线 */}
      <div
        className="relative z-10 w-[50px] h-px bg-[#7d7d7d4d] mx-auto my-8"
        role="separator"
        aria-hidden="true"
      />

      {/* 内容层：容器居中，尺寸与全站正文 max-w-[620px] 严格垂直对齐 */}
      <div className="relative z-10 mx-auto w-full max-w-[620px] flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 text-sm font-sans">
        {/* 左侧：名言宣言 + 版权协议 + 技术构建栈 */}
        <div className="flex flex-col items-start text-left space-y-2.5">
          {/* 名言宣言（浪客行禅意衬线体，单行优雅） */}
          <div className="text-[13px] sm:text-[13.5px] font-medium text-neutral-800 dark:text-neutral-200 leading-relaxed font-serif tracking-wide select-text">
            “{t("footer.motto")}”
          </div>

          {/* 许可协议与版权归属 */}
          <div className="text-xs sm:text-[13px] opacity-60 font-sans flex items-center gap-1.5 flex-wrap">
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

          {/* 站点构建信息 */}
          <div className="text-xs opacity-40 font-sans">
            <p>Powered by Next.js & React</p>
          </div>
        </div>

        {/* 右侧：极简辅助工具（Sitemap 与 四季背景特效开关） */}
        <div className="flex items-center gap-3 text-xs opacity-60 self-start sm:self-end pb-0.5">
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline underline-offset-4"
            style={{ color: "inherit" }}
          >
            sitemap
          </a>
          <span>·</span>
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