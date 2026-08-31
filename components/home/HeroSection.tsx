// components/home/HeroSection.tsx
"use client";

import React from "react";
import Link from "next/link";
import { ShootingStars } from "@/components/effects/ShootingStars";
import {
  SiGithub,
  SiX,
  SiBilibili,
  SiTelegram,
  SiGmail,
} from "@icons-pack/react-simple-icons";

// 统一文本链接组件：强化边缘下划线与对比度，杜绝重复代码
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

const SOCIAL_LINKS = [
  { name: "GitHub", href: "https://github.com", icon: SiGithub },
  { name: "X", href: "https://x.com", icon: SiX },
  { name: "Bilibili", href: "https://bilibili.com", icon: SiBilibili },
  { name: "Telegram", href: "https://t.me", icon: SiTelegram },
  { name: "Email", href: "mailto:your-email@example.com", icon: SiGmail },
];

export function HeroSection() {
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
        <div className=" space-y-6">
          {/* Header */}
          <header className="mb-10">
            <h1 className="text-[32px] sm:text-[36px] font-semibold tracking-[-0.025em] text-neutral-900 dark:text-neutral-50">
              theyole
            </h1>
            <p className="mt-1.5 text-[14px] leading-6 text-neutral-500 dark:text-neutral-400">
              拾光小站 · Anything is possible
            </p>
          </header>

          <p>
            嗨，我是{" "}
            <strong className="font-semibold text-neutral-900 dark:text-neutral-50">
              theyole
            </strong>
            ，一名热爱折腾的全栈开发者与数字手艺人。
          </p>

          <p>
            在这里记录技术探索、系统折腾、DIY 工具与生活碎片。秉持着
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              “破碎重组，再破碎的循环，让自己成为自己”
            </span>
            的理念，持续构建有温度的开源与个人项目。
          </p>

          <p>
            我喜欢研究新的东西，也喜欢把想法真正做出来。常在{" "}
            <TextLink href="https://github.com" external>
              GitHub
            </TextLink>{" "}
            探索开源项目，也会在各种平台上分享自己的折腾日常。
          </p>

          <p>
            你可以阅读我的{" "}
            <TextLink href="/posts">博客文章</TextLink>
            ，或者随意逛逛我的{" "}
            <TextLink href="/gallery">摄影作品</TextLink>。
          </p>

          <section className="pt-3 space-y-2.5">
            <div className="text-[12px] uppercase tracking-[0.12em] text-neutral-400 dark:text-neutral-500 font-mono font-medium">
              Currently
            </div>
            <p>
              正在学习{" "}
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                React · Next.js · TypeScript
              </span>
              ，探索全栈开发与现代 Web 技术。
            </p>
            <p>也在持续折腾自己的博客、摄影网站以及一些有趣的小项目。</p>
          </section>

          <section className="pt-3 space-y-2.5">
            <div className="text-[12px] uppercase tracking-[0.12em] text-neutral-400 dark:text-neutral-500 font-mono font-medium">
              Photography
            </div>
            <p>
              除了写代码，我也喜欢摄影。这里记录我在生活和旅途中留下的一些影像。如果你也喜欢照片，可以去{" "}
              <TextLink href="/gallery">摄影画廊</TextLink>{" "}
              看看。
            </p>
          </section>
        </div>

        {/* 沉底社交图标栏 */}
        <section
          className=" mt-auto pt-16"
          style={{ "--enter-stage": 8 } as React.CSSProperties}
        >
          <div className="mb-3.5 text-[12px] uppercase tracking-[0.12em] text-neutral-400 dark:text-neutral-500 font-mono font-medium">
            Find me on
          </div>
          <div className="flex items-center gap-5 text-neutral-500 dark:text-neutral-400">
            {SOCIAL_LINKS.map((item) => {
              const Icon = item.icon;
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