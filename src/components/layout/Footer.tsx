// src/components/layout/Footer.tsx
"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { siteConfig } from "@/config/site";
import { useSeasonalEffect } from "@/hooks/useSeasonalEffect";
import { useI18n } from "@/lib/i18n/I18nContext";
import { InkMountainBackground } from "./InkMountainBackground";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Footer() {
  const { mounted, enabled, activeSeason, toggleEnabled } = useSeasonalEffect();
  const { locale, t } = useI18n();
  const isEn = locale === "en";

  // 当前季节标签（随自然节气自动流转，无需手动下拉）
  const SEASON_MAP = {
    spring: isEn ? "Spring Cherry" : "春樱漫舞",
    summer: isEn ? "Summer Fireflies" : "夏夜流萤",
    autumn: isEn ? "Autumn Maples" : "秋枫飘落",
    winter: isEn ? "Silent First Snow" : "静谧初雪",
  } as const;
  const seasonTitle = SEASON_MAP[activeSeason] || (isEn ? "Silent First Snow" : "静谧初雪");

  return (
    <footer className="relative w-full select-none overflow-hidden bg-transparent text-neutral-600 dark:text-neutral-400 transition-colors duration-300 mt-auto px-6 sm:px-8">
      {/* 顶部分割线：极淡水墨虚化化境线，无硬切缝隙 */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-black/[0.04] dark:via-white/[0.04] to-transparent pointer-events-none z-10" />

      {/* 画卷全景背景 */}
      <InkMountainBackground />

      {/* 内容层：容器居中，尺寸与全站正文 max-w-[660px] 像素级无缝垂直对齐 */}
      <div className="relative z-10 mx-auto w-full max-w-[660px] pt-12 pb-10 sm:pt-36 sm:pb-12">
        {/* ===================== 上半部分：品牌大字 + 3列导航 ===================== */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-10 sm:gap-8">
          {/* 左侧：品牌名、名言宣言（左对齐，宽度充足绝不折单字） */}
          <div className="flex flex-col items-start text-left space-y-3 shrink-0 sm:max-w-[340px]">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5">
              {siteConfig.name}
            </h2>
            {/* 纯净引用文本：单行优雅呈现，杜绝孤字掉行 */}
            <div className="my-1 text-[13px] sm:text-[13.5px] font-medium text-neutral-700 dark:text-neutral-300 leading-relaxed font-serif tracking-wide select-text whitespace-nowrap">
              {t("footer.motto")}
            </div>
            <div className="pt-0.5 text-xs leading-relaxed text-neutral-600 dark:text-[#b8b2a8] font-sans">
              <p>© 2026 - Present Powered by Next.js & React</p>
            </div>
          </div>
          {/* 3列导航链接 */}
          <div className="flex items-start justify-between sm:justify-end gap-6 sm:gap-8 md:gap-10 text-left shrink-0">
            {/* 第 1 列：关于 */}
            <div className="space-y-3">
              <h3 className="text-[13.5px] sm:text-sm font-semibold text-neutral-900 dark:text-white tracking-wide dark:drop-shadow-[0_0_6px_rgba(255,255,255,0.2)]">
                {t("footer.about")}
              </h3>
              <ul className="space-y-2 text-[13px] sm:text-sm font-medium">
                <li>
                  <Link
                    href="/"
                    className="text-neutral-700 hover:text-neutral-950 dark:text-[#f3f0ea] dark:hover:text-white dark:[text-shadow:_0_1px_4px_rgba(0,0,0,0.9)] hover:underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-600 transition-all duration-200"
                  >
                    {t("footer.about_site")}
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/qaz6758"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-700 hover:text-neutral-950 dark:text-[#f3f0ea] dark:hover:text-white dark:[text-shadow:_0_1px_4px_rgba(0,0,0,0.9)] hover:underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-600 transition-all duration-200"
                  >
                    {t("footer.about_me")}
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/qaz6758/my-blog"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-0.5 text-neutral-700 hover:text-neutral-950 dark:text-[#f3f0ea] dark:hover:text-white dark:[text-shadow:_0_1px_4px_rgba(0,0,0,0.9)] transition-all duration-200"
                  >
                    <span className="hover:underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-600">{t("footer.about_project")}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-75 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-neutral-500 dark:text-neutral-300 group-hover:text-neutral-950 dark:group-hover:text-white transition-all shrink-0" />
                  </a>
                </li>
              </ul>
            </div>

            {/* 第 2 列：更多 */}
            <div className="space-y-3">
              <h3 className="text-[13.5px] sm:text-sm font-semibold text-neutral-900 dark:text-white tracking-wide dark:drop-shadow-[0_0_6px_rgba(255,255,255,0.2)]">
                {t("footer.more")}
              </h3>
              <ul className="space-y-2 text-[13px] sm:text-sm font-medium">
                <li>
                  <Link
                    href="/gallery"
                    className="text-neutral-700 hover:text-neutral-950 dark:text-[#f3f0ea] dark:hover:text-white dark:[text-shadow:_0_1px_4px_rgba(0,0,0,0.9)] hover:underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-600 transition-all duration-200"
                  >
                    {t("footer.gallery")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/playlist"
                    className="text-neutral-700 hover:text-neutral-950 dark:text-[#f3f0ea] dark:hover:text-white dark:[text-shadow:_0_1px_4px_rgba(0,0,0,0.9)] hover:underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-600 transition-all duration-200"
                  >
                    {t("footer.playlist")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/thoughts"
                    className="text-neutral-700 hover:text-neutral-950 dark:text-[#f3f0ea] dark:hover:text-white dark:[text-shadow:_0_1px_4px_rgba(0,0,0,0.9)] hover:underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-600 transition-all duration-200"
                  >
                    {t("footer.thoughts")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* 第 3 列：联系 */}
            <div className="space-y-3">
              <h3 className="text-[13.5px] sm:text-sm font-semibold text-neutral-900 dark:text-white tracking-wide dark:drop-shadow-[0_0_6px_rgba(255,255,255,0.2)]">
                {t("footer.contact")}
              </h3>
              <ul className="space-y-2 text-[13px] sm:text-sm font-medium">
                <li>
                  <Link
                    href="/posts"
                    className="text-neutral-700 hover:text-neutral-950 dark:text-[#f3f0ea] dark:hover:text-white dark:[text-shadow:_0_1px_4px_rgba(0,0,0,0.9)] hover:underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-600 transition-all duration-200"
                  >
                    {t("footer.message")}
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:hi@owen.loc.cc"
                    className="group inline-flex items-center gap-0.5 text-neutral-700 hover:text-neutral-950 dark:text-[#f3f0ea] dark:hover:text-white dark:[text-shadow:_0_1px_4px_rgba(0,0,0,0.9)] transition-all duration-200"
                  >
                    <span className="hover:underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-600">{t("footer.email")}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-75 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-neutral-500 dark:text-neutral-300 group-hover:text-neutral-950 dark:group-hover:text-white transition-all shrink-0" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/qaz6758"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-0.5 text-neutral-700 hover:text-neutral-950 dark:text-[#f3f0ea] dark:hover:text-white dark:[text-shadow:_0_1px_4px_rgba(0,0,0,0.9)] transition-all duration-200"
                  >
                    <span className="hover:underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-600">{t("footer.github")}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-75 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-neutral-500 dark:text-neutral-300 group-hover:text-neutral-950 dark:group-hover:text-white transition-all shrink-0" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ===================== 下半部分：次级工具条 (严格保持左对齐) ===================== */}
        <div className="mt-10 sm:mt-12 pt-5 sm:pt-6 border-t border-black/[0.08] dark:border-white/10 flex items-center justify-start text-[12.5px] sm:text-xs font-medium text-neutral-700 dark:text-neutral-300">
          {/* 条目：站点地图 | 简体中文 | 背景效果开关（与上方左侧品牌文案严格在同一直线） */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex items-center">
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-700 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white transition-colors duration-200 dark:[text-shadow:_0_1px_3px_rgba(0,0,0,0.8)]"
              >
                {t("footer.sitemap")}
              </a>
            </div>

            {/* 竖向细分隔线 */}
            <span className="text-neutral-400 dark:text-neutral-500 select-none font-normal">
              |
            </span>

            {/* 多语言切换菜单 */}
            <LanguageSwitcher />

            {/* 竖向细分隔线 */}
            <span className="text-neutral-400 dark:text-neutral-500 select-none font-normal">
              |
            </span>

            {/* 背景效果控制 */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleEnabled}
                className="cursor-pointer select-none text-neutral-700 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white transition-colors duration-200 focus:outline-none dark:[text-shadow:_0_1px_3px_rgba(0,0,0,0.8)]"
                title={
                  isEn
                    ? `Background effect: ${enabled ? "Enabled" : "Disabled"} (${seasonTitle})`
                    : `背景特效当前状态：${enabled ? "开启" : "关闭"}（${seasonTitle}）`
                }
              >
                <span>{t("footer.bg_effect")}</span>
              </button>

              {/* 极简纯粹开关：清晰线框 + 内部高亮小方块 */}
              {mounted && (
                <button
                  type="button"
                  onClick={toggleEnabled}
                  className={`relative inline-flex h-3.5 w-6.5 items-center rounded-[2.5px] transition-colors duration-200 focus:outline-none cursor-pointer p-[1.5px] bg-transparent ${
                    enabled
                      ? "border border-[#f472b6] dark:border-[#f472b6]"
                      : "border border-neutral-400 dark:border-neutral-500"
                  }`}
                  title={
                    isEn
                      ? enabled
                        ? `Click to disable background effect (${seasonTitle})`
                        : "Click to enable background effect"
                      : enabled
                      ? `点击关闭背景特效（当前：${seasonTitle}）`
                      : "点击开启背景特效"
                  }
                  aria-label={
                    isEn
                      ? enabled ? "Disable background effect" : "Enable background effect"
                      : enabled ? "关闭背景特效" : "开启背景特效"
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
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}