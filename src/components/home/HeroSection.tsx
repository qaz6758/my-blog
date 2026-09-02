import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
        className={`prose-link inline-flex items-center gap-0.5 group font-semibold text-neutral-900 dark:text-neutral-100 ${className}`}
      >
        <span>{children}</span>
        <ArrowUpRight className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={`prose-link font-semibold text-neutral-900 dark:text-neutral-100 ${className}`}
    >
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
          relative z-10 mx-auto w-full max-w-[65ch]
          px-6 pt-28 pb-12 sm:pt-32 sm:pb-16
          text-[15px] sm:text-[15.5px] leading-[1.8] sm:leading-[1.85]
          text-neutral-600 dark:text-[#999999]
          tracking-[0.015em] antialiased font-sans
        "
      >
        {/* 大标题：Anthony Fu 同款粗体无衬线 H1 */}
        <h1 className="mb-6 sm:mb-8 text-[32px] sm:text-[38px] font-bold tracking-tight text-neutral-900 dark:text-white select-none">
          {name}
        </h1>

        {/* 主体正文流 */}
        <div className="slide-enter-content space-y-6">
          {/* 第一句：极简身份宣言 */}
          <p>
            嘿！我是{name}，一名热爱音乐以及网站开发的全栈初学者。
          </p>

          {/* 🌟 官方标准 SVG 图标 + 页面原字体排版 */}
          <div className="my-6 space-y-2.5 text-[14px] leading-relaxed select-none">
            {/* Focus on */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-neutral-400 dark:text-neutral-500 w-26 shrink-0">Working with</span>
              <span className="inline-flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200">
                <SiVercel className="h-3.5 w-3.5" />
                <span>Vercel</span>
              </span>
              <span className="text-neutral-300 dark:text-neutral-600">/</span>
              <span className="inline-flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200">
                <SiCloudflare className="h-3.5 w-3.5 text-[#F38020]" />
                <span>Cloudflare</span>
              </span>
            </div>

            {/* Tech Stack */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <span className="text-neutral-400 dark:text-neutral-500 w-26 shrink-0">Tech Stack</span>
              <span className="inline-flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200">
                <SiReact className="h-3.5 w-3.5 text-[#61DAFB]" />
                <span>React 19</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200">
                <SiNextdotjs className="h-3.5 w-3.5" />
                <span>Next.js 16</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200">
                <SiTypescript className="h-3.5 w-3.5 text-[#3178C6]" />
                <span>TypeScript</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200">
                <SiTailwindcss className="h-3.5 w-3.5 text-[#06B6D4]" />
                <span>Tailwind v4</span>
              </span>
            </div>

            {/* Infrastructure */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <span className="text-neutral-400 dark:text-neutral-500 w-26 shrink-0">Backend</span>
              <span className="inline-flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200">
                <SiSupabase className="h-3.5 w-3.5 text-[#3ECF8E]" />
                <span>Supabase</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200">
                <SiNotion className="h-3.5 w-3.5" />
                <span>Notion API</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200">
                <SiCloudflare className="h-3.5 w-3.5 text-[#F38020]" />
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
            
              “破碎重组，再破碎的循环，让自己成为自己”
            
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

          {/* 居中 36px 极简小分隔线 (1:1 还原 Anthony Fu 原版) */}
          <div className="pt-1 pb-0 flex justify-center">
            <div className="w-9 h-[1px] bg-neutral-300 dark:bg-neutral-800" />
          </div>

          {/* 底部社交与联系方式 (1:1 还原 Anthony Fu 原版纯净无下划线 Inline 排版) */}
          <div className="space-y-4 pt-0 text-[15px] sm:text-[15.5px]">
            <p className="text-neutral-500 dark:text-neutral-400">
              Find me on
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
              <a
                href="https://github.com/qaz6758"
                target="_blank"
                rel="noopener noreferrer"
                className="prose-link inline-flex items-center gap-1.5 font-medium text-neutral-900 dark:text-neutral-100 cursor-pointer select-none"
              >
                <SiGithub className="h-4 w-4" />
                <span>GitHub</span>
              </a>

              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="prose-link inline-flex items-center gap-1.5 font-medium text-neutral-900 dark:text-neutral-100 cursor-pointer select-none"
              >
                <SiX className="h-3.5 w-3.5" />
                <span>Twitter</span>
              </a>

              <a
                href="https://space.bilibili.com/520681544?spm_id_from=333.1007.0.0"
                target="_blank"
                rel="noopener noreferrer"
                className="prose-link inline-flex items-center gap-1.5 font-medium text-neutral-900 dark:text-neutral-100 cursor-pointer select-none"
              >
                <SiBilibili className="h-4 w-4" />
                <span>哔哩哔哩</span>
              </a>

              <a
                href="https://t.me"
                target="_blank"
                rel="noopener noreferrer"
                className="prose-link inline-flex items-center gap-1.5 font-medium text-neutral-900 dark:text-neutral-100 cursor-pointer select-none"
              >
                <SiTelegram className="h-4 w-4" />
                <span>Telegram</span>
              </a>
            </div>

            {/* 邮箱行 */}
            <p className="pt-2 text-neutral-500 dark:text-neutral-400">
              Or mail me at{" "}
              <a
                href="mailto:theyole114@outlook.com"
                className="font-mono text-neutral-800 hover:text-neutral-950 dark:text-neutral-200 dark:hover:text-white transition-colors"
              >
                theyole114@outlook.com
              </a>
            </p>
          </div>

          {/* 底部收尾 36px 极简分隔线 */}
          <div className="pt-6 pb-0 flex justify-center">
            <div className="w-9 h-[1px] bg-neutral-300 dark:bg-neutral-800" />
          </div>
        </div>
      </main>
    </div>
  );
}