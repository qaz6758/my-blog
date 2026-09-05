// src/components/home/HeroSection.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { siteConfig } from "@/config/site";
import {
  SiGithub,
  SiX,
  SiBilibili,
  SiTelegram,
  SiVercel,
  SiCloudflare,
  SiReact,
  SiNextdotjs,
  SiTypescript,
  SiTailwindcss,
  SiSupabase,
  SiNotion,
} from "@icons-pack/react-simple-icons";

interface TextLinkProps {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  className?: string;
}

export function TextLink({ href, children, external, className = "" }: TextLinkProps) {
  const isExternal = external ?? (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//"));

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`prose-link inline-flex items-center gap-0.5 group font-semibold text-neutral-900 dark:text-[#eae5dc] ${className}`}
      >
        <span>{children}</span>
        <ArrowUpRight className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 group-hover:text-[#0284c7] dark:group-hover:text-white dark:group-hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.4)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={`prose-link font-semibold text-neutral-900 dark:text-[#eae5dc] ${className}`}
    >
      {children}
    </Link>
  );
}

interface AgedScrollRodProps {
  type: "top" | "bottom";
}

function AgedScrollRod({ type }: AgedScrollRodProps) {
  const isBottom = type === "bottom";
  return (
    <div
      className={`relative z-20 flex items-center left-1/2 -translate-x-1/2 w-[calc(100%+36px)] sm:w-[calc(100%+52px)] select-none ${
        isBottom ? "-mt-1 drop-shadow-md" : "drop-shadow-sm"
      }`}
    >
      {/* 左轴头 (参考图一形制：外凸马蹄端盖 + 轴颈 + 套环) */}
      <div className="flex items-center shrink-0">
        <div
          className={`scroll-knob-cap-left ${
            isBottom ? "h-5 sm:h-6" : "h-4.5 sm:h-5"
          }`}
        />
        <div
          className={`scroll-knob-neck w-2.5 sm:w-3.5 ${
            isBottom ? "h-3.5 sm:h-4" : "h-3 sm:h-3.5"
          }`}
        />
        <div
          className={`scroll-knob-collar w-1 sm:w-1.5 ${
            isBottom ? "h-4.5 sm:h-5.5" : "h-4 sm:h-4.5"
          }`}
        />
      </div>

      {/* 圆木横杆/重杆本体 (年代陈旧感老檀木/老红木包浆) */}
      <div
        className={`scroll-rod-body rounded-[1px] ${
          isBottom ? "h-4 sm:h-[18px]" : "h-3.5 sm:h-4"
        }`}
      />

      {/* 右轴头 (参考图一形制：套环 + 轴颈 + 外凸马蹄端盖) */}
      <div className="flex items-center shrink-0">
        <div
          className={`scroll-knob-collar w-1 sm:w-1.5 ${
            isBottom ? "h-4.5 sm:h-5.5" : "h-4 sm:h-4.5"
          }`}
        />
        <div
          className={`scroll-knob-neck w-2.5 sm:w-3.5 ${
            isBottom ? "h-3.5 sm:h-4" : "h-3 sm:h-3.5"
          }`}
        />
        <div
          className={`scroll-knob-cap-right ${
            isBottom ? "h-5 sm:h-6" : "h-4.5 sm:h-5"
          }`}
        />
      </div>
    </div>
  );
}

