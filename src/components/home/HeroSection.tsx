// src/components/home/HeroSection.tsx
// Scheme A: Natural Fluid Narrative (Editorial Flow · Pure Text Oriental Aesthetic)
"use client";

import React from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { siteConfig } from "@/config/site";

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
        className={`group inline-flex items-center gap-0.5 font-medium text-neutral-900 dark:text-[#eae5dc] hover:text-[#7f1d1d] dark:hover:text-white underline underline-offset-4 decoration-black/25 dark:decoration-white/25 hover:decoration-[#7f1d1d] transition-colors ${className}`}
      >
        <span>{children}</span>
        <span className="text-[10px] opacity-60 font-mono group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">
          ↗
        </span>
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={`font-medium text-neutral-900 dark:text-[#eae5dc] hover:text-[#7f1d1d] dark:hover:text-white underline underline-offset-4 decoration-black/25 dark:decoration-white/25 hover:decoration-[#7f1d1d] transition-colors ${className}`}
    >
      {children}
    </Link>
  );
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] },
  },
};

export function HeroSection() {
  const { name } = siteConfig;

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden pt-32 sm:pt-40 pb-12 sm:pb-16 px-4 sm:px-6">
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto w-full max-w-[640px] flex flex-col items-center my-auto"
      >
        {/* ===================== 1. 居中圆形头像 ===================== */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.04, rotate: 1.2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 380, damping: 24 }}
          className="mb-5 sm:mb-6 select-none cursor-pointer"
        >
          <div className="relative h-20 w-20 sm:h-22 sm:w-22 overflow-hidden rounded-full border border-black/10 dark:border-white/15 bg-neutral-100 dark:bg-[#1c1917] shadow-sm hover:shadow-md transition-shadow duration-300">
            <img
              src="/avatar.jpg"
              alt={name}
              className="h-full w-full object-cover"
            />
          </div>
        </motion.div>

        {/* ===================== 2. 核心身份标题 ===================== */}
        <motion.div variants={itemVariants} className="text-center mb-6 sm:mb-8">
          <h1 className="text-[34px] sm:text-[44px] font-semibold tracking-[-0.035em] text-neutral-900 dark:text-[#ece7df] select-none font-serif">
            {name}
          </h1>
        </motion.div>

        {/* ===================== 3. 自然流体文学正文 (纯粹文心 · 宣纸留白) ===================== */}
        <div className="w-full space-y-6 text-neutral-900 dark:text-[#eae5dc]">
          {/* 第一段：身份白描 */}
          <motion.p
            variants={itemVariants}
            className="font-wenkai text-[15.5px] sm:text-[16.5px] leading-[2.05] tracking-[0.025em] text-justify"
          >
            嘿！我是 {name}，一名热爱音乐以及网站开发的全栈初学者。
          </motion.p>

          {/* 第二段：内省与对抗 */}
          <motion.p
            variants={itemVariants}
            className="font-wenkai text-[15.5px] sm:text-[16.5px] leading-[2.05] tracking-[0.025em] text-justify"
          >
            在这个被快餐娱乐与既定准则裹挟的时代，对我而言失去分享欲是正常的，却也是危险的。人们总在谈论对抗荒诞、失衡与提线木偶般的外部世界，但真正漫长而频繁的，其实是与自我的交战——当思想变革过于剧烈，而实际能力尚未企及，所以难免产生无力与厌恶感。
          </motion.p>

          {/* 第三段：信念宣言 */}
          <motion.p
            variants={itemVariants}
            className="font-wenkai text-[15.5px] sm:text-[16.5px] leading-[2.05] tracking-[0.025em] text-justify"
          >
            但不必长久陷入痛苦。我选择在此留下自己能留下的一切，无论是逻辑的代码，还是感性的艺术。秉持着{" "}
            <span className="font-medium text-[#7f1d1d] dark:text-[#e7e2d8]">
              “破碎重组，再破碎的循环，让自己成为自己”
            </span>{" "}
            的信念，持续打磨自己的开源项目与个人数字花园。
          </motion.p>

          {/* 第四段：多维通路引言 */}
          <motion.p
            variants={itemVariants}
            className="font-wenkai text-[15.5px] sm:text-[16.5px] leading-[2.05] tracking-[0.025em] text-justify"
          >
            除了代码构建，我也在旅途与日常中凝固光影，欢迎漫步我的{" "}
            <TextLink href="/gallery">摄影画廊</TextLink>、聆听我的{" "}
            <TextLink href="/playlist">精选歌单</TextLink>，或在{" "}
            <TextLink href="/posts">博客文章</TextLink> 与{" "}
            <TextLink href="/thoughts">随想录</TextLink> 里，读一读我近期的技术沉淀与内心注脚。
          </motion.p>
        </div>

        {/* ===================== 4. 底部联络与社交 (纯文字水墨风格 · 零多余图标) ===================== */}
        <motion.div
          variants={itemVariants}
          className="mt-10 sm:mt-12 flex w-full flex-col items-center space-y-2.5 pt-2 text-center select-none"
        >
          <div className="flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5 text-[13px] sm:text-[14px] font-serif">
            <a
              href="https://github.com/qaz6758"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-600 dark:text-[#9c958a] hover:text-[#7f1d1d] dark:hover:text-[#ede7dc] transition-colors"
            >
              GitHub ↗
            </a>
            <span className="text-neutral-300 dark:text-neutral-700 select-none">·</span>
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-600 dark:text-[#9c958a] hover:text-[#7f1d1d] dark:hover:text-[#ede7dc] transition-colors"
            >
              Twitter ↗
            </a>
            <span className="text-neutral-300 dark:text-neutral-700 select-none">·</span>
            <a
              href="https://space.bilibili.com/520681544?spm_id_from=333.1007.0.0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-600 dark:text-[#9c958a] hover:text-[#7f1d1d] dark:hover:text-[#ede7dc] transition-colors"
            >
              Bilibili ↗
            </a>
            <span className="text-neutral-300 dark:text-neutral-700 select-none">·</span>
            <a
              href="https://t.me"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-600 dark:text-[#9c958a] hover:text-[#7f1d1d] dark:hover:text-[#ede7dc] transition-colors"
            >
              Telegram ↗
            </a>
          </div>

          {/* 邮箱 */}
          <p className="pt-0.5 text-xs text-neutral-400 dark:text-[#777168]">
            Or mail me at{" "}
            <a
              href="mailto:theyole114@outlook.com"
              className="font-mono text-neutral-600 dark:text-[#9c958a] hover:text-[#7f1d1d] dark:hover:text-[#ede7dc] underline underline-offset-2 transition-colors"
            >
              theyole114@outlook.com
            </a>
          </p>
        </motion.div>
      </motion.main>
    </div>
  );
}