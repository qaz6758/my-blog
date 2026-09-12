// src/components/home/HeroSection.tsx
// v3: stable paper paint + static typography + staged close
"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
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
        <ArrowUpRight 
          className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 group-hover:text-[#b91c1c] dark:group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" 
          style={{ transitionDuration: "var(--realm-motion-duration)", transitionTimingFunction: "var(--realm-motion-ease)" }}
        />
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

interface StackItemProps {
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

function StackItem({
  label,
  icon: Icon,
}: StackItemProps) {
  return (
    <span
      className="group/stack inline-flex items-center gap-1.5 whitespace-nowrap text-neutral-600 dark:text-[#918a80] hover:text-[#b91c1c] dark:hover:text-white transition-colors cursor-default"
      style={{ transitionDuration: "var(--realm-motion-duration)", transitionTimingFunction: "var(--realm-motion-ease)" }}
    >
      <Icon 
        className="h-[13px] w-[13px] shrink-0 opacity-60 group-hover/stack:opacity-100 transition-opacity" 
        style={{ transitionDuration: "var(--realm-motion-duration)", transitionTimingFunction: "var(--realm-motion-ease)" }}
      />
      <span className="font-serif tracking-wide text-[12.5px]">{label}</span>
    </span>
  );
}

interface StackRowProps {
  label: string;
  children: React.ReactNode;
}

function StackRow({ label, children }: StackRowProps) {
  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-x-3 sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-x-5">
      <span className="pt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400 dark:text-[#777168]">
        {label}
      </span>
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-[13px] leading-6 sm:text-[13.5px]">
        {children}
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

        {/* ===================== 1. 核心身份标题 ===================== */}
        <div className="text-center">
          <h1 className="text-[34px] font-semibold tracking-[-0.035em] text-neutral-900 dark:text-[#ece7df] select-none sm:text-[44px]">
            {name}
          </h1>
          <p className="mt-2.5 text-[13px] tracking-[0.12em] text-neutral-400 dark:text-[#777168] sm:mt-3 sm:text-[13.5px]">
            Developer · Music · Photography · Writing
          </p>
        </div>

        {/* ===================== 2. 古卷题签触发器：低存在感、短反馈、与卷轴动作连续 ===================== */}
        <motion.button
          type="button"
          onClick={handleToggle}
          whileTap={{ scale: 0.985 }}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className={`group relative mt-5 mb-2 flex min-h-9 items-center justify-center gap-2.5 px-2.5 sm:mt-6 sm:mb-2.5 sm:px-3 select-none outline-none ${
            isExpanded
              ? "text-neutral-700 dark:text-[#d6d0c7]"
              : "text-neutral-500 dark:text-[#918a80]"
          }`}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "收起画卷" : "展开画卷"}
        >
          {/* 题签引线：默认极淡，hover / 展开时才形成完整的小型构图 */}
          <motion.span
            aria-hidden="true"
            className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-neutral-300/0 transition-colors duration-300 group-hover:bg-neutral-300/80 dark:group-hover:bg-white/15"
            animate={{ scaleX: isExpanded ? 1 : 0.7, opacity: isExpanded ? 0.8 : 0.55 }}
            transition={{ duration: isExpanded ? 0.36 : 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "left center" }}
          />
          <motion.span
            aria-hidden="true"
            className="absolute right-0 top-1/2 h-px w-3 -translate-y-1/2 bg-neutral-300/0 transition-colors duration-300 group-hover:bg-neutral-300/80 dark:group-hover:bg-white/15"
            animate={{ scaleX: isExpanded ? 1 : 0.7, opacity: isExpanded ? 0.8 : 0.55 }}
            transition={{ duration: isExpanded ? 0.36 : 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "right center" }}
          />

          {/* 朱砂印记：从醒目的发光圆点降为真正的小印 */}
          <motion.span
            aria-hidden="true"
            className="relative z-10 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b91c1c] dark:bg-[#c7c2ba]"
            animate={{
              scale: isExpanded ? 0.88 : 1,
              opacity: isExpanded ? 0.8 : 0.9,
            }}
            whileHover={{ scale: 1.14 }}
            transition={{ duration: isExpanded ? 0.3 : 0.24, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* 题签文字：保留固定尺寸，只做极轻的纵向落位 */}
          <motion.span
            className="relative z-10 inline-flex h-6 min-w-[72px] items-center justify-center text-[12.5px] font-serif font-medium leading-none tracking-[0.2em] transition-colors duration-300 sm:text-[13.5px] group-hover:text-[#991b1b] dark:group-hover:text-white"
            animate={{ y: isExpanded ? -0.5 : 0 }}
            transition={{ duration: isExpanded ? 0.46 : 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {isExpanded ? "卷收 · 藏" : "展卷 · 阅"}
          </motion.span>

          {/* 箭头只作为方向提示，不再成为视觉主角 */}
          <motion.span
            className="relative z-10 flex h-4 w-4 shrink-0 items-center justify-center text-neutral-400 dark:text-neutral-500"
            animate={{
              y: isExpanded ? -0.5 : 0,
              rotate: isExpanded ? 180 : 0,
              opacity: isExpanded ? 0.82 : 0.68,
            }}
            whileHover={{ opacity: 1 }}
            transition={{
              duration: isExpanded ? 0.56 : 0.38,
              ease: isExpanded ? [0.25, 1, 0.35, 1] : [0.36, 0, 0.16, 1],
            }}
          >
            <ChevronDown className="h-3.5 w-3.5 stroke-[1.6]" />
          </motion.span>

          {/* 很轻的“印下”反馈，仅用于告诉用户点击已经发生 */}
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-3 top-1/2 h-7 -translate-y-1/2 rounded-full bg-[#b91c1c]/0 blur-md dark:bg-white/0"
            animate={{ opacity: isExpanded ? 0.06 : 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </motion.button>

        {/* ===================== 3. 仿古水墨画卷主体 (非对称自然物理缓动曲线：展卷从容舒展，收卷干净利落) ===================== */}
        <motion.div
          initial={false}
          animate={{
            height: isExpanded ? contentHeight : 0,
          }}
          transition={
            isExpanded
              ? {
                  height: { duration: 0.62, ease: [0.25, 1, 0.35, 1] },
                }
              : {
                  height: { duration: 0.48, delay: 0.08, ease: [0.36, 0, 0.16, 1] },
                }
          }
          className={`w-full relative overflow-hidden ${isExpanded ? "" : "pointer-events-none"}`}
          style={{ willChange: "height" }}
        >
          <div
            ref={contentRef}
            className="w-full py-4"
          >
            {/* 1. 顶端圆木天杆：始终保持固定在顶端 */}
            <AgedScrollRod type="top" />

            {/* 2. 画卷装裱画芯主体 */}
            <div className="relative w-full overflow-hidden scroll-canvas-bg border-x border-[#8c7150]/35 dark:border-white/[0.08] shadow-2xl rounded-[1px] [isolation:isolate]">
            {/* 内部画芯内容与浪客行海报背景 */}
            <div className="relative w-full py-9 sm:py-12 px-6 sm:px-11 text-left">
              {/* 图二海报背景 (武藏、金色旭日、红梅，全画幅覆盖) */}
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none [isolation:isolate]">
                {/* 亮色模式：复古新闻纸与版画质感 (正片叠底) */}
                <img
                  src="/images/vagabond-poster.webp"
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover object-center opacity-[0.24] sm:opacity-[0.28] dark:hidden mix-blend-multiply"
                />
                {/* 深色模式：夜色墨韵暗涌 (武藏、金色旭日与红梅) */}
                <img
                  src="/images/vagabond-poster.webp"
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover object-center hidden dark:block opacity-[0.16] sm:opacity-[0.20] brightness-90 contrast-110"
                />

                {/* 中心阅读防干扰柔光遮罩 (保证文字与代码徽章黄金易读性) */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#ede7dc]/90 via-[#ede7dc]/58 to-[#ede7dc]/90 dark:from-[#111213]/90 dark:via-[#111213]/62 dark:to-[#111213]/90 " />
              </div>

              {/* 正文内容 (黄金阅读尺寸，霞鹜文楷水墨风，行高与画卷舒展和谐) */}
              <motion.div
                initial={false}
                animate={{
                  opacity: isExpanded ? 1 : 0,
                }}
                transition={
                  isExpanded
                    ? {
                        opacity: { duration: 0.24, delay: 0.16, ease: [0.16, 1, 0.3, 1] },
                      }
                    : {
                        opacity: { duration: 0.18, ease: [0.25, 0.1, 0.25, 1] },
                      }
                }
                className="relative z-10 font-wenkai text-[16px] sm:text-[17px] leading-[2.0] sm:leading-[2.05] text-neutral-900 dark:text-[#eae5dc] space-y-6 sm:space-y-7 tracking-[0.025em]"
                style={{ willChange: "opacity" }}
              >
                {/* 第一句：极简身份宣言 */}
                <p>
                  嘿！我是{name}，一名热爱音乐以及网站开发的全栈初学者。
                </p>

                {/* 题跋 / 工具注记 */}
                <div className="my-8 border-y border-black/[0.07] py-5 font-sans tracking-normal dark:border-white/[0.08] sm:my-9 sm:py-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-neutral-400 dark:text-[#777168]">
                      Working notes
                    </span>
                    <span className="font-mono text-[10px] text-neutral-400 dark:text-[#6f685f]">
                      01 — 04
                    </span>
                  </div>

                  <div className="space-y-3">
                    <StackRow label="Working">
                      <StackItem icon={SiVercel} label="Vercel" />
                      <span className="text-neutral-300 dark:text-[#4a4640]">/</span>
                      <StackItem icon={SiCloudflare} label="Cloudflare" />
                    </StackRow>

                    <StackRow label="Tech stack">
                      <StackItem icon={SiReact} label="React 19" />
                      <StackItem icon={SiNextdotjs} label="Next.js 16" />
                      <StackItem icon={SiTypescript} label="TypeScript" />
                      <StackItem icon={SiTailwindcss} label="Tailwind v4" />
                    </StackRow>

                    <StackRow label="Backend& DB">
                      <StackItem icon={SiSupabase} label="Supabase" />
                      <StackItem icon={SiNotion} label="Notion API" />
                      <StackItem icon={SiCloudflare} label="Cloudflare R2" />
                    </StackRow>
                  </div>
                </div>

                {/* 段落 2: 思考与理念 */}
                <p>
                  在这个被快餐娱乐与既定准则裹挟的时代，对我而言失去分享欲是正常的，却也是危险的。人们总在谈论对抗荒诞、失衡与提线木偶般的外部世界，但真正漫长而频繁的，其实是与自我的交战——当思想变革过于剧烈，而实际能力尚未企及，所以难免产生无力与厌恶感。
                </p>

                {/* 段落 3: 态度与信念 */}
                <p>
                  但不必长久陷入痛苦。我选择在此留下自己能留下的一切，无论是逻辑的代码，还是感性的艺术。秉持着{" "}
                  <span className="relative mx-1 inline-block font-medium text-[#7f1d1d] dark:text-[#e7e2d8]">
                    “破碎重组，再破碎的循环，让自己成为自己”
                  </span>
                  的信念，持续打磨自己的开源项目与个人数字花园。
                </p>

                {/* 段落 4: 多维内容索引 */}
                <p>
                  除了代码构建，我也在旅途与日常中凝固光影，欢迎漫步我的{" "}
                  <TextLink href="/gallery">摄影画廊</TextLink>、聆听我的{" "}
                  <TextLink href="/playlist">精选歌单</TextLink>，或在{" "}
                  <TextLink href="/posts">博客文章</TextLink> 与{" "}
                  <TextLink href="/thoughts">随想录</TextLink> 里，读一读我近期的技术沉淀与内心注脚。
                </p>
              </motion.div>
            </div>
            </div>
          </div>

          {/* 3. 底端圆木地轴：紧贴画芯底边，收卷时真实由下向上滚动，直至与顶端天杆合拢 */}
          <AgedScrollRod type="bottom" />
        </motion.div>

        {/* ===================== 4. 联系方式 (自然平滑随画卷展开下移与回退) ===================== */}
        <div
          className="mt-1 flex w-full flex-col items-center space-y-2.5 pt-2 text-center select-none sm:pt-2.5"
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
              className="prose-link group inline-flex items-center gap-1 font-medium"
            >
              <SiGithub className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform" style={{ transitionDuration: "var(--realm-motion-duration)", transitionTimingFunction: "var(--realm-motion-ease)" }} />
              <span>GitHub</span>
            </a>

            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="prose-link group inline-flex items-center gap-1 font-medium"
            >
              <SiX className="h-3 w-3 sm:h-3.5 sm:w-3.5 group-hover:scale-110 transition-transform" style={{ transitionDuration: "var(--realm-motion-duration)", transitionTimingFunction: "var(--realm-motion-ease)" }} />
              <span>Twitter</span>
            </a>

            <a
              href="https://space.bilibili.com/520681544?spm_id_from=333.1007.0.0"
              target="_blank"
              rel="noopener noreferrer"
              className="prose-link group inline-flex items-center gap-1 font-medium"
            >
              <SiBilibili className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform" style={{ transitionDuration: "var(--realm-motion-duration)", transitionTimingFunction: "var(--realm-motion-ease)" }} />
              <span>Bilibili</span>
            </a>

            <a
              href="https://t.me"
              target="_blank"
              rel="noopener noreferrer"
              className="prose-link group inline-flex items-center gap-1 font-medium"
            >
              <SiTelegram className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform" style={{ transitionDuration: "var(--realm-motion-duration)", transitionTimingFunction: "var(--realm-motion-ease)" }} />
              <span>Telegram</span>
            </a>
          </div>

          {/* 邮箱行 */}
          <p className="pt-1 text-xs sm:text-[13px] text-neutral-500 dark:text-[#8c857b]">
            Or mail me at{" "}
            <a
              href="mailto:theyole114@outlook.com"
              className="font-mono text-neutral-800 hover:text-[#d97706] dark:text-[#a8a29e] dark:hover:text-white transition-colors duration-200"
            >
              theyole114@outlook.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}