export function HeroSection() {
  const { name } = siteConfig;
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  useEffect(() => {
    if (!contentRef.current) return;
    const updateHeight = () => {
      if (contentRef.current) {
        setContentHeight(contentRef.current.scrollHeight);
      }
    };
    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, []);

  const handleToggle = () => {
    if (isExpanded) {
      // 收起画卷时，若视口存在向下滚动，平滑回滚至顶部锚点，消除瞬态割裂感
      if (typeof window !== "undefined" && window.scrollY > 20) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
    setIsExpanded((prev) => !prev);
  };

  return (
    <div
      className="relative min-h-[100dvh] flex flex-col items-center overflow-hidden pt-16 sm:pt-[68px] pb-16 sm:pb-[68px]"
    >
      <main className="relative z-10 mx-auto w-full max-w-[690px] px-4 sm:px-8 flex flex-col items-center my-auto">
        {/* ===================== 0. 居中圆形头像 (对标图一结构，微动效与水墨包边) ===================== */}
        <motion.div
          whileHover={{ scale: 1.05, rotate: 1.5 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 380, damping: 24 }}
          className="mb-5 sm:mb-6 select-none cursor-pointer"
        >
          <div className="relative h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-full border-2 border-black/[0.08] dark:border-white/20 bg-neutral-100 dark:bg-[#1c1917] shadow-sm hover:shadow-md dark:shadow-black/40 transition-shadow duration-300">
            <img
              src="/avatar.jpg"
              alt={name}
              className="h-full w-full object-cover"
            />
          </div>
        </motion.div>

        {/* ===================== 1. 核心居中大标题 (典雅沉稳) ===================== */}
        <h1 className="text-[34px] sm:text-[44px] font-bold tracking-tight text-neutral-900 dark:text-[#ededed] select-none text-center">
          {name}
        </h1>

        {/* ===================== 2. 大标题下方仿古展卷交互钮 (双界交错：日间狂客赤印，夜间澄澈月石) ===================== */}
        <button
          type="button"
          onClick={handleToggle}
          className="group mt-4 mb-2 sm:mt-5 sm:mb-2.5 inline-flex items-center gap-2.5 px-3 py-1.5 text-neutral-500 hover:text-neutral-900 dark:text-[#a8a29e] dark:hover:text-white transition-colors duration-200 cursor-pointer select-none bg-transparent border-none focus:outline-none"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "收起画卷" : "展开画卷"}
        >
          {/* 微印 (日间：狂客朱砂鲜亮跳动；夜间：温润清冷月白微珠) */}
          <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626] dark:bg-[#d6d3d1] group-hover:scale-125 group-hover:shadow-[0_0_8px_rgba(220,38,38,0.7)] dark:group-hover:shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all duration-300 shrink-0" />

          {/* 古风题签微字 (定高定宽居中，彻底锁定文字布局基准，消除任何字形与行高跳动) */}
          <span className="inline-flex items-center justify-center h-6 min-w-[72px] text-[13px] sm:text-[14px] tracking-[0.22em] font-serif font-medium leading-none group-hover:text-[#dc2626] dark:group-hover:text-white dark:group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-colors duration-200">
            {isExpanded ? "卷收 · 藏" : "展卷 · 阅"}
          </span>

          {/* 灵动下折箭头 (精确同步卷轴非对称开合时长与曲线，杜绝旋转与展开割裂脱节) */}
          <div className="w-4 h-4 flex items-center justify-center text-neutral-400 group-hover:text-[#dc2626] dark:text-neutral-500 dark:group-hover:text-white group-hover:translate-y-0.5 transition-colors duration-200 shrink-0">
            <ChevronDown
              className="h-4 w-4 stroke-[1.8] transition-transform"
              style={{
                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                transitionDuration: isExpanded ? "600ms" : "420ms",
                transitionTimingFunction: isExpanded
                  ? "cubic-bezier(0.25, 1, 0.35, 1)"
                  : "cubic-bezier(0.36, 0, 0.16, 1)",
              }}
            />
          </div>
        </button>

        {/* ===================== 3. 仿古水墨画卷主体 (非对称自然物理缓动曲线：展卷从容舒展，收卷干净利落) ===================== */}
        <motion.div
          initial={false}
          animate={{
            height: isExpanded ? contentHeight : 0,
          }}
          transition={
            isExpanded
              ? {
                  height: { duration: 0.6, ease: [0.25, 1, 0.35, 1] },
                }
              : {
                  height: { duration: 0.42, ease: [0.36, 0, 0.16, 1] },
                }
          }
          className={`w-full relative overflow-hidden ${isExpanded ? "" : "pointer-events-none"}`}
          style={{ willChange: "height" }}
        >
          <motion.div
            ref={contentRef}
            initial={false}
            animate={{
              opacity: isExpanded ? 1 : 0,
              y: isExpanded ? 0 : -14,
            }}
            transition={
              isExpanded
                ? {
                    opacity: { duration: 0.48, ease: [0.25, 1, 0.35, 1], delay: 0.05 },
                    y: { duration: 0.58, ease: [0.25, 1, 0.35, 1] },
                  }
                : {
                    opacity: { duration: 0.22, ease: "easeIn" },
                    y: { duration: 0.38, ease: [0.36, 0, 0.16, 1] },
                  }
            }
            className="w-full py-4"
          >
            {/* 1. 顶端圆木天杆：始终保持固定在顶端 */}
            <AgedScrollRod type="top" />

            {/* 2. 画卷装裱画芯主体 */}
            <div className="relative w-full overflow-hidden scroll-canvas-bg border-x border-[#8c7150]/35 dark:border-white/[0.08] shadow-2xl rounded-[1px]">
            {/* 内部画芯内容与浪客行海报背景 */}
            <div className="relative w-full py-9 sm:py-12 px-6 sm:px-11 text-left">
              {/* 图二海报背景 (武藏、金色旭日、红梅，全画幅覆盖) */}
              <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
                {/* 亮色模式：复古新闻纸与版画质感 (正片叠底) */}
                <img
                  src="/images/vagabond-poster.webp"
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover object-center opacity-[0.32] sm:opacity-[0.36] dark:hidden mix-blend-multiply transition-opacity duration-500"
                />
                {/* 深色模式：夜色墨韵暗涌 (武藏、金色旭日与红梅) */}
                <img
                  src="/images/vagabond-poster.webp"
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover object-center hidden dark:block opacity-[0.22] sm:opacity-[0.26] brightness-90 contrast-115 transition-opacity duration-500"
                />

                {/* 中心阅读防干扰柔光遮罩 (保证文字与代码徽章黄金易读性) */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#ede7dc]/80 via-[#ede7dc]/55 to-[#ede7dc]/80 dark:from-[#181614]/85 dark:via-[#181614]/60 dark:to-[#181614]/85 backdrop-blur-[0.3px]" />
              </div>

              {/* 正文内容 (黄金阅读尺寸，霞鹜文楷水墨风，行高与画卷舒展和谐) */}
              <div className="relative z-10 font-wenkai text-[16px] sm:text-[17px] leading-[2.0] sm:leading-[2.05] text-neutral-900 dark:text-[#eae5dc] space-y-6 sm:space-y-7 tracking-[0.025em]">
                {/* 第一句：极简身份宣言 */}
                <p>
                  嘿！我是{name}，一名热爱音乐以及网站开发的全栈初学者。
                </p>

                {/* 🌟 官方标准 SVG 图标 + 页面原字体排版 (保持技术栈标签清晰工整) */}
                <div className="my-7 sm:my-8 space-y-3 font-sans text-[13.5px] sm:text-[14px] leading-relaxed select-none tracking-normal">
                  {/* Focus on */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-neutral-500 dark:text-[#8c857b] w-26 shrink-0">Working with</span>
                    <span className="inline-flex items-center gap-1.5 text-neutral-900 dark:text-[#d6d3d1] hover:text-[#dc2626] dark:hover:text-white transition-colors duration-200 cursor-default">
                      <SiVercel className="h-3.5 w-3.5 dark:opacity-80" />
                      <span>Vercel</span>
                    </span>
                    <span className="text-neutral-400 dark:text-[#57534e]">/</span>
                    <span className="inline-flex items-center gap-1.5 text-neutral-900 dark:text-[#d6d3d1] hover:text-[#dc2626] dark:hover:text-white transition-colors duration-200 cursor-default">
                      <SiCloudflare className="h-3.5 w-3.5 text-[#F38020] dark:grayscale dark:contrast-125 dark:opacity-75 dark:hover:grayscale-0 dark:hover:opacity-100 transition-all duration-200" />
                      <span>Cloudflare</span>
                    </span>
                  </div>

                  {/* Tech Stack */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    <span className="text-neutral-500 dark:text-[#8c857b] w-26 shrink-0">Tech Stack</span>
                    <span className="inline-flex items-center gap-1.5 text-neutral-900 dark:text-[#d6d3d1] hover:text-[#0284c7] dark:hover:text-white transition-colors duration-200 cursor-default">
                      <SiReact className="h-3.5 w-3.5 text-[#61DAFB] dark:grayscale dark:contrast-125 dark:opacity-75 dark:hover:grayscale-0 dark:hover:opacity-100 transition-all duration-200" />
                      <span>React 19</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-neutral-900 dark:text-[#d6d3d1] hover:text-[#dc2626] dark:hover:text-white transition-colors duration-200 cursor-default">
                      <SiNextdotjs className="h-3.5 w-3.5 dark:opacity-80" />
                      <span>Next.js 16</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-neutral-900 dark:text-[#d6d3d1] hover:text-[#0284c7] dark:hover:text-white transition-colors duration-200 cursor-default">
                      <SiTypescript className="h-3.5 w-3.5 text-[#3178C6] dark:grayscale dark:contrast-125 dark:opacity-75 dark:hover:grayscale-0 dark:hover:opacity-100 transition-all duration-200" />
                      <span>TypeScript</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-neutral-900 dark:text-[#d6d3d1] hover:text-[#0284c7] dark:hover:text-white transition-colors duration-200 cursor-default">
                      <SiTailwindcss className="h-3.5 w-3.5 text-[#06B6D4] dark:grayscale dark:contrast-125 dark:opacity-75 dark:hover:grayscale-0 dark:hover:opacity-100 transition-all duration-200" />
                      <span>Tailwind v4</span>
                    </span>
                  </div>

                  {/* Infrastructure */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    <span className="text-neutral-500 dark:text-[#8c857b] w-26 shrink-0">Backend</span>
                    <span className="inline-flex items-center gap-1.5 text-neutral-900 dark:text-[#d6d3d1] hover:text-[#059669] dark:hover:text-white transition-colors duration-200 cursor-default">
                      <SiSupabase className="h-3.5 w-3.5 text-[#3ECF8E] dark:grayscale dark:contrast-125 dark:opacity-75 dark:hover:grayscale-0 dark:hover:opacity-100 transition-all duration-200" />
                      <span>Supabase</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-neutral-900 dark:text-[#d6d3d1] hover:text-[#dc2626] dark:hover:text-white transition-colors duration-200 cursor-default">
                      <SiNotion className="h-3.5 w-3.5 dark:opacity-80" />
                      <span>Notion API</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-neutral-900 dark:text-[#d6d3d1] hover:text-[#F38020] dark:hover:text-white transition-colors duration-200 cursor-default">
                      <SiCloudflare className="h-3.5 w-3.5 text-[#F38020] dark:grayscale dark:contrast-125 dark:opacity-75 dark:hover:grayscale-0 dark:hover:opacity-100 transition-all duration-200" />
                      <span>Cloudflare R2</span>
                    </span>
                  </div>
                </div>

                {/* 段落 2: 思考与理念 */}
                <p>
                  在这个被快餐娱乐与既定准则裹挟的时代，对我而言失去分享欲是正常的，却也是危险的。人们总在谈论对抗荒诞、失衡与提线木偶般的外部世界，但真正漫长而频繁的，其实是与自我的交战——当思想变革过于剧烈，而实际能力尚未企及，所以难免产生无力与厌恶感。
                </p>

                {/* 段落 3: 态度与信念 */}
                <p>
                  但不必长久陷入痛苦。我选择在此留下自己能留下的一切，无论是逻辑的代码，还是感性的艺术。秉持着{" "}
                  “破碎重组，再破碎的循环，让自己成为自己” 的信念，持续打磨自己的开源项目与个人数字花园。
                </p>

                {/* 段落 4: 多维内容索引 */}
                <p>
                  除了代码构建，我也在旅途与日常中凝固光影，欢迎漫步我的{" "}
                  <TextLink href="/gallery">摄影画廊</TextLink>、聆听我的{" "}
                  <TextLink href="/playlist">精选歌单</TextLink>，或在{" "}
                  <TextLink href="/posts">博客文章</TextLink> 与{" "}
                  <TextLink href="/thoughts">随想录</TextLink> 里，读一读我近期的技术沉淀与内心注脚。
                </p>
              </div>
            </div>
          </div>

          {/* 3. 底端圆木地轴：紧贴画芯底边，收卷时真实由下向上滚动，直至与顶端天杆合拢 */}
          <AgedScrollRod type="bottom" />
        </motion.div>
      </motion.div>

        {/* ===================== 4. 联系方式 (自然平滑随画卷展开下移与回退) ===================== */}
        <div
          className="w-full flex flex-col items-center text-center space-y-2.5 pt-1 sm:pt-1.5 select-none"
        >
          {/* 居中极简题跋标签 */}
          <div className="flex items-center gap-2 text-neutral-400 dark:text-neutral-500 text-xs sm:text-[13px]">
            <span className="w-5 h-[1px] bg-neutral-300 dark:bg-neutral-700" />
            <span>Find me on</span>
            <span className="w-5 h-[1px] bg-neutral-300 dark:bg-neutral-700" />
          </div>

          {/* 社交链接 (GitHub, Twitter, B站, Telegram) */}
          <div className="flex flex-wrap items-center justify-center gap-x-2.5 sm:gap-x-4 gap-y-2 text-[13px] sm:text-[15px]">
            <a
              href="https://github.com/qaz6758"
              target="_blank"
              rel="noopener noreferrer"
              className="prose-link group inline-flex items-center gap-1 font-medium text-neutral-900 dark:text-[#a8a29e] hover:!text-[#0891b2] dark:hover:!text-white hover:!border-b-[#0891b2] dark:hover:!border-b-white cursor-pointer select-none transition-all duration-200"
            >
              <SiGithub className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:scale-110 dark:group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all duration-200" />
              <span>GitHub</span>
            </a>

            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="prose-link group inline-flex items-center gap-1 font-medium text-neutral-900 dark:text-[#a8a29e] hover:!text-[#dc2626] dark:hover:!text-white hover:!border-b-[#dc2626] dark:hover:!border-b-white cursor-pointer select-none transition-all duration-200"
            >
              <SiX className="h-3 w-3 sm:h-3.5 sm:w-3.5 group-hover:scale-110 dark:group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all duration-200" />
              <span>Twitter</span>
            </a>

            <a
              href="https://space.bilibili.com/520681544?spm_id_from=333.1007.0.0"
              target="_blank"
              rel="noopener noreferrer"
              className="prose-link group inline-flex items-center gap-1 font-medium text-neutral-900 dark:text-[#a8a29e] hover:!text-[#0284c7] dark:hover:text-white hover:!border-b-[#0284c7] dark:hover:!border-b-white cursor-pointer select-none transition-all duration-200"
            >
              <SiBilibili className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:scale-110 dark:group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all duration-200" />
              <span>哔哩哔哩</span>
            </a>

            <a
              href="https://t.me"
              target="_blank"
              rel="noopener noreferrer"
              className="prose-link group inline-flex items-center gap-1 font-medium text-neutral-900 dark:text-[#a8a29e] hover:!text-[#0891b2] dark:hover:!text-white hover:!border-b-[#0891b2] dark:hover:!border-b-white cursor-pointer select-none transition-all duration-200"
            >
              <SiTelegram className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:scale-110 dark:group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all duration-200" />
              <span>Telegram</span>
            </a>
          </div>

          {/* 邮箱行 */}
          <p className="pt-1 text-xs sm:text-[13px] text-neutral-500 dark:text-[#8c857b]">
            Or mail me at{" "}
            <a
              href="mailto:theyole114@outlook.com"
              className="font-mono text-neutral-800 hover:text-[#d97706] dark:text-[#a8a29e] dark:hover:text-white dark:hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-all duration-200"
            >
              theyole114@outlook.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}