// src/components/home/HeroSection.tsx
"use client";

import React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import {
  SiGithub,
  SiX,
  SiBilibili,
  SiTelegram,
} from "@icons-pack/react-simple-icons";

// 统一文本链接组件（高对比度实体下划线）
function TextLink({
  href,
  children,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const className =
    "font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-400/80 dark:border-neutral-500 hover:border-neutral-900 dark:hover:border-white pb-[1px] transition-colors";

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function HeroSection() {
  const { name } = siteConfig;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <main
        className="
          relative z-10 mx-auto w-full max-w-[650px]
          px-6 pt-20 pb-8 sm:pt-24 sm:pb-10
          text-[15px] sm:text-[15.5px] leading-[1.85]
          text-neutral-600 dark:text-[#a1a1aa]
        "
      >
        {/* 大标题 */}
        <h1 className="mb-8 text-[36px] sm:text-[40px] font-bold tracking-[-0.035em] text-neutral-900 dark:text-white">
          {name}
        </h1>

        {/* 段落 1: 自我介绍 */}
        <p className="mb-6">
          嗨，我是{" "}
          <strong className="font-semibold text-neutral-900 dark:text-white">
            {name}
          </strong>
          。一名全栈开发者，也是在数字荒野中对抗与修剪自我的手艺人。
        </p>

        {/* 段落 2: 思考与自省 */}
        <p className="mb-6">
          在这个被快餐娱乐与既定准则裹挟的时代，对我而言失去分享欲是正常的，却也是危险的。人们总在谈论对抗荒诞、失衡与提线木偶般的外部世界，但真正漫长而频繁的，其实是与自我的交战——当思想变革过于剧烈，而实际能力尚未企及，难免产生无力与厌恶。
        </p>

        {/* 段落 3: 态度与选择 */}
        <p className="mb-6">
          但不必长久陷入痛苦。我选择在此留下自己能留下的一切，无论是逻辑的代码，还是感性的艺术。
        </p>

        {/* 段落 4: 信念与技术探索 */}
        <p className="mb-6">
          秉持着{" "}
          <strong className="font-semibold text-neutral-900 dark:text-white">
            “破碎重组，再破碎的循环，让自己成为自己”
          </strong>{" "}
          的信念，我在这里深入探索{" "}
          <TextLink href="https://react.dev" external>
            React
          </TextLink>
          、
          <TextLink href="https://nextjs.org" external>
            Next.js
          </TextLink>
          、
          <TextLink href="https://www.typescriptlang.org" external>
            TypeScript
          </TextLink>{" "}
          等全栈现代 Web 技术，持续打磨有温度的{" "}
          <TextLink href="https://github.com/qaz6758" external>
            开源项目
          </TextLink>{" "}
          与个人工具。
        </p>

        {/* 段落 5: 摄影、博客与思考 */}
        <p className="mb-8">
          每一个新的阶段，都是在理解新的作品、寻找新的共鸣。除了代码构建，我也在旅途与日常中凝固光影，欢迎漫步我的{" "}
          <TextLink href="/gallery">摄影画廊</TextLink>，或在{" "}
          <TextLink href="/posts">博客文章</TextLink> 与{" "}
          <TextLink href="/thoughts">思考 (Thinking)</TextLink> 里，读一读我近期的技术沉淀与内心注脚。
        </p>

        {/* 居中小分隔横线 */}
        <hr className="w-12 mx-auto my-12 border-t border-neutral-200 dark:border-neutral-800" />

        {/* 底部社交列表 */}
        <div className="space-y-4 text-[14.5px]">
          <div className="text-neutral-500 dark:text-neutral-400">
            Find me on
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5">
            <a
              href="https://github.com/qaz6758"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-400/80 dark:border-neutral-500 hover:border-neutral-900 dark:hover:border-white pb-[1px] transition-colors"
            >
              <SiGithub className="h-4 w-4" />
              <span>GitHub</span>
            </a>

            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-400/80 dark:border-neutral-500 hover:border-neutral-900 dark:hover:border-white pb-[1px] transition-colors"
            >
              <SiX className="h-3.5 w-3.5" />
              <span>Twitter</span>
            </a>

            <a
              href="https://space.bilibili.com/520681544?spm_id_from=333.1007.0.0"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-400/80 dark:border-neutral-500 hover:border-neutral-900 dark:hover:border-white pb-[1px] transition-colors"
            >
              <SiBilibili className="h-4 w-4 text-[#00AEEC]" />
              <span>哔哩哔哩</span>
            </a>

            <a
              href="https://t.me"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-400/80 dark:border-neutral-500 hover:border-neutral-900 dark:hover:border-white pb-[1px] transition-colors"
            >
              <SiTelegram className="h-4 w-4 text-[#26A5E4]" />
              <span>Telegram</span>
            </a>
          </div>

          {/* 邮箱行 */}
          <div className="pt-2 text-neutral-500 dark:text-neutral-400">
            Or mail me at{" "}
            <a
              href="mailto:theyole@outlook.com"
              className="font-mono font-semibold text-neutral-900 hover:text-neutral-950 dark:text-neutral-100 dark:hover:text-white border-b border-neutral-400/80 dark:border-neutral-500 hover:border-neutral-900 dark:hover:border-white pb-[1px] transition-colors"
            >
              theyole@outlook.com
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}