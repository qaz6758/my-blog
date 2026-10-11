// src/components/about/RetroAboutView.tsx
"use client";

import React from "react";
import { TypewriterTitle } from "@/components/common/TypewriterTitle";
import { Emote } from "@/components/common/Emote";

export function RetroAboutView() {
  return (
<div className="flex flex-col w-full flex-1 min-h-0 pt-0">
  <div className="flex items-center justify-center pb-1 mb-2.5 sm:mb-3 border-b-2 border-[#d0d7de] dark:border-white select-none">
    <h2 className="font-bold tracking-[0.12em] font-['W95FA',sans-serif] leading-none text-[19px] sm:text-[22px] text-[#24292f] dark:text-white">
      <TypewriterTitle text="About" />
    </h2>
  </div>

      {/* 个人全景介绍 */}
      <div>
        <div className="flex items-center justify-between pb-1.5 mb-2.5 border-b-2 border-[#d0d7de] dark:border-white select-none">
          <h3 className="font-bold tracking-wide font-['W95FA',sans-serif] text-[15px] sm:text-[16px] text-[#24292f] dark:text-white">
            About Me
          </h3>
        </div>
        <div className="text-[13px] sm:text-[14px] text-[#24292f] dark:text-white space-y-3 leading-[1.6]">
          <p>
            嗨，我是 <strong className="text-black dark:text-white">Vince Ou</strong>！一名全栈摸索者与数字花园构建者。
          </p>
          <p>
            热衷于用代码实现优雅直观的用户交互与系统架构。喜欢老式互联网的质朴纯粹，也享受现代全栈工具带来的开发心流。
          </p>
          <div className="pt-1">
            <p className="font-bold text-[#24292f] dark:text-white mb-2 select-none font-['W95FA',sans-serif]">
              Quick Facts:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li className="leading-[1.4]">
                来自南方小城 <Emote src="/emotes/city.webp" alt="city" />，在城市角落敲代码与听歌。
              </li>
              <li className="leading-[1.4]">
                主力技术栈：<span className="font-semibold text-[#9179E4]">Next.js</span>、<span className="font-semibold text-[#3178C6]">TypeScript</span> 与 <span className="font-semibold text-[#d97706] dark:text-[#facc15]">music</span>。
              </li>
              <li className="leading-[1.4]">
                音乐重度沉迷者 <Emote src="/emotes/yap.webp" alt="yap" />，写代码时常年循环 Lo-Fi 与 J-Pop。
              </li>
              <li className="leading-[1.4]">
                猫 <Emote src="/emotes/cat.webp" alt="cat" />&狗 <Emote src="/emotes/dog.webp" alt="dog" />爱好者。
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 技术栈清单 */}
      <div>
        <div className="flex items-center justify-between pb-1.5 mb-2.5 border-b-2 border-[#d0d7de] dark:border-white select-none">
          <h3 className="font-bold tracking-wide font-['W95FA',sans-serif] text-[15px] sm:text-[16px] text-[#24292f] dark:text-white">
            Skills & Tech Stack
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px] sm:text-[13px]">
          <div className="p-2.5 rounded-[3px] bg-neutral-100/70 dark:bg-transparent border border-[#e1e4e8] dark:border-white/40">
            <h4 className="font-bold text-[#24292f] dark:text-white mb-1 font-['W95FA',sans-serif]">
              Frontend & UI
            </h4>
            <p className="text-neutral-600 dark:text-[#a1a1aa] leading-relaxed">
              React 19, Next.js 16 (App Router), TypeScript, Tailwind CSS, Framer Motion, HTML5/CSS3.
            </p>
          </div>

          <div className="p-2.5 rounded-[3px] bg-neutral-100/70 dark:bg-transparent border border-[#e1e4e8] dark:border-white/40">
            <h4 className="font-bold text-[#24292f] dark:text-white mb-1 font-['W95FA',sans-serif]">
              Backend & Cloud
            </h4>
            <p className="text-neutral-600 dark:text-[#a1a1aa] leading-relaxed">
              Cloudflare Workers / Pages, Supabase, PostgreSQL, Notion API Gateway, Node.js.
            </p>
          </div>
        </div>
      </div>

      {/* 建站理念 */}
      <div>
        <div className="flex items-center justify-between pb-1.5 mb-2.5 border-b-2 border-[#d0d7de] dark:border-white select-none">
          <h3 className="font-bold tracking-wide font-['W95FA',sans-serif] text-[15px] sm:text-[16px] text-[#24292f] dark:text-white">
            Site Philosophy
          </h3>
        </div>
        <div className="text-[13px] text-[#24292f] dark:text-white leading-[1.6]">
          <p className="mb-2 italic text-neutral-600 dark:text-[#a1a1aa] font-mono">
            &ldquo;大道至简，衍化至繁。这里是我的个人数字花园与技术自留地。&rdquo;
          </p>
          <p>
            本站采用静态全栈预渲染（SSG + ISR）架构，致敬复古 90 年代视窗经典风格与现代动效设计的融合，让每一次访问都轻快、纯粹。
          </p>
        </div>
      </div>

      {/* 社交链接 */}
      <div>
        <div className="flex items-center justify-between pb-1.5 mb-2.5 border-b-2 border-[#d0d7de] dark:border-white select-none">
          <h3 className="font-bold tracking-wide font-['W95FA',sans-serif] text-[15px] sm:text-[16px] text-[#24292f] dark:text-white">
            Connect
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <a
            href="https://github.com/qaz6758"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-[3px] border border-[#d0d7de] dark:border-[#333] hover:border-[#33FF33] hover:text-[#33FF33] dark:hover:border-[#33FF33] dark:hover:text-[#33FF33] transition-colors text-neutral-700 dark:text-white"
          >
            GitHub: @qaz6758
          </a>
          <a
            href="https://space.bilibili.com/520681544"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-[3px] border border-[#d0d7de] dark:border-[#333] hover:border-[#33FF33] hover:text-[#33FF33] dark:hover:border-[#33FF33] dark:hover:text-[#33FF33] transition-colors text-neutral-700 dark:text-neutral-300"
          >
            Bilibili
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-[3px] border border-[#d0d7de] dark:border-[#333] hover:border-[#33FF33] hover:text-[#33FF33] dark:hover:border-[#33FF33] dark:hover:text-[#33FF33] transition-colors text-neutral-700 dark:text-neutral-300"
          >
            Twitter / X
          </a>
          <a
            href="https://t.me"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-[3px] border border-[#d0d7de] dark:border-[#333] hover:border-[#33FF33] hover:text-[#33FF33] dark:hover:border-[#33FF33] dark:hover:text-[#33FF33] transition-colors text-neutral-700 dark:text-neutral-300"
          >
            Telegram
          </a>
        </div>
      </div>
    </div>
  );
}
