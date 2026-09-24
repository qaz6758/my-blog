"use client";

import React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { useI18n } from "@/lib/i18n/I18nContext";

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
        className={`group inline-flex items-center gap-0.5 font-normal text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white border-b border-black/20 dark:border-white/25 hover:border-black dark:hover:border-white pb-px transition-colors ${className}`}
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
      className={`font-normal text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white border-b border-black/20 dark:border-white/25 hover:border-black dark:hover:border-white pb-px transition-colors ${className}`}
    >
      {children}
    </Link>
  );
}

export function HeroSection() {
  const { name } = siteConfig;
  const { locale, t } = useI18n();
  const space = locale === "en" ? " " : "";

  return (
    <div className="relative w-full overflow-hidden min-h-[100dvh] flex flex-col justify-start pt-28 sm:pt-32 pb-16 sm:pb-20 px-6 sm:px-8">
      <main className="relative z-10 mx-auto w-full max-w-[620px] flex flex-col items-start text-left">
        {/* ===================== 核心身份标题 (静态物理锚点，不参与 slide-enter 位移) ===================== */}
        <div className="text-left mb-5 sm:mb-6 select-none">
          <h1 className="text-[32px] sm:text-[38px] font-extrabold tracking-tight text-black dark:text-white font-sans">
            {name}
          </h1>
        </div>

        {/* ===================== 3. 现代纯粹正文 (Anthony Fu 阶梯错落流式入场) ===================== */}
        <div className="w-full space-y-4.5 sm:space-y-5 text-[15px] sm:text-[16px] leading-[1.8] sm:leading-[1.85] text-neutral-700 dark:text-neutral-300 font-sans slide-enter-content">
          {/* 开篇 Lead */}
          <p>
            {t("hero.p1", { name })}
          </p>

          {/* 心境与转折 (p2 + p3 + p4 融合) */}
          <p>
            {t("hero.p2")}{space}{t("hero.p3")}{space}{t("hero.p4")}
          </p>

          {/* 记录的意义与数字空间 (p5 + p6 融合) */}
          <p>
            {t("hero.p5")}{space}{t("hero.p6")}
          </p>

          {/* 信条与探索导览 (p7 + p8 顺承) */}
          <p>
            {t("hero.p7_pre")}
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {t("hero.p7_quote")}
            </span>
            {t("hero.p7_post")}{space}
            {t("hero.p8_1")}
            <TextLink href="/gallery">{t("hero.p8_gallery")}</TextLink>
            {t("hero.p8_2")}
            <TextLink href="/playlist">{t("hero.p8_playlist")}</TextLink>
            {t("hero.p8_3")}
            <TextLink href="/posts">{t("hero.p8_posts")}</TextLink>
            {t("hero.p8_4")}
            <TextLink href="/thoughts">{t("hero.p8_thoughts")}</TextLink>
            {t("hero.p8_5")}
          </p>

          {/* 尾声 (p9 + p10 凝练收束) */}
          <p>
            {t("hero.p9")}{space}{t("hero.p10")}
          </p>
        </div>

        {/* Anthony Fu 极简居中分隔短线 (随瀑布顺延入场) */}
        <div
          className="my-8 sm:my-9 flex justify-center w-full select-none slide-enter"
          style={{ "--enter-stage": 6 } as React.CSSProperties}
        >
          <div className="w-10 sm:w-12 h-[1px] bg-neutral-200 dark:bg-neutral-800" />
        </div>

        {/* ===================== 4. 底部联络与社交 (Anthony Fu 风格复刻：品牌图标 + 下划线 + 纯净极客排版) ===================== */}
        <div
          className="flex w-full flex-col items-start space-y-3 text-left select-none slide-enter"
          style={{ "--enter-stage": 7 } as React.CSSProperties}
        >
          {/* 结构小标题 */}
          <p className="text-[14px] text-neutral-500 dark:text-neutral-400 font-sans">
            {t("hero.find_me")}
          </p>

          {/* 品牌图标与带下划线外链列表 */}
          <div className="flex flex-wrap items-center justify-start gap-x-5 gap-y-3 text-[14px] font-sans">
            {/* GitHub */}
            <a
              href="https://github.com/qaz6758"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white border-b border-black/25 dark:border-white/30 hover:border-black dark:hover:border-white pb-0.5 transition-colors"
            >
              <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub</span>
            </a>

            {/* Twitter / X */}
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white border-b border-black/25 dark:border-white/30 hover:border-black dark:hover:border-white pb-0.5 transition-colors"
            >
              <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Twitter</span>
            </a>

            {/* Bilibili */}
            <a
              href="https://space.bilibili.com/520681544?spm_id_from=333.1007.0.0"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white border-b border-black/25 dark:border-white/30 hover:border-black dark:hover:border-white pb-0.5 transition-colors"
            >
              <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M17.813 4.653h.854c1.51 0 2.769 1.233 2.825 2.743l.008.19v10.514c0 1.51-1.233 2.769-2.743 2.825l-.19.008H5.433c-1.51 0-2.769-1.233-2.825-2.743l-.008-.19V7.586c0-1.51 1.233-2.769 2.743-2.825l.19-.008h.854L4.76 2.767a.846.846 0 0 1 .15-.992.839.839 0 0 1 1.134.02l2.95 2.858h6.012l2.95-2.858a.839.839 0 0 1 1.134-.02.846.846 0 0 1 .15.992l-1.427 1.886ZM5.433 6.347a1.144 1.144 0 0 0-1.138 1.054l-.006.185v10.514c0 .618.496 1.122 1.109 1.138l.185.006h13.134c.618 0 1.122-.496 1.138-1.109l.006-.185V7.586c0-.618-.496-1.122-1.109-1.138l-.185-.006H5.433Zm3.18 4.793c.69 0 1.25.56 1.25 1.25s-.56 1.25-1.25 1.25-1.25-.56-1.25-1.25.56-1.25 1.25-1.25Zm6.774 0c.69 0 1.25.56 1.25 1.25s-.56 1.25-1.25 1.25-1.25-.56-1.25-1.25.56-1.25 1.25-1.25Z" />
              </svg>
              <span>Bilibili</span>
            </a>

            {/* Telegram */}
            <a
              href="https://t.me"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white border-b border-black/25 dark:border-white/30 hover:border-black dark:hover:border-white pb-0.5 transition-colors"
            >
              <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.37.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
              <span>Telegram</span>
            </a>
          </div>

          {/* 纯等宽极客邮箱排版 */}
          <p className="pt-2 font-mono text-[13px] sm:text-[14px] text-neutral-500 dark:text-neutral-400 text-left select-text">
            {t("hero.or_mail")}{" "}
            <a
              href="mailto:hi@owen.loc.cc"
              className="hover:text-neutral-900 dark:hover:text-white hover:underline transition-colors"
            >
              hi@owen.loc.cc
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}