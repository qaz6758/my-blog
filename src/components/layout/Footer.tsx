// src/components/layout/Footer.tsx
"use client";

import React from "react";
import { siteConfig } from "@/config/site";
import { useSeasonalEffect } from "@/hooks/useSeasonalEffect";

export function Footer() {
  const { enabled, activeSeason, toggleEnabled } = useSeasonalEffect();

  // 当前季节标签（随自然节气自动流转）
  const SEASON_MAP = {
    spring: "Spring Cherry",
    summer: "Summer Fireflies",
    autumn: "Autumn Maples",
    winter: "Silent First Snow",
  } as const;
  const seasonTitle = SEASON_MAP[activeSeason] || "Silent First Snow";

  return (
    <footer className="relative w-full select-none bg-transparent text-neutral-600 dark:text-neutral-400 mt-auto px-6 sm:px-8 pb-8 pt-4">
      {/* Anthony Fu (antfu.me) 同款居中 50px 极简短横线分割线 */}
      <div
        className="w-[50px] h-px bg-[#7d7d7d4d] mx-auto my-8"
        role="separator"
        aria-hidden="true"
      />

      {/* Anthony Fu (antfu.me) 官方同款极简版权与站点信息栏 */}
      <div className="mx-auto w-full max-w-[620px] flex flex-col sm:flex-row items-center justify-between gap-3 text-sm opacity-50 font-sans">
        <span>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
            className="hover:underline underline-offset-4"
            style={{ color: "inherit" }}
          >
            CC BY-NC-SA 4.0
          </a>{" "}
          2026-PRESENT © {siteConfig.name}
        </span>

        {/* 极简辅助栏：Sitemap 与 背景动效切换 */}
        <div className="flex items-center gap-3 text-xs">
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