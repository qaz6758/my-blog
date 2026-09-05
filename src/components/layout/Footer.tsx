// src/components/layout/Footer.tsx
"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { siteConfig } from "@/config/site";
import { useSeasonalEffect } from "@/hooks/useSeasonalEffect";
import { InkMountainBackground } from "./InkMountainBackground";

export function Footer() {
  const { mounted, enabled, activeSeason, toggleEnabled } = useSeasonalEffect();

  // 当前季节标签（随自然节气自动流转，无需手动下拉）
const SEASON_MAP = {
  spring: "春樱漫舞",
  summer: "夏夜流萤",
  autumn: "秋枫飘落",
  winter: "静谧初雪",
} as const;
const seasonTitle = SEASON_MAP[activeSeason] || "静谧初雪";

  return (
    <footer className="relative w-full select-none overflow-hidden bg-[#ede7dc] dark:bg-[#181614] text-neutral-600 dark:text-neutral-400 transition-colors duration-300 mt-auto">
      {/* 顶部分割线：极淡水墨虚化化境线，无硬切缝隙 */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-black/[0.04] dark:via-white/[0.04] to-transparent pointer-events-none z-10" />

      {/* 画卷全景背景 */}
      <InkMountainBackground />

      {/* 内容层：预留上方苍穹与巍峨远峰，文字如古典题跋置于云谷之间 */}
      <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pt-12 pb-10 sm:px-8 sm:pt-36 sm:pb-12">
        {/* ===================== 上半部分：品牌大字 + 3列导航 (融合浪客行/混沌武士主题) ===================== */}
                {/* ===================== 上半部分：品牌大字 + 3列导航 ===================== */}
        <div className="flex flex-col sm:flex-row items-start justify-start sm:justify-center gap-10 sm:gap-16 md:gap-24">
          {/* 左侧：品牌名、名言宣言（手机端靠左，电脑端保持左齐） */}
          <div className="flex flex-col items-start text-left space-y-3 max-w-sm">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {siteConfig.name}
            </h2>
            {/* 水墨引用块（mx-0 贴左，取消手机端居中） */}
            <blockquote className="my-1 mx-0 w-fit border-l-2 border-neutral-500 dark:border-neutral-300 bg-black/[0.04] dark:bg-white/[0.07] pl-3 pr-3 py-1 text-[12.5px] sm:text-xs font-medium text-neutral-800 dark:text-white dark:drop-shadow-[0_0_6px_rgba(255,255,255,0.15)] leading-relaxed font-sans rounded-r-sm select-text">
              破碎重组，再破碎的循环，让自己成为自己。
            </blockquote>
            <div className="pt-0.5 text-xs leading-relaxed text-neutral-600 dark:text-[#b8b2a8] font-sans">
              <p>© 2026 - Present Powered by Next.js & React</p>
            </div>
          </div>
          {/* 3列导航链接（手机端靠左，电脑端保持居中） */}
          <div className="flex items-start justify-start sm:justify-center gap-8 sm:gap-10 md:gap-14 text-left shrink-0">
            {/* 第 1 列：关于 */}
            <div className="space-y-3">
              <h3 className="text-[13.5px] sm:text-sm font-semibold text-neutral-900 dark:text-white tracking-wide dark:drop-shadow-[0_0_6px_rgba(255,255,255,0.2)]">
                关于
              </h3>
              <ul className="space-y-2 text-[13px] sm:text-sm font-medium">
                <li>
                  <Link
                    href="/"
                    className="text-neutral-700 hover:text-neutral-950 dark:text-[#f3f0ea] dark:hover:text-white dark:[text-shadow:_0_1px_4px_rgba(0,0,0,0.9)] hover:underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-600 transition-all duration-200"
                  >
                    关于本站
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/qaz6758"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-700 hover:text-neutral-950 dark:text-[#f3f0ea] dark:hover:text-white dark:[text-shadow:_0_1px_4px_rgba(0,0,0,0.9)] hover:underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-600 transition-all duration-200"
                  >
                    关于我
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/qaz6758/my-blog"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-0.5 text-neutral-700 hover:text-neutral-950 dark:text-[#f3f0ea] dark:hover:text-white dark:[text-shadow:_0_1px_4px_rgba(0,0,0,0.9)] transition-all duration-200"
                  >
                    <span className="hover:underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-600">关于此项目</span>
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-75 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-neutral-500 dark:text-neutral-300 group-hover:text-neutral-950 dark:group-hover:text-white transition-all shrink-0" />
                  </a>
                </li>
              </ul>
            </div>

            {/* 第 2 列：更多 */}
            <div className="space-y-3">
              <h3 className="text-[13.5px] sm:text-sm font-semibold text-neutral-900 dark:text-white tracking-wide dark:drop-shadow-[0_0_6px_rgba(255,255,255,0.2)]">
                更多
              </h3>
              <ul className="space-y-2 text-[13px] sm:text-sm font-medium">
                <li>
                  <Link
                    href="/gallery"
                    className="text-neutral-700 hover:text-neutral-950 dark:text-[#f3f0ea] dark:hover:text-white dark:[text-shadow:_0_1px_4px_rgba(0,0,0,0.9)] hover:underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-600 transition-all duration-200"
                  >
                    摄影画廊
                  </Link>
                </li>
                <li>
                  <Link
                    href="/playlist"
                    className="text-neutral-700 hover:text-neutral-950 dark:text-[#f3f0ea] dark:hover:text-white dark:[text-shadow:_0_1px_4px_rgba(0,0,0,0.9)] hover:underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-600 transition-all duration-200"
                  >
                    精选歌单
                  </Link>
                </li>
                <li>
                  <Link
                    href="/thoughts"
                    className="text-neutral-700 hover:text-neutral-950 dark:text-[#f3f0ea] dark:hover:text-white dark:[text-shadow:_0_1px_4px_rgba(0,0,0,0.9)] hover:underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-600 transition-all duration-200"
                  >
                    随想录
                  </Link>
                </li>
              </ul>
            </div>

            {/* 第 3 列：联系 */}
            <div className="space-y-3">
              <h3 className="text-[13.5px] sm:text-sm font-semibold text-neutral-900 dark:text-white tracking-wide dark:drop-shadow-[0_0_6px_rgba(255,255,255,0.2)]">
                联系
              </h3>
              <ul className="space-y-2 text-[13px] sm:text-sm font-medium">
                <li>
                  <Link
                    href="/posts"
                    className="text-neutral-700 hover:text-neutral-950 dark:text-[#f3f0ea] dark:hover:text-white dark:[text-shadow:_0_1px_4px_rgba(0,0,0,0.9)] hover:underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-600 transition-all duration-200"
                  >
                    写留言
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:theyole114@outlook.com"
                    className="group inline-flex items-center gap-0.5 text-neutral-700 hover:text-neutral-950 dark:text-[#f3f0ea] dark:hover:text-white dark:[text-shadow:_0_1px_4px_rgba(0,0,0,0.9)] transition-all duration-200"
                  >
                    <span className="hover:underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-600">发邮件</span>
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
                    <span className="hover:underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-600">GitHub</span>
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-75 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-neutral-500 dark:text-neutral-300 group-hover:text-neutral-950 dark:group-hover:text-white transition-all shrink-0" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ===================== 下半部分：次级工具条 (高对比度清晰化优化) ===================== */}
        <div className="mt-10 sm:mt-12 pt-5 sm:pt-6 border-t border-black/[0.08] dark:border-white/10 flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-8 gap-y-3 text-[12.5px] sm:text-xs font-medium text-neutral-700 dark:text-[#e7e5e4]">
          {/* 左侧条目：RSS 订阅 · 站点地图 · 订阅 | 简体中文 | 背景效果开关 */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex items-center">
              <a
                href="/api/rss"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-700 hover:text-neutral-950 dark:text-[#e7e5e4] dark:hover:text-white transition-colors duration-200 dark:[text-shadow:_0_1px_3px_rgba(0,0,0,0.8)]"
              >
                RSS 订阅
              </a>
              <span className="mx-1.5 text-neutral-400 dark:text-neutral-500 select-none">·</span>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-700 hover:text-neutral-950 dark:text-[#e7e5e4] dark:hover:text-white transition-colors duration-200 dark:[text-shadow:_0_1px_3px_rgba(0,0,0,0.8)]"
              >
                站点地图
              </a>
            </div>

            {/* 竖向细分隔线 */}
            <span className="text-neutral-400 dark:text-neutral-500 select-none font-normal">
              |
            </span>

            {/* 语言指示器 */}
            <div className="inline-flex items-center gap-1.5 cursor-default text-neutral-700 dark:text-[#e7e5e4] hover:text-neutral-950 dark:hover:text-white transition-colors duration-200 dark:[text-shadow:_0_1px_3px_rgba(0,0,0,0.8)]">
              <span className="text-[10px] font-serif border border-neutral-400 dark:border-neutral-500 px-1 py-0.2 rounded-xs leading-none bg-black/[0.03] dark:bg-white/[0.08] text-neutral-800 dark:text-neutral-200">
                文
              </span>
              <span>简体中文</span>
              <ChevronDown className="h-3 w-3 opacity-75" />
            </div>

            {/* 竖向细分隔线 */}
            <span className="text-neutral-400 dark:text-neutral-500 select-none font-normal">
              |
            </span>

            {/* 背景效果控制 */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleEnabled}
                className="cursor-pointer select-none text-neutral-700 hover:text-neutral-950 dark:text-[#e7e5e4] dark:hover:text-white transition-colors duration-200 focus:outline-none dark:[text-shadow:_0_1px_3px_rgba(0,0,0,0.8)]"
                title={`背景特效当前状态：${enabled ? "开启" : "关闭"}（${seasonTitle}）`}
              >
                <span>背景效果</span>
              </button>

              {/* 图二同款极简纯粹开关：清晰线框 + 内部高亮小方块 */}
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
                    enabled
                      ? `点击关闭背景特效（当前：${seasonTitle}）`
                      : "点击开启背景特效"
                  }
                  aria-label={enabled ? "关闭背景特效" : "开启背景特效"}
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

          {/* 右侧：严格去除备案信息，保持纯净留白 */}
          <div />
        </div>
      </div>
    </footer>
  );
}