// src/components/home/HeroSection.tsx
"use client";

import React from "react";
import Link from "next/link";
import { ShootingStars } from "@/components/effects/ShootingStars";
import { siteConfig } from "@/config/site";
import {
  SiGithub,
  SiX,
  SiBilibili,
  SiTelegram,
  SiGmail,
  IconType,
} from "@icons-pack/react-simple-icons";

// 社交平台图标映射表
const ICON_MAP: Record<string, IconType> = {
  GitHub: SiGithub,
  X: SiX,
  Bilibili: SiBilibili,
  Telegram: SiTelegram,
  Email: SiGmail,
};

// 统一文本链接组件：强化边缘下划线与对比度
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
    "font-medium text-neutral-900 dark:text-neutral-100 underline decoration-neutral-300 dark:decoration-neutral-600 underline-offset-4 transition-colors hover:decoration-neutral-900 dark:hover:decoration-neutral-100";

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
  const { name, tagline, intro, currently, photography, socialLinks } = siteConfig;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ShootingStars />

      <main
        className="
          relative z-10 mx-auto w-full max-w-[740px]
          min-h-[calc(100vh-64px)]
          px-6 pt-24 pb-12
          flex flex-col justify-between
          text-[15.5px] sm:text-[16px] leading-[1.8]
          text-neutral-800 dark:text-neutral-200
          transform-gpu [backface-visibility:hidden]
        "
      >
        <div className="space-y-6">
          {/* Header 头部标题 */}
          <header className="mb-10">
            <h1 className="text-[32px] sm:text-[36px] font-semibold tracking-[-0.025em] text-neutral-900 dark:text-neutral-50">
              {name}
            </h1>
            <p className="mt-1.5 text-[14px] leading-6 text-neutral-500 dark:text-neutral-400">
              {tagline}
            </p>
          </header>

          {/* 个人介绍段落 */}
          <p>
            {intro.greeting}{" "}
            <strong className="font-semibold text-neutral-900 dark:text-neutral-50">
              {name}
            </strong>
            ，{intro.role}
          </p>

          <p>
            在这里记录技术探索、系统折腾、DIY 工具与生活碎片。秉持着
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              “{intro.philosophy}”
            </span>
            的理念，持续构建有温度的开源与个人项目。
          </p>

          <p>
            {intro.hobby.split("GitHub")[0]}
            <TextLink href="https://github.com" external>
              GitHub
            </TextLink>
            {intro.hobby.split("GitHub")[1]}
          </p>

          <p>
            你可以阅读我的{" "}
            <TextLink href="/posts">博客文章</TextLink>
            ，或者随意逛逛我的{" "}
            <TextLink href="/gallery">摄影作品</TextLink>。
          </p>

          {/* Currently 当前进行中 */}
          <section className="pt-3 space-y-2.5">
            <div className="text-[12px] uppercase tracking-[0.12em] text-neutral-400 dark:text-neutral-500 font-mono font-medium">
              {currently.title}
            </div>
            <p>
              正在学习{" "}
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {currently.techStack}
              </span>
              ，探索全栈开发与现代 Web 技术。
            </p>
            <p>{currently.projectText}</p>
          </section>

          {/* Photography 摄影 */}
          <section className="pt-3 space-y-2.5">
            <div className="text-[12px] uppercase tracking-[0.12em] text-neutral-400 dark:text-neutral-500 font-mono font-medium">
              {photography.title}
            </div>
            <p>
              {photography.text}{" "}
              <TextLink href={photography.linkHref}>
                {photography.linkText}
              </TextLink>{" "}
              看看。
            </p>
          </section>
        </div>

        {/* 沉底社交图标栏 */}
        <section
          className="mt-auto pt-16"
          style={{ "--enter-stage": 8 } as React.CSSProperties}
        >
          <div className="mb-3.5 text-[12px] uppercase tracking-[0.12em] text-neutral-400 dark:text-neutral-500 font-mono font-medium">
            Find me on
          </div>
          <div className="flex items-center gap-5 text-neutral-500 dark:text-neutral-400">
            {socialLinks.map((item) => {
              const Icon = ICON_MAP[item.name] || SiGithub;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={item.name}
                  aria-label={item.name}
                  className="p-1 -m-1 transition-colors duration-200 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